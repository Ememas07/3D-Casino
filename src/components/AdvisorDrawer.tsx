import { useState, type FormEvent } from 'react';
import { X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CasinoStation } from '../three/CasinoScene';

interface AdvisorDrawerProps {
  open: boolean;
  onClose: () => void;
  station: CasinoStation;
  bankroll: number;
  contextSummary: string;
}

const PRESET_PROMPTS = [
  'Analyze the house edge and best odds here',
  'Suggest a conservative chip unit for my stack',
  'Compare Blackjack vs Roulette variance',
];

export function AdvisorDrawer({
  open,
  onClose,
  station,
  bankroll,
  contextSummary,
}: AdvisorDrawerProps) {
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function askAdvisor(promptText: string) {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/casino/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station,
          bankroll,
          question: trimmed,
          contextSummary,
        }),
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data = (await res.json()) as { advice?: string; model?: string; error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setAdvice(data.advice || 'No response received.');
        setModelUsed(data.model || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach advisor.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    void askAdvisor(question);
    setQuestion('');
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          aria-label="Pit-Boss Strategy Advisor"
          initial={{ opacity: 0, x: 24, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.98 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed top-16 right-4 z-30 w-[min(400px,92vw)] rounded-xl border border-[#d4af37]/30 bg-[#141019]/95 shadow-2xl pointer-events-auto flex flex-col max-h-[70vh]"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <h2 className="font-display text-base font-semibold text-[#f6f2e9]">
                Pit-Boss Strategy Advisor
              </h2>
              <p className="text-xs text-[#9c9384]">
                Probability, expected value &amp; chip sizing
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Strategy Advisor"
              className="p-2 rounded-lg text-[#b8ae9c] hover:text-[#f6f2e9] hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMPTS.map((preset) => (
                <motion.button
                  key={preset}
                  type="button"
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => void askAdvisor(preset)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-md border border-[#d4af37]/25 bg-[#1d1724] hover:border-[#d4af37]/60 text-[#e8e1d3] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {preset}
                </motion.button>
              ))}
            </div>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/10 bg-[#1a1420] p-3 text-xs text-[#d4af37]"
              >
                Analyzing probabilities and table odds...
              </motion.div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-950/50 p-3 text-xs text-red-200">
                {error}
              </div>
            )}

            {!loading && advice && (
              <motion.div
                key={advice}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg border border-white/10 bg-[#1a1420] p-3.5 text-xs leading-relaxed text-[#f0eae0] whitespace-pre-line"
              >
                {advice}
                {modelUsed && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-[#9c9384] font-mono-tabular">
                    Engine: {modelUsed}
                  </div>
                )}
              </motion.div>
            )}

            {!loading && !advice && !error && (
              <div className="rounded-lg border border-white/10 bg-[#1a1420] p-3 text-xs text-[#9c9384] leading-relaxed">
                Ask a question about house edge, Roulette payouts, Blackjack basic strategy, or virtual chip management.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
            <label htmlFor="advisor-input" className="sr-only">
              Ask strategy question
            </label>
            <input
              id="advisor-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about odds or strategy..."
              className="flex-1 bg-[#0d0b10] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#f6f2e9] placeholder-[#7c7468] focus:outline-none focus:border-[#d4af37]"
            />
            <motion.button
              type="submit"
              disabled={loading || !question.trim()}
              whileTap={{ scale: 0.96 }}
              aria-label="Send question"
              className="px-3 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] font-medium text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </motion.button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
