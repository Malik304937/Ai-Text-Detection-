import React, { useState } from 'react';
import {
  FileText,
  Clipboard,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ManualInputProps {
  initialText?: string;
  onAnalyze: (text: string, title?: string) => void;
  isAnalyzing: boolean;
}

const SAMPLE_TEXTS = [
  {
    label: 'Typical AI Generated (Essay style)',
    title: 'AI Perspective on Renewable Energy',
    text: `Renewable energy plays a crucial role in modern environmental conservation, serving as a vital cornerstone for global sustainability. In today's rapidly evolving world, the transition toward solar and wind power offers unprecedented opportunities to mitigate climate change. Furthermore, it is important to delve into the nuanced interplay between technological innovation and policy adoption. By embracing clean energy solutions, humanity can foster economic growth while simultaneously safeguarding natural ecosystems. In conclusion, the multifaceted benefits of renewable infrastructure underscore its indispensable value for future generations, creating a balanced tapestry of progress and stewardship.`
  },
  {
    label: 'Authentic Human Narrative (Personal & Irregular)',
    title: 'My Sunday Bike Accident Experience',
    text: `Honestly I wasn't even going that fast down 4th street. My back tire hit some wet leaves—or maybe an oily puddle, didn't really see it—and the next second my handlebars jerked hard left and I slammed right onto the asphalt. Tore through my favorite corduroy jacket, completely scuffed the left elbow. An older guy walking a golden retriever stopped and asked if I was alright, handed me some napkins from his pocket. My knee was throbbing pretty bad, but nothing felt broken. Limped the remaining three blocks home pushing the bike with one flat tire. Definitely skipping the morning commute tomorrow.`
  },
  {
    label: 'Short / Boilerplate Fragment (Inconclusive)',
    title: 'Terms Fragment',
    text: `All rights reserved. Use of this product is governed by standard enterprise licensing provisions and privacy standards.`
  }
];

export const ManualInput: React.FC<ManualInputProps> = ({
  initialText = '',
  onAnalyze,
  isAnalyzing,
}) => {
  const [text, setText] = useState<string>(initialText);
  const [title, setTitle] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const characterCount = text.length;
  const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
        setValidationError(null);
      }
    } catch (err) {
      // Fallback: prompt or notify
      setValidationError('Clipboard access denied by browser. Please paste using Ctrl+V or Cmd+V directly into the box.');
    }
  };

  const handleClear = () => {
    setText('');
    setTitle('');
    setValidationError(null);
  };

  const handleLoadSample = (sample: typeof SAMPLE_TEXTS[0]) => {
    setText(sample.text);
    setTitle(sample.title);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!trimmed) {
      setValidationError('Please enter or paste text to analyze.');
      return;
    }

    if (wordCount < 10) {
      setValidationError('Text sample is very brief (less than 10 words). Analysis requires more prose for reliable stylometric evaluation.');
      return;
    }

    if (wordCount > 15000) {
      setValidationError('Text exceeds the maximum threshold of 15,000 words. Please submit a shorter excerpt or section.');
      return;
    }

    onAnalyze(trimmed, title || 'Manual Input Sample');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Title & Preset Samples */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Direct Prose Input
          </h2>
          <p className="text-sm text-slate-400">
            Paste essays, articles, academic writing, or transcripts for stylometric detection
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            Try sample:
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadSample(sample)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-colors"
            >
              {idx === 0 ? 'AI Essay' : idx === 1 ? 'Human Story' : 'Short Fragment'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Optional Title input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sample Title or Subject (Optional, e.g. History Term Paper)"
            className="w-full px-4 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
          />
        </div>

        {/* Toolbar & Action Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              Paste from Clipboard
            </button>

            {text && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{characterCount} chars</span>
            {wordCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> ~{estimatedReadingTimeMinutes}m read
                </span>
              </>
            )}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            rows={10}
            placeholder="Paste or write your text here for linguistic analysis... (Recommended: at least 30-50 words for optimal stylometric evaluation)"
            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans text-sm leading-relaxed"
          />
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>{validationError}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400">
            Secure server-side evaluation with Gemini 3.8 Flash. No text logged or retained externally.
          </p>

          <button
            type="submit"
            disabled={isAnalyzing || !trimmed}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing Stylometrics...' : 'Analyze Writing Patterns'}
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
