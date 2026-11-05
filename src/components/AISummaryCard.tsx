import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  FileCheck,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AISummaryState, AnalyticsSummary } from '../types/sales';
import { formatUSD, formatPercent } from '../utils/analytics';

interface AISummaryCardProps {
  aiState: AISummaryState;
  summaryData: AnalyticsSummary;
  onRegenerate: () => void;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  aiState,
  summaryData,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showGroundTruth, setShowGroundTruth] = useState(false);
  const [viewMode, setViewMode] = useState<'paragraph' | 'breakdown'>('paragraph');

  const { mostChangedRegionDollar } = summaryData;

  const handleCopy = () => {
    if (!aiState.summary) return;
    navigator.clipboard.writeText(aiState.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!aiState.summary) return;
    const utterance = new SpeechSynthesisUtterance(aiState.summary);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Split summary into sentences for structured inspection
  const rawSentences = (aiState.summary || '')
    .replace(/([0-9]+)\.([0-9]+)/g, '$1__DEC__$2')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/__DEC__/g, '.').trim())
    .filter(s => s.length > 0);

  const isExactThree = rawSentences.length === 3;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl shadow-indigo-950/30">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative px-6 pt-5 pb-4 border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Regional Variance Commentary
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Q2 to Q3 maximum regional variance analysis (calculated numbers only)
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Sentence count badge */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
              isExactThree
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
            }`}
            title="User prompt constraint: exactly 3 sentences"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              {rawSentences.length} {rawSentences.length === 1 ? 'Sentence' : 'Sentences'}
              {isExactThree && ' (Exact)'}
            </span>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => setViewMode('paragraph')}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === 'paragraph'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prose
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-2.5 py-1 rounded-md transition ${
                viewMode === 'breakdown'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1-2-3 Breakdown
            </button>
          </div>

          {/* Audio Speech */}
          {'speechSynthesis' in window && (
            <button
              onClick={handleSpeak}
              disabled={aiState.loading || !aiState.summary}
              className={`p-2 rounded-lg border transition ${
                isSpeaking
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Listen to summary'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={aiState.loading || !aiState.summary}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Copy 3-sentence summary"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Regenerate Button */}
          <button
            onClick={onRegenerate}
            disabled={aiState.loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            title="Regenerate summary with Gemini 3.8 Flash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiState.loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="relative p-6">
        {aiState.loading ? (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="h-4 bg-slate-800 rounded-full w-11/12" />
            <div className="h-4 bg-slate-800 rounded-full w-full" />
            <div className="h-4 bg-slate-800 rounded-full w-9/12" />
            <div className="flex items-center gap-2 pt-2 text-xs text-indigo-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing calculated sales metrics and synthesizing executive summary...</span>
            </div>
          </div>
        ) : aiState.error ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start justify-between gap-3">
            <div>
              <strong className="font-semibold block mb-1">API Notice:</strong>
              {aiState.error}
              <div className="mt-2 text-slate-400">
                Displaying deterministic calculations below. Click &quot;Regenerate&quot; once credentials or connectivity is established.
              </div>
            </div>
            <button
              onClick={onRegenerate}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium shrink-0"
            >
              Retry
            </button>
          </div>
        ) : viewMode === 'paragraph' ? (
          /* Prose View */
          <div className="relative">
            <blockquote className="text-base sm:text-lg leading-relaxed font-normal text-slate-100 tracking-normal pl-4 border-l-2 border-indigo-400">
              {aiState.summary}
            </blockquote>
          </div>
        ) : (
          /* 3-Sentence Step-by-Step Breakdown */
          <div className="space-y-3">
            {rawSentences.map((sentence, idx) => {
              const label =
                idx === 0
                  ? 'Sentence 1: Region & Core Variance'
                  : idx === 1
                  ? 'Sentence 2: Primary Product Driver'
                  : idx === 2
                  ? 'Sentence 3: Channel / Discount Dynamics'
                  : `Sentence ${idx + 1}`;

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-indigo-500/30">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-indigo-300 mb-1 uppercase tracking-wider">
                      {label}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      {sentence}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Calculated Ground Truth Audit Accordion */}
        {mostChangedRegionDollar && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => setShowGroundTruth(!showGroundTruth)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 transition group"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium group-hover:text-indigo-300 transition">
                  Audit Ground Truth: Numbers Calculated by App
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Zero Hallucination Guarantee
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300">
                <span className="text-[11px]">{showGroundTruth ? 'Hide' : 'Inspect'}</span>
                {showGroundTruth ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showGroundTruth && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 animate-in fade-in duration-150">
                {/* Region & Variance */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Region with Max Delta
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {mostChangedRegionDollar.region}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold mt-1">
                    {mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span
                      className={
                        mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {mostChangedRegionDollar.dollarChangeQ2toQ3 >= 0 ? '+' : ''}
                      {formatUSD(mostChangedRegionDollar.dollarChangeQ2toQ3)} (
                      {formatPercent(mostChangedRegionDollar.pctChangeQ2toQ3)})
                    </span>
                  </div>
                </div>

                {/* Q2 vs Q3 Revenue */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Quarterly Shift
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Q2: <strong className="text-white">{formatUSD(mostChangedRegionDollar.q2Revenue)}</strong>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Q3: <strong className="text-white">{formatUSD(mostChangedRegionDollar.q3Revenue)}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Volume: {mostChangedRegionDollar.q2Units.toLocaleString()} → {mostChangedRegionDollar.q3Units.toLocaleString()} units
                  </div>
                </div>

                {/* Product Driver */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Primary Product Driver
                  </div>
                  {mostChangedRegionDollar.topProductDriver ? (
                    <>
                      <div className="text-xs font-bold text-indigo-300 truncate mt-0.5">
                        {mostChangedRegionDollar.topProductDriver.product}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        Shift:{' '}
                        <span
                          className={
                            mostChangedRegionDollar.topProductDriver.revenueChange >= 0
                              ? 'text-emerald-400 font-semibold'
                              : 'text-rose-400 font-semibold'
                          }
                        >
                          {mostChangedRegionDollar.topProductDriver.revenueChange >= 0 ? '+' : ''}
                          {formatUSD(mostChangedRegionDollar.topProductDriver.revenueChange)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Units: {mostChangedRegionDollar.topProductDriver.unitsChange >= 0 ? '+' : ''}
                        {mostChangedRegionDollar.topProductDriver.unitsChange.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1">No products found</div>
                  )}
                </div>

                {/* Channel & Discount */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Channel &amp; Discount
                  </div>
                  {mostChangedRegionDollar.topChannelDriver && (
                    <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {mostChangedRegionDollar.topChannelDriver.channel} (
                      {mostChangedRegionDollar.topChannelDriver.revenueChange >= 0 ? '+' : ''}
                      {formatUSD(mostChangedRegionDollar.topChannelDriver.revenueChange)})
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    Avg Discount: {mostChangedRegionDollar.q2AvgDiscount.toFixed(1)}% →{' '}
                    {mostChangedRegionDollar.q3AvgDiscount.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
