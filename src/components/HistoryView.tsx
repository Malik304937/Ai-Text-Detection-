import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileText,
  Camera,
  UploadCloud,
  Edit3,
  AlertTriangle,
  X,
  FileDown
} from 'lucide-react';
import { HistoryRecord, AssessmentType } from '../types';
import { downloadPdfReport } from '../utils/pdfReport';

interface HistoryViewProps {
  records: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onNewScan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onNewScan,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assessmentFilter, setAssessmentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  // Filter records
  const filteredRecords = records.filter((rec) => {
    // Search
    const matchesSearch =
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.summary.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Assessment filter
    if (assessmentFilter !== 'all' && rec.assessment !== assessmentFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'camera' && rec.source !== 'camera') return false;
      if (sourceFilter === 'upload' && !rec.source.startsWith('upload')) return false;
      if (sourceFilter === 'manual' && rec.source !== 'manual') return false;
    }

    return true;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'camera':
        return <Camera className="w-3.5 h-3.5 text-indigo-400" />;
      case 'upload_image':
      case 'upload_doc':
        return <UploadCloud className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Edit3 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'camera':
        return 'Camera OCR';
      case 'upload_image':
        return 'Image OCR';
      case 'upload_doc':
        return 'Document';
      default:
        return 'Direct Prose';
    }
  };

  const getAssessmentBadge = (assessment: AssessmentType) => {
    if (assessment === 'Possibly AI-generated') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <ShieldAlert className="w-3 h-3" />
          Possibly AI
        </span>
      );
    }
    if (assessment === 'Possibly human-written') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3" />
          Possibly Human
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        <HelpCircle className="w-3 h-3" />
        Inconclusive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Local Analysis History
          </h2>
          <p className="text-sm text-slate-400">
            {records.length} records securely stored locally in your browser (IndexedDB).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {records.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All History
            </button>
          )}

          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
          >
            New Scan
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search within past texts, titles, or summaries..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Assessment Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={assessmentFilter}
            onChange={(e) => setAssessmentFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Assessments</option>
            <option value="Possibly AI-generated">Possibly AI-generated</option>
            <option value="Possibly human-written">Possibly human-written</option>
            <option value="Inconclusive">Inconclusive</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="camera">Camera OCR</option>
            <option value="upload">Document & Image Upload</option>
            <option value="manual">Direct Text</option>
          </select>
        </div>
      </div>

      {/* Record List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {records.length === 0 ? 'No Analysis Records Yet' : 'No Matching Records'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            {records.length === 0
              ? 'Complete an analysis via camera OCR, file upload, or direct text to automatically save records locally.'
              : 'Try adjusting your search criteria or filter selectors.'}
          </p>
          <button
            onClick={onNewScan}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Start First Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  {getAssessmentBadge(rec.assessment)}

                  <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    {getSourceIcon(rec.source)}
                    {getSourceLabel(rec.source)}
                  </span>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(rec.createdAt).toLocaleDateString()} at{' '}
                    {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPdfReport(rec)}
                    title="Download PDF"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteRecord(rec.id)}
                    title="Delete record"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectRecord(rec)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
                  >
                    Reopen
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Title & Preview */}
              <div className="mt-3 cursor-pointer" onClick={() => onSelectRecord(rec)}>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {rec.originalText}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{rec.stats.wordCount} words • {rec.stats.sentenceCount} sentences</span>
                <span className="truncate max-w-xs text-slate-400 italic font-sans">{rec.summary}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Clear All Analysis History?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              This will permanently delete all {records.length} saved analyses from your browser's local storage. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-colors"
              >
                Yes, Clear All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
