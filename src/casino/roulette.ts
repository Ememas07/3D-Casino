export const EUROPEAN_WHEEL_ORDER: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

export const RED_NUMBERS = new Set<number>([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type PocketColor = 'green' | 'red' | 'black';

export type RouletteBetType =
  | 'straight'
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'col1'
  | 'col2'
  | 'col3';

export interface RouletteBet {
  id: string;
  type: RouletteBetType;
  number?: number;
  amount: number;
  label: string;
}

export interface RouletteSettlement {
  winningNumber: number;
  winningColor: PocketColor;
  totalWagered: number;
  totalReturn: number;
  netProfit: number;
}

export function getPocketColor(n: number): PocketColor {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

export function getWheelAngleForNumber(n: number): number {
  const idx = EUROPEAN_WHEEL_ORDER.indexOf(n);
  const safeIdx = idx === -1 ? 0 : idx;
  return (safeIdx / EUROPEAN_WHEEL_ORDER.length) * Math.PI * 2;
}

export function evaluateRouletteBet(bet: RouletteBet, winningNumber: number): number {
  if (bet.amount <= 0) return 0;
  const color = getPocketColor(winningNumber);

  switch (bet.type) {
    case 'straight':
      return bet.number === winningNumber ? bet.amount * 36 : 0;
    case 'red':
      return color === 'red' ? bet.amount * 2 : 0;
    case 'black':
      return color === 'black' ? bet.amount * 2 : 0;
    case 'even':
      return winningNumber !== 0 && winningNumber % 2 === 0 ? bet.amount * 2 : 0;
    case 'odd':
      return winningNumber !== 0 && winningNumber % 2 === 1 ? bet.amount * 2 : 0;
    case 'low':
      return winningNumber >= 1 && winningNumber <= 18 ? bet.amount * 2 : 0;
    case 'high':
      return winningNumber >= 19 && winningNumber <= 36 ? bet.amount * 2 : 0;
    case 'dozen1':
      return winningNumber >= 1 && winningNumber <= 12 ? bet.amount * 3 : 0;
    case 'dozen2':
      return winningNumber >= 13 && winningNumber <= 24 ? bet.amount * 3 : 0;
    case 'dozen3':
      return winningNumber >= 25 && winningNumber <= 36 ? bet.amount * 3 : 0;
    case 'col1':
      return winningNumber !== 0 && winningNumber % 3 === 1 ? bet.amount * 3 : 0;
    case 'col2':
      return winningNumber !== 0 && winningNumber % 3 === 2 ? bet.amount * 3 : 0;
    case 'col3':
      return winningNumber !== 0 && winningNumber % 3 === 0 ? bet.amount * 3 : 0;
    default:
      return 0;
  }
}

export function settleRouletteSpin(
  bets: RouletteBet[],
  winningNumber: number,
): RouletteSettlement {
  const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0);
  const totalReturn = bets.reduce((sum, b) => sum + evaluateRouletteBet(b, winningNumber), 0);
  return {
    winningNumber,
    winningColor: getPocketColor(winningNumber),
    totalWagered,
    totalReturn,
    netProfit: totalReturn - totalWagered,
  };
}

export function spinRouletteNumber(rng: () => number = Math.random): number {
  const idx = Math.floor(rng() * EUROPEAN_WHEEL_ORDER.length);
  return EUROPEAN_WHEEL_ORDER[Math.min(EUROPEAN_WHEEL_ORDER.length - 1, Math.max(0, idx))];
}
