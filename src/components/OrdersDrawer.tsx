import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SalesRecord, Quarter } from '../types/sales';
import { formatUSD } from '../utils/analytics';
import { exportRecordsToCSV } from '../utils/csvParser';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  records: SalesRecord[];
  allRegions: string[];
}

export const OrdersDrawer: React.FC<OrdersDrawerProps> = ({
  isOpen,
  onClose,
  records,
  allRegions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  if (!isOpen) return null;

  const filtered = records.filter((r) => {
    if (selectedQuarter !== 'all' && r.quarter !== selectedQuarter) return false;
    if (selectedRegion !== 'all' && r.region !== selectedRegion) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.product.toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Raw Sales Orders Explorer
              </h2>
              <p className="text-xs text-slate-400">
                Viewing {filtered.length} of {records.length} sales transaction rows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportRecordsToCSV(records)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search product, channel, region..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quarter Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Quarter:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Regions</option>
                {allRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Quarter</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Units</th>
                <th className="py-3 px-4 text-right">Discount %</th>
                <th className="py-3 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedRecords.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-4 text-slate-500 font-sans">
                      {(currentPage - 1) * pageSize + i + 1}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-indigo-300">
                      {r.quarter}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{r.region}</span>
                        {r.originalRegion && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
                            title={`Original in CSV: "${r.originalRegion}"`}
                          >
                            raw: &quot;{r.originalRegion}&quot;
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-300">
                      {r.channel}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-200">
                      {r.product}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-300">
                      {r.units.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      {r.discount_pct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                      {formatUSD(r.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing page <strong className="text-white">{currentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
