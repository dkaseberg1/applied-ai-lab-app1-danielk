import {
  Quarter,
  SalesRecord,
  RegionPivotRow,
  AnalyticsSummary,
  ProductDrilldown,
  ChannelDrilldown,
} from '../types/sales';
import { canonicalizeRegionName } from './csvParser';

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export function formatUSD(amount: number, compact: boolean = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}k`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(pct: number): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function calculateSalesAnalytics(records: SalesRecord[]): AnalyticsSummary {
  if (!records || records.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalUnits: 0,
      averageOrderValue: 0,
      quarterTotals: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
      quarterUnits: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
      regionRows: [],
      allRegions: [],
      allQuarters: QUARTERS,
      mostChangedRegionDollar: null,
      mostChangedRegionPct: null,
      totalQ2Revenue: 0,
      totalQ3Revenue: 0,
      totalQ2Q3Delta: 0,
      totalQ2Q3Pct: 0,
    };
  }

  // 1. Group by Region (with intelligent name unification, e.g. "west" & "West" -> "West")
  const regionRegistry = new Map<string, string>();
  const regionVariantMap = new Map<string, Set<string>>();
  const regionMap = new Map<string, SalesRecord[]>();
  const quarterTotals: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  const quarterUnits: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  let grandTotalRevenue = 0;
  let grandTotalUnits = 0;

  for (const r of records) {
    const rawVal = r.originalRegion || r.region;
    const canonicalRegion = canonicalizeRegionName(r.region, regionRegistry, regionVariantMap);

    if (!regionVariantMap.has(canonicalRegion)) {
      regionVariantMap.set(canonicalRegion, new Set());
    }
    if (rawVal) {
      regionVariantMap.get(canonicalRegion)!.add(rawVal);
    }

    if (!regionMap.has(canonicalRegion)) {
      regionMap.set(canonicalRegion, []);
    }
    regionMap.get(canonicalRegion)!.push(r);

    if (quarterTotals[r.quarter] !== undefined) {
      quarterTotals[r.quarter] += r.revenue;
      quarterUnits[r.quarter] += r.units;
    }
    grandTotalRevenue += r.revenue;
    grandTotalUnits += r.units;
  }

  const regionRows: RegionPivotRow[] = [];

  for (const [region, regionRecords] of regionMap.entries()) {
    const quarters: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const qUnits: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const qDiscountSum: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
    const qDiscountCount: Record<Quarter, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

    // Breakdown maps for Q2 vs Q3
    const productQ2Map = new Map<string, { rev: number; units: number; discSum: number; count: number }>();
    const productQ3Map = new Map<string, { rev: number; units: number; discSum: number; count: number }>();
    const channelQ2Map = new Map<string, { rev: number; units: number }>();
    const channelQ3Map = new Map<string, { rev: number; units: number }>();

    let regTotalRev = 0;
    let regTotalUnits = 0;

    for (const item of regionRecords) {
      quarters[item.quarter] = (quarters[item.quarter] || 0) + item.revenue;
      qUnits[item.quarter] = (qUnits[item.quarter] || 0) + item.units;
      qDiscountSum[item.quarter] = (qDiscountSum[item.quarter] || 0) + item.discount_pct;
      qDiscountCount[item.quarter] = (qDiscountCount[item.quarter] || 0) + 1;

      regTotalRev += item.revenue;
      regTotalUnits += item.units;

      if (item.quarter === 'Q2') {
        const p = productQ2Map.get(item.product) || { rev: 0, units: 0, discSum: 0, count: 0 };
        p.rev += item.revenue;
        p.units += item.units;
        p.discSum += item.discount_pct;
        p.count += 1;
        productQ2Map.set(item.product, p);

        const c = channelQ2Map.get(item.channel) || { rev: 0, units: 0 };
        c.rev += item.revenue;
        c.units += item.units;
        channelQ2Map.set(item.channel, c);
      } else if (item.quarter === 'Q3') {
        const p = productQ3Map.get(item.product) || { rev: 0, units: 0, discSum: 0, count: 0 };
        p.rev += item.revenue;
        p.units += item.units;
        p.discSum += item.discount_pct;
        p.count += 1;
        productQ3Map.set(item.product, p);

        const c = channelQ3Map.get(item.channel) || { rev: 0, units: 0 };
        c.rev += item.revenue;
        c.units += item.units;
        channelQ3Map.set(item.channel, c);
      }
    }

    const q2Revenue = quarters.Q2;
    const q3Revenue = quarters.Q3;
    const q2Units = qUnits.Q2;
    const q3Units = qUnits.Q3;
    const q2AvgDiscount = qDiscountCount.Q2 > 0 ? qDiscountSum.Q2 / qDiscountCount.Q2 : 0;
    const q3AvgDiscount = qDiscountCount.Q3 > 0 ? qDiscountSum.Q3 / qDiscountCount.Q3 : 0;

    const dollarChangeQ2toQ3 = q3Revenue - q2Revenue;
    const absDollarChangeQ2toQ3 = Math.abs(dollarChangeQ2toQ3);
    const pctChangeQ2toQ3 =
      q2Revenue > 0
        ? ((q3Revenue - q2Revenue) / q2Revenue) * 100
        : q3Revenue > 0
        ? 100
        : 0;
    const absPctChangeQ2toQ3 = Math.abs(pctChangeQ2toQ3);

    // Build Product Breakdown
    const allProducts = new Set([...productQ2Map.keys(), ...productQ3Map.keys()]);
    const productBreakdown: ProductDrilldown[] = [];
    for (const prod of allProducts) {
      const q2Data = productQ2Map.get(prod) || { rev: 0, units: 0, discSum: 0, count: 0 };
      const q3Data = productQ3Map.get(prod) || { rev: 0, units: 0, discSum: 0, count: 0 };
      const revDiff = q3Data.rev - q2Data.rev;
      const pctDiff = q2Data.rev > 0 ? ((q3Data.rev - q2Data.rev) / q2Data.rev) * 100 : q3Data.rev > 0 ? 100 : 0;
      productBreakdown.push({
        product: prod,
        q2Revenue: q2Data.rev,
        q3Revenue: q3Data.rev,
        revenueChange: revDiff,
        percentChange: pctDiff,
        q2Units: q2Data.units,
        q3Units: q3Data.units,
        unitsChange: q3Data.units - q2Data.units,
        q2AvgDiscount: q2Data.count > 0 ? q2Data.discSum / q2Data.count : 0,
        q3AvgDiscount: q3Data.count > 0 ? q3Data.discSum / q3Data.count : 0,
      });
    }
    productBreakdown.sort((a, b) => Math.abs(b.revenueChange) - Math.abs(a.revenueChange));

    // Build Channel Breakdown
    const allChannels = new Set([...channelQ2Map.keys(), ...channelQ3Map.keys()]);
    const channelBreakdown: ChannelDrilldown[] = [];
    for (const ch of allChannels) {
      const q2Data = channelQ2Map.get(ch) || { rev: 0, units: 0 };
      const q3Data = channelQ3Map.get(ch) || { rev: 0, units: 0 };
      const revDiff = q3Data.rev - q2Data.rev;
      const pctDiff = q2Data.rev > 0 ? ((q3Data.rev - q2Data.rev) / q2Data.rev) * 100 : q3Data.rev > 0 ? 100 : 0;
      channelBreakdown.push({
        channel: ch,
        q2Revenue: q2Data.rev,
        q3Revenue: q3Data.rev,
        revenueChange: revDiff,
        percentChange: pctDiff,
        q2Units: q2Data.units,
        q3Units: q3Data.units,
        unitsChange: q3Data.units - q2Data.units,
      });
    }
    channelBreakdown.sort((a, b) => Math.abs(b.revenueChange) - Math.abs(a.revenueChange));

    const rawVariants = regionVariantMap.get(region)
      ? Array.from(regionVariantMap.get(region)!)
      : [region];

    regionRows.push({
      region,
      rawVariations: rawVariants.length > 1 ? rawVariants : undefined,
      quarters,
      quarterUnits: qUnits,
      totalRevenue: regTotalRev,
      totalUnits: regTotalUnits,
      q2Revenue,
      q3Revenue,
      q2Units,
      q3Units,
      q2AvgDiscount,
      q3AvgDiscount,
      dollarChangeQ2toQ3,
      pctChangeQ2toQ3,
      absDollarChangeQ2toQ3,
      absPctChangeQ2toQ3,
      productBreakdown,
      channelBreakdown,
      topProductDriver: productBreakdown.length > 0 ? productBreakdown[0] : null,
      topChannelDriver: channelBreakdown.length > 0 ? channelBreakdown[0] : null,
    });
  }

  // Sort region rows by total revenue descending by default
  regionRows.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Identify which region changed most from Q2 to Q3
  let mostChangedRegionDollar: RegionPivotRow | null = null;
  let mostChangedRegionPct: RegionPivotRow | null = null;

  if (regionRows.length > 0) {
    // Largest by absolute dollar magnitude
    const byDollar = [...regionRows].sort((a, b) => b.absDollarChangeQ2toQ3 - a.absDollarChangeQ2toQ3);
    mostChangedRegionDollar = byDollar[0];

    // Largest by absolute percentage magnitude
    const byPct = [...regionRows].sort((a, b) => b.absPctChangeQ2toQ3 - a.absPctChangeQ2toQ3);
    mostChangedRegionPct = byPct[0];
  }

  const totalQ2Revenue = quarterTotals.Q2;
  const totalQ3Revenue = quarterTotals.Q3;
  const totalQ2Q3Delta = totalQ3Revenue - totalQ2Revenue;
  const totalQ2Q3Pct = totalQ2Revenue > 0 ? (totalQ2Q3Delta / totalQ2Revenue) * 100 : 0;

  const integratedRegionAliases: Record<string, string[]> = {};
  for (const [canonical, variants] of regionVariantMap.entries()) {
    if (variants.size > 1) {
      integratedRegionAliases[canonical] = Array.from(variants);
    }
  }

  return {
    totalRevenue: grandTotalRevenue,
    totalOrders: records.length,
    totalUnits: grandTotalUnits,
    averageOrderValue: records.length > 0 ? grandTotalRevenue / records.length : 0,
    quarterTotals,
    quarterUnits,
    regionRows,
    allRegions: regionRows.map(r => r.region),
    allQuarters: QUARTERS,
    mostChangedRegionDollar,
    mostChangedRegionPct,
    totalQ2Revenue,
    totalQ3Revenue,
    totalQ2Q3Delta,
    totalQ2Q3Pct,
    integratedRegionAliases,
  };
}

/**
 * Builds the exact mathematical payload sent to the Gemini API endpoint
 */
export function buildPayloadForAI(summary: AnalyticsSummary) {
  const target = summary.mostChangedRegionDollar;
  if (!target) return null;

  return {
    mostChangedRegion: {
      region: target.region,
      q2Revenue: target.q2Revenue,
      q3Revenue: target.q3Revenue,
      dollarChange: target.dollarChangeQ2toQ3,
      percentChange: target.pctChangeQ2toQ3,
      direction: (target.dollarChangeQ2toQ3 >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
      q2Units: target.q2Units,
      q3Units: target.q3Units,
      unitsChange: target.q3Units - target.q2Units,
      q2AvgDiscountPct: target.q2AvgDiscount,
      q3AvgDiscountPct: target.q3AvgDiscount,
      topProductDriver: target.topProductDriver
        ? {
            product: target.topProductDriver.product,
            q2Revenue: target.topProductDriver.q2Revenue,
            q3Revenue: target.topProductDriver.q3Revenue,
            revenueChange: target.topProductDriver.revenueChange,
            q2Units: target.topProductDriver.q2Units,
            q3Units: target.topProductDriver.q3Units,
            unitsChange: target.topProductDriver.unitsChange,
          }
        : null,
      topChannelDriver: target.topChannelDriver
        ? {
            channel: target.topChannelDriver.channel,
            q2Revenue: target.topChannelDriver.q2Revenue,
            q3Revenue: target.topChannelDriver.q3Revenue,
            revenueChange: target.topChannelDriver.revenueChange,
          }
        : null,
    },
    otherRegions: summary.regionRows
      .filter(r => r.region !== target.region)
      .map(r => ({
        region: r.region,
        q2Revenue: r.q2Revenue,
        q3Revenue: r.q3Revenue,
        dollarChange: r.dollarChangeQ2toQ3,
        percentChange: r.pctChangeQ2toQ3,
      })),
    totalQ2Revenue: summary.totalQ2Revenue,
    totalQ3Revenue: summary.totalQ3Revenue,
    totalRevenueChange: summary.totalQ2Q3Delta,
  };
}

/**
 * Deterministic fallback generator for the 3-sentence summary.
 * Guaranteed to produce exactly 3 sentences with strictly ground-truth calculated numbers.
 */
export function generateDeterministicThreeSentenceSummary(summary: AnalyticsSummary): string {
  const target = summary.mostChangedRegionDollar;
  if (!target) return 'No sales data is available to analyze regional shifts.';

  const dirWord = target.dollarChangeQ2toQ3 >= 0 ? 'surged' : 'contracted';
  const changeSign = target.dollarChangeQ2toQ3 >= 0 ? '+' : '';
  const s1 = `The ${target.region} region recorded the largest change from Q2 to Q3, as revenue ${dirWord} from ${formatUSD(target.q2Revenue)} in Q2 to ${formatUSD(target.q3Revenue)} in Q3, reflecting a net variance of ${changeSign}${formatUSD(target.dollarChangeQ2toQ3)} (${changeSign}${target.pctChangeQ2toQ3.toFixed(1)}%).`;

  let s2 = '';
  if (target.topProductDriver) {
    const p = target.topProductDriver;
    const pWord = p.revenueChange >= 0 ? 'an increase' : 'a decline';
    s2 = `This movement was primarily driven by ${p.product}, which registered ${pWord} of ${formatUSD(Math.abs(p.revenueChange))} (moving from ${formatUSD(p.q2Revenue)} on ${p.q2Units.toLocaleString()} units to ${formatUSD(p.q3Revenue)} on ${p.q3Units.toLocaleString()} units).`;
  } else {
    s2 = `Total regional volume adjusted by ${Math.abs(target.q3Units - target.q2Units).toLocaleString()} units while average discounting shifted from ${target.q2AvgDiscount.toFixed(1)}% to ${target.q3AvgDiscount.toFixed(1)}%.`;
  }

  let s3 = '';
  if (target.topChannelDriver) {
    const c = target.topChannelDriver;
    const cWord = c.revenueChange >= 0 ? 'growth' : 'reduction';
    s3 = `Additionally, the ${c.channel} distribution channel influenced the trajectory with a ${cWord} of ${formatUSD(Math.abs(c.revenueChange))}, alongside an average regional discount moving from ${target.q2AvgDiscount.toFixed(1)}% in Q2 to ${target.q3AvgDiscount.toFixed(1)}% in Q3.`;
  } else {
    s3 = `Across all quarters, ${target.region} contributed a total of ${formatUSD(target.totalRevenue)} in aggregate sales.`;
  }

  return `${s1} ${s2} ${s3}`;
}
