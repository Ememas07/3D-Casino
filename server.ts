import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AdvisorRequestBody {
  station?: string;
  bankroll?: number;
  question?: string;
  contextSummary?: string;
}

interface BanterRequestBody {
  station?: string;
  eventSummary?: string;
  netDelta?: number;
}

function buildDeterministicStrategyFallback(body: AdvisorRequestBody): string {
  const station = body.station || 'floor';
  const bankroll = typeof body.bankroll === 'number' ? body.bankroll : 10000;
  const unit = Math.max(10, Math.round((bankroll * 0.02) / 5) * 5);

  if (station === 'blackjack') {
    return [
      `Blackjack House Edge & Sizing (Virtual Chips: $${bankroll.toLocaleString()}):`,
      `• Optimal 6-deck basic strategy holds house edge near 0.5% — the lowest on the casino floor.`,
      `• Recommended base wager: $${unit.toLocaleString()} (~2% of bankroll). Double down on hard 11 against any dealer upcard, and on 10 unless dealer shows 10 or Ace.`,
      `• Always stand on hard 17+, hit hard 12–16 against dealer 7–Ace, and never take even-money insurance.`,
    ].join('\n');
  }

  if (station === 'roulette') {
    return [
      `European Single-Zero Roulette Odds (Virtual Chips: $${bankroll.toLocaleString()}):`,
      `• Single-zero European wheel carries a uniform 2.70% house edge across all inside and outside wagers (36/37 on straight, 18/37 on Red/Black).`,
      `• Outside bets (Red/Black, Odd/Even, Dozens) offer smoother variance; a $${unit.toLocaleString()} unit keeps swings under 3% per spin.`,
      `• Straight-up numbers pay 35:1 (2.70% hit probability) — pair a small straight anchor with an outside hedge if you want controlled excitement.`,
    ].join('\n');
  }

  if (station === 'poker') {
    return [
      `Monte Carlo Hold'em Poker Strategy (Virtual Chips: $${bankroll.toLocaleString()}):`,
      `• Optimal Call/Fold threshold beats calling blindly: call the 2x flop bet whenever you hold any pair, two overcards to the board, or a 4-card flush/straight draw (~82% of hands).`,
      `• Recommended Ante unit: $${unit.toLocaleString()} (so total hand exposure on a Call is $${(unit * 3).toLocaleString()}).`,
      `• Dealer requires Pair of 4s or better to qualify; Ante bonuses pay up to 20:1 on a Royal Flush.`,
    ].join('\n');
  }

  if (station === 'slots') {
    return [
      `3-Theme Mechanical Slots Volatility (Virtual Chips: $${bankroll.toLocaleString()}):`,
      `• Royal Fruit 777 (1 or 3 lines): Lowest variance; ideal for steady play.`,
      `• Pharaoh's Vault (Scarab Wild, up to 5 lines): Balanced mid-variance with diagonal hits.`,
      `• Cyber Vault X (2x Wild Core, 5 lines): Highest volatility & upside; size total spin stake around $${Math.max(10, Math.min(unit, 150)).toLocaleString()}.`,
    ].join('\n');
  }

  return [
    `Monte Carlo Pavilion Bankroll Guidance ($${bankroll.toLocaleString()} Virtual Chips):`,
    `• Lowest House Edge: Blackjack (~0.5% with basic strategy) > European Roulette (2.70%) > Mechanical Slots (~5.5%).`,
    `• Standard 2% session unit: $${unit.toLocaleString()} per hand or spin. Remember this salon uses 100% virtual play chips.`,
  ].join('\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/casino/advisor', async (req, res) => {
    const body = (req.body || {}) as AdvisorRequestBody;
    const ai = createGeminiClient();

    if (!ai) {
      res.json({
        advice: buildDeterministicStrategyFallback(body),
        model: 'math-engine',
        note: 'Calculated locally (configure GEMINI_API_KEY in Secrets to enable Gemini deep reasoning).',
      });
      return;
    }

    const prompt = [
      `Station: ${body.station ?? 'floor'}`,
      `Virtual Bankroll: $${body.bankroll ?? 10000} (virtual play money only)`,
      `Current Table State: ${body.contextSummary || 'Player is surveying the salon.'}`,
      `Player Query: ${body.question || 'Analyze the current odds, house edge, and optimal play-chip sizing.'}`,
    ].join('\n');

    const systemInstruction =
      'You are the Monte Carlo Pavilion Pit-Boss & Probability Strategist inside a 100% virtual play-money 3D casino. ' +
      'Provide crisp, mathematically accurate odds, expected value (EV), house edge, and responsible bankroll-unit advice in 3-5 concise bullet points. ' +
      'Remind the player only when relevant that all chips are virtual play money. Never encourage real-money wagering.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-carbon',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      res.json({
        advice: (response.text ?? '').trim() || buildDeterministicStrategyFallback(body),
        model: 'gemini-4-carbon',
      });
    } catch {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });
        res.json({
          advice:
            (fallbackResponse.text ?? '').trim() ||
            buildDeterministicStrategyFallback(body),
          model: 'gemini-4-hydrogen',
        });
      } catch {
        res.json({
          advice: buildDeterministicStrategyFallback(body),
          model: 'math-engine',
        });
      }
    }
  });

  app.post('/api/casino/dealer-banter', async (req, res) => {
    const body = (req.body || {}) as BanterRequestBody;
    const ai = createGeminiClient();
    const delta = typeof body.netDelta === 'number' ? body.netDelta : 0;

    if (!ai) {
      res.json({
        line:
          delta > 0
            ? `Splendid play at ${body.station || 'the table'} — +$${delta.toLocaleString()} in play chips.`
            : `The wheel turns anew. Place your next virtual wager whenever ready.`,
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Station: ${body.station || 'casino'}. Event: ${body.eventSummary || 'Round complete'}. Net chip delta: ${delta}.`,
        config: {
          systemInstruction:
            'You are a refined Monte Carlo croupier. Reply with a single crisp 1-sentence remark (under 18 words) reacting to the virtual play-chip outcome.',
        },
      });
      res.json({
        line:
          (response.text ?? '').trim() ||
          'Place your virtual chips whenever you are ready.',
      });
    } catch {
      res.json({
        line:
          delta > 0
            ? `Well played — +$${delta.toLocaleString()} added to your virtual stack.`
            : 'Rien ne va plus — ready for the next round.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Monte Carlo Pavilion server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
