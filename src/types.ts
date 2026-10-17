export type AssessmentType = 'Possibly AI-generated' | 'Possibly human-written' | 'Inconclusive';

export type SourceType = 'camera' | 'upload_image' | 'upload_doc' | 'manual';

export interface StylometricMetric {
  rating: string;
  explanation: string;
}

export interface Observation {
  category: string;
  detail: string;
}

export interface HighlightedPhrase {
  phrase: string;
  reason: string;
  type: 'ai_pattern' | 'human_trait' | 'neutral';
}

export interface AnalysisStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
}

export interface AnalysisResult {
  id?: string;
  assessment: AssessmentType;
  confidenceLevel?: 'Low' | 'Moderate' | 'High';
  summary: string;
  metrics: {
    burstiness: StylometricMetric;
    perplexityAndVocabulary: StylometricMetric;
    repetitiveStructures: StylometricMetric;
    toneAndVoice: StylometricMetric;
  };
  observations: Observation[];
  highlightedPhrases: HighlightedPhrase[];
  caveatsAndLimitations: string;
  stats: AnalysisStats;
  originalText: string;
  title: string;
  source: SourceType;
  analyzedAt: string;
}

export interface HistoryRecord extends AnalysisResult {
  id: string;
  createdAt: number;
}

export interface OCRProgress {
  status: string;
  progress: number; // 0 to 1
}
