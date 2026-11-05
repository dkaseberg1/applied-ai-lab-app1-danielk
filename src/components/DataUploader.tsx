import React, { useRef, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
  Clipboard,
  Wrench,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  parseCSVContent,
  TARGET_COLUMNS,
  detectColumnMapping,
} from '../utils/csvParser';
import {
  CSVParseResult,
  TargetColumn,
  CSVDiagnosticInfo,
} from '../types/sales';
import { SAMPLE_PRESETS, getSampleCSVText } from '../utils/sampleData';

interface DataUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (result: CSVParseResult) => void;
  currentDiagnostics?: CSVDiagnosticInfo | null;
}

export const DataUploader: React.FC<DataUploaderProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  currentDiagnostics,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'mapper'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');

  // Diagnostic & Mapping State
  const [rawCSVText, setRawCSVText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('uploaded_file.csv');
  const [diagnostics, setDiagnostics] = useState<CSVDiagnosticInfo | null>(
    currentDiagnostics || null
  );
  const [customMapping, setCustomMapping] = useState<Record<TargetColumn, string>>({
    quarter: '',
    region: '',
    channel: '',
    product: '',
    units: '',
    discount_pct: '',
    revenue: '',
  });

  if (!isOpen) return null;

  const processText = (text: string, fileName: string) => {
    setErrorMsg(null);
    setRawCSVText(text);
    setUploadedFileName(fileName);

    const result = parseCSVContent(text, fileName);
    setDiagnostics(result.diagnostics || null);

    if (result.diagnostics) {
      setCustomMapping(result.diagnostics.detectedMapping);
    }

    // If critical fields are missing or validRows is 0, transition to Mapper view
    const missingCritical =
      !result.diagnostics?.detectedMapping.quarter ||
      !result.diagnostics?.detectedMapping.region ||
      !result.diagnostics?.detectedMapping.revenue;

    if (missingCritical || result.validRows === 0) {
      setActiveTab('mapper');
      setErrorMsg(
        result.errors.length > 0
          ? result.errors.join(' ')
          : 'Please map your CSV columns to continue.'
      );
      return;
    }

    // Auto-success
    onDataLoaded(result);
    onClose();
  };

  const handleFile = (file: File) => {
    const nameLower = file.name.toLowerCase();
    const isCsvOrText =
      nameLower.endsWith('.csv') ||
      nameLower.endsWith('.tsv') ||
      nameLower.endsWith('.txt') ||
      file.type.includes('csv') ||
      file.type.includes('text') ||
      file.type.includes('excel') ||
      file.type === '';

    if (!isCsvOrText) {
      setErrorMsg(
        `File "${file.name}" may not be a standard CSV. Supported formats are .csv, .tsv, and plain text.`
      );
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        setErrorMsg('The selected file appears to be completely empty.');
        return;
      }
      processText(text, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file from your disk.');
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste some CSV or tabular text.');
      return;
    }
    processText(pastedText, 'pasted_sales_data.csv');
  };

  const applyCustomMapping = () => {
    if (!rawCSVText) return;
    setErrorMsg(null);

    const result = parseCSVContent(rawCSVText, uploadedFileName, customMapping);
    setDiagnostics(result.diagnostics || null);

    if (result.validRows === 0) {
      setErrorMsg(
        'Still could not parse any valid order rows. Check if the Quarter and Region columns match valid values.'
      );
      return;
    }

    onDataLoaded(result);
    onClose();
  };

  const loadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const headers = 'quarter,region,channel,product,units,discount_pct,revenue';
    const rows = preset.data.map(
      (d) =>
        `${d.quarter},${d.region},${d.channel},${d.product},${d.units},${d.discount_pct},${d.revenue}`
    );
    const csv = [headers, ...rows].join('\n');
    const result = parseCSVContent(csv, `${preset.name}.csv`);
    onDataLoaded(result);
    onClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upload &amp; Troubleshoot CSV</h2>
              <p className="text-xs text-slate-400">
                Populate dashboard with your custom order rows or resolve formatting issues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs shrink-0 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste CSV Text</span>
          </button>
          {diagnostics && (
            <button
              onClick={() => setActiveTab('mapper')}
              className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'mapper'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Column Mapper &amp; Diagnostics</span>
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block mb-0.5">CSV Ingestion Notice:</strong>
                <p>{errorMsg}</p>
                {activeTab !== 'mapper' && diagnostics && (
                  <button
                    onClick={() => setActiveTab('mapper')}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium underline flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Open Column Mapper to fix column headers</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: UPLOAD DROPZONE */}
          {activeTab === 'upload' && (
            <>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Drag &amp; drop your sales orders CSV here, or{' '}
                  <span className="text-indigo-400 underline underline-offset-2">browse files</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports comma, semicolon, tab, and pipe-delimited files (.csv, .tsv, .txt)
                </p>
              </div>

              {/* Troubleshooting helper tip */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Why didn&apos;t my data populate previously?</span>
                </div>
                <ul className="list-disc pl-5 text-slate-400 space-y-0.5 text-[11px]">
                  <li>
                    <strong>Column names:</strong> Your CSV might use labels like <code>Period</code> or <code>Order Date</code> instead of <code>quarter</code>, or <code>Territory</code> instead of <code>region</code>.
                  </li>
                  <li>
                    <strong>Quarter formatting:</strong> Values like <code>Qtr 1</code>, <code>2024-Q1</code>, dates (<code>2024-03-15</code>), or numbers are now automatically recognized.
                  </li>
                  <li>
                    <strong>Missing fields:</strong> Columns like <code>channel</code>, <code>product</code>, <code>units</code>, and <code>discount_pct</code> now provide automatic defaults if omitted.
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* TAB 2: PASTE CSV */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Copy table rows directly from Excel, Google Sheets, or a text file and paste them below:
              </p>
              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="quarter,region,channel,product,units,discount_pct,revenue&#10;Q1,North America,Direct,Cloud Blade,500,10,2000000&#10;Q2,North America,Direct,Cloud Blade,600,10,2400000..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={!pastedText.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
              >
                Parse &amp; Load Pasted Data
              </button>
            </div>
          )}

          {/* TAB 3: COLUMN MAPPER & DIAGNOSTICS */}
          {activeTab === 'mapper' && diagnostics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div>
                  File: <strong className="text-white">{diagnostics.fileName}</strong> (
                  {diagnostics.totalRawRows} rows detected, delimiter: &apos;{diagnostics.delimiter}&apos;)
                </div>
                <div>
                  Valid: <strong className="text-emerald-400">{diagnostics.validParsedRows}</strong> rows
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                  Match Columns from Your File
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TARGET_COLUMNS.map((target) => {
                    const isRequired = ['quarter', 'region', 'revenue'].includes(target);
                    const currentSelection = customMapping[target] || '';

                    return (
                      <div
                        key={target}
                        className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-200">
                            {target} {isRequired && <span className="text-rose-400">*</span>}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isRequired ? 'Essential' : 'Optional (has default)'}
                          </span>
                        </div>
                        <select
                          value={currentSelection}
                          onChange={(e) =>
                            setCustomMapping((prev) => ({
                              ...prev,
                              [target]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Choose matching column --</option>
                          {diagnostics.rawHeaders.map((hdr) => (
                            <option key={hdr} value={hdr}>
                              {hdr}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Preview of Raw Data */}
              {diagnostics.sampleRows.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    First Rows from Your File:
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-[11px] text-left text-slate-300">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          {diagnostics.rawHeaders.map((h) => (
                            <th key={h} className="py-1.5 px-2 font-mono">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono">
                        {diagnostics.sampleRows.slice(0, 3).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {diagnostics.rawHeaders.map((h) => (
                              <td key={h} className="py-1.5 px-2 text-slate-400 truncate max-w-[120px]">
                                {String(row[h] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invalid Rows Diagnostics Log (if any) */}
              {diagnostics.invalidRowReasons.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                  <div className="font-semibold">Row Parse Warnings:</div>
                  {diagnostics.invalidRowReasons.slice(0, 3).map((inv, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300">
                      &bull; Row {inv.rowNumber}: {inv.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={applyCustomMapping}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                <span>Apply Mappings &amp; Populate Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Benchmark Datasets */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Or Load Verified Sample Datasets</span>
              </span>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium underline text-[11px]"
              >
                <FileText className="w-3.5 h-3.5" />
                Template CSV
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset.id)}
                  className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 text-left transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition">
                      {preset.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {preset.data.length} rows
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {preset.highlight}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
