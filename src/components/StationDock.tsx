import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  evaluateHand,
  type BlackjackRoundState,
  type Card,
} from '../casino/blackjack';
import type { PokerRoundState } from '../casino/poker';
import {
  getPocketColor,
  type RouletteBet,
  type RouletteBetType,
} from '../casino/roulette';
import {
  SLOT_THEMES,
  type SlotSymbol,
  type SlotThemeId,
} from '../casino/slots';
import type { CasinoStation } from '../three/CasinoScene';

export interface FloorLogEntry {
  id: string;
  station: string;
  summary: string;
  net: number;
}

interface StationDockProps {
  station: CasinoStation;
  onSelectStation: (station: CasinoStation) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  bankroll: number;
  dealerBanter: string;
  floorLog: FloorLogEntry[];

  // Roulette
  chipSize: number;
  onSelectChipSize: (size: number) => void;
  rouletteBets: RouletteBet[];
  rouletteSpinning: boolean;
  selectedStraightNum: number;
  onChangeStraightNum: (num: number) => void;
  onPlaceRouletteBet: (type: RouletteBetType, label: string, num?: number) => void;
  onClearRouletteBets: () => void;
  onSpinRoulette: () => void;
  lastRoulettePocket: number | null;

  // Blackjack
  blackjackBet: number;
  onSelectBlackjackBet: (amount: number) => void;
  blackjackState: BlackjackRoundState;
  onDealBlackjack: () => void;
  onHitBlackjack: () => void;
  onStandBlackjack: () => void;
  onDoubleBlackjack: () => void;

  // Poker
  pokerAnte: number;
  onSelectPokerAnte: (amount: number) => void;
  pokerState: PokerRoundState;
  onDealPoker: () => void;
  onCallPoker: () => void;
  onFoldPoker: () => void;

  // Slots (3 Themes)
  slotTheme: SlotThemeId;
  onSelectSlotTheme: (theme: SlotThemeId) => void;
  slotPaylines: number;
  onSelectSlotPaylines: (lines: number) => void;
  slotBetPerLine: number;
  onSelectSlotBetPerLine: (amount: number) => void;
  jackpotPool: number;
  slotCenterRow: [SlotSymbol, SlotSymbol, SlotSymbol];
  slotMessage: string;
  slotSpinning: boolean;
  onPullSlotLever: () => void;

  // Bar
  onOrderDrink: (drinkName: string) => void;
}

const CHIP_DENOMINATIONS = [10, 25, 100, 500];

const SUIT_GLYPHS: Record<Card['suit'], string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const COCKTAILS = [
  'Monte Carlo Negroni',
  'Golden 777 Martini',
  'Velvet Espresso',
  'Sparkling Riviera Tonic',
];

export function StationDock(props: StationDockProps) {
  const {
    station,
    onSelectStation,
    collapsed,
    onToggleCollapse,
    bankroll,
    dealerBanter,
    floorLog,
    chipSize,
    onSelectChipSize,
    rouletteBets,
    rouletteSpinning,
    selectedStraightNum,
    onChangeStraightNum,
    onPlaceRouletteBet,
    onClearRouletteBets,
    onSpinRoulette,
    lastRoulettePocket,
    blackjackBet,
    onSelectBlackjackBet,
    blackjackState,
    onDealBlackjack,
    onHitBlackjack,
    onStandBlackjack,
    onDoubleBlackjack,
    pokerAnte,
    onSelectPokerAnte,
    pokerState,
    onDealPoker,
    onCallPoker,
    onFoldPoker,
    slotTheme,
    onSelectSlotTheme,
    slotPaylines,
    onSelectSlotPaylines,
    slotBetPerLine,
    onSelectSlotBetPerLine,
    jackpotPool,
    slotCenterRow,
    slotMessage,
    slotSpinning,
    onPullSlotLever,
    onOrderDrink,
  } = props;

  const totalRouletteWager = rouletteBets.reduce((s, b) => s + b.amount, 0);
  const playerEval = evaluateHand(blackjackState.playerHand, true);
  const dealerEval = evaluateHand(blackjackState.dealerHand, false);
  const activeSlotCfg = SLOT_THEMES[slotTheme];
  const totalSlotStake = slotBetPerLine * slotPaylines;

  return (
    <div
      className="fixed bottom-4 left-0 right-0 mx-auto z-20 w-[min(960px,95vw)] flex flex-col items-center pointer-events-none transition-transform duration-200"
      style={{
        transform: collapsed ? 'translateY(calc(100% - 36px))' : 'translateY(0)',
      }}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-t-lg border border-b-0 border-[#d4af37]/30 bg-[#141019]/95 text-xs font-medium text-[#e6decb] hover:text-[#d4af37] cursor-pointer whitespace-nowrap"
      >
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span>{collapsed ? 'Show Controls' : 'Hide Controls'}</span>
      </button>

      <div className="pointer-events-auto w-full rounded-xl border border-[#d4af37]/30 bg-[#141019]/95 shadow-2xl overflow-hidden">
        {/* Station tabs & dealer banter */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-1 bg-[#0d0b10] p-1 rounded-lg" role="tablist" aria-label="Casino Stations">
            {(
              [
                ['overview', 'Floor'],
                ['roulette', 'Roulette'],
                ['blackjack', 'Blackjack'],
                ['poker', 'Poker'],
                ['slots', 'Slots'],
                ['bar', 'Bar'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={station === id}
                onClick={() => onSelectStation(id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  station === id
                    ? 'text-[#110d14]'
                    : 'text-[#b8ae9c] hover:text-[#f6f2e9]'
                }`}
              >
                {station === id && (
                  <motion.span
                    layoutId="station-active-tab"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-md bg-[#d4af37]"
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={dealerBanter}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-[#cfc8ba] truncate max-w-md"
              title={dealerBanter}
            >
              {dealerBanter}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Station panel body */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={station}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
          {station === 'overview' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#f6f2e9]">
                  Salon Privé Floor
                </h2>
                <p className="text-xs text-[#b8ae9c] mt-1">
                  Use WASD or Arrow keys to walk the floor, drag to orbit, or click any 3D table, slot cabinet, or the bar.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono-tabular">
                {floorLog.length === 0 ? (
                  <span className="text-[#8e8578]">No rounds settled yet</span>
                ) : (
                  floorLog.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      className="px-2.5 py-1.5 rounded-md bg-[#1d1724] border border-white/10 text-[#e6decb]"
                    >
                      <span>{entry.station}</span>
                      <span className="mx-1.5 text-[#7c7468]">·</span>
                      <span className={entry.net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {entry.net >= 0 ? `+$${entry.net}` : `-$${Math.abs(entry.net)}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {station === 'roulette' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9c9384]">Chip:</span>
                  {CHIP_DENOMINATIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      disabled={rouletteSpinning || bankroll < size}
                      onClick={() => onSelectChipSize(size)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tabular font-semibold border cursor-pointer transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 ${
                        chipSize === size
                          ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                          : 'bg-[#1d1724] text-[#f6f2e9] border-white/15 hover:border-[#d4af37]/50'
                      }`}
                    >
                      ${size}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono-tabular">
                  {lastRoulettePocket !== null && (
                    <span className="text-[#e6decb]">
                      Last:{' '}
                      <strong
                        className={
                          getPocketColor(lastRoulettePocket) === 'red'
                            ? 'text-red-400'
                            : getPocketColor(lastRoulettePocket) === 'green'
                              ? 'text-emerald-400'
                              : 'text-[#f6f2e9]'
                        }
                      >
                        #{lastRoulettePocket} ({getPocketColor(lastRoulettePocket)})
                      </strong>
                    </span>
                  )}
                  <span className="text-[#d4af37]">
                    Staked: ${totalRouletteWager.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ['red', 'Red 1:1', 'bg-[#7f1d1d] hover:bg-[#991b1b] text-white'],
                    ['black', 'Black 1:1', 'bg-[#1c1921] hover:bg-[#2a2531] text-white'],
                    ['even', 'Even 1:1', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['odd', 'Odd 1:1', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['low', '1–18', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['high', '19–36', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['dozen1', '1st 12', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['dozen2', '2nd 12', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                    ['dozen3', '3rd 12', 'bg-[#1d1724] hover:bg-[#2a2234] text-[#f6f2e9]'],
                  ] as const
                ).map(([type, label, cls]) => (
                  <button
                    key={type}
                    type="button"
                    disabled={rouletteSpinning || bankroll < chipSize}
                    onClick={() => onPlaceRouletteBet(type, label)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border border-white/15 cursor-pointer transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 ${cls}`}
                  >
                    {label}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-auto">
                  <label htmlFor="straight-num" className="text-xs text-[#9c9384]">
                    Straight:
                  </label>
                  <select
                    id="straight-num"
                    value={selectedStraightNum}
                    onChange={(e) => onChangeStraightNum(Number(e.target.value))}
                    className="bg-[#0d0b10] border border-white/15 rounded-md px-2 py-1.5 text-xs font-mono-tabular text-[#f6f2e9]"
                  >
                    {Array.from({ length: 37 }, (_, n) => (
                      <option key={n} value={n}>
                        #{n} ({getPocketColor(n)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={rouletteSpinning || bankroll < chipSize}
                    onClick={() =>
                      onPlaceRouletteBet('straight', `#${selectedStraightNum}`, selectedStraightNum)
                    }
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#175e44] hover:bg-[#1e7a58] text-white border border-white/15 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40"
                  >
                    Bet #{selectedStraightNum} (35:1)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-[#b8ae9c] truncate max-w-lg">
                  {rouletteBets.length === 0
                    ? 'Select a chip and place inside or outside bets on the European wheel.'
                    : rouletteBets.map((b) => `${b.label} ($${b.amount})`).join(' · ')}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={rouletteSpinning || rouletteBets.length === 0}
                    onClick={onClearRouletteBets}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium border border-white/15 text-[#cfc8ba] hover:text-white cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    Clear Bets
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={rouletteSpinning || rouletteBets.length === 0}
                    onClick={onSpinRoulette}
                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] cursor-pointer disabled:opacity-40 whitespace-nowrap"
                  >
                    {rouletteSpinning ? 'Spinning...' : 'Spin Wheel'}
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {station === 'blackjack' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <div>
                    <span className="text-[#9c9384]">Dealer: </span>
                    <span className="font-mono-tabular font-semibold text-[#f6f2e9]">
                      {blackjackState.dealerHand.length === 0
                        ? '—'
                        : `${blackjackState.dealerHand
                            .map((c) => (c.faceUp ? `${c.rank}${SUIT_GLYPHS[c.suit]}` : '🂠'))
                            .join(' ')} (${dealerEval.total})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9c9384]">Player: </span>
                    <span className="font-mono-tabular font-semibold text-[#d4af37]">
                      {blackjackState.playerHand.length === 0
                        ? '—'
                        : `${blackjackState.playerHand
                            .map((c) => `${c.rank}${SUIT_GLYPHS[c.suit]}`)
                            .join(' ')} (${playerEval.total}${playerEval.isSoft ? ' soft' : ''})`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#9c9384]">Wager:</span>
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={blackjackState.phase === 'playerTurn' || bankroll < amt}
                      onClick={() => onSelectBlackjackBet(amt)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tabular font-semibold border cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                        blackjackBet === amt
                          ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                          : 'bg-[#1d1724] text-[#f6f2e9] border-white/15'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#e6decb]">{blackjackState.message}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {blackjackState.phase !== 'playerTurn' ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={bankroll < blackjackBet}
                      onClick={onDealBlackjack}
                      className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] cursor-pointer disabled:opacity-40 whitespace-nowrap"
                    >
                      Deal Hand (${blackjackBet})
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={onHitBlackjack}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#175e44] hover:bg-[#1e7a58] text-white cursor-pointer whitespace-nowrap"
                      >
                        Hit
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={onStandBlackjack}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] cursor-pointer whitespace-nowrap"
                      >
                        Stand
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        disabled={
                          blackjackState.playerHand.length !== 2 ||
                          bankroll < blackjackState.bet
                        }
                        onClick={onDoubleBlackjack}
                        className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                      >
                        Double
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {station === 'poker' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-[#9c9384]">Board: </span>
                    <span className="font-mono-tabular font-semibold text-[#f6f2e9]">
                      {pokerState.community.length === 0
                        ? '—'
                        : pokerState.community.map((c) => `${c.rank}${SUIT_GLYPHS[c.suit]}`).join(' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9c9384]">Your Hand: </span>
                    <span className="font-mono-tabular font-semibold text-[#d4af37]">
                      {pokerState.playerHole.length === 0
                        ? '—'
                        : `${pokerState.playerHole.map((c) => `${c.rank}${SUIT_GLYPHS[c.suit]}`).join(' ')} · ${pokerState.playerRankName}`}
                    </span>
                  </div>
                  {pokerState.phase === 'resolved' && pokerState.outcome !== 'fold' && (
                    <div>
                      <span className="text-[#9c9384]">Dealer: </span>
                      <span className="font-mono-tabular text-[#e6decb]">
                        {pokerState.dealerHole.map((c) => `${c.rank}${SUIT_GLYPHS[c.suit]}`).join(' ')} ({pokerState.dealerRankName})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#9c9384]">Ante:</span>
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={pokerState.phase === 'flop' || bankroll < amt}
                      onClick={() => onSelectPokerAnte(amt)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-mono-tabular font-semibold border cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                        pokerAnte === amt
                          ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                          : 'bg-[#1d1724] text-[#f6f2e9] border-white/15'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#e6decb]">{pokerState.message}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {pokerState.phase !== 'flop' ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      disabled={bankroll < pokerAnte}
                      onClick={onDealPoker}
                      className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] cursor-pointer disabled:opacity-40 whitespace-nowrap"
                    >
                      Deal Hold&apos;em (${pokerAnte} Ante)
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={onFoldPoker}
                        className="px-4 py-2 rounded-lg text-xs font-medium border border-white/15 text-[#cfc8ba] hover:text-white cursor-pointer whitespace-nowrap"
                      >
                        Fold
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        disabled={bankroll < pokerState.ante * 2}
                        onClick={onCallPoker}
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#175e44] hover:bg-[#1e7a58] text-white cursor-pointer disabled:opacity-40 whitespace-nowrap"
                      >
                        Call (${pokerState.ante * 2})
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {station === 'slots' && (
            <div className="space-y-3">
              {/* Theme Machine Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['classic', 'treasure', 'futuristic'] as const).map((tid) => (
                    <button
                      key={tid}
                      type="button"
                      disabled={slotSpinning}
                      onClick={() => onSelectSlotTheme(tid)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 ${
                        slotTheme === tid
                          ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                          : 'bg-[#1d1724] text-[#e6decb] border-white/15 hover:border-[#d4af37]/50'
                      }`}
                    >
                      {SLOT_THEMES[tid].name}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono-tabular text-[#d4af37]">
                  Jackpot: ${jackpotPool.toLocaleString()}
                </div>
              </div>

              {/* Paylines & Bet-per-Line */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#9c9384]">Lines:</span>
                    {activeSlotCfg.paylineOptions.map((lines) => (
                      <button
                        key={lines}
                        type="button"
                        disabled={slotSpinning}
                        onClick={() => onSelectSlotPaylines(lines)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular border cursor-pointer whitespace-nowrap ${
                          slotPaylines === lines
                            ? 'bg-[#175e44] text-white border-[#1e7a58]'
                            : 'bg-[#1d1724] text-[#cfc8ba] border-white/15'
                        }`}
                      >
                        {lines} {lines === 1 ? 'Line' : 'Lines'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#9c9384]">Bet/Line:</span>
                    {activeSlotCfg.betOptions.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        disabled={slotSpinning || bankroll < amt * slotPaylines}
                        onClick={() => onSelectSlotBetPerLine(amt)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono-tabular font-semibold border cursor-pointer disabled:opacity-40 whitespace-nowrap ${
                          slotBetPerLine === amt
                            ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                            : 'bg-[#1d1724] text-[#f6f2e9] border-white/15'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-mono-tabular text-[#e6decb]">
                  Center Line: [{slotCenterRow.join(' · ')}]
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#cfc8ba]">
                  {activeSlotCfg.subtitle} · {slotMessage}
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  disabled={slotSpinning || bankroll < totalSlotStake}
                  onClick={onPullSlotLever}
                  className="px-6 py-2 rounded-lg text-xs font-semibold bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
                >
                  {slotSpinning
                    ? 'Spinning Reels...'
                    : `Pull Lever ($${totalSlotStake.toLocaleString()})`}
                </motion.button>
              </div>
            </div>
          )}

          {station === 'bar' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#f6f2e9]">
                  Salon Cocktail Bar &amp; Lounge
                </h2>
                <p className="text-xs text-[#b8ae9c] mt-1">
                  Complimentary house refreshments while you survey the floor.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {COCKTAILS.map((drink) => (
                  <motion.button
                    key={drink}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onOrderDrink(drink)}
                    className="px-3 py-2 rounded-lg text-xs font-medium border border-[#d4af37]/30 bg-[#1d1724] hover:border-[#d4af37] text-[#f6f2e9] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Order {drink}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
