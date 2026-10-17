import React from 'react';
import { ShieldCheck, History, BookOpen, Sun, Moon, Sparkles, Scan, FileText } from 'lucide-react';

interface NavbarProps {
  currentTab: 'workspace' | 'history' | 'methodology';
  setCurrentTab: (tab: 'workspace' | 'history' | 'methodology') => void;
  historyCount: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  historyCount,
  isDarkMode,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 border-slate-800 bg-slate-950/80 dark:border-slate-800 dark:bg-slate-950/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentTab('workspace')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  AI Text Detective
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Forensic Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Probabilistic Authorship & Stylometric Analysis
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('workspace')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 text-xs rounded-full bg-slate-800 text-indigo-300 font-mono border border-slate-700">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('methodology')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'methodology'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Methodology & Limits</span>
              <span className="md:hidden">Guide</span>
            </button>

            {/* Dark/Light Theme Toggle */}
            <div className="h-6 w-px bg-slate-800 mx-1 sm:mx-2 hidden sm:block" />

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
