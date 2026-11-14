import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createShoe,
  dealerResolve,
  dealBlackjackRound,
  evaluateHand,
  playerDouble,
  playerHit,
  type BlackjackRoundState,
  type Card,
} from './blackjack';

test('createShoe builds 6 full 52-card decks', () => {
  const shoe = createShoe(6);
  assert.equal(shoe.length, 312);
});

test('evaluateHand handles soft and hard Aces properly', () => {
  const soft18: Card[] = [
    { suit: 'spades', rank: 'A', faceUp: true },
    { suit: 'hearts', rank: '7', faceUp: true },
  ];
  assert.deepEqual(evaluateHand(soft18), {
    total: 18,
    isSoft: true,
    isBust: false,
    isBlackjack: false,
  });

  const hard18: Card[] = [
    { suit: 'spades', rank: 'A', faceUp: true },
    { suit: 'hearts', rank: '7', faceUp: true },
    { suit: 'clubs', rank: '10', faceUp: true },
  ];
  assert.deepEqual(evaluateHand(hard18), {
    total: 18,
    isSoft: false,
    isBust: false,
    isBlackjack: false,
  });
});

test('dealBlackjackRound detects natural blackjack 3:2 payout', () => {
  // pop() takes from the end of shoe: d1=last, d2=second-last, d3=third-last, d4=fourth-last
  const riggedShoe: Card[] = [
    ...createShoe(1),
    { suit: 'clubs', rank: '9', faceUp: true }, // d4 (dealer hole)
    { suit: 'spades', rank: 'K', faceUp: true }, // d3 (player 2)
    { suit: 'hearts', rank: '6', faceUp: true }, // d2 (dealer up)
    { suit: 'spades', rank: 'A', faceUp: true }, // d1 (player 1)
  ];

  const round = dealBlackjackRound(riggedShoe, 100);
  assert.equal(round.phase, 'resolved');
  assert.equal(round.outcome, 'blackjack');
  assert.equal(round.payout, 250);
});

test('playerHit busts when exceeding 21 and dealerResolve draws to 17', () => {
  const state: BlackjackRoundState = {
    phase: 'playerTurn',
    shoe: [
      ...createShoe(1),
      { suit: 'clubs', rank: '10', faceUp: true },
    ],
    playerHand: [
      { suit: 'spades', rank: '10', faceUp: true },
      { suit: 'hearts', rank: '6', faceUp: true },
    ],
    dealerHand: [
      { suit: 'diamonds', rank: '9', faceUp: true },
      { suit: 'clubs', rank: '7', faceUp: false },
    ],
    bet: 100,
    outcome: null,
    payout: 0,
    message: '',
  };

  const busted = playerHit(state);
  assert.equal(busted.phase, 'resolved');
  assert.equal(busted.outcome, 'bust');
  assert.equal(busted.payout, 0);

  const standState: BlackjackRoundState = {
    ...state,
    shoe: [
      ...createShoe(1),
      { suit: 'spades', rank: '5', faceUp: true },
    ],
    playerHand: [
      { suit: 'spades', rank: '10', faceUp: true },
      { suit: 'hearts', rank: '9', faceUp: true },
    ],
  };
  const resolved = dealerResolve(standState);
  assert.equal(resolved.phase, 'resolved');
  assert.equal(resolved.dealerHand.length, 3); // 9 + 7 = 16 -> draws 5 -> 21
  assert.equal(resolved.outcome, 'lose');
});

test('playerDouble doubles bet and resolves round', () => {
  const state: BlackjackRoundState = {
    phase: 'playerTurn',
    shoe: [
      ...createShoe(1),
      { suit: 'clubs', rank: '9', faceUp: true }, // player double card -> 20
    ],
    playerHand: [
      { suit: 'spades', rank: '6', faceUp: true },
      { suit: 'hearts', rank: '5', faceUp: true },
    ],
    dealerHand: [
      { suit: 'diamonds', rank: '10', faceUp: true },
      { suit: 'clubs', rank: '8', faceUp: false },
    ],
    bet: 50,
    outcome: null,
    payout: 0,
    message: '',
  };
  const doubled = playerDouble(state);
  assert.equal(doubled.phase, 'resolved');
  assert.equal(doubled.bet, 100);
  assert.equal(doubled.outcome, 'win');
  assert.equal(doubled.payout, 200);
});
