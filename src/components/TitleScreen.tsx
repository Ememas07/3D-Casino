import { useEffect } from 'react';
import { motion } from 'motion/react';

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(95deg, rgba(13,11,16,0.90) 0%, rgba(13,11,16,0.68) 38%, rgba(13,11,16,0.16) 72%, rgba(13,11,16,0.32) 100%)',
        }}
      />

      <div className="relative z-10 flex-1 flex items-center px-8 md:px-16 max-w-2xl">
        <div className="pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <svg
              viewBox="0 0 280 56"
              className="w-64 h-14 mb-5"
              aria-hidden="true"
            >
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="#19131f"
                stroke="#d4af37"
                strokeWidth="2"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="15"
                fill="none"
                stroke="#d4af37"
                strokeWidth="1"
                strokeDasharray="3 3"
                style={{ originX: '28px', originY: '28px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              />
              <path
                d="M28 15 L35 28 L28 41 L21 28 Z"
                fill="#b91c1c"
                stroke="#f6f2e9"
                strokeWidth="1.2"
              />
              <text
                x="64"
                y="24"
                fill="#d4af37"
                fontSize="12"
                fontWeight="600"
                letterSpacing="2.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                SALON PRIVÉ
              </text>
              <text
                x="64"
                y="42"
                fill="#f6f2e9"
                fontSize="14"
                fontWeight="500"
                fontFamily="Playfair Display, serif"
              >
                Virtual Play-Money Casino
              </text>
            </svg>
          </motion.div>

          <a
            href="/"
            title="Return to Hub"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#d4af37] hover:text-[#f6f2e9] font-semibold mb-2 transition-colors cursor-pointer"
          >
            ← Return to Hub
          </a>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-[#f6f2e9] leading-[1.08] [text-wrap:balance]"
          >
            <a href="/" title="Return to Hub" className="hover:text-[#d4af37] transition-colors cursor-pointer">
              Monte Carlo Pavilion
            </a>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-sm md:text-base text-[#cfc8ba] max-w-md leading-relaxed"
          >
            Explore an octagonal 3D salon featuring European Roulette, Blackjack, Casino Hold&apos;em Poker, three themed Slot cabinets, and a VIP cocktail bar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-6 flex items-center gap-3 text-xs text-[#b8ae9c] font-mono-tabular"
          >
            <span>$10,000 Starting Play Chips</span>
            <span aria-hidden="true">·</span>
            <span>No Real-Money Wagering</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.34 }}
            className="mt-8 flex items-center gap-4"
          >
            <motion.button
              type="button"
              data-start="true"
              onClick={onStart}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3.5 bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] font-semibold text-sm rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6f2e9] whitespace-nowrap shrink-0"
            >
              Enter Salon
            </motion.button>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 px-8 md:px-16 pb-6 text-xs text-[#9c9384]"
      >
        <span>Enter or Space to start</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>WASD / Arrows to walk</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Drag to orbit</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Click any table or bar to focus</span>
      </motion.div>
    </motion.div>
  );
}
