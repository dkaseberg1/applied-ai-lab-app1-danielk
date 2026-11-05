import Papa from 'papaparse';
import {
  CSVParseResult,
  Quarter,
  SalesRecord,
  TargetColumn,
  ColumnMapping,
  CSVDiagnosticInfo,
} from '../types/sales';

export const TARGET_COLUMNS: TargetColumn[] = [
  'quarter',
  'region',
  'channel',
  'product',
  'units',
  'discount_pct',
  'revenue',
];

const SYNONYMS: Record<TargetColumn, string[]> = {
  quarter: [
    'quarter',
    'qtr',
    'period',
    'fiscalquarter',
    'fiscalq',
    'fiscalperiod',
    'timeperiod',
    'q',
    'date',
    'orderdate',
    'invoicedate',
  ],
  region: [
    'region',
    'territory',
    'geo',
    'geography',
    'market',
    'area',
    'zone',
    'location',
    'country',
    'state',
    'district',
    'division',
    'branch',
    'salesregion',
  ],
  channel: [
    'channel',
    'distribution',
    'route',
    'segment',
    'type',
    'saleschannel',
    'channeltype',
    'source',
    'platform',
    'method',
  ],
  product: [
    'product',
    'item',
    'sku',
    'merchandise',
    'good',
    'part',
    'model',
    'description',
    'productname',
    'itemname',
    'category',
    'productcategory',
  ],
  units: [
    'units',
    'unit',
    'qty',
    'quantity',
    'volume',
    'count',
    'orders',
    'items',
    'salesunits',
    'qtysold',
    'vol',
    'numberofunits',
    'pieces',
  ],
  discount_pct: [
    'discount_pct',
    'discount',
    'disc',
    'discountpct',
    'discountrate',
    'rebate',
    'markdown',
    'discountpercent',
    'promopct',
    'promodiscount',
  ],
  revenue: [
    'revenue',
    'sales',
    'amount',
    'turnover',
    'total',
    'orderamt',
    'orderrevenue',
    'netrevenue',
    'grossrevenue',
    'price',
    'proceeds',
    'netamount',
    'dollars',
    'incometotal',
    'totalsales',
  ],
};

function cleanHeaderStr(header: string): string {
  return header
    .replace(/^\uFEFF/, '') // Strip UTF-8 BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width spaces
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.:/\\()$#%]+/g, '');
}

const REGION_ACRONYMS = new Set([
  'EMEA',
  'APAC',
  'LATAM',
  'NA',
  'EU',
  'UK',
  'US',
  'USA',
  'ANZ',
  'DACH',
  'CEE',
  'MENA',
  'CIS',
  'SEA',
  'NORAM',
]);

/**
 * Normalizes and integrates region names with case or punctuation variations (e.g. "west" & "West" -> "West")
 */
export function canonicalizeRegionName(
  rawName: string,
  registry?: Map<string, string>,
  variantMap?: Map<string, Set<string>>
): string {
  const trimmed = rawName.trim();
  if (!trimmed) return '';

  const normKey = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');

  if (registry && registry.has(normKey)) {
    const canonical = registry.get(normKey)!;
    if (variantMap) {
      if (!variantMap.has(canonical)) variantMap.set(canonical, new Set());
      variantMap.get(canonical)!.add(trimmed);
    }
    return canonical;
  }

  const upper = trimmed.toUpperCase();
  let canonical = '';

  if (REGION_ACRONYMS.has(upper)) {
    canonical = upper;
  } else if (/^asia[\s\-_]*pacific$/i.test(trimmed)) {
    canonical = 'Asia-Pacific';
  } else if (/^north[\s\-_]*america$/i.test(trimmed)) {
    canonical = 'North America';
  } else if (/^south[\s\-_]*america$/i.test(trimmed)) {
    canonical = 'South America';
  } else if (/^latin[\s\-_]*america$/i.test(trimmed)) {
    canonical = 'Latin America';
  } else {
    // Title-case words, preserving hyphens and spaces
    canonical = trimmed
      .split(/([\s\-_]+)/)
      .map((part) => {
        if (/^[\s\-_]+$/.test(part)) return part;
        if (REGION_ACRONYMS.has(part.toUpperCase())) return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join('');
  }

  if (registry) {
    registry.set(normKey, canonical);
  }
  if (variantMap) {
    if (!variantMap.has(canonical)) variantMap.set(canonical, new Set());
    variantMap.get(canonical)!.add(trimmed);
  }

  return canonical;
}

export function canonicalizeText(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/([\s\-_]+)/)
    .map((part) => {
      if (/^[\s\-_]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Intelligent auto-mapping of raw CSV headers to required target fields
 */
export function detectColumnMapping(rawHeaders: string[]): Record<TargetColumn, string> {
  const mapping: Record<TargetColumn, string> = {
    quarter: '',
    region: '',
    channel: '',
    product: '',
    units: '',
    discount_pct: '',
    revenue: '',
  };

  const cleanHeaders = rawHeaders.map((h) => ({
    raw: h,
    cleaned: cleanHeaderStr(h),
  }));

  const usedRawHeaders = new Set<string>();

  // 1. Exact match pass
  for (const target of TARGET_COLUMNS) {
    const directMatch = cleanHeaders.find(
      (h) => !usedRawHeaders.has(h.raw) && h.cleaned === target.replace('_', '')
    );
    if (directMatch) {
      mapping[target] = directMatch.raw;
      usedRawHeaders.add(directMatch.raw);
    }
  }

  // 2. Synonyms match pass
  for (const target of TARGET_COLUMNS) {
    if (mapping[target]) continue; // already mapped

    const synonyms = SYNONYMS[target];
    for (const syn of synonyms) {
      const match = cleanHeaders.find(
        (h) => !usedRawHeaders.has(h.raw) && (h.cleaned === syn || h.cleaned.includes(syn))
      );
      if (match) {
        mapping[target] = match.raw;
        usedRawHeaders.add(match.raw);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Parses diverse representations of quarters (Q1, Qtr 1, 2024-Q1, 1, Date strings)
 */
export function parseQuarterValue(rawVal: any): Quarter | null {
  if (rawVal === undefined || rawVal === null) return null;
  const str = String(rawVal).trim().toUpperCase();
  if (!str) return null;

  // Direct Q1-Q4 check (handles "Q1", "2024-Q1", "Q1 2024", "Q1'24", "FY24-Q1")
  if (/\bQ1\b|QTR[\s\-_.]*1|QUARTER[\s\-_.]*1|1ST[\s\-_.]*QUARTER|FIRST[\s\-_.]*QUARTER|\bI\b/i.test(str)) {
    return 'Q1';
  }
  if (/\bQ2\b|QTR[\s\-_.]*2|QUARTER[\s\-_.]*2|2ND[\s\-_.]*QUARTER|SECOND[\s\-_.]*QUARTER|\bII\b/i.test(str)) {
    return 'Q2';
  }
  if (/\bQ3\b|QTR[\s\-_.]*3|QUARTER[\s\-_.]*3|3RD[\s\-_.]*QUARTER|THIRD[\s\-_.]*QUARTER|\bIII\b/i.test(str)) {
    return 'Q3';
  }
  if (/\bQ4\b|QTR[\s\-_.]*4|QUARTER[\s\-_.]*4|4TH[\s\-_.]*QUARTER|FOURTH[\s\-_.]*QUARTER|\bIV\b/i.test(str)) {
    return 'Q4';
  }

  // Exact single digit numbers
  if (str === '1') return 'Q1';
  if (str === '2') return 'Q2';
  if (str === '3') return 'Q3';
  if (str === '4') return 'Q4';

  // Hyphenated or slash formats like "2024-1" or "2024/1"
  const trailingDigit = str.match(/[-/](\d)$/);
  if (trailingDigit) {
    const d = trailingDigit[1];
    if (d === '1') return 'Q1';
    if (d === '2') return 'Q2';
    if (d === '3') return 'Q3';
    if (d === '4') return 'Q4';
  }

  // Check if string is a valid Date (e.g. "2024-03-15", "03/15/2024", "15-Apr-2024")
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime()) && str.length >= 6) {
    const month = parsedDate.getMonth(); // 0 to 11
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    if (month >= 9 && month <= 11) return 'Q4';
  }

  return null;
}

/**
 * Robust numeric parser handling currency, European formats, accounting parentheses, and commas
 */
export function parseNumericValue(rawVal: any): number {
  if (rawVal === undefined || rawVal === null) return 0;
  if (typeof rawVal === 'number') return isNaN(rawVal) ? 0 : rawVal;

  let str = String(rawVal).trim();
  if (!str || str === '-' || str === 'N/A' || str === 'null') return 0;

  // Accounting negative notation e.g. (1250.00)
  const isAccountingNegative = str.startsWith('(') && str.endsWith(')');
  if (isAccountingNegative) {
    str = '-' + str.slice(1, -1);
  }

  // Strip currency symbols, spaces, percent signs
  str = str.replace(/[$€£¥\s%]/g, '');

  // Detect European decimal comma vs thousands dot (e.g. "1.250,50" or "12,50")
  if (str.includes(',') && !str.includes('.')) {
    // Only comma present, e.g. "12,50" or "1250,50"
    str = str.replace(',', '.');
  } else if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // European: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US standard: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else {
    // Standard US with comma thousands
    str = str.replace(/,/g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Main CSV parser supporting auto-detection, custom column mapping, and diagnostics
 */
export function parseCSVContent(
  csvText: string,
  fileName: string = 'sales_orders.csv',
  customMapping?: Record<TargetColumn, string>
): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const records: SalesRecord[] = [];
  const invalidRowReasons: Array<{ rowNumber: number; reason: string; sampleData: any }> = [];

  // Registries to detect and unify similar names (e.g. "west" & "West")
  const regionRegistry = new Map<string, string>();
  const regionVariantMap = new Map<string, Set<string>>();
  const channelRegistry = new Map<string, string>();
  const productRegistry = new Map<string, string>();

  // Parse raw with PapaParse (preserve raw headers)
  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\uFEFF/, '').trim(), // Clean BOM from header names
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors.slice(0, 5)) {
      warnings.push(`CSV format notice at row ${err.row}: ${err.message}`);
    }
  }

  const rawHeaders = parsed.meta.fields || [];

  if (rawHeaders.length === 0) {
    return {
      records: [],
      errors: ['The uploaded CSV contains no headers or tabular data.'],
      warnings: [],
      fileName,
      totalRows: 0,
      validRows: 0,
    };
  }

  // Resolve mapping
  const mapping: Record<TargetColumn, string> = customMapping
    ? { ...customMapping }
    : detectColumnMapping(rawHeaders);

  // Critical columns needed: quarter, region, revenue
  const essentialMissing: string[] = [];
  if (!mapping.quarter) essentialMissing.push('Quarter');
  if (!mapping.region) essentialMissing.push('Region');
  if (!mapping.revenue) essentialMissing.push('Revenue');

  const unmappedTargets = TARGET_COLUMNS.filter((t) => !mapping[t]);

  if (essentialMissing.length > 0) {
    errors.push(
      `Could not automatically detect essential column(s): ${essentialMissing.join(', ')}. Please use the column mapping tool below.`
    );
  }

  let rowIdx = 0;
  for (const rawRow of parsed.data) {
    rowIdx++;

    // Quarter
    const rawQtr = mapping.quarter ? rawRow[mapping.quarter] : null;
    const qtr = parseQuarterValue(rawQtr);
    if (!qtr) {
      if (invalidRowReasons.length < 5) {
        invalidRowReasons.push({
          rowNumber: rowIdx,
          reason: `Quarter value "${rawQtr ?? ''}" could not be recognized as Q1, Q2, Q3, or Q4.`,
          sampleData: rawRow,
        });
      }
      continue;
    }

    // Region - Canonicalize and capture similar names (e.g. "west" & "West" -> "West")
    const rawRegion = mapping.region ? rawRow[mapping.region] : '';
    const trimmedRegion = String(rawRegion || '').trim();
    if (!trimmedRegion) {
      if (invalidRowReasons.length < 5) {
        invalidRowReasons.push({
          rowNumber: rowIdx,
          reason: 'Region was empty or missing.',
          sampleData: rawRow,
        });
      }
      continue;
    }

    const canonicalRegion = canonicalizeRegionName(
      trimmedRegion,
      regionRegistry,
      regionVariantMap
    );

    // Channel (graceful fallback + capitalization normalization)
    const rawChannel = mapping.channel && rawRow[mapping.channel]
      ? String(rawRow[mapping.channel]).trim()
      : 'Direct Sales';
    const channelKey = rawChannel.toLowerCase().replace(/[\s\-_]+/g, '');
    let canonicalChannel = channelRegistry.get(channelKey);
    if (!canonicalChannel) {
      canonicalChannel = canonicalizeText(rawChannel);
      channelRegistry.set(channelKey, canonicalChannel);
    }

    // Product (graceful fallback + capitalization normalization)
    const rawProduct = mapping.product && rawRow[mapping.product]
      ? String(rawRow[mapping.product]).trim()
      : 'Standard Merchandise';
    const productKey = rawProduct.toLowerCase().replace(/[\s\-_]+/g, '');
    let canonicalProduct = productRegistry.get(productKey);
    if (!canonicalProduct) {
      canonicalProduct = canonicalizeText(rawProduct);
      productRegistry.set(productKey, canonicalProduct);
    }

    // Units (graceful fallback to 1)
    const rawUnits = mapping.units ? rawRow[mapping.units] : null;
    const unitsParsed = parseNumericValue(rawUnits);
    const units = rawUnits !== null && rawUnits !== undefined ? Math.max(0, Math.round(unitsParsed)) : 1;

    // Discount percentage
    let discountPct = mapping.discount_pct ? parseNumericValue(rawRow[mapping.discount_pct]) : 0;
    if (discountPct > 0 && discountPct <= 1.0) {
      discountPct = discountPct * 100;
    }

    // Revenue
    const revenue = mapping.revenue ? parseNumericValue(rawRow[mapping.revenue]) : 0;

    records.push({
      id: `ord-${rowIdx}-${Math.random().toString(36).slice(2, 7)}`,
      quarter: qtr,
      region: canonicalRegion,
      originalRegion: trimmedRegion !== canonicalRegion ? trimmedRegion : undefined,
      channel: canonicalChannel,
      product: canonicalProduct,
      units,
      discount_pct: Math.min(100, Math.max(0, discountPct)),
      revenue,
    });
  }

  // Record merged name variations into warnings and diagnostic info
  const integratedRegionAliases: Record<string, string[]> = {};
  for (const [canonical, variants] of regionVariantMap.entries()) {
    if (variants.size > 1) {
      const variantList = Array.from(variants);
      integratedRegionAliases[canonical] = variantList;
      warnings.push(
        `Integrated ${variants.size} name variations for "${canonical}": merged ${variantList.map((v) => `"${v}"`).join(' and ')} together.`
      );
    }
  }

  const sampleRows = parsed.data.slice(0, 5);

  const diagnostics: CSVDiagnosticInfo = {
    fileName,
    fileSizeBytes: csvText.length,
    delimiter: parsed.meta.delimiter || ',',
    rawHeaders,
    sampleRows,
    detectedMapping: mapping,
    unmappedTargets,
    totalRawRows: parsed.data.length,
    validParsedRows: records.length,
    invalidRowReasons,
    integratedRegionAliases,
  };

  return {
    records,
    errors,
    warnings: warnings.slice(0, 10),
    fileName,
    totalRows: parsed.data.length,
    validRows: records.length,
    diagnostics,
  };
}

export function exportRecordsToCSV(records: SalesRecord[], filename = 'sales_orders_export.csv') {
  const csv = Papa.unparse(
    records.map((r) => ({
      quarter: r.quarter,
      region: r.region,
      channel: r.channel,
      product: r.product,
      units: r.units,
      discount_pct: r.discount_pct.toFixed(1),
      revenue: r.revenue.toFixed(2),
    }))
  );

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
