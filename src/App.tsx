import React, { useState, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  History,
  BookOpen
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Navbar } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { FileUpload } from './components/FileUpload';
import { ManualInput } from './components/ManualInput';
import { AnalysisResults } from './components/AnalysisResults';
import { HistoryView } from './components/HistoryView';
import { MethodologyView } from './components/MethodologyView';
import { ServerSettingsModal } from './components/ServerSettingsModal';
import {
  AnalysisResult,
  HistoryRecord,
  SourceType
} from './types';
import {
  saveAnalysisRecord,
  getAnalysisHistory,
  deleteAnalysisRecord,
  clearAnalysisHistory
} from './utils/storage';
import { getApiEndpoint } from './utils/apiConfig';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'workspace' | 'history' | 'methodology'>('workspace');
  const [activeInputMode, setActiveInputMode] = useState<SourceType>('camera');

  // Text review state before final analysis
  const [pendingText, setPendingText] = useState<string>('');
  const [pendingTitle, setPendingTitle] = useState<string>('');
  const [pendingSource, setPendingSource] = useState<SourceType>('manual');
  const [isReviewingText, setIsReviewingText] = useState<boolean>(false);

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  // History state
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_text_detective_theme');
      return saved ? saved === 'dark' : true;
    }
    return true;
  });

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ai_text_detective_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ai_text_detective_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Load history from IndexedDB on startup
  const refreshHistory = async () => {
    try {
      const records = await getAnalysisHistory();
      setHistoryRecords(records);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  // Android Native Hardware Back Button Handler
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonSub = CapApp.addListener('backButton', () => {
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
      } else if (currentResult) {
        setCurrentResult(null);
      } else if (isReviewingText) {
        setIsReviewingText(false);
      } else if (currentTab !== 'workspace') {
        setCurrentTab('workspace');
      } else {
        CapApp.minimizeApp();
      }
    });

    return () => {
      backButtonSub.then(h => h.remove());
    };
  }, [currentResult, isReviewingText, currentTab, isSettingsOpen]);

  // Callback when text is extracted from Camera or File Upload
  const handleTextExtracted = (text: string, title?: string, source: SourceType = 'manual') => {
    setPendingText(text);
    setPendingTitle(title || 'Extracted Document Sample');
    setPendingSource(source);
    setIsReviewingText(true);
    setCurrentResult(null);
    setAnalysisError(null);
  };

  // Perform Analysis by calling backend API
  const performAnalysis = async (textToAnalyze: string, titleToUse?: string, sourceToUse?: SourceType) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    const payload = {
      text: textToAnalyze,
      title: titleToUse || pendingTitle || 'Text Analysis Sample',
      source: sourceToUse || pendingSource || 'manual'
    };

    try {
      const targetEndpoint = getApiEndpoint('/api/analyze');

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server analysis error (HTTP ${res.status})`);
      }

      const data = await res.json();

      const finalResult: AnalysisResult = {
        ...data,
        originalText: textToAnalyze,
        title: payload.title,
        source: payload.source,
        analyzedAt: data.analyzedAt || new Date().toISOString()
      };

      // Save to IndexedDB
      const savedRecord = await saveAnalysisRecord(finalResult);

      setCurrentResult(savedRecord);
      setIsReviewingText(false);
      await refreshHistory();
    } catch (err: any) {
      console.error('Analysis request error:', err);
      setAnalysisError(
        err.message || 'Failed to complete analysis. Please verify your connection or server settings.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reopen past record from history
  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setCurrentResult(record);
    setIsReviewingText(false);
    setCurrentTab('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a record
  const handleDeleteRecord = async (id: string) => {
    await deleteAnalysisRecord(id);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
    await refreshHistory();
  };

  // Clear all records
  const handleClearAllHistory = async () => {
    await clearAnalysisHistory();
    setCurrentResult(null);
    await refreshHistory();
  };

  // Reset to new scan
  const handleResetWorkspace = () => {
    setCurrentResult(null);
    setIsReviewingText(false);
    setPendingText('');
    setPendingTitle('');
    setAnalysisError(null);
  };

  const wordCount = pendingText.trim() ? pendingText.trim().split(/\s+/).length : 0;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} pb-[env(safe-area-inset-bottom)]`}>
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'history') refreshHistory();
        }}
        historyCount={historyRecords.length}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TAB 1: DETECTOR WORKSPACE */}
        {currentTab === 'workspace' && (
          <div className="space-y-6 sm:space-y-8">
            {/* If Results are available, show Results View directly */}
            {currentResult && (
              <AnalysisResults
                result={currentResult}
                onAnalyzeAgain={() => {
                  performAnalysis(currentResult.originalText, currentResult.title, currentResult.source);
                }}
                onNewScan={handleResetWorkspace}
              />
            )}

            {/* If In Review Mode (extracted text ready for edit/check) */}
            {!currentResult && isReviewingText && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Step 2: Inspect & Edit Extracted Text
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Review Extracted Prose Before Forensic Detection
                    </h2>
                    <p className="text-xs text-slate-400">
                      You can modify OCR words, remove stray punctuation, or adjust paragraphs for optimal linguistic analysis.
                    </p>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    {wordCount} words • {pendingText.length} characters
                  </div>
                </div>

                {analysisError && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p>{analysisError}</p>
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sample Title / Reference Label:
                    </label>
                    <input
                      type="text"
                      value={pendingTitle}
                      onChange={(e) => setPendingTitle(e.target.value)}
                      placeholder="Title (e.g., Biology Essay, Camera Capture #1)"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Text Body (Freely Editable):
                    </label>
                    <textarea
                      value={pendingText}
                      onChange={(e) => setPendingText(e.target.value)}
                      rows={12}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <button
                      onClick={handleResetWorkspace}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Discard & Back to Input Modes
                    </button>

                    <button
                      onClick={() => performAnalysis(pendingText, pendingTitle, pendingSource)}
                      disabled={isAnalyzing || wordCount === 0}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running Forensic Stylometric Analysis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Perform AI Authorship Analysis ({wordCount} words)
                          <ArrowRight className="w-4 h-4 ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If in Input Mode (No Results, No Active Review) */}
            {!currentResult && !isReviewingText && (
              <div className="space-y-6">
                {/* Hero / Overview Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-5 sm:p-8 shadow-2xl">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                      <Sparkles className="w-3.5 h-3.5" />
                      Cross-Platform Android & Web AI Authorship Suite
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      Detect Machine Writing with Linguistic Forensics
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Capture text directly with live camera OCR, upload PDF/Word/Image files, or paste continuous prose to evaluate burstiness, perplexity, and stylistic symmetry.
                    </p>
                  </div>

                  {/* Top Three Mode Selection Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-6 sm:mt-8">
                    {/* Mode 1: Live Camera OCR */}
                    <div
                      onClick={() => setActiveInputMode('camera')}
                      className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                        activeInputMode === 'camera'
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm sm:text-base">Live Camera OCR</h3>
                        {activeInputMode === 'camera' && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Aim at printed pages, exams, books, or displays. Snap a still and extract text with OCR.
                      </p>
                    </div>

                    {/* Mode 2: File & Image Upload */}
                    <div
                      onClick={() => setActiveInputMode('upload_doc')}
                      className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                        activeInputMode === 'upload_doc' || activeInputMode === 'upload_image'
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                        <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm sm:text-base">File & Image Upload</h3>
                        {(activeInputMode === 'upload_doc' || activeInputMode === 'upload_image') && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Extract text from PDF documents, Word DOCX files, TXT manuscripts, or Gallery screenshots.
                      </p>
                    </div>

                    {/* Mode 3: Manual Input */}
                    <div
                      onClick={() => setActiveInputMode('manual')}
                      className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all ${
                        activeInputMode === 'manual'
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm sm:text-base">Direct Text Input</h3>
                        {activeInputMode === 'manual' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        Paste essays, articles, or transcripts directly. Includes word counters and benchmark samples.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Active Tool View */}
                <div>
                  {activeInputMode === 'camera' && (
                    <CameraScanner
                      onTextExtracted={(text, title) =>
                        handleTextExtracted(text, title, 'camera')
                      }
                    />
                  )}

                  {(activeInputMode === 'upload_doc' || activeInputMode === 'upload_image') && (
                    <FileUpload
                      onTextExtracted={(text, title, source) =>
                        handleTextExtracted(text, title, source || 'upload_doc')
                      }
                    />
                  )}

                  {activeInputMode === 'manual' && (
                    <ManualInput
                      onAnalyze={(text, title) => {
                        performAnalysis(text, title, 'manual');
                      }}
                      isAnalyzing={isAnalyzing}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY VIEW */}
        {currentTab === 'history' && (
          <HistoryView
            records={historyRecords}
            onSelectRecord={handleSelectHistoryRecord}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllHistory}
            onNewScan={() => {
              handleResetWorkspace();
              setCurrentTab('workspace');
            }}
          />
        )}

        {/* TAB 3: METHODOLOGY & LIMITS */}
        {currentTab === 'methodology' && <MethodologyView />}
      </main>

      {/* Settings Modal */}
      <ServerSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-8 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AI Text Detective</span>
            <span>•</span>
            <span>Cross-Platform Android & Web Edition</span>
          </div>

          <div className="text-slate-400">
            Powered by Google Gemini 3.8 Flash • Local OCR • Zero Cloud Retention
          </div>
        </div>
      </footer>
    </div>
  );
}
