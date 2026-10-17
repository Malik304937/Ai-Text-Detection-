import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  FileDown,
  FileText,
  AlertTriangle,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Calendar,
  BookOpen,
  Share2
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { downloadPdfReport, downloadTxtReport, shareReportSheet } from '../utils/pdfReport';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onAnalyzeAgain: () => void;
  onNewScan: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onAnalyzeAgain,
  onNewScan,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [highlightMarkers, setHighlightMarkers] = useState<boolean>(true);
  const [activePhraseFilter, setActivePhraseFilter] = useState<'all' | 'ai_pattern' | 'human_trait'>('all');

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(result.originalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Configure Banner Styling according to assessment
  let badgeConfig = {
    title: 'POSSIBLY AI-GENERATED',
    color: 'from-amber-500/20 via-orange-500/20 to-violet-500/20',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    icon: ShieldAlert,
    tag: 'Formulaic / High Regularity Pattern',
    description:
      'Linguistic patterns in this text match typical Large Language Model stylometrics: uniform sentence cadence, standard AI transitional phrases, and hedged, balanced neutrality.'
  };

  if (result.assessment === 'Possibly human-written') {
    badgeConfig = {
      title: 'POSSIBLY HUMAN-WRITTEN',
      color: 'from-emerald-500/20 via-teal-500/20 to-blue-500/20',
      borderColor: 'border-emerald-500/40',
      textColor: 'text-emerald-400',
      icon: ShieldCheck,
      tag: 'Natural Variance / High Burstiness',
      description:
        'Linguistic patterns exhibit authentic human stylometrics: high sentence length variance, colloquial or idiosyncratic phrasing, and organic narrative or argumentative flow.'
    };
  } else if (result.assessment === 'Inconclusive') {
    badgeConfig = {
      title: 'INCONCLUSIVE ASSESSMENT',
      color: 'from-slate-800/80 via-slate-800/60 to-slate-900/80',
      borderColor: 'border-slate-700',
      textColor: 'text-slate-300',
      icon: HelpCircle,
      tag: 'Ambiguous / Insufficient Stylometric Signal',
      description:
        'The linguistic evidence is mixed, brief, heavily formulaic by domain convention (e.g. legal or scientific boilerplate), or insufficient to form a reliable stylometric assessment.'
    };
  }

  const BadgeIcon = badgeConfig.icon;

  // Render text with interactive phrase highlights
  const renderHighlightedText = () => {
    if (!highlightMarkers || !result.highlightedPhrases || result.highlightedPhrases.length === 0) {
      return <span className="whitespace-pre-wrap">{result.originalText}</span>;
    }

    // Filter phrases if user clicked a filter
    const activePhrases = result.highlightedPhrases.filter(p => {
      if (activePhraseFilter === 'all') return true;
      return p.type === activePhraseFilter;
    });

    if (activePhrases.length === 0) {
      return <span className="whitespace-pre-wrap">{result.originalText}</span>;
    }

    // Escape regex
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(
      `(${activePhrases.map(p => escapeRegex(p.phrase)).join('|')})`,
      'gi'
    );

    const parts = result.originalText.split(pattern);

    return (
      <span className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const matchingPhrase = activePhrases.find(
            p => p.phrase.toLowerCase() === part.toLowerCase()
          );

          if (matchingPhrase) {
            const isAi = matchingPhrase.type === 'ai_pattern';
            return (
              <mark
                key={i}
                title={`${isAi ? 'AI Stylistic Marker' : 'Human Marker'}: ${matchingPhrase.reason}`}
                className={`px-1.5 py-0.5 rounded font-medium cursor-help transition-colors ${
                  isAi
                    ? 'bg-amber-500/30 text-amber-200 border-b-2 border-amber-500'
                    : 'bg-emerald-500/30 text-emerald-200 border-b-2 border-emerald-500'
                }`}
              >
                {part}
              </mark>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Assessment Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border ${badgeConfig.borderColor} bg-gradient-to-r ${badgeConfig.color} p-6 sm:p-8 backdrop-blur-xl shadow-2xl`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${badgeConfig.borderColor} bg-slate-950/60 shadow-inner`}
            >
              <BadgeIcon className={`w-8 h-8 ${badgeConfig.textColor}`} />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 border ${badgeConfig.borderColor} ${badgeConfig.textColor}`}>
                  {badgeConfig.tag}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(result.analyzedAt).toLocaleString()}
                </span>
              </div>

              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${badgeConfig.textColor}`}>
                {result.assessment}
              </h1>

              <p className="mt-2 text-sm text-slate-200 max-w-2xl leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 shrink-0">
            <button
              onClick={() => downloadPdfReport(result)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              Download PDF Report
            </button>

            <button
              onClick={() => shareReportSheet(result)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-violet-300" />
              Share Report
            </button>

            <button
              onClick={() => downloadTxtReport(result)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Download TXT Summary
            </button>
          </div>
        </div>
      </div>

      {/* Quantitative & Stylometric Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Burstiness */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Sentence Burstiness
            </span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="font-bold text-white text-sm mb-1.5">
            {result.metrics.burstiness.rating}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {result.metrics.burstiness.explanation}
          </p>
        </div>

        {/* Metric 2: Perplexity & Lexical Diversity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Lexical Perplexity
            </span>
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="font-bold text-white text-sm mb-1.5">
            {result.metrics.perplexityAndVocabulary.rating}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {result.metrics.perplexityAndVocabulary.explanation}
          </p>
        </div>

        {/* Metric 3: Repetitive Structures */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              3. Structural Symmetry
            </span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-bold text-white text-sm mb-1.5">
            {result.metrics.repetitiveStructures.rating}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {result.metrics.repetitiveStructures.explanation}
          </p>
        </div>

        {/* Metric 4: Tone & Voice */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              4. Tone & Hedging
            </span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-bold text-white text-sm mb-1.5">
            {result.metrics.toneAndVoice.rating}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {result.metrics.toneAndVoice.explanation}
          </p>
        </div>
      </div>

      {/* Observations & Highlighted Phrases Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Text Viewer with Highlights */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Analyzed Prose & Linguistic Inspection
              </h3>
              <p className="text-xs text-slate-400">
                {result.stats.wordCount} words • {result.stats.sentenceCount} sentences • avg {result.stats.avgSentenceLength} words/sentence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHighlightMarkers(!highlightMarkers)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  highlightMarkers
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {highlightMarkers ? 'Highlights ON' : 'Highlights OFF'}
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
          </div>

          {/* Text Content */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-sm leading-relaxed text-slate-300 max-h-[380px] overflow-y-auto">
            {renderHighlightedText()}
          </div>

          {/* Highlight Key & Filter */}
          {highlightMarkers && result.highlightedPhrases && result.highlightedPhrases.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Filter tags:</span>
                <button
                  onClick={() => setActivePhraseFilter('all')}
                  className={`px-2.5 py-1 rounded-md ${activePhraseFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  All ({result.highlightedPhrases.length})
                </button>
                <button
                  onClick={() => setActivePhraseFilter('ai_pattern')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                    activePhraseFilter === 'ai_pattern' ? 'bg-amber-500/40 text-amber-200 border border-amber-500' : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  AI Markers
                </button>
                <button
                  onClick={() => setActivePhraseFilter('human_trait')}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
                    activePhraseFilter === 'human_trait' ? 'bg-emerald-500/40 text-emerald-200 border border-emerald-500' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Human Traits
                </button>
              </div>

              <span className="text-slate-400 italic">
                Hover highlighted phrases to read rationale
              </span>
            </div>
          )}
        </div>

        {/* Right 1 Col: Detailed Stylometric Observations */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Forensic Observations
            </h3>

            <div className="space-y-3">
              {result.observations.map((obs, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                  <span className="font-semibold text-indigo-300 block mb-1">
                    {obs.category}
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {obs.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Caveats Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Evaluation Caveats
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {result.caveatsAndLimitations}
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Scientific / Ethical Limitation Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-600/30 text-amber-200/90 text-xs leading-relaxed flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-1">
            CRITICAL ETHICAL & TECHNICAL DISCLAIMER
          </span>
          AI writing detectors analyze probabilistic stylometric markers, perplexity, and sentence burstiness. They do NOT provide scientific certainty or definitive proof of authorship. Academic writing, non-native English speakers, and standardized domain reports are frequently flagged as false positives. Conversely, lightly human-edited AI text can evade detection. These assessments are heuristic indicators intended to guide human review, never to serve as sole evidence.
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onNewScan}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Detection Scan
          </button>

          <button
            onClick={onAnalyzeAgain}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Re-analyze Sample
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => shareReportSheet(result)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-violet-300" />
            Share
          </button>
          <button
            onClick={() => downloadPdfReport(result)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-400" />
            PDF
          </button>
          <button
            onClick={() => downloadTxtReport(result)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            TXT
          </button>
        </div>
      </div>
    </div>
  );
};
