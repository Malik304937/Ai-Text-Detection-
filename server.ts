import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Forensic Text Analysis API Endpoint
app.post('/api/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, title, source } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text content is required for analysis.' });
      return;
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Reject excessively short or absurdly long inputs
    if (wordCount < 10) {
      res.json({
        assessment: 'Inconclusive',
        summary: 'The submitted sample is too brief (fewer than 10 words) to reliably evaluate linguistic variance, sentence rhythm, or stylometric predictability.',
        metrics: {
          burstiness: {
            rating: 'Insufficient Data',
            explanation: 'Sentence length variance cannot be reliably measured on fewer than 10 words.'
          },
          perplexityAndVocabulary: {
            rating: 'Insufficient Data',
            explanation: 'Vocabulary entropy and transition density require longer contextual passages.'
          },
          repetitiveStructures: {
            rating: 'Insufficient Data',
            explanation: 'No recurring syntactic patterns can be derived from this text length.'
          },
          toneAndVoice: {
            rating: 'Insufficient Data',
            explanation: 'Voice characteristics cannot be distinguished on brief fragments.'
          }
        },
        observations: [
          {
            category: 'Sample Size Restriction',
            detail: 'Statistical stylometry requires at least 30-50 words of continuous prose to observe rhythm, syntactic burstiness, and phrasing patterns.'
          }
        ],
        highlightedPhrases: [],
        caveatsAndLimitations: 'Short phrases, titles, or single sentences often trigger false positives across all detection models due to low structural entropy.',
        stats: {
          wordCount,
          characterCount: trimmed.length,
          sentenceCount: 1,
          avgSentenceLength: wordCount
        }
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please ensure GEMINI_API_KEY is set in your environment.'
      });
      return;
    }

    // Initialize Google GenAI client according to instructions
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are a forensic linguistic analyst specializing in evaluating written prose for stylometric markers characteristic of Large Language Models (LLMs) versus human authors.

Analyze the following text sample carefully:
"""
${trimmed.slice(0, 24000)}
"""

CRITICAL INSTRUCTIONS:
1. You must classify the text strictly into one of three assessments:
   - "Possibly AI-generated"
   - "Possibly human-written"
   - "Inconclusive"
2. NEVER claim scientific certainty or that any pattern proves AI authorship. AI writing cannot be definitively proven through heuristics.
3. DO NOT output fake percentages or fabricated certainty numbers (e.g. "97.2% AI").
4. Evaluate four core linguistic dimensions:
   - Burstiness & Sentence Variation (LLMs tend toward uniform, moderate-length sentence distribution; humans alternate between short staccato sentences and long meandering clauses).
   - Perplexity & Vocabulary (LLMs prefer predictable, safe phrasing, cliché AI markers like "delve into", "tapestry", "crucial role", "furthermore", "in conclusion", balanced parallel triads; humans use idiosyncratic idioms, informal colloquialisms, specialized slang, or unconventional syntax).
   - Structural Uniformity & Repetition (LLMs follow rigid paragraph structures: topic sentence, two supporting points with transitional adverbs, concluding synthesis; humans may wander, omit tidy wrap-ups, or rely on personal voice).
   - Nuance, Tone & Voice (LLMs maintain relentlessly polite, neutral, hedging textbook tone; humans display personal viewpoint, subjective bias, conversational irregularities, emotional cadence).
5. If the text is bullet points, legal disclaimers, code-heavy, highly technical specifications, or too generic to determine, choose "Inconclusive".
6. Explicitly identify any specific phrases or clauses that demonstrate either AI stylistic markers (e.g. stereotypical transitions, symmetry) or human stylistic markers (e.g. natural pauses, spontaneous syntax, typos, idiosyncratic analogies).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an objective stylometrics auditor. Return your analysis in strict JSON adhering to the specified schema. Be nuanced, cautious, and scientifically grounded.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assessment: {
              type: Type.STRING,
              description: 'Must be strictly one of: "Possibly AI-generated", "Possibly human-written", or "Inconclusive"'
            },
            confidenceLevel: {
              type: Type.STRING,
              description: 'Qualitative confidence indicator: "Low", "Moderate", or "High" (qualitative only, never numeric percentage)'
            },
            summary: {
              type: Type.STRING,
              description: 'Nuanced 2-3 sentence overview explaining the primary factors leading to the assessment.'
            },
            metrics: {
              type: Type.OBJECT,
              properties: {
                burstiness: {
                  type: Type.OBJECT,
                  properties: {
                    rating: { type: Type.STRING, description: 'e.g. Uniform & Predictable, Moderate Variation, or High Natural Cadence' },
                    explanation: { type: Type.STRING }
                  },
                  required: ['rating', 'explanation']
                },
                perplexityAndVocabulary: {
                  type: Type.OBJECT,
                  properties: {
                    rating: { type: Type.STRING, description: 'e.g. High Predictability / Cliché-prone, Balanced / Neutral, or Idiosyncratic / Rich Diversity' },
                    explanation: { type: Type.STRING }
                  },
                  required: ['rating', 'explanation']
                },
                repetitiveStructures: {
                  type: Type.OBJECT,
                  properties: {
                    rating: { type: Type.STRING, description: 'e.g. Formulaic Transitions Observed, Varied Paragraph Architecture, or Minimal Patterning' },
                    explanation: { type: Type.STRING }
                  },
                  required: ['rating', 'explanation']
                },
                toneAndVoice: {
                  type: Type.OBJECT,
                  properties: {
                    rating: { type: Type.STRING, description: 'e.g. Detached & Hedged, Expressive & Conversational, or Domain Formal' },
                    explanation: { type: Type.STRING }
                  },
                  required: ['rating', 'explanation']
                }
              },
              required: ['burstiness', 'perplexityAndVocabulary', 'repetitiveStructures', 'toneAndVoice']
            },
            observations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  detail: { type: Type.STRING }
                },
                required: ['category', 'detail']
              }
            },
            highlightedPhrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'ai_pattern, human_trait, or neutral' }
                },
                required: ['phrase', 'reason', 'type']
              }
            },
            caveatsAndLimitations: {
              type: Type.STRING,
              description: 'Clear statement noting potential false positive scenarios (e.g. standard academic writing, ESL prose) or false negatives.'
            }
          },
          required: ['assessment', 'summary', 'metrics', 'observations', 'highlightedPhrases', 'caveatsAndLimitations']
        }
      }
    });

    const rawJson = response.text?.trim() || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', parseErr, rawJson);
      parsedData = {
        assessment: 'Inconclusive',
        summary: 'Unable to parse model evaluation response. Assessment deemed inconclusive.',
        metrics: {
          burstiness: { rating: 'Indeterminate', explanation: 'Output parsing anomaly.' },
          perplexityAndVocabulary: { rating: 'Indeterminate', explanation: 'Output parsing anomaly.' },
          repetitiveStructures: { rating: 'Indeterminate', explanation: 'Output parsing anomaly.' },
          toneAndVoice: { rating: 'Indeterminate', explanation: 'Output parsing anomaly.' }
        },
        observations: [{ category: 'System', detail: 'Analysis produced irregular format.' }],
        highlightedPhrases: [],
        caveatsAndLimitations: 'Evaluations require complete linguistic telemetry.'
      };
    }

    // Enforce strict assessment values
    const allowed = ['Possibly AI-generated', 'Possibly human-written', 'Inconclusive'];
    if (!allowed.includes(parsedData.assessment)) {
      if (parsedData.assessment?.toLowerCase().includes('ai')) {
        parsedData.assessment = 'Possibly AI-generated';
      } else if (parsedData.assessment?.toLowerCase().includes('human')) {
        parsedData.assessment = 'Possibly human-written';
      } else {
        parsedData.assessment = 'Inconclusive';
      }
    }

    // Compute basic text statistics
    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length || 1;
    const avgSentenceLength = Math.round((wordCount / sentenceCount) * 10) / 10;

    res.json({
      ...parsedData,
      stats: {
        wordCount,
        characterCount: trimmed.length,
        sentenceCount,
        avgSentenceLength
      },
      analyzedAt: new Date().toISOString(),
      title: title || 'Untitled Sample',
      source: source || 'direct_input'
    });
  } catch (error: any) {
    console.error('Error during text analysis:', error);
    res.status(500).json({
      error: error?.message || 'An error occurred while evaluating the text sample.'
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite connect middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AI Text Detective server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
