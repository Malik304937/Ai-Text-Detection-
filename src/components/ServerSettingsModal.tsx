import React, { useState } from 'react';
import { Settings, Server, Check, X, RotateCcw, Smartphone, Globe } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  DEFAULT_BACKEND_URL,
  getCustomApiUrl,
  setCustomApiUrl
} from '../utils/apiConfig';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [url, setUrl] = useState<string>(getCustomApiUrl());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const isNative = Capacitor.isNativePlatform();

  if (!isOpen) return null;

  const handleSave = () => {
    setCustomApiUrl(url);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setUrl('');
    setCustomApiUrl('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Platform & Server Configuration</h3>
            <p className="text-xs text-slate-400">
              {isNative ? 'Android Native APK Mode' : 'Web Browser Mode'}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                {isNative ? <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
                Runtime Environment
              </span>
              <span className="font-mono text-indigo-300">
                {isNative ? 'Capacitor Android Native' : 'Responsive Web'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Default Backend Endpoint</span>
              <span className="font-mono text-slate-400 truncate max-w-[200px]" title={DEFAULT_BACKEND_URL}>
                {DEFAULT_BACKEND_URL}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-1.5">
              Custom Server API Base URL (Optional):
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://your-domain.run.app"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to automatically connect to the primary cloud server.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
              {savedSuccess ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
