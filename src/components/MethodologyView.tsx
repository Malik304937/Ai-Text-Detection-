import React from 'react';
import {
  BookOpen,
  Activity,
  Sparkles,
  Layers,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          Technical & Ethical Framework
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Linguistic Stylometry & AI Authorship Limitations
        </h1>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          AI Text Detective employs probabilistic stylometric analysis rather than arbitrary black-box percentage scores. Learn how linguistic markers are measured and why 100% certainty is scientifically impossible.
        </p>
      </div>

      {/* The 4 Linguistic Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Burstiness */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base mb-1.5">1. Burstiness (Sentence Cadence)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Burstiness measures the variation and rhythm in sentence length and complexity. Human writers naturally alternate between short, punchy statements and sprawling subordinate clauses. In contrast, LLMs optimize for smooth transition probabilities, resulting in uniform, medium-length sentences that lack natural cadence bursts.
          </p>
        </div>

        {/* Perplexity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base mb-1.5">2. Perplexity (Token Predictability)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Perplexity measures how predictable words are in context. Autoregressive language models favor statistically typical word collocations (e.g., "vital role", "delve deeper", "complex tapestry"). Humans frequently deploy surprising idioms, colloquialisms, non-standard punctuation, or specialized jargon that yield higher perplexity spikes.
          </p>
        </div>

        {/* Structural Repetition */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base mb-1.5">3. Discourse Markers & Symmetries</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            LLMs adhere strictly to standard essay and paragraph schemata: topic sentence, two supporting arguments introduced with standard transitions ("Furthermore", "Additionally", "Moreover"), followed by a synthesis ("In conclusion", "Ultimately"). Human prose frequently exhibits asymmetric transitions and digressions.
          </p>
        </div>

        {/* Hedging and Neutrality */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base mb-1.5">4. Stylistic Hedging & Voice</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            RLHF training instills a cautious, polite, and unopinionated tone in models. Sentences often qualify statements ("While opinions vary...", "It is important to remember..."). Human text often carries distinct emotional flavor, strong personal bias, vernacular idiosyncrasies, or colloquial tone.
          </p>
        </div>
      </div>

      {/* Why We Reject Percentage Scores */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Why We Never Output Fake Accuracy Scores or Percentages
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Many commercial tools display misleading scores such as "98.4% AI Generated". Peer-reviewed computational linguistics research has demonstrated that these pseudo-precise percentages lack empirical calibration and generate dangerous overconfidence.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-rose-300 mb-1">Risk of False Positives</h4>
            <p className="text-slate-400 leading-relaxed">
              Academic research papers, standardized legal documents, and essays by Non-Native English (ESL) speakers often score high on predictability because standard formal grammar resembles the patterns favored by LLMs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-amber-300 mb-1">Risk of False Negatives</h4>
            <p className="text-slate-400 leading-relaxed">
              When a human lightly edits an AI-generated draft, introduces a few typos, or prompts the model to write in a conversational or slang-heavy voice, automated detection rates drop precipitously.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Processing Transparency */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Security, Privacy & Data Architecture
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          Our architecture is built around user privacy and client-side protection:
        </p>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Client-Side Optical Recognition:</strong> Camera snapshots and uploaded images are processed via in-browser Tesseract.js OCR. Camera frames are never streamed to a server.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Zero External Storage:</strong> Text samples are only transmitted to our private server-side Gemini 3.8 Flash analysis route during an active scan. No text or images are retained in server databases.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Browser-Exclusive History:</strong> Your past scans and reports reside exclusively in your local device's IndexedDB. You can inspect, export, or permanently delete them at any time.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
