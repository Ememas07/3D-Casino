import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EUROPEAN_WHEEL_ORDER,
  evaluateRouletteBet,
  getPocketColor,
  getWheelAngleForNumber,
  settleRouletteSpin,
  type RouletteBet,
} from './roulette';

test('European wheel has 37 unique numbers 0..36', () => {
  assert.equal(EUROPEAN_WHEEL_ORDER.length, 37);
  assert.equal(new Set(EUROPEAN_WHEEL_ORDER).size, 37);
});

test('Pocket colors classify 0 as green and classic red/black numbers', () => {
  assert.equal(getPocketColor(0), 'green');
  assert.equal(getPocketColor(1), 'red');
  assert.equal(getPocketColor(17), 'black');
  assert.equal(getPocketColor(32), 'red');
});

test('Roulette bet payouts pay 35:1 straight, 2:1 dozen/column, 1:1 even money', () => {
  const bets: RouletteBet[] = [
    { id: '1', type: 'straight', number: 17, amount: 10, label: '#17' },
    { id: '2', type: 'black', amount: 50, label: 'Black' },
    { id: '3', type: 'dozen2', amount: 25, label: '2nd 12' },
    { id: '4', type: 'red', amount: 100, label: 'Red' },
  ];

  // 17 is black and in 2nd dozen (13..24)
  const result = settleRouletteSpin(bets, 17);
  assert.equal(result.totalWagered, 185);
  // 10*36 + 50*2 + 25*3 + 0 = 360 + 100 + 75 = 535
  assert.equal(result.totalReturn, 535);
  assert.equal(result.netProfit, 350);
  assert.equal(result.winningColor, 'black');
});

test('Zero house pocket clears non-straight outside bets', () => {
  const redBet: RouletteBet = { id: 'r', type: 'red', amount: 100, label: 'Red' };
  const evenBet: RouletteBet = { id: 'e', type: 'even', amount: 100, label: 'Even' };
  assert.equal(evaluateRouletteBet(redBet, 0), 0);
  assert.equal(evaluateRouletteBet(evenBet, 0), 0);
});

test('Wheel angle maps 0 to 0 radians and increments smoothly', () => {
  assert.equal(getWheelAngleForNumber(0), 0);
  assert.ok(getWheelAngleForNumber(32) > 0);
});
