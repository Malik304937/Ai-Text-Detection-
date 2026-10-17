import React from 'react';
import {
  History,
  BookOpen,
  Sun,
  Moon,
  Scan,
  FileText,
  Settings,
  Smartphone
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface NavbarProps {
  currentTab: 'workspace' | 'history' | 'methodology';
  setCurrentTab: (tab: 'workspace' | 'history' | 'methodology') => void;
  historyCount: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  historyCount,
  isDarkMode,
  toggleTheme,
  onOpenSettings,
}) => {
  const isNative = Capacitor.isNativePlatform();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 border-slate-800 bg-slate-950/85 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentTab('workspace')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  AI Text Detective
                </span>
                {isNative ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Smartphone className="w-2.5 h-2.5" /> APK
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Forensic Suite
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Probabilistic Authorship & Stylometric Analysis
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('workspace')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'workspace'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Detector Workspace</span>
              <span className="md:hidden">Scan</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full bg-slate-800 text-indigo-300 font-mono border border-slate-700">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('methodology')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                currentTab === 'methodology'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Methodology & Limits</span>
              <span className="md:hidden">Guide</span>
            </button>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Server Connection Settings"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
