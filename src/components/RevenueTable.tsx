import React, { useState } from 'react';
import {
  Table,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  Sparkles,
  Package,
  Layers,
  Percent,
} from 'lucide-react';
import { AnalyticsSummary, Quarter, RegionPivotRow } from '../types/sales';
import { formatUSD, formatPercent } from '../utils/analytics';
import Papa from 'papaparse';

interface RevenueTableProps {
  summary: AnalyticsSummary;
}

type SortField =
  | 'region'
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4'
  | 'totalRevenue'
  | 'dollarChangeQ2toQ3'
  | 'pctChangeQ2toQ3';

export const RevenueTable: React.FC<RevenueTableProps> = ({ summary }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [activeDrilldownTab, setActiveDrilldownTab] = useState<Record<string, 'products' | 'channels'>>({});
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const {
    regionRows,
    quarterTotals,
    totalRevenue,
    totalQ2Revenue,
    totalQ3Revenue,
    totalQ2Q3Delta,
    totalQ2Q3Pct,
    mostChangedRegionDollar,
  } = summary;

  const toggleExpand = (region: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  // Filter & Sort
  const filteredRows = regionRows.filter((r) =>
    r.region.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === 'region') {
      aVal = a.region;
      bVal = b.region;
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (sortField === 'Q1' || sortField === 'Q2' || sortField === 'Q3' || sortField === 'Q4') {
      aVal = a.quarters[sortField];
      bVal = b.quarters[sortField];
    } else {
      aVal = a[sortField];
      bVal = b[sortField];
    }

    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const exportPivotCSV = () => {
    const data = regionRows.map((r) => ({
      Region: r.region,
      'Q1 Revenue': r.quarters.Q1.toFixed(2),
      'Q2 Revenue': r.quarters.Q2.toFixed(2),
      'Q3 Revenue': r.quarters.Q3.toFixed(2),
      'Q4 Revenue': r.quarters.Q4.toFixed(2),
      'Total Revenue': r.totalRevenue.toFixed(2),
      'Q2 to Q3 Dollar Delta': r.dollarChangeQ2toQ3.toFixed(2),
      'Q2 to Q3 Pct Change': `${r.pctChangeQ2toQ3.toFixed(1)}%`,
    }));

    // Add totals row
    data.push({
      Region: 'GRAND TOTAL',
      'Q1 Revenue': quarterTotals.Q1.toFixed(2),
      'Q2 Revenue': quarterTotals.Q2.toFixed(2),
      'Q3 Revenue': quarterTotals.Q3.toFixed(2),
      'Q4 Revenue': quarterTotals.Q4.toFixed(2),
      'Total Revenue': totalRevenue.toFixed(2),
      'Q2 to Q3 Dollar Delta': totalQ2Q3Delta.toFixed(2),
      'Q2 to Q3 Pct Change': `${totalQ2Q3Pct.toFixed(1)}%`,
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_revenue_by_region_and_quarter.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Revenue Pivot Matrix by Region &amp; Quarter
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {regionRows.length} Regions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any column header to sort, or expand any region to view underlying product and channel drivers
          </p>
        </div>

        {/* Right Search & Export Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          <button
            onClick={exportPivotCSV}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Export Pivot Table to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 w-10"></th>
              <th
                onClick={() => handleSort('region')}
                className="py-3.5 px-4 cursor-pointer group hover:text-white transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  {getSortIcon('region')}
                </div>
              </th>
              {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((qtr) => (
                <th
                  key={qtr}
                  onClick={() => handleSort(qtr)}
                  className="py-3.5 px-4 text-right cursor-pointer group hover:text-white transition select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{qtr} Revenue</span>
                    {getSortIcon(qtr)}
                  </div>
                </th>
              ))}
              <th
                onClick={() => handleSort('totalRevenue')}
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-white transition select-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  {getSortIcon('totalRevenue')}
                </div>
              </th>
              <th
                onClick={() => handleSort('dollarChangeQ2toQ3')}
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-white transition select-none bg-indigo-950/20"
              >
                <div className="flex items-center justify-end gap-1.5 text-indigo-300">
                  <span>Q2→Q3 Delta ($)</span>
                  {getSortIcon('dollarChangeQ2toQ3')}
                </div>
              </th>
              <th
                onClick={() => handleSort('pctChangeQ2toQ3')}
                className="py-3.5 px-4 text-right cursor-pointer group hover:text-white transition select-none bg-indigo-950/20"
              >
                <div className="flex items-center justify-end gap-1.5 text-indigo-300">
                  <span>Q2→Q3 %</span>
                  {getSortIcon('pctChangeQ2toQ3')}
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No matching regions found.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isExpanded = expandedRegions.has(row.region);
                const isTopChanged = mostChangedRegionDollar?.region === row.region;
                const tab = activeDrilldownTab[row.region] || 'products';

                return (
                  <React.Fragment key={row.region}>
                    <tr
                      onClick={() => toggleExpand(row.region)}
                      className={`cursor-pointer transition-colors ${
                        isTopChanged
                          ? 'bg-indigo-950/20 hover:bg-indigo-950/30'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Expand Toggle */}
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </td>

                      {/* Region Name with Badge */}
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{row.region}</span>
                          {row.rawVariations && row.rawVariations.length > 1 && (
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                              title={`Unified from variations: ${row.rawVariations.map(v => `"${v}"`).join(', ')}`}
                            >
                              Integrated ({row.rawVariations.map(v => `"${v}"`).join(' + ')})
                            </span>
                          )}
                          {isTopChanged && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40 shadow-sm">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              Max Shift
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quarters Q1 - Q4 */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatUSD(row.quarters.Q1)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                        {formatUSD(row.quarters.Q2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                        {formatUSD(row.quarters.Q3)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatUSD(row.quarters.Q4)}
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatUSD(row.totalRevenue)}
                      </td>

                      {/* Q2 to Q3 Dollar Delta */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold bg-indigo-950/15">
                        <span
                          className={
                            row.dollarChangeQ2toQ3 >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {row.dollarChangeQ2toQ3 >= 0 ? '+' : ''}
                          {formatUSD(row.dollarChangeQ2toQ3)}
                        </span>
                      </td>

                      {/* Q2 to Q3 % Delta */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold bg-indigo-950/15">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            row.pctChangeQ2toQ3 >= 0
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {formatPercent(row.pctChangeQ2toQ3)}
                        </span>
                      </td>
                    </tr>

                    {/* EXPANDABLE DETAIL DRAWER (Products and Channels in this region) */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-y border-slate-800">
                        <td colSpan={9} className="p-4 sm:p-6">
                          <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
                            {/* Drilldown Header & Tab Switcher */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-white">
                                  {row.region} Drilldown Analysis (Q2 vs Q3 Drivers)
                                </span>
                                <span className="text-xs text-slate-400">
                                  Volume: {row.q2Units.toLocaleString()} → {row.q3Units.toLocaleString()} units |
                                  Avg Discount: {row.q2AvgDiscount.toFixed(1)}% → {row.q3AvgDiscount.toFixed(1)}%
                                </span>
                              </div>

                              <div className="flex items-center rounded-lg bg-slate-800 p-0.5 text-xs">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDrilldownTab((prev) => ({ ...prev, [row.region]: 'products' }));
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                                    tab === 'products'
                                      ? 'bg-indigo-600 text-white font-medium'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  <span>Product Breakdown ({row.productBreakdown.length})</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDrilldownTab((prev) => ({ ...prev, [row.region]: 'channels' }));
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                                    tab === 'channels'
                                      ? 'bg-indigo-600 text-white font-medium'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Channel Breakdown ({row.channelBreakdown.length})</span>
                                </button>
                              </div>
                            </div>

                            {/* TAB: PRODUCTS */}
                            {tab === 'products' && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="text-slate-400 font-semibold border-b border-slate-800">
                                    <tr>
                                      <th className="py-2 px-3">Product Name</th>
                                      <th className="py-2 px-3 text-right">Q2 Revenue</th>
                                      <th className="py-2 px-3 text-right">Q3 Revenue</th>
                                      <th className="py-2 px-3 text-right">Revenue Change</th>
                                      <th className="py-2 px-3 text-right">% Change</th>
                                      <th className="py-2 px-3 text-right">Q2 Units</th>
                                      <th className="py-2 px-3 text-right">Q3 Units</th>
                                      <th className="py-2 px-3 text-right">Units Delta</th>
                                      <th className="py-2 px-3 text-right">Q2 / Q3 Avg Disc</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {row.productBreakdown.map((p, pIdx) => (
                                      <tr key={p.product} className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-sans font-medium text-slate-200 flex items-center gap-1.5">
                                          {pIdx === 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Top Revenue Driver" />
                                          )}
                                          <span>{p.product}</span>
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-300">
                                          {formatUSD(p.q2Revenue)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-300">
                                          {formatUSD(p.q3Revenue)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-bold ${
                                            p.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {p.revenueChange >= 0 ? '+' : ''}
                                          {formatUSD(p.revenueChange)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right ${
                                            p.percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {formatPercent(p.percentChange)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400">
                                          {p.q2Units.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400">
                                          {p.q3Units.toLocaleString()}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-semibold ${
                                            p.unitsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {p.unitsChange >= 0 ? '+' : ''}
                                          {p.unitsChange.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400">
                                          {p.q2AvgDiscount.toFixed(1)}% → {p.q3AvgDiscount.toFixed(1)}%
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* TAB: CHANNELS */}
                            {tab === 'channels' && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="text-slate-400 font-semibold border-b border-slate-800">
                                    <tr>
                                      <th className="py-2 px-3">Sales Channel</th>
                                      <th className="py-2 px-3 text-right">Q2 Revenue</th>
                                      <th className="py-2 px-3 text-right">Q3 Revenue</th>
                                      <th className="py-2 px-3 text-right">Revenue Change</th>
                                      <th className="py-2 px-3 text-right">% Change</th>
                                      <th className="py-2 px-3 text-right">Q2 Units</th>
                                      <th className="py-2 px-3 text-right">Q3 Units</th>
                                      <th className="py-2 px-3 text-right">Units Delta</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {row.channelBreakdown.map((ch, cIdx) => (
                                      <tr key={ch.channel} className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-sans font-medium text-slate-200 flex items-center gap-1.5">
                                          {cIdx === 0 && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Primary Channel Driver" />
                                          )}
                                          <span>{ch.channel}</span>
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-300">
                                          {formatUSD(ch.q2Revenue)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-300">
                                          {formatUSD(ch.q3Revenue)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-bold ${
                                            ch.revenueChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {ch.revenueChange >= 0 ? '+' : ''}
                                          {formatUSD(ch.revenueChange)}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right ${
                                            ch.percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {formatPercent(ch.percentChange)}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400">
                                          {ch.q2Units.toLocaleString()}
                                        </td>
                                        <td className="py-2 px-3 text-right text-slate-400">
                                          {ch.q3Units.toLocaleString()}
                                        </td>
                                        <td
                                          className={`py-2 px-3 text-right font-semibold ${
                                            ch.unitsChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                          }`}
                                        >
                                          {ch.unitsChange >= 0 ? '+' : ''}
                                          {ch.unitsChange.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Grand Totals Summary Row */}
          <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-semibold text-white">
            <tr>
              <td className="py-4 px-4 text-center">Σ</td>
              <td className="py-4 px-4 font-bold text-slate-200 uppercase tracking-wider text-xs">
                Grand Total ({regionRows.length} Regions)
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-200">
                {formatUSD(quarterTotals.Q1)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-200">
                {formatUSD(quarterTotals.Q2)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-200">
                {formatUSD(quarterTotals.Q3)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-slate-200">
                {formatUSD(quarterTotals.Q4)}
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                {formatUSD(totalRevenue)}
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold bg-indigo-950/30">
                <span
                  className={
                    totalQ2Q3Delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {totalQ2Q3Delta >= 0 ? '+' : ''}
                  {formatUSD(totalQ2Q3Delta)}
                </span>
              </td>
              <td className="py-4 px-4 text-right font-mono font-bold bg-indigo-950/30">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                    totalQ2Q3Pct >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {formatPercent(totalQ2Q3Pct)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
