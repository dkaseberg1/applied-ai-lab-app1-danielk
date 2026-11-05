import React, { useState, useId } from 'react';
import {
  BarChart3,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { AnalyticsSummary, Quarter, RegionPivotRow } from '../types/sales';
import { formatUSD, formatPercent } from '../utils/analytics';

interface RevenueChartProps {
  summary: AnalyticsSummary;
}

type ChartViewMode = 'by-region' | 'by-quarter' | 'q2-q3-shift' | 'stacked';

const QUARTER_COLORS: Record<Quarter, { fill: string; border: string; text: string; bg: string }> = {
  Q1: { fill: 'url(#gradientQ1)', border: '#60a5fa', text: 'text-blue-400', bg: 'bg-blue-500' },
  Q2: { fill: 'url(#gradientQ2)', border: '#818cf8', text: 'text-indigo-400', bg: 'bg-indigo-500' },
  Q3: { fill: 'url(#gradientQ3)', border: '#c084fc', text: 'text-purple-400', bg: 'bg-purple-500' },
  Q4: { fill: 'url(#gradientQ4)', border: '#38bdf8', text: 'text-sky-400', bg: 'bg-sky-500' },
};

const REGION_PALETTE = [
  { fill: 'url(#regGrad0)', border: '#38bdf8', hex: '#38bdf8' },
  { fill: 'url(#regGrad1)', border: '#818cf8', hex: '#818cf8' },
  { fill: 'url(#regGrad2)', border: '#c084fc', hex: '#c084fc' },
  { fill: 'url(#regGrad3)', border: '#34d399', hex: '#34d399' },
  { fill: 'url(#regGrad4)', border: '#fbbf24', hex: '#fbbf24' },
  { fill: 'url(#regGrad5)', border: '#f87171', hex: '#f87171' },
];

export const RevenueChart: React.FC<RevenueChartProps> = ({ summary }) => {
  const chartId = useId();
  const [viewMode, setViewMode] = useState<ChartViewMode>('by-region');
  const [hoveredData, setHoveredData] = useState<{
    label: string;
    subLabel: string;
    revenue: number;
    pctOfTotal?: number;
    units?: number;
    x: number;
    y: number;
  } | null>(null);

  const { regionRows, allQuarters, mostChangedRegionDollar } = summary;

  if (!regionRows || regionRows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
        No sales data available to render chart.
      </div>
    );
  }

  // Chart dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const padding = { top: 30, right: 30, bottom: 65, left: 75 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Maximum revenue computation based on view
  let maxRevenue = 1000;
  if (viewMode === 'stacked') {
    maxRevenue = Math.max(...regionRows.map(r => r.totalRevenue), 1000);
  } else if (viewMode === 'q2-q3-shift') {
    maxRevenue = Math.max(
      ...regionRows.flatMap(r => [r.q2Revenue, r.q3Revenue]),
      1000
    );
  } else {
    maxRevenue = Math.max(
      ...regionRows.flatMap(r => Object.values(r.quarters)),
      1000
    );
  }
  // Add a 15% headroom for top labels
  maxRevenue = maxRevenue * 1.15;

  const getY = (val: number) => {
    return innerHeight - (val / maxRevenue) * innerHeight;
  };

  // Y-axis tick marks (5 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ratio * maxRevenue);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl relative">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Total Revenue by Region &amp; Quarter
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Interactive Visualization
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare regional quarterly performance, market share, and specific Q2 vs Q3 movements
          </p>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center rounded-xl bg-slate-800/90 p-1 border border-slate-700/80 text-xs gap-1">
          <button
            onClick={() => setViewMode('by-region')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'by-region'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>By Region</span>
          </button>

          <button
            onClick={() => setViewMode('by-quarter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'by-quarter'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>By Quarter</span>
          </button>

          <button
            onClick={() => setViewMode('q2-q3-shift')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'q2-q3-shift'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Focus specifically on Q2 to Q3 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Q2 vs Q3 Focus</span>
          </button>

          <button
            onClick={() => setViewMode('stacked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'stacked'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stacked Share</span>
          </button>
        </div>
      </div>

      {/* Main SVG Chart */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[680px] overflow-visible"
        >
          <defs>
            {/* Quarter Gradients */}
            <linearGradient id="gradientQ1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="gradientQ2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="gradientQ3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="gradientQ4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
            </linearGradient>

            {/* Region Gradients */}
            {REGION_PALETTE.map((pal, idx) => (
              <linearGradient key={idx} id={`regGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={pal.hex} stopOpacity="0.9" />
                <stop offset="100%" stopColor={pal.hex} stopOpacity="0.5" />
              </linearGradient>
            ))}
          </defs>

          {/* Chart Canvas Area */}
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid horizontal lines */}
            {yTicks.map((tick, i) => {
              const y = getY(tick);
              return (
                <g key={i}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray={i === 0 ? '' : '3 3'}
                    strokeWidth={i === 0 ? 1.5 : 0.8}
                    strokeOpacity={0.6}
                  />
                  <text
                    x={-10}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={11}
                    fontFamily="monospace"
                  >
                    {formatUSD(tick, true)}
                  </text>
                </g>
              );
            })}

            {/* VIEW MODE: BY REGION */}
            {viewMode === 'by-region' && (
              <>
                {regionRows.map((reg, rIdx) => {
                  const groupWidth = innerWidth / regionRows.length;
                  const groupX = rIdx * groupWidth;
                  const barMargin = 6;
                  const availableWidth = groupWidth - barMargin * 2;
                  const barWidth = Math.min(28, availableWidth / 4 - 3);
                  const isTopChanged = mostChangedRegionDollar?.region === reg.region;

                  return (
                    <g key={reg.region} transform={`translate(${groupX}, 0)`}>
                      {/* Highlight backdrop for region that changed most */}
                      {isTopChanged && (
                        <rect
                          x={barMargin - 2}
                          y={-10}
                          width={groupWidth - barMargin * 2 + 4}
                          height={innerHeight + 10}
                          rx={8}
                          fill="#4f46e5"
                          fillOpacity={0.08}
                          stroke="#6366f1"
                          strokeOpacity={0.3}
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* 4 Quarterly bars */}
                      {allQuarters.map((qtr, qIdx) => {
                        const val = reg.quarters[qtr] || 0;
                        const barHeight = Math.max(2, (val / maxRevenue) * innerHeight);
                        const barX =
                          barMargin +
                          (availableWidth - (barWidth * 4 + 3 * 3)) / 2 +
                          qIdx * (barWidth + 3);
                        const barY = innerHeight - barHeight;
                        const qColor = QUARTER_COLORS[qtr];

                        return (
                          <g
                            key={qtr}
                            className="transition-transform duration-200 cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredData({
                                label: reg.region,
                                subLabel: `${qtr} Revenue`,
                                revenue: val,
                                units: reg.quarterUnits[qtr],
                                pctOfTotal: (val / reg.totalRevenue) * 100,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredData(null)}
                          >
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barHeight}
                              rx={4}
                              fill={qColor.fill}
                              stroke={qColor.border}
                              strokeWidth={0.5}
                              className="hover:brightness-125 transition-all"
                            />
                          </g>
                        );
                      })}

                      {/* Region X-Axis Label */}
                      <text
                        x={groupWidth / 2}
                        y={innerHeight + 24}
                        textAnchor="middle"
                        fill={isTopChanged ? '#818cf8' : '#cbd5e1'}
                        fontSize={12}
                        fontWeight={isTopChanged ? 700 : 500}
                      >
                        {reg.region}
                      </text>

                      {/* Callout badge if top changed */}
                      {isTopChanged && (
                        <text
                          x={groupWidth / 2}
                          y={innerHeight + 42}
                          textAnchor="middle"
                          fill="#a5b4fc"
                          fontSize={10}
                          fontWeight={600}
                        >
                          Max Q2→Q3 Shift
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE: BY QUARTER */}
            {viewMode === 'by-quarter' && (
              <>
                {allQuarters.map((qtr, qIdx) => {
                  const groupWidth = innerWidth / allQuarters.length;
                  const groupX = qIdx * groupWidth;
                  const barMargin = 12;
                  const availableWidth = groupWidth - barMargin * 2;
                  const barWidth = Math.min(32, availableWidth / regionRows.length - 4);

                  return (
                    <g key={qtr} transform={`translate(${groupX}, 0)`}>
                      {regionRows.map((reg, rIdx) => {
                        const val = reg.quarters[qtr] || 0;
                        const barHeight = Math.max(2, (val / maxRevenue) * innerHeight);
                        const barX =
                          barMargin +
                          (availableWidth - (barWidth * regionRows.length + 4 * (regionRows.length - 1))) / 2 +
                          rIdx * (barWidth + 4);
                        const barY = innerHeight - barHeight;
                        const pal = REGION_PALETTE[rIdx % REGION_PALETTE.length];

                        return (
                          <g
                            key={reg.region}
                            className="cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredData({
                                label: qtr,
                                subLabel: reg.region,
                                revenue: val,
                                units: reg.quarterUnits[qtr],
                                pctOfTotal: summary.quarterTotals[qtr] > 0 ? (val / summary.quarterTotals[qtr]) * 100 : 0,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredData(null)}
                          >
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barHeight}
                              rx={4}
                              fill={pal.fill}
                              stroke={pal.border}
                              strokeWidth={0.5}
                              className="hover:brightness-125 transition-all"
                            />
                          </g>
                        );
                      })}

                      {/* Quarter Label */}
                      <text
                        x={groupWidth / 2}
                        y={innerHeight + 24}
                        textAnchor="middle"
                        fill="#f8fafc"
                        fontSize={13}
                        fontWeight={600}
                      >
                        {qtr}
                      </text>
                      <text
                        x={groupWidth / 2}
                        y={innerHeight + 42}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                      >
                        {formatUSD(summary.quarterTotals[qtr], true)}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE: Q2 VS Q3 FOCUS */}
            {viewMode === 'q2-q3-shift' && (
              <>
                {regionRows.map((reg, rIdx) => {
                  const groupWidth = innerWidth / regionRows.length;
                  const groupX = rIdx * groupWidth;
                  const barMargin = 14;
                  const availableWidth = groupWidth - barMargin * 2;
                  const barWidth = Math.min(36, availableWidth / 2 - 6);
                  const isTopChanged = mostChangedRegionDollar?.region === reg.region;

                  const q2Val = reg.q2Revenue;
                  const q3Val = reg.q3Revenue;
                  const q2Height = Math.max(2, (q2Val / maxRevenue) * innerHeight);
                  const q3Height = Math.max(2, (q3Val / maxRevenue) * innerHeight);

                  const q2X = barMargin + availableWidth / 2 - barWidth - 4;
                  const q3X = barMargin + availableWidth / 2 + 4;
                  const q2Y = innerHeight - q2Height;
                  const q3Y = innerHeight - q3Height;

                  return (
                    <g key={reg.region} transform={`translate(${groupX}, 0)`}>
                      {isTopChanged && (
                        <rect
                          x={barMargin - 4}
                          y={-12}
                          width={groupWidth - barMargin * 2 + 8}
                          height={innerHeight + 12}
                          rx={10}
                          fill="#4f46e5"
                          fillOpacity={0.12}
                          stroke="#818cf8"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Q2 Bar */}
                      <g
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredData({
                            label: reg.region,
                            subLabel: 'Q2 Baseline Revenue',
                            revenue: q2Val,
                            units: reg.q2Units,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredData(null)}
                      >
                        <rect
                          x={q2X}
                          y={q2Y}
                          width={barWidth}
                          height={q2Height}
                          rx={4}
                          fill="url(#gradientQ2)"
                          stroke="#818cf8"
                          strokeWidth={0.5}
                          className="hover:brightness-125 transition"
                        />
                        <text
                          x={q2X + barWidth / 2}
                          y={q2Y - 6}
                          textAnchor="middle"
                          fill="#818cf8"
                          fontSize={10}
                          fontWeight={600}
                        >
                          Q2
                        </text>
                      </g>

                      {/* Q3 Bar */}
                      <g
                        className="cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredData({
                            label: reg.region,
                            subLabel: 'Q3 Comparison Revenue',
                            revenue: q3Val,
                            units: reg.q3Units,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredData(null)}
                      >
                        <rect
                          x={q3X}
                          y={q3Y}
                          width={barWidth}
                          height={q3Height}
                          rx={4}
                          fill="url(#gradientQ3)"
                          stroke="#c084fc"
                          strokeWidth={0.5}
                          className="hover:brightness-125 transition"
                        />
                        <text
                          x={q3X + barWidth / 2}
                          y={q3Y - 6}
                          textAnchor="middle"
                          fill="#c084fc"
                          fontSize={10}
                          fontWeight={600}
                        >
                          Q3
                        </text>
                      </g>

                      {/* Region Label */}
                      <text
                        x={groupWidth / 2}
                        y={innerHeight + 24}
                        textAnchor="middle"
                        fill={isTopChanged ? '#818cf8' : '#e2e8f0'}
                        fontSize={12}
                        fontWeight={isTopChanged ? 700 : 500}
                      >
                        {reg.region}
                      </text>

                      {/* Delta percentage badge */}
                      <text
                        x={groupWidth / 2}
                        y={innerHeight + 42}
                        textAnchor="middle"
                        fill={reg.dollarChangeQ2toQ3 >= 0 ? '#34d399' : '#f87171'}
                        fontSize={11}
                        fontWeight={700}
                      >
                        {reg.dollarChangeQ2toQ3 >= 0 ? '+' : ''}
                        {formatUSD(reg.dollarChangeQ2toQ3, true)} ({formatPercent(reg.pctChangeQ2toQ3)})
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE: STACKED SHARE */}
            {viewMode === 'stacked' && (
              <>
                {regionRows.map((reg, rIdx) => {
                  const barWidth = Math.min(48, innerWidth / regionRows.length - 24);
                  const groupWidth = innerWidth / regionRows.length;
                  const groupX = rIdx * groupWidth + (groupWidth - barWidth) / 2;

                  let currentHeight = 0;
                  return (
                    <g key={reg.region}>
                      {allQuarters.map((qtr) => {
                        const val = reg.quarters[qtr] || 0;
                        const segmentHeight = (val / maxRevenue) * innerHeight;
                        const y = innerHeight - currentHeight - segmentHeight;
                        currentHeight += segmentHeight;
                        const qColor = QUARTER_COLORS[qtr];

                        return (
                          <g
                            key={qtr}
                            className="cursor-pointer"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredData({
                                label: reg.region,
                                subLabel: `${qtr} Revenue`,
                                revenue: val,
                                pctOfTotal: (val / reg.totalRevenue) * 100,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredData(null)}
                          >
                            <rect
                              x={groupX}
                              y={y}
                              width={barWidth}
                              height={segmentHeight}
                              fill={qColor.fill}
                              stroke={qColor.border}
                              strokeWidth={0.5}
                              className="hover:brightness-125 transition"
                            />
                          </g>
                        );
                      })}

                      {/* Region Label */}
                      <text
                        x={groupX + barWidth / 2}
                        y={innerHeight + 24}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize={12}
                        fontWeight={500}
                      >
                        {reg.region}
                      </text>
                      <text
                        x={groupX + barWidth / 2}
                        y={innerHeight + 42}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={11}
                        fontFamily="monospace"
                      >
                        {formatUSD(reg.totalRevenue, true)}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Floating Tooltip */}
      {hoveredData && (
        <div
          className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl text-xs backdrop-blur-md"
          style={{ left: hoveredData.x, top: hoveredData.y - 12 }}
        >
          <div className="font-semibold text-white">{hoveredData.label}</div>
          <div className="text-[11px] text-slate-400">{hoveredData.subLabel}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-emerald-400">
              {formatUSD(hoveredData.revenue)}
            </span>
            {hoveredData.pctOfTotal !== undefined && (
              <span className="text-[10px] text-slate-400">
                ({hoveredData.pctOfTotal.toFixed(1)}% share)
              </span>
            )}
          </div>
          {hoveredData.units !== undefined && (
            <div className="text-[10px] text-slate-400 mt-0.5">
              Units: <strong className="text-slate-200">{hoveredData.units.toLocaleString()}</strong>
            </div>
          )}
        </div>
      )}

      {/* Chart Footer Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'by-quarter' ? (
            regionRows.map((reg, idx) => {
              const pal = REGION_PALETTE[idx % REGION_PALETTE.length];
              return (
                <div key={reg.region} className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: pal.hex }}
                  />
                  <span>{reg.region}</span>
                </div>
              );
            })
          ) : viewMode === 'q2-q3-shift' ? (
            <>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 shadow-sm" />
                <span>Q2 (Baseline)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-sm bg-purple-500 shadow-sm" />
                <span>Q3 (Comparison)</span>
              </div>
              <div className="text-slate-500 text-[11px]">
                Dashed box highlights region with the largest variance magnitude
              </div>
            </>
          ) : (
            allQuarters.map((qtr) => {
              const col = QUARTER_COLORS[qtr];
              return (
                <div key={qtr} className="flex items-center gap-1.5 text-slate-300">
                  <span className={`w-3 h-3 rounded-sm ${col.bg} shadow-sm`} />
                  <span>{qtr}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Highlight Quick Stats */}
        {mostChangedRegionDollar && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="text-indigo-300 font-semibold">Max Variance:</span>
            <span className="text-white font-medium">{mostChangedRegionDollar.region}</span>
            <span
              className={
                mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0
                  ? 'text-emerald-400 font-semibold'
                  : 'text-rose-400 font-semibold'
              }
            >
              ({mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0 ? '+' : ''}
              {formatUSD(mostChangedRegionDollar.dollarChangeQ2toQ3, true)},{' '}
              {formatPercent(mostChangedRegionDollar.pctChangeQ2toQ3)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
