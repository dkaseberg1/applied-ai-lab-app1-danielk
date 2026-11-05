/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  AlertCircle,
  Database,
  Upload,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  SalesRecord,
  CSVParseResult,
  AISummaryState,
  CSVDiagnosticInfo,
} from './types/sales';
import {
  calculateSalesAnalytics,
  buildPayloadForAI,
  generateDeterministicThreeSentenceSummary,
} from './utils/analytics';
import { parseCSVContent } from './utils/csvParser';
import { SAMPLE_PRESETS } from './utils/sampleData';
import { Navbar } from './components/Navbar';
import { KPICards } from './components/KPICards';
import { AISummaryCard } from './components/AISummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { DataUploader } from './components/DataUploader';
import { OrdersDrawer } from './components/OrdersDrawer';

export default function App() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [fileName, setFileName] = useState<string>('Enterprise_Tech_Orders.csv');
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [lastDiagnostics, setLastDiagnostics] = useState<CSVDiagnosticInfo | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const [aiState, setAiState] = useState<AISummaryState>({
    summary: '',
    sentenceCount: 0,
    model: 'gemini-3.8-flash',
    calculatedRegion: '',
    loading: false,
    error: null,
    lastCalculatedAt: null,
  });

  // Load initial preset data on mount
  useEffect(() => {
    const initialPreset = SAMPLE_PRESETS[0];
    const headers = 'quarter,region,channel,product,units,discount_pct,revenue';
    const rows = initialPreset.data.map(
      d => `${d.quarter},${d.region},${d.channel},${d.product},${d.units},${d.discount_pct},${d.revenue}`
    );
    const csv = [headers, ...rows].join('\n');
    const result = parseCSVContent(csv, `${initialPreset.name}.csv`);
    setRecords(result.records);
    setFileName(result.fileName);
  }, []);

  // Compute analytics deterministically
  const analytics = useMemo(() => {
    return calculateSalesAnalytics(records);
  }, [records]);

  // Request Gemini 3.8 Flash summary from server-side endpoint
  const fetchAISummary = useCallback(
    async (currentAnalytics = analytics) => {
      if (!currentAnalytics.mostChangedRegionDollar) return;

      const payload = buildPayloadForAI(currentAnalytics);
      if (!payload) return;

      // Provide instant ground-truth fallback while server AI processes
      const fallbackSummary = generateDeterministicThreeSentenceSummary(currentAnalytics);

      setAiState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        calculatedRegion: currentAnalytics.mostChangedRegionDollar?.region || '',
      }));

      try {
        const response = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        setAiState({
          summary: data.summary || fallbackSummary,
          sentenceCount: data.sentenceCount || 3,
          model: data.model || 'gemini-3.8-flash',
          calculatedRegion: data.calculatedRegion || currentAnalytics.mostChangedRegionDollar.region,
          loading: false,
          error: null,
          lastCalculatedAt: Date.now(),
        });
      } catch (err: any) {
        console.warn('AI summary fetch failed, using ground-truth deterministic synthesis:', err);
        setAiState({
          summary: fallbackSummary,
          sentenceCount: 3,
          model: 'deterministic-engine',
          calculatedRegion: currentAnalytics.mostChangedRegionDollar.region,
          loading: false,
          error: err.message || 'Gemini API not connected. Using verified mathematical calculation.',
          lastCalculatedAt: Date.now(),
        });
      }
    },
    [analytics]
  );

  // Trigger AI summary whenever records change
  useEffect(() => {
    if (analytics.mostChangedRegionDollar) {
      fetchAISummary(analytics);
    }
  }, [analytics.mostChangedRegionDollar?.region, analytics.totalRevenue]);

  const handleDataLoaded = (result: CSVParseResult) => {
    setRecords(result.records);
    setFileName(result.fileName);
    setParseWarnings(result.warnings);
    if (result.diagnostics) {
      setLastDiagnostics(result.diagnostics);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const headers = 'quarter,region,channel,product,units,discount_pct,revenue';
    const rows = preset.data.map(
      d => `${d.quarter},${d.region},${d.channel},${d.product},${d.units},${d.discount_pct},${d.revenue}`
    );
    const csv = [headers, ...rows].join('\n');
    const result = parseCSVContent(csv, `${preset.name}.csv`);
    handleDataLoaded(result);
  };

  return (
    <div className="min-h-screen bg-[#1b367d] text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sticky Navbar */}
      <Navbar
        fileName={fileName}
        totalRows={records.length}
        totalRevenue={analytics.totalRevenue}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenTroubleshoot={() => setIsUploadOpen(true)}
        onSelectPreset={handleSelectPreset}
        onRegenerateAI={() => fetchAISummary(analytics)}
        isAiLoading={aiState.loading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Non-fatal CSV Warnings Banner (if any) */}
        {parseWarnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  CSV Notice: {parseWarnings.length} row warnings resolved
                </strong>
                <p className="text-slate-400">{parseWarnings[0]}</p>
              </div>
            </div>
            <button
              onClick={() => setParseWarnings([])}
              className="text-xs text-amber-400 hover:text-white underline shrink-0 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top KPI Headline Summary Cards */}
        <KPICards summary={analytics} />

        {/* Executive AI 3-Sentence Variance Summary Card */}
        <AISummaryCard
          aiState={aiState}
          summaryData={analytics}
          onRegenerate={() => fetchAISummary(analytics)}
        />

        {/* Visual Revenue Chart Section */}
        <section>
          <RevenueChart summary={analytics} />
        </section>

        {/* Revenue Pivot Matrix Table Section */}
        <section>
          <RevenueTable summary={analytics} />
        </section>

        {/* Bottom Explorer Banner */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Underlying Transaction Records
              </h4>
              <p className="text-xs text-slate-400">
                Inspect raw rows, column values, products, channels, and individual discount percentages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>View All {records.length} Order Rows</span>
              <ArrowRight className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Another CSV</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-blue-900/60 bg-[#1b367d]/90 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            SalesPulse Regional Intelligence Engine &bull; Calculated with deterministic precision &amp; summarized with Gemini 3.8 Flash
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            quarter &bull; region &bull; channel &bull; product &bull; units &bull; discount_pct &bull; revenue
          </div>
        </div>
      </footer>

      {/* CSV Upload & Troubleshooting Modal */}
      <DataUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
        currentDiagnostics={lastDiagnostics}
      />

      {/* Raw Orders Modal */}
      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        records={records}
        allRegions={analytics.allRegions}
      />
    </div>
  );
}
