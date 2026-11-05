import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Flame,
  Award,
} from 'lucide-react';
import { AnalyticsSummary } from '../types/sales';
import { formatUSD, formatPercent } from '../utils/analytics';

interface KPICardsProps {
  summary: AnalyticsSummary;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary }) => {
  const {
    totalRevenue,
    totalOrders,
    totalUnits,
    quarterTotals,
    regionRows,
    mostChangedRegionDollar,
  } = summary;

  // Best Quarter
  const bestQuarter = Object.entries(quarterTotals).reduce(
    (max, [q, rev]) => (rev > max.rev ? { q, rev } : max),
    { q: 'Q1', rev: -1 }
  );

  // Top Region
  const topRegion = regionRows.length > 0 ? regionRows[0] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {formatUSD(totalRevenue)}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Across {totalOrders.toLocaleString()} orders &amp; {totalUnits.toLocaleString()} units
        </div>
      </div>

      {/* Region That Changed Most from Q2 to Q3 */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Max Q2→Q3 Shift
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
            {mostChangedRegionDollar && mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white tracking-tight truncate">
            {mostChangedRegionDollar ? mostChangedRegionDollar.region : 'N/A'}
          </span>
        </div>
        {mostChangedRegionDollar ? (
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
            <span
              className={
                mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
            >
              {mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0 ? '+' : ''}
              {formatUSD(mostChangedRegionDollar.dollarChangeQ2toQ3, true)} (
              {formatPercent(mostChangedRegionDollar.pctChangeQ2toQ3)})
            </span>
            <span className="text-slate-500">from Q2 to Q3</span>
          </div>
        ) : (
          <div className="mt-1 text-xs text-slate-500">No regional data</div>
        )}
      </div>

      {/* Top Revenue Region */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Leading Region
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white tracking-tight truncate">
            {topRegion ? topRegion.region : 'N/A'}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {topRegion ? (
            <>
              <strong className="text-slate-300">{formatUSD(topRegion.totalRevenue, true)}</strong> (
              {((topRegion.totalRevenue / (totalRevenue || 1)) * 100).toFixed(1)}% total share)
            </>
          ) : (
            'Awaiting data'
          )}
        </div>
      </div>

      {/* Peak Quarter */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Peak Quarter
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {bestQuarter.q}
          </span>
          <span className="text-xs text-purple-300 font-mono">
            {formatUSD(bestQuarter.rev, true)}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {((bestQuarter.rev / (totalRevenue || 1)) * 100).toFixed(1)}% of annual sales
        </div>
      </div>
    </div>
  );
};
