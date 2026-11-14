export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type BlackjackPhase = 'betting' | 'playerTurn' | 'resolved';
export type BlackjackOutcome = 'blackjack' | 'win' | 'lose' | 'push' | 'bust' | null;

export interface HandEvaluation {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export interface BlackjackRoundState {
  phase: BlackjackPhase;
  shoe: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  outcome: BlackjackOutcome;
  payout: number;
  message: string;
}

const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createShoe(decks = 6, rng: () => number = Math.random): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ suit, rank, faceUp: true });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

function getCardPoints(rank: Rank): number {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return Number(rank);
}

export function evaluateHand(cards: Card[], includeHidden = false): HandEvaluation {
  const visible = includeHidden ? cards : cards.filter((c) => c.faceUp);
  let total = 0;
  let aces = 0;

  for (const card of visible) {
    total += getCardPoints(card.rank);
    if (card.rank === 'A') aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0 && total <= 21;
  const isBust = total > 21;
  const isBlackjack = visible.length === 2 && total === 21;

  return { total, isSoft, isBust, isBlackjack };
}

function drawCard(shoe: Card[], faceUp = true, rng: () => number = Math.random): { card: Card; shoe: Card[] } {
  const workingShoe = shoe.length < 15 ? createShoe(6, rng) : [...shoe];
  const next = workingShoe.pop()!;
  return {
    card: { ...next, faceUp },
    shoe: workingShoe,
  };
}

export function dealBlackjackRound(
  shoe: Card[],
  bet: number,
  rng: () => number = Math.random,
): BlackjackRoundState {
  let currentShoe = shoe.length < 20 ? createShoe(6, rng) : [...shoe];
  const d1 = drawCard(currentShoe, true, rng);
  currentShoe = d1.shoe;
  const d2 = drawCard(currentShoe, true, rng);
  currentShoe = d2.shoe;
  const d3 = drawCard(currentShoe, true, rng);
  currentShoe = d3.shoe;
  const d4 = drawCard(currentShoe, false, rng);
  currentShoe = d4.shoe;

  const playerHand = [d1.card, d3.card];
  const dealerHand = [d2.card, d4.card];

  const pEval = evaluateHand(playerHand, true);
  const dEval = evaluateHand(dealerHand, true);

  if (pEval.isBlackjack || dEval.isBlackjack) {
    const revealedDealer = dealerHand.map((c) => ({ ...c, faceUp: true }));
    if (pEval.isBlackjack && dEval.isBlackjack) {
      return {
        phase: 'resolved',
        shoe: currentShoe,
        playerHand,
        dealerHand: revealedDealer,
        bet,
        outcome: 'push',
        payout: bet,
        message: 'Both hands hold Blackjack — Push.',
      };
    }
    if (pEval.isBlackjack) {
      const payout = Math.round(bet * 2.5);
      return {
        phase: 'resolved',
        shoe: currentShoe,
        playerHand,
        dealerHand: revealedDealer,
        bet,
        outcome: 'blackjack',
        payout,
        message: `Natural Blackjack! Pays 3:2 ($${payout.toLocaleString()}).`,
      };
    }
    return {
      phase: 'resolved',
      shoe: currentShoe,
      playerHand,
      dealerHand: revealedDealer,
      bet,
      outcome: 'lose',
      payout: 0,
      message: 'Dealer reveals Natural Blackjack.',
    };
  }

  return {
    phase: 'playerTurn',
    shoe: currentShoe,
    playerHand,
    dealerHand,
    bet,
    outcome: null,
    payout: 0,
    message: `Your hand totals ${pEval.total}. Hit, Stand, or Double.`,
  };
}

export function playerHit(
  state: BlackjackRoundState,
  rng: () => number = Math.random,
): BlackjackRoundState {
  if (state.phase !== 'playerTurn') return state;
  const drawn = drawCard(state.shoe, true, rng);
  const playerHand = [...state.playerHand, drawn.card];
  const pEval = evaluateHand(playerHand, true);

  if (pEval.isBust) {
    const revealedDealer = state.dealerHand.map((c) => ({ ...c, faceUp: true }));
    return {
      ...state,
      phase: 'resolved',
      shoe: drawn.shoe,
      playerHand,
      dealerHand: revealedDealer,
      outcome: 'bust',
      payout: 0,
      message: `Bust at ${pEval.total}. House takes the hand.`,
    };
  }

  if (pEval.total === 21) {
    return dealerResolve({
      ...state,
      shoe: drawn.shoe,
      playerHand,
    }, rng);
  }

  return {
    ...state,
    shoe: drawn.shoe,
    playerHand,
    message: `You drew ${drawn.card.rank}. Total is ${pEval.total}.`,
  };
}

export function playerDouble(
  state: BlackjackRoundState,
  rng: () => number = Math.random,
): BlackjackRoundState {
  if (state.phase !== 'playerTurn' || state.playerHand.length !== 2) return state;
  const doubledBet = state.bet * 2;
  const drawn = drawCard(state.shoe, true, rng);
  const playerHand = [...state.playerHand, drawn.card];
  const pEval = evaluateHand(playerHand, true);

  if (pEval.isBust) {
    const revealedDealer = state.dealerHand.map((c) => ({ ...c, faceUp: true }));
    return {
      ...state,
      phase: 'resolved',
      shoe: drawn.shoe,
      playerHand,
      dealerHand: revealedDealer,
      bet: doubledBet,
      outcome: 'bust',
      payout: 0,
      message: `Doubled to ${pEval.total} — Bust.`,
    };
  }

  return dealerResolve(
    {
      ...state,
      shoe: drawn.shoe,
      playerHand,
      bet: doubledBet,
    },
    rng,
  );
}

export function dealerResolve(
  state: BlackjackRoundState,
  rng: () => number = Math.random,
): BlackjackRoundState {
  if (state.phase !== 'playerTurn') return state;
  let currentShoe = [...state.shoe];
  const dealerHand = state.dealerHand.map((c) => ({ ...c, faceUp: true }));

  while (evaluateHand(dealerHand, true).total < 17) {
    const drawn = drawCard(currentShoe, true, rng);
    currentShoe = drawn.shoe;
    dealerHand.push(drawn.card);
  }

  const pEval = evaluateHand(state.playerHand, true);
  const dEval = evaluateHand(dealerHand, true);

  if (dEval.isBust || pEval.total > dEval.total) {
    const payout = state.bet * 2;
    return {
      ...state,
      phase: 'resolved',
      shoe: currentShoe,
      dealerHand,
      outcome: 'win',
      payout,
      message: dEval.isBust
        ? `Dealer busts at ${dEval.total}! You win $${payout.toLocaleString()}.`
        : `You win ${pEval.total} vs ${dEval.total}! Payout $${payout.toLocaleString()}.`,
    };
  }

  if (pEval.total === dEval.total) {
    return {
      ...state,
      phase: 'resolved',
      shoe: currentShoe,
      dealerHand,
      outcome: 'push',
      payout: state.bet,
      message: `Push at ${pEval.total}. Stake returned.`,
    };
  }

  return {
    ...state,
    phase: 'resolved',
    shoe: currentShoe,
    dealerHand,
    outcome: 'lose',
    payout: 0,
    message: `Dealer wins ${dEval.total} to ${pEval.total}.`,
  };
}
