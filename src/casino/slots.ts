export type SlotThemeId = 'classic' | 'treasure' | 'futuristic';

export type SlotSymbol =
  | 'SEVEN'
  | 'BELL'
  | 'BAR'
  | 'MELON'
  | 'LEMON'
  | 'CHERRY'
  | 'PHARAOH'
  | 'SCARAB'
  | 'ANUBIS'
  | 'CHALICE'
  | 'RUBY'
  | 'COIN'
  | 'CORE'
  | 'MECH'
  | 'PRISM'
  | 'CHIP'
  | 'BOLT'
  | 'STAR';

export interface SlotThemeConfig {
  id: SlotThemeId;
  name: string;
  subtitle: string;
  strip: readonly SlotSymbol[];
  betOptions: readonly number[];
  paylineOptions: readonly number[];
  wildSymbol?: SlotSymbol;
  payouts: Partial<Record<SlotSymbol, number>>;
}

export const SLOT_THEMES: Record<SlotThemeId, SlotThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Royal Fruit 777',
    subtitle: 'Classic 3-Reel · 1 or 3 Paylines',
    strip: [
      'CHERRY', 'LEMON', 'BAR', 'CHERRY', 'MELON', 'BELL',
      'CHERRY', 'LEMON', 'SEVEN', 'BAR', 'CHERRY', 'MELON',
      'BELL', 'LEMON', 'CHERRY', 'BAR', 'MELON', 'BELL',
    ],
    betOptions: [5, 10, 25, 50],
    paylineOptions: [1, 3],
    payouts: {
      SEVEN: 50,
      BELL: 20,
      MELON: 12,
      BAR: 8,
      LEMON: 5,
      CHERRY: 4,
    },
  },
  treasure: {
    id: 'treasure',
    name: "Pharaoh's Vault",
    subtitle: 'Treasure Hunt · 3 or 5 Paylines',
    strip: [
      'COIN', 'RUBY', 'CHALICE', 'COIN', 'SCARAB', 'ANUBIS',
      'COIN', 'RUBY', 'PHARAOH', 'CHALICE', 'COIN', 'SCARAB',
      'ANUBIS', 'RUBY', 'COIN', 'CHALICE', 'SCARAB', 'RUBY',
    ],
    betOptions: [25, 50, 100, 250],
    paylineOptions: [3, 5],
    wildSymbol: 'SCARAB',
    payouts: {
      PHARAOH: 60,
      SCARAB: 35,
      ANUBIS: 22,
      CHALICE: 14,
      RUBY: 8,
      COIN: 5,
    },
  },
  futuristic: {
    id: 'futuristic',
    name: 'Cyber Vault X',
    subtitle: 'Futuristic High-Limit · 5 Paylines · 2x Wild Core',
    strip: [
      'STAR', 'BOLT', 'CHIP', 'STAR', 'PRISM', 'MECH',
      'STAR', 'BOLT', 'CORE', 'CHIP', 'STAR', 'PRISM',
      'MECH', 'BOLT', 'STAR', 'CHIP', 'PRISM', 'MECH',
    ],
    betOptions: [50, 100, 250, 500],
    paylineOptions: [5],
    wildSymbol: 'CORE',
    payouts: {
      CORE: 80,
      MECH: 30,
      PRISM: 20,
      CHIP: 12,
      BOLT: 8,
      STAR: 5,
    },
  },
};

export interface WinningLineHit {
  lineIndex: number;
  lineName: string;
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol];
  payout: number;
}

export interface SlotSpinResult {
  themeId: SlotThemeId;
  centerIndices: [number, number, number];
  /** 3x3 visible grid: rows [top, center, bottom], each 3 columns */
  grid: [
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
  ];
  winningLines: WinningLineHit[];
  totalPayout: number;
  isJackpot: boolean;
  nextJackpotPool: number;
  summary: string;
}

const PAYLINE_DEFS: { name: string; coords: [[number, number], [number, number], [number, number]] }[] = [
  { name: 'Center Line', coords: [[1, 0], [1, 1], [1, 2]] },
  { name: 'Top Line', coords: [[0, 0], [0, 1], [0, 2]] },
  { name: 'Bottom Line', coords: [[2, 0], [2, 1], [2, 2]] },
  { name: 'Diagonal Down', coords: [[0, 0], [1, 1], [2, 2]] },
  { name: 'Diagonal Up', coords: [[2, 0], [1, 1], [0, 2]] },
];

function wrapIndex(idx: number, len: number): number {
  return ((idx % len) + len) % len;
}

export function evaluateSlotGrid(
  themeId: SlotThemeId,
  grid: [
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
  ],
  betPerLine: number,
  activeLines: number,
  jackpotPool: number,
): { winningLines: WinningLineHit[]; totalPayout: number; isJackpot: boolean; summary: string } {
  const cfg = SLOT_THEMES[themeId];
  const linesToCheck = PAYLINE_DEFS.slice(0, Math.min(activeLines, PAYLINE_DEFS.length));
  const winningLines: WinningLineHit[] = [];
  let totalPayout = 0;
  let isJackpot = false;

  const topSymbol = cfg.strip.includes('SEVEN')
    ? 'SEVEN'
    : cfg.strip.includes('PHARAOH')
      ? 'PHARAOH'
      : 'CORE';

  linesToCheck.forEach((def, lineIdx) => {
    const syms: [SlotSymbol, SlotSymbol, SlotSymbol] = [
      grid[def.coords[0][0]][def.coords[0][1]],
      grid[def.coords[1][0]][def.coords[1][1]],
      grid[def.coords[2][0]][def.coords[2][1]],
    ];

    const wild = cfg.wildSymbol;
    const nonWilds = wild ? syms.filter((s) => s !== wild) : syms;
    const allWild = nonWilds.length === 0;
    const target = allWild ? wild! : nonWilds[0];
    const isThreeMatch = allWild || nonWilds.every((s) => s === target);

    if (isThreeMatch) {
      if (target === topSymbol) {
        isJackpot = true;
        const jp = Math.round(jackpotPool + betPerLine * (cfg.payouts[target] ?? 50));
        totalPayout += jp;
        winningLines.push({ lineIndex: lineIdx, lineName: def.name, symbols: syms, payout: jp });
      } else {
        const mult = cfg.payouts[target] ?? 5;
        const wildBonus = wild && syms.includes(wild) && themeId === 'futuristic' ? 2 : 1;
        const pay = betPerLine * mult * wildBonus;
        totalPayout += pay;
        winningLines.push({ lineIndex: lineIdx, lineName: def.name, symbols: syms, payout: pay });
      }
      return;
    }

    // Two-of-a-kind lead match for entry symbol (CHERRY / COIN / STAR)
    const entrySym: SlotSymbol =
      themeId === 'classic' ? 'CHERRY' : themeId === 'treasure' ? 'COIN' : 'STAR';
    if (syms[0] === entrySym && syms[1] === entrySym) {
      const pay = betPerLine * 2;
      totalPayout += pay;
      winningLines.push({ lineIndex: lineIdx, lineName: def.name, symbols: syms, payout: pay });
    }
  });

  const summary =
    winningLines.length === 0
      ? 'No matching payline.'
      : isJackpot
        ? `JACKPOT! ${winningLines.map((l) => l.lineName).join(' + ')}`
        : `${winningLines.length} winning line${winningLines.length > 1 ? 's' : ''} (${winningLines[0].lineName})`;

  return { winningLines, totalPayout, isJackpot, summary };
}

export function spinSlots(
  themeId: SlotThemeId,
  betPerLine: number,
  activeLines: number,
  jackpotPool: number,
  rng: () => number = Math.random,
): SlotSpinResult {
  const cfg = SLOT_THEMES[themeId];
  const len = cfg.strip.length;

  const c0 = Math.floor(rng() * len) % len;
  const c1 = Math.floor(rng() * len) % len;
  const c2 = Math.floor(rng() * len) % len;

  const grid: [
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
    [SlotSymbol, SlotSymbol, SlotSymbol],
  ] = [
    [
      cfg.strip[wrapIndex(c0 - 1, len)],
      cfg.strip[wrapIndex(c1 - 1, len)],
      cfg.strip[wrapIndex(c2 - 1, len)],
    ],
    [cfg.strip[c0], cfg.strip[c1], cfg.strip[c2]],
    [
      cfg.strip[wrapIndex(c0 + 1, len)],
      cfg.strip[wrapIndex(c1 + 1, len)],
      cfg.strip[wrapIndex(c2 + 1, len)],
    ],
  ];

  const totalStake = betPerLine * activeLines;
  const poolAfter = jackpotPool + Math.max(5, Math.round(totalStake * 0.08));
  const evalRes = evaluateSlotGrid(themeId, grid, betPerLine, activeLines, poolAfter);
  const nextJackpotPool = evalRes.isJackpot ? 5000 : poolAfter;

  return {
    themeId,
    centerIndices: [c0, c1, c2],
    grid,
    winningLines: evalRes.winningLines,
    totalPayout: evalRes.totalPayout,
    isJackpot: evalRes.isJackpot,
    nextJackpotPool,
    summary: evalRes.summary,
  };
}
