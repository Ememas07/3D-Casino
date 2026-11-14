import { createShoe, type Card, type Rank } from './blackjack';

export type PokerPhase = 'betting' | 'flop' | 'resolved';
export type PokerOutcome = 'win' | 'lose' | 'push' | 'fold' | null;

export interface PokerHandRank {
  category: number; // 8=StraightFlush .. 0=HighCard
  name: string;
  tiebreakers: number[];
}

export interface PokerRoundState {
  phase: PokerPhase;
  deck: Card[];
  playerHole: Card[];
  dealerHole: Card[];
  community: Card[];
  ante: number;
  callBet: number;
  outcome: PokerOutcome;
  payout: number;
  playerRankName: string;
  dealerRankName: string;
  message: string;
}

const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function compareTiebreakers(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

export function comparePokerRanks(a: PokerHandRank, b: PokerHandRank): number {
  if (a.category !== b.category) return a.category > b.category ? 1 : -1;
  return compareTiebreakers(a.tiebreakers, b.tiebreakers);
}

function evaluateFiveCards(cards: Card[]): PokerHandRank {
  const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const uniqueVals = Array.from(new Set(vals));
  let isStraight = false;
  let straightHigh = 0;
  if (uniqueVals.length === 5) {
    if (uniqueVals[0] - uniqueVals[4] === 4) {
      isStraight = true;
      straightHigh = uniqueVals[0];
    } else if (
      uniqueVals[0] === 14 &&
      uniqueVals[1] === 5 &&
      uniqueVals[2] === 4 &&
      uniqueVals[3] === 3 &&
      uniqueVals[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  const counts = new Map<number, number>();
  for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (isFlush && isStraight) {
    return {
      category: 8,
      name: straightHigh === 14 ? 'Royal Flush' : 'Straight Flush',
      tiebreakers: [straightHigh],
    };
  }
  if (groups[0][1] === 4) {
    return { category: 7, name: 'Four of a Kind', tiebreakers: [groups[0][0], groups[1][0]] };
  }
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return { category: 6, name: 'Full House', tiebreakers: [groups[0][0], groups[1][0]] };
  }
  if (isFlush) {
    return { category: 5, name: 'Flush', tiebreakers: vals };
  }
  if (isStraight) {
    return { category: 4, name: 'Straight', tiebreakers: [straightHigh] };
  }
  if (groups[0][1] === 3) {
    return {
      category: 3,
      name: 'Three of a Kind',
      tiebreakers: [groups[0][0], groups[1][0], groups[2][0]],
    };
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    return {
      category: 2,
      name: 'Two Pair',
      tiebreakers: [groups[0][0], groups[1][0], groups[2][0]],
    };
  }
  if (groups[0][1] === 2) {
    return {
      category: 1,
      name: 'One Pair',
      tiebreakers: [groups[0][0], groups[1][0], groups[2][0], groups[3][0]],
    };
  }
  return { category: 0, name: 'High Card', tiebreakers: vals };
}

export function evaluateBestSevenCardHand(cards: Card[]): PokerHandRank {
  if (cards.length < 5) {
    return { category: 0, name: 'Incomplete', tiebreakers: [] };
  }
  let best: PokerHandRank | null = null;
  const n = cards.length;
  for (let a = 0; a < n - 4; a++) {
    for (let b = a + 1; b < n - 3; b++) {
      for (let c = b + 1; c < n - 2; c++) {
        for (let d = c + 1; d < n - 1; d++) {
          for (let e = d + 1; e < n; e++) {
            const rank = evaluateFiveCards([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || comparePokerRanks(rank, best) > 0) {
              best = rank;
            }
          }
        }
      }
    }
  }
  return best!;
}

export function dealPokerFlop(ante: number, rng: () => number = Math.random): PokerRoundState {
  const deck = createShoe(1, rng);
  const playerHole = [
    { ...deck.pop()!, faceUp: true },
    { ...deck.pop()!, faceUp: true },
  ];
  const dealerHole = [
    { ...deck.pop()!, faceUp: false },
    { ...deck.pop()!, faceUp: false },
  ];
  const community = [
    { ...deck.pop()!, faceUp: true },
    { ...deck.pop()!, faceUp: true },
    { ...deck.pop()!, faceUp: true },
  ];

  const flopRank = evaluateBestSevenCardHand([...playerHole, ...community]);

  return {
    phase: 'flop',
    deck,
    playerHole,
    dealerHole,
    community,
    ante,
    callBet: 0,
    outcome: null,
    payout: 0,
    playerRankName: flopRank.name,
    dealerRankName: 'Hidden',
    message: `Flop dealt (${flopRank.name}). Call $${(ante * 2).toLocaleString()} or Fold.`,
  };
}

export function foldPokerRound(state: PokerRoundState): PokerRoundState {
  if (state.phase !== 'flop') return state;
  return {
    ...state,
    phase: 'resolved',
    dealerHole: state.dealerHole.map((c) => ({ ...c, faceUp: true })),
    outcome: 'fold',
    payout: 0,
    message: 'You folded the hand. Ante forfeited.',
  };
}

export function callPokerRound(state: PokerRoundState): PokerRoundState {
  if (state.phase !== 'flop') return state;
  const deck = [...state.deck];
  const callBet = state.ante * 2;
  const community = [
    ...state.community,
    { ...deck.pop()!, faceUp: true },
    { ...deck.pop()!, faceUp: true },
  ];
  const dealerHole = state.dealerHole.map((c) => ({ ...c, faceUp: true }));

  const playerRank = evaluateBestSevenCardHand([...state.playerHole, ...community]);
  const dealerRank = evaluateBestSevenCardHand([...dealerHole, ...community]);

  const cmp = comparePokerRanks(playerRank, dealerRank);
  // Dealer qualifies with Pair of 4s or better
  const dealerQualifies =
    dealerRank.category >= 2 || (dealerRank.category === 1 && dealerRank.tiebreakers[0] >= 4);

  const anteBonusMult =
    playerRank.name === 'Royal Flush'
      ? 20
      : playerRank.name === 'Straight Flush'
        ? 10
        : playerRank.category === 7
          ? 6
          : playerRank.category === 6
            ? 3
            : playerRank.category === 5
              ? 2
              : 1;

  if (cmp > 0) {
    const anteWin = state.ante * (1 + anteBonusMult);
    const callReturn = dealerQualifies ? callBet * 2 : callBet;
    const payout = anteWin + callReturn;
    return {
      ...state,
      phase: 'resolved',
      deck,
      dealerHole,
      community,
      callBet,
      outcome: 'win',
      payout,
      playerRankName: playerRank.name,
      dealerRankName: dealerRank.name,
      message: dealerQualifies
        ? `Your ${playerRank.name} beats Dealer's ${dealerRank.name}! Won $${payout.toLocaleString()}.`
        : `Your ${playerRank.name} wins! Dealer failed to qualify — Ante paid, Call pushed ($${payout.toLocaleString()}).`,
    };
  }

  if (cmp === 0) {
    const payout = state.ante + callBet;
    return {
      ...state,
      phase: 'resolved',
      deck,
      dealerHole,
      community,
      callBet,
      outcome: 'push',
      payout,
      playerRankName: playerRank.name,
      dealerRankName: dealerRank.name,
      message: `Split pot (${playerRank.name}). Stakes returned.`,
    };
  }

  return {
    ...state,
    phase: 'resolved',
    deck,
    dealerHole,
    community,
    callBet,
    outcome: 'lose',
    payout: 0,
    playerRankName: playerRank.name,
    dealerRankName: dealerRank.name,
    message: `Dealer's ${dealerRank.name} beats your ${playerRank.name}.`,
  };
}
