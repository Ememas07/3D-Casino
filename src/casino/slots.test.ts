import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSlotGrid, SLOT_THEMES, spinSlots } from './slots';

test('All three slot themes have 18-stop strips and distinct bet/payline options', () => {
  assert.equal(SLOT_THEMES.classic.strip.length, 18);
  assert.equal(SLOT_THEMES.treasure.strip.length, 18);
  assert.equal(SLOT_THEMES.futuristic.strip.length, 18);
  assert.deepEqual(SLOT_THEMES.classic.paylineOptions, [1, 3]);
  assert.deepEqual(SLOT_THEMES.treasure.paylineOptions, [3, 5]);
  assert.deepEqual(SLOT_THEMES.futuristic.paylineOptions, [5]);
});

test('evaluateSlotGrid evaluates diagonal paylines and 2x wild Core on futuristic theme', () => {
  const grid: [
    ['MECH', 'STAR', 'BOLT'],
    ['STAR', 'CORE', 'CHIP'],
    ['BOLT', 'CHIP', 'MECH'],
  ] = [
    ['MECH', 'STAR', 'BOLT'],
    ['STAR', 'CORE', 'CHIP'],
    ['BOLT', 'CHIP', 'MECH'],
  ];
  // Diagonal Down: MECH - CORE(wild) - MECH -> 30x * 2(wild bonus) * $100 = $6,000
  // Diagonal Up: BOLT - CORE(wild) - BOLT -> 8x * 2(wild bonus) * $100 = $1,600
  const res = evaluateSlotGrid('futuristic', grid, 100, 5, 5000);
  assert.equal(res.winningLines.length, 2);
  assert.equal(res.winningLines[0].lineName, 'Diagonal Down');
  assert.equal(res.winningLines[1].lineName, 'Diagonal Up');
  assert.equal(res.totalPayout, 7600);
});

test('Classic triple SEVEN on center payline awards progressive jackpot and resets pool', () => {
  // index 8 in classic strip is SEVEN (8/18 = 0.45)
  const spin = spinSlots('classic', 25, 1, 5400, () => 0.45);
  assert.equal(spin.isJackpot, true);
  assert.ok(spin.totalPayout > 5400);
  assert.equal(spin.nextJackpotPool, 5000);
});
