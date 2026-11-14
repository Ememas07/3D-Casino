import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, BrainCircuit, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { casinoAudio } from './audio/casinoAudio';
import {
  createShoe,
  dealerResolve,
  dealBlackjackRound,
  playerDouble,
  playerHit,
  type BlackjackRoundState,
} from './casino/blackjack';
import {
  callPokerRound,
  dealPokerFlop,
  foldPokerRound,
  type PokerRoundState,
} from './casino/poker';
import {
  settleRouletteSpin,
  spinRouletteNumber,
  type RouletteBet,
  type RouletteBetType,
} from './casino/roulette';
import {
  SLOT_THEMES,
  spinSlots,
  type SlotSymbol,
  type SlotThemeId,
} from './casino/slots';
import { AdvisorDrawer } from './components/AdvisorDrawer';
import { StationDock, type FloorLogEntry } from './components/StationDock';
import { TitleScreen } from './components/TitleScreen';
import { CasinoSceneEngine, type CasinoStation } from './three/CasinoScene';

type GameShellState = 'title' | 'playing' | 'paused';

const INITIAL_BANKROLL = 10000;

export default function App() {
  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [shellState, setShellState] = useState<GameShellState>(
    initialAutostart ? 'playing' : 'title',
  );
  const [station, setStation] = useState<CasinoStation>('overview');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const [bankroll, setBankroll] = useState(INITIAL_BANKROLL);
  const prevBankrollRef = useRef(INITIAL_BANKROLL);
  const [chipDelta, setChipDelta] = useState<{ key: number; amount: number } | null>(null);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [dealerBanter, setDealerBanter] = useState(
    'Welcome to Monte Carlo Pavilion. Place virtual chips on any table.',
  );
  const [floorLog, setFloorLog] = useState<FloorLogEntry[]>([]);

  // Roulette state
  const [chipSize, setChipSize] = useState(25);
  const [rouletteBets, setRouletteBets] = useState<RouletteBet[]>([]);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [selectedStraightNum, setSelectedStraightNum] = useState(17);
  const [lastRoulettePocket, setLastRoulettePocket] = useState<number | null>(null);

  // Blackjack state
  const [blackjackBet, setBlackjackBet] = useState(50);
  const [blackjackState, setBlackjackState] = useState<BlackjackRoundState>(() => ({
    phase: 'betting',
    shoe: createShoe(6),
    playerHand: [],
    dealerHand: [],
    bet: 50,
    outcome: null,
    payout: 0,
    message: 'Select a wager and deal a six-deck Blackjack hand.',
  }));

  // Poker state
  const [pokerAnte, setPokerAnte] = useState(50);
  const [pokerState, setPokerState] = useState<PokerRoundState>(() => ({
    phase: 'betting',
    deck: [],
    playerHole: [],
    dealerHole: [],
    community: [],
    ante: 50,
    callBet: 0,
    outcome: null,
    payout: 0,
    playerRankName: '—',
    dealerRankName: '—',
    message: "Select an Ante and deal Heads-Up Monte Carlo Hold'em.",
  }));

  // Slots state (3 Themes)
  const [slotTheme, setSlotTheme] = useState<SlotThemeId>('classic');
  const [slotPaylines, setSlotPaylines] = useState<number>(3);
  const [slotBetPerLine, setSlotBetPerLine] = useState<number>(10);
  const [jackpotPool, setJackpotPool] = useState(5000);
  const [slotCenterRow, setSlotCenterRow] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    'SEVEN',
    'SEVEN',
    'SEVEN',
  ]);
  const [slotMessage, setSlotMessage] = useState('Pull the lever to spin.');
  const [slotSpinning, setSlotSpinning] = useState(false);

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CasinoSceneEngine | null>(null);

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    const diff = bankroll - prevBankrollRef.current;
    prevBankrollRef.current = bankroll;
    if (diff === 0) return;
    setChipDelta({ key: Date.now() + Math.random(), amount: diff });
    const timer = window.setTimeout(() => setChipDelta(null), 1600);
    return () => window.clearTimeout(timer);
  }, [bankroll]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;
    const engine = new CasinoSceneEngine(mount, {
      onStationSelect: (selected, chosenTheme) => {
        setStation(selected);
        if (chosenTheme) {
          setSlotTheme(chosenTheme);
          const cfg = SLOT_THEMES[chosenTheme];
          setSlotPaylines(cfg.paylineOptions[cfg.paylineOptions.length - 1]);
          setSlotBetPerLine(cfg.betOptions[0]);
        }
        setDockCollapsed(false);
      },
      onContextIssue: (lost) => setContextLost(lost),
    });
    engine.setMode(initialAutostart ? 'playing' : 'title');
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [initialAutostart]);

  useEffect(() => {
    engineRef.current?.syncRouletteChips(rouletteBets);
  }, [rouletteBets]);

  useEffect(() => {
    engineRef.current?.syncBlackjackTable(
      blackjackState.playerHand,
      blackjackState.dealerHand,
      blackjackState.phase === 'playerTurn' ? blackjackState.bet : 0,
    );
  }, [blackjackState]);

  useEffect(() => {
    engineRef.current?.syncPokerTable(
      pokerState.community,
      pokerState.playerHole,
      pokerState.dealerHole,
      pokerState.phase === 'flop' ? pokerState.ante + pokerState.callBet : 0,
    );
  }, [pokerState]);

  const requestBanter = useCallback(
    async (stationName: string, eventSummary: string, netDelta: number) => {
      try {
        const res = await fetch('/api/casino/dealer-banter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station: stationName,
            eventSummary,
            netDelta,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { line?: string };
        if (data.line) {
          setDealerBanter(data.line);
        }
      } catch {
        // Keep current line
      }
    },
    [],
  );

  const appendLog = useCallback((stationLabel: string, summary: string, net: number) => {
    setRoundsPlayed((r) => r + 1);
    setFloorLog((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        station: stationLabel,
        summary,
        net,
      },
      ...prev.slice(0, 11),
    ]);
  }, []);

  const handleEnterSalon = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShellState('playing');
    engineRef.current?.setMode('playing');
  }, []);

  const handleSelectStation = useCallback(
    (next: CasinoStation) => {
      setStation(next);
      engineRef.current?.focusStation(next, next === 'slots' ? slotTheme : undefined);
    },
    [slotTheme],
  );

  const handleSelectSlotTheme = useCallback((theme: SlotThemeId) => {
    const cfg = SLOT_THEMES[theme];
    setSlotTheme(theme);
    setSlotPaylines(cfg.paylineOptions[cfg.paylineOptions.length - 1]);
    setSlotBetPerLine(cfg.betOptions[0]);
    setSlotCenterRow([cfg.strip[8], cfg.strip[8], cfg.strip[8]]);
    setSlotMessage(`Switched to ${cfg.name}.`);
    engineRef.current?.focusStation('slots', theme);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      casinoAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleResetBankroll = useCallback(() => {
    setBankroll(INITIAL_BANKROLL);
    setRouletteBets([]);
    setRoundsPlayed(0);
    setFloorLog([]);
    setDealerBanter('Fresh $10,000 virtual bankroll issued. Enjoy the salon.');
    setShellState('playing');
    engineRef.current?.setMode('playing');
  }, []);

  useEffect(() => {
    if (shellState === 'title') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShellState((s) => (s === 'playing' ? 'paused' : 'playing'));
      } else if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'a' || e.key === 'A') {
        setAdvisorOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shellState, handleToggleMute]);

  // Roulette handlers
  const handlePlaceRouletteBet = useCallback(
    (type: RouletteBetType, label: string, num?: number) => {
      if (rouletteSpinning || bankroll < chipSize) return;
      casinoAudio.playChipClink();
      setBankroll((b) => b - chipSize);
      setRouletteBets((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          number: num,
          amount: chipSize,
          label,
        },
      ]);
    },
    [bankroll, chipSize, rouletteSpinning],
  );

  const handleClearRouletteBets = useCallback(() => {
    if (rouletteSpinning || rouletteBets.length === 0) return;
    const refunded = rouletteBets.reduce((s, b) => s + b.amount, 0);
    setBankroll((b) => b + refunded);
    setRouletteBets([]);
  }, [rouletteBets, rouletteSpinning]);

  const handleSpinRoulette = useCallback(() => {
    if (rouletteSpinning || rouletteBets.length === 0) return;
    const activeBets = [...rouletteBets];
    const winningNumber = spinRouletteNumber();
    setRouletteSpinning(true);
    setDealerBanter('Rien ne va plus — wheel is in motion.');

    engineRef.current?.triggerRouletteSpin(winningNumber, () => {
      const settlement = settleRouletteSpin(activeBets, winningNumber);
      setLastRoulettePocket(winningNumber);
      setBankroll((b) => b + settlement.totalReturn);
      setRouletteBets([]);
      setRouletteSpinning(false);

      if (settlement.totalReturn > 0) {
        casinoAudio.playWinFanfare(settlement.netProfit >= 200);
        if (settlement.netProfit > 0) {
          engineRef.current?.triggerTableCelebration('roulette');
        }
      }

      const summary = `#${winningNumber} ${settlement.winningColor.toUpperCase()} — Return $${settlement.totalReturn}`;
      setDealerBanter(
        settlement.netProfit >= 0
          ? `Pocket #${winningNumber} (${settlement.winningColor})! Returned $${settlement.totalReturn.toLocaleString()}.`
          : `Pocket #${winningNumber} (${settlement.winningColor}). Ready for your next wager.`,
      );
      appendLog('Roulette', summary, settlement.netProfit);
      void requestBanter('Roulette', summary, settlement.netProfit);
    });
  }, [appendLog, requestBanter, rouletteBets, rouletteSpinning]);

  // Blackjack handlers
  const handleDealBlackjack = useCallback(() => {
    if (blackjackState.phase === 'playerTurn' || bankroll < blackjackBet) return;
    casinoAudio.playCardSnap();
    setBankroll((b) => b - blackjackBet);
    const next = dealBlackjackRound(blackjackState.shoe, blackjackBet);
    setBlackjackState(next);

    if (next.phase === 'resolved') {
      if (next.payout > 0) {
        setBankroll((b) => b + next.payout);
        casinoAudio.playWinFanfare(next.outcome === 'blackjack');
        if (next.payout > next.bet) {
          engineRef.current?.triggerTableCelebration('blackjack');
        }
      }
      const net = next.payout - next.bet;
      appendLog('Blackjack', next.message, net);
      void requestBanter('Blackjack', next.message, net);
    }
  }, [appendLog, bankroll, blackjackBet, blackjackState.phase, blackjackState.shoe, requestBanter]);

  const handleHitBlackjack = useCallback(() => {
    if (blackjackState.phase !== 'playerTurn') return;
    casinoAudio.playCardSnap();
    const next = playerHit(blackjackState);
    setBlackjackState(next);

    if (next.phase === 'resolved') {
      if (next.payout > 0) {
        setBankroll((b) => b + next.payout);
        casinoAudio.playWinFanfare(false);
        if (next.payout > next.bet) {
          engineRef.current?.triggerTableCelebration('blackjack');
        }
      }
      const net = next.payout - next.bet;
      appendLog('Blackjack', next.message, net);
      void requestBanter('Blackjack', next.message, net);
    }
  }, [appendLog, blackjackState, requestBanter]);

  const handleStandBlackjack = useCallback(() => {
    if (blackjackState.phase !== 'playerTurn') return;
    casinoAudio.playCardSnap();
    const next = dealerResolve(blackjackState);
    setBlackjackState(next);

    if (next.payout > 0) {
      setBankroll((b) => b + next.payout);
      casinoAudio.playWinFanfare(next.outcome === 'win');
      if (next.payout > next.bet) {
        engineRef.current?.triggerTableCelebration('blackjack');
      }
    }
    const net = next.payout - next.bet;
    appendLog('Blackjack', next.message, net);
    void requestBanter('Blackjack', next.message, net);
  }, [appendLog, blackjackState, requestBanter]);

  const handleDoubleBlackjack = useCallback(() => {
    if (
      blackjackState.phase !== 'playerTurn' ||
      blackjackState.playerHand.length !== 2 ||
      bankroll < blackjackState.bet
    ) {
      return;
    }
    casinoAudio.playChipClink(1.1);
    casinoAudio.playCardSnap();
    setBankroll((b) => b - blackjackState.bet);
    const next = playerDouble(blackjackState);
    setBlackjackState(next);

    if (next.payout > 0) {
      setBankroll((b) => b + next.payout);
      casinoAudio.playWinFanfare(true);
      if (next.payout > next.bet) {
        engineRef.current?.triggerTableCelebration('blackjack');
      }
    }
    const net = next.payout - next.bet;
    appendLog('Blackjack', next.message, net);
    void requestBanter('Blackjack', next.message, net);
  }, [appendLog, bankroll, blackjackState, requestBanter]);

  // Poker handlers
  const handleDealPoker = useCallback(() => {
    if (pokerState.phase === 'flop' || bankroll < pokerAnte) return;
    casinoAudio.playCardSnap();
    setBankroll((b) => b - pokerAnte);
    setPokerState(dealPokerFlop(pokerAnte));
  }, [bankroll, pokerAnte, pokerState.phase]);

  const handleCallPoker = useCallback(() => {
    if (pokerState.phase !== 'flop' || bankroll < pokerState.ante * 2) return;
    casinoAudio.playChipClink(1.15);
    casinoAudio.playCardSnap();
    setBankroll((b) => b - pokerState.ante * 2);
    const next = callPokerRound(pokerState);
    setPokerState(next);
    if (next.payout > 0) {
      setBankroll((b) => b + next.payout);
      casinoAudio.playWinFanfare(next.outcome === 'win');
      if (next.payout > next.ante + next.callBet) {
        engineRef.current?.triggerTableCelebration('poker');
      }
    }
    const totalWagered = next.ante + next.callBet;
    const net = next.payout - totalWagered;
    appendLog('Poker', next.message, net);
    void requestBanter("Hold'em Poker", next.message, net);
  }, [appendLog, bankroll, pokerState, requestBanter]);

  const handleFoldPoker = useCallback(() => {
    if (pokerState.phase !== 'flop') return;
    const next = foldPokerRound(pokerState);
    setPokerState(next);
    appendLog('Poker', 'Folded on flop', -next.ante);
  }, [appendLog, pokerState]);

  // Slots handler (3 Themes)
  const handlePullSlotLever = useCallback(() => {
    const totalStake = slotBetPerLine * slotPaylines;
    if (slotSpinning || bankroll < totalStake) return;
    casinoAudio.playChipClink(0.9);
    setBankroll((b) => b - totalStake);
    setSlotSpinning(true);
    setSlotMessage('Reels spinning...');

    const result = spinSlots(slotTheme, slotBetPerLine, slotPaylines, jackpotPool);
    engineRef.current?.triggerSlotSpin(
      slotTheme,
      result.centerIndices,
      result.totalPayout > 0,
      () => {
        setSlotCenterRow(result.grid[1]);
        setJackpotPool(result.nextJackpotPool);
        setSlotSpinning(false);

        if (result.totalPayout > 0) {
          setBankroll((b) => b + result.totalPayout);
          casinoAudio.playWinFanfare(result.isJackpot || result.totalPayout >= totalStake * 6);
        }

        const net = result.totalPayout - totalStake;
        setSlotMessage(
          result.totalPayout > 0
            ? `${result.summary} — Won $${result.totalPayout.toLocaleString()}!`
            : result.summary,
        );
        appendLog(SLOT_THEMES[slotTheme].name, result.summary, net);
        void requestBanter(SLOT_THEMES[slotTheme].name, result.summary, net);
      },
    );
  }, [
    appendLog,
    bankroll,
    jackpotPool,
    requestBanter,
    slotBetPerLine,
    slotPaylines,
    slotSpinning,
    slotTheme,
  ]);

  const handleOrderDrink = useCallback((drinkName: string) => {
    casinoAudio.playChipClink(1.45);
    engineRef.current?.triggerBarServe();
    setDealerBanter(`Bartender shakes and slides a chilled ${drinkName} across the marble counter.`);
  }, []);

  const advisorContextSummary = useMemo(() => {
    const recent = floorLog.slice(0, 3).map((e) => `${e.station}: ${e.summary}`).join('; ');
    return `Station=${station} (SlotTheme=${slotTheme}, Lines=${slotPaylines}), VirtualBankroll=$${bankroll}, Rounds=${roundsPlayed}, Recent=[${recent || 'none'}]`;
  }, [bankroll, floorLog, roundsPlayed, slotPaylines, slotTheme, station]);

  const netSessionProfit = bankroll - INITIAL_BANKROLL;

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0d0b10]">
      <div
        ref={canvasMountRef}
        data-testid="casino-viewport"
        className="fixed inset-0 w-full h-full"
      />

      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0b10]/95 p-6 text-center">
          <div className="max-w-sm rounded-xl border border-[#d4af37]/30 bg-[#141019] p-6">
            <h2 className="font-display text-xl text-[#f6f2e9]">Graphics Context Paused</h2>
            <p className="mt-2 text-xs text-[#b8ae9c]">
              The 3D viewport is recovering its WebGL surface.
            </p>
          </div>
        </div>
      )}

      {shellState === 'title' && <TitleScreen onStart={handleEnterSalon} />}

      {shellState !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 pt-3.5 gap-2 sm:gap-4">
            <div className="pointer-events-auto min-w-0 flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-[#d4af37]/25 bg-[#141019]/92">
              <a
                href="/"
                title="Return to Hub"
                className="font-display text-xs sm:text-sm md:text-base font-semibold text-[#f6f2e9] truncate hover:text-[#d4af37] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="text-xs text-[#d4af37]">←</span> Monte Carlo Pavilion
              </a>
              <span className="hidden sm:inline text-xs text-[#9c9384] whitespace-nowrap">
                · Virtual Play Chips
              </span>
            </div>

            <div className="pointer-events-auto shrink-0 flex items-center gap-1.5 sm:gap-2">
              <div className="relative flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-[#d4af37]/35 bg-[#141019]/92">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9c9384]">
                  Chips
                </span>
                <span
                  data-testid="bankroll-value"
                  className="font-mono-tabular text-xs sm:text-sm md:text-base font-bold text-[#d4af37]"
                >
                  ${bankroll.toLocaleString()}
                </span>
                <AnimatePresence>
                  {chipDelta && (
                    <motion.span
                      key={chipDelta.key}
                      initial={{ opacity: 0, y: 6, scale: 0.9 }}
                      animate={{ opacity: 1, y: 18, scale: 1 }}
                      exit={{ opacity: 0, y: 26 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`pointer-events-none absolute right-2 top-full mt-0.5 px-2 py-0.5 rounded bg-[#141019]/95 border text-[11px] font-mono-tabular font-semibold whitespace-nowrap ${
                        chipDelta.amount >= 0
                          ? 'text-emerald-400 border-emerald-500/40'
                          : 'text-red-400 border-red-500/40'
                      }`}
                    >
                      {chipDelta.amount >= 0
                        ? `+$${chipDelta.amount.toLocaleString()}`
                        : `-$${Math.abs(chipDelta.amount).toLocaleString()}`}
                    </motion.span>
                  )}
                </AnimatePresence>
                {bankroll < 500 && (
                  <button
                    type="button"
                    onClick={() => {
                      casinoAudio.playChipClink(1.15);
                      setBankroll((b) => b + 2500);
                      setDealerBanter('House courtesy refill: +$2,500 virtual chips added.');
                    }}
                    className="ml-1 px-2 py-0.5 rounded bg-[#175e44] hover:bg-[#1e7a58] text-[11px] font-medium text-white cursor-pointer whitespace-nowrap"
                  >
                    +Refill
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAdvisorOpen((o) => !o)}
                aria-label="Toggle Pit-Boss Strategy Advisor"
                aria-expanded={advisorOpen}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  advisorOpen
                    ? 'bg-[#d4af37] text-[#110d14] border-[#d4af37]'
                    : 'bg-[#141019]/92 text-[#f6f2e9] border-[#d4af37]/25 hover:border-[#d4af37]/60'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span className="hidden sm:inline">Advisor</span>
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                className="p-1.5 sm:p-2 rounded-lg border border-[#d4af37]/25 bg-[#141019]/92 text-[#e6decb] hover:text-[#d4af37] cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShellState((s) => (s === 'playing' ? 'paused' : 'playing'))}
                aria-label="Open Salon Menu"
                className="p-1.5 sm:p-2 rounded-lg border border-[#d4af37]/25 bg-[#141019]/92 text-[#e6decb] hover:text-[#d4af37] cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AdvisorDrawer
            open={advisorOpen}
            onClose={() => setAdvisorOpen(false)}
            station={station}
            bankroll={bankroll}
            contextSummary={advisorContextSummary}
          />

          <StationDock
            station={station}
            onSelectStation={handleSelectStation}
            collapsed={dockCollapsed}
            onToggleCollapse={() => setDockCollapsed((c) => !c)}
            bankroll={bankroll}
            dealerBanter={dealerBanter}
            floorLog={floorLog}
            chipSize={chipSize}
            onSelectChipSize={setChipSize}
            rouletteBets={rouletteBets}
            rouletteSpinning={rouletteSpinning}
            selectedStraightNum={selectedStraightNum}
            onChangeStraightNum={setSelectedStraightNum}
            onPlaceRouletteBet={handlePlaceRouletteBet}
            onClearRouletteBets={handleClearRouletteBets}
            onSpinRoulette={handleSpinRoulette}
            lastRoulettePocket={lastRoulettePocket}
            blackjackBet={blackjackBet}
            onSelectBlackjackBet={setBlackjackBet}
            blackjackState={blackjackState}
            onDealBlackjack={handleDealBlackjack}
            onHitBlackjack={handleHitBlackjack}
            onStandBlackjack={handleStandBlackjack}
            onDoubleBlackjack={handleDoubleBlackjack}
            pokerAnte={pokerAnte}
            onSelectPokerAnte={setPokerAnte}
            pokerState={pokerState}
            onDealPoker={handleDealPoker}
            onCallPoker={handleCallPoker}
            onFoldPoker={handleFoldPoker}
            slotTheme={slotTheme}
            onSelectSlotTheme={handleSelectSlotTheme}
            slotPaylines={slotPaylines}
            onSelectSlotPaylines={setSlotPaylines}
            slotBetPerLine={slotBetPerLine}
            onSelectSlotBetPerLine={setSlotBetPerLine}
            jackpotPool={jackpotPool}
            slotCenterRow={slotCenterRow}
            slotMessage={slotMessage}
            slotSpinning={slotSpinning}
            onPullSlotLever={handlePullSlotLever}
            onOrderDrink={handleOrderDrink}
          />
        </div>
      )}

      <AnimatePresence>
        {shellState === 'paused' && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-md rounded-xl border border-[#d4af37]/35 bg-[#141019] p-6 shadow-2xl"
            >
              <h2 id="pause-modal-title" className="font-display text-2xl font-semibold text-[#f6f2e9]">
                Salon Ledger
              </h2>
              <p className="mt-1 text-xs text-[#9c9384]">
                Virtual play-money session summary · No real currency
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-[#1d1724] p-3">
                  <div className="text-[11px] text-[#9c9384]">Bankroll</div>
                  <div className="mt-1 font-mono-tabular text-base font-bold text-[#d4af37]">
                    ${bankroll.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#1d1724] p-3">
                  <div className="text-[11px] text-[#9c9384]">Net P&amp;L</div>
                  <div
                    className={`mt-1 font-mono-tabular text-base font-bold ${
                      netSessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {netSessionProfit >= 0
                      ? `+$${netSessionProfit.toLocaleString()}`
                      : `-$${Math.abs(netSessionProfit).toLocaleString()}`}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#1d1724] p-3">
                  <div className="text-[11px] text-[#9c9384]">Rounds</div>
                  <div className="mt-1 font-mono-tabular text-base font-bold text-[#f6f2e9]">
                    {roundsPlayed}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setShellState('playing')}
                  className="w-full py-2.5 rounded-lg bg-[#d4af37] hover:bg-[#e2c051] text-[#110d14] font-semibold text-sm cursor-pointer"
                >
                  Resume Floor
                </button>
                <button
                  type="button"
                  onClick={handleResetBankroll}
                  className="w-full py-2.5 rounded-lg border border-white/15 bg-[#1d1724] hover:border-[#d4af37]/50 text-[#f6f2e9] font-medium text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Bankroll ($10,000)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShellState('title');
                    engineRef.current?.setMode('title');
                  }}
                  className="w-full py-2 rounded-lg text-xs text-[#9c9384] hover:text-[#f6f2e9] cursor-pointer"
                >
                  Return to Title Screen
                </button>
                <a
                  href="/"
                  className="w-full py-2 rounded-lg text-xs text-[#d4af37] hover:text-[#f6f2e9] cursor-pointer text-center block"
                >
                  Exit to AI Studio Hub
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
