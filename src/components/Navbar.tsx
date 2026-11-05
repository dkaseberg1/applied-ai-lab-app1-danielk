import React from 'react';
import {
  BarChart3,
  Upload,
  Download,
  Database,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_PRESETS, getSampleCSVText } from '../utils/sampleData';
import { formatUSD } from '../utils/analytics';

interface NavbarProps {
  fileName: string;
  totalRows: number;
  totalRevenue: number;
  onOpenUpload: () => void;
  onOpenTroubleshoot: () => void;
  onSelectPreset: (presetId: string) => void;
  onRegenerateAI: () => void;
  isAiLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  totalRows,
  totalRevenue,
  onOpenUpload,
  onOpenTroubleshoot,
  onSelectPreset,
  onRegenerateAI,
  isAiLoading,
}) => {
  const downloadSampleTemplate = () => {
    const csv = getSampleCSVText();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_orders_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SalesPulse
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Regional Revenue &amp; Quarterly Variance Engine
            </p>
          </div>
        </div>

        {/* Current Dataset Stats Badge */}
        {totalRows > 0 && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-200 truncate max-w-[140px]" title={fileName}>
                {fileName}
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-700" />
            <span className="text-slate-400">
              <strong className="text-slate-200">{totalRows}</strong> orders
            </span>
            <div className="w-px h-3.5 bg-slate-700" />
            <span className="text-slate-400">
              Total: <strong className="text-emerald-400">{formatUSD(totalRevenue, true)}</strong>
            </span>
          </div>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Load Pre-configured Datasets"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Demo Datasets</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Load Sample Data
              </div>
              {SAMPLE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-800/90 transition text-xs text-slate-300 hover:text-white"
                >
                  <div className="font-medium text-slate-200">{preset.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Download Starter Template */}
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Download Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Sample CSV</span>
          </button>

          {/* Troubleshoot CSV Button */}
          <button
            onClick={onOpenTroubleshoot}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 transition"
            title="Troubleshoot & Map CSV Columns"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Troubleshoot CSV</span>
          </button>

          {/* AI Refresh Button */}
          <button
            onClick={onRegenerateAI}
            disabled={isAiLoading || totalRows === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 transition disabled:opacity-40"
            title="Re-run Gemini AI Summary"
          >
            {isAiLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="hidden sm:inline">AI Analysis</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
