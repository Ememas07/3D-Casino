import test from 'node:test';
import assert from 'node:assert/strict';
import type { Card } from './blackjack';
import {
  callPokerRound,
  comparePokerRanks,
  dealPokerFlop,
  evaluateBestSevenCardHand,
  foldPokerRound,
} from './poker';

test('evaluateBestSevenCardHand detects Royal Flush and Full House over Flush', () => {
  const royal: Card[] = [
    { suit: 'spades', rank: 'A', faceUp: true },
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'spades', rank: 'Q', faceUp: true },
    { suit: 'spades', rank: 'J', faceUp: true },
    { suit: 'spades', rank: '10', faceUp: true },
    { suit: 'hearts', rank: '2', faceUp: true },
    { suit: 'clubs', rank: '7', faceUp: true },
  ];
  const r = evaluateBestSevenCardHand(royal);
  assert.equal(r.name, 'Royal Flush');
  assert.equal(r.category, 8);

  const fullHouse: Card[] = [
    { suit: 'hearts', rank: 'K', faceUp: true },
    { suit: 'spades', rank: 'K', faceUp: true },
    { suit: 'diamonds', rank: 'K', faceUp: true },
    { suit: 'clubs', rank: '9', faceUp: true },
    { suit: 'hearts', rank: '9', faceUp: true },
    { suit: 'hearts', rank: '4', faceUp: true },
    { suit: 'hearts', rank: '2', faceUp: true },
  ];
  const fh = evaluateBestSevenCardHand(fullHouse);
  assert.equal(fh.name, 'Full House');
  assert.ok(comparePokerRanks(r, fh) > 0);
});

test('dealPokerFlop deals 2 hole + 3 community cards and supports fold & call', () => {
  const flop = dealPokerFlop(50);
  assert.equal(flop.phase, 'flop');
  assert.equal(flop.playerHole.length, 2);
  assert.equal(flop.dealerHole.length, 2);
  assert.equal(flop.community.length, 3);

  const folded = foldPokerRound(flop);
  assert.equal(folded.phase, 'resolved');
  assert.equal(folded.outcome, 'fold');
  assert.equal(folded.payout, 0);

  const called = callPokerRound(flop);
  assert.equal(called.phase, 'resolved');
  assert.equal(called.community.length, 5);
  assert.equal(called.callBet, 100);
});
