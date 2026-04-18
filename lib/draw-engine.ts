// ── Draw Engine — Digital Heroes ────────────────────────────────
// Prize pool: 5-match 40% (jackpot/rollover), 4-match 35%, 3-match 25%

export type MatchType = '5' | '4' | '3' | 'none';

export interface DrawResult {
  winningNumbers: number[];
  matchedUsers: { userId: string; matchType: MatchType; numbers: number[] }[];
}

export interface PrizeDistribution {
  fiveMatch: number;   // 40%
  fourMatch: number;   // 35%
  threeMatch: number;  // 25%
  charity: number;     // from subscriptions
}

// ── Number Generation ────────────────────────────────────────────

/** Random lottery-style: 5 unique numbers 1–45 */
export function generateRandomNumbers(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5).sort((a, b) => a - b);
}

/**
 * Algorithmic: numbers weighted by how often they appear in
 * users' Stableford scores. Higher frequency = higher chance.
 */
export function generateAlgorithmicNumbers(
  scoreFrequency: Record<number, number>
): number[] {
  // Build weighted pool (1–45)
  const weightedPool: number[] = [];
  for (let n = 1; n <= 45; n++) {
    const freq = scoreFrequency[n] ?? 0;
    const weight = Math.max(1, freq + 1); // min weight 1
    for (let i = 0; i < weight; i++) weightedPool.push(n);
  }

  const chosen = new Set<number>();
  while (chosen.size < 5) {
    const idx = Math.floor(Math.random() * weightedPool.length);
    chosen.add(weightedPool[idx]);
  }
  return Array.from(chosen).sort((a, b) => a - b);
}

// ── Match Detection ──────────────────────────────────────────────

export function detectMatch(
  userNumbers: number[],
  winningNumbers: number[]
): MatchType {
  const winSet = new Set(winningNumbers);
  const matches = userNumbers.filter((n) => winSet.has(n)).length;
  if (matches >= 5) return '5';
  if (matches === 4) return '4';
  if (matches === 3) return '3';
  return 'none';
}

// ── Prize Pool Calculation ───────────────────────────────────────

export function calculatePrizePool(
  activeSubscribers: number,
  monthlyFeeInPence: number,
  poolFraction = 0.5 // 50% of subscription goes to prize pool
): number {
  return Math.floor(activeSubscribers * monthlyFeeInPence * poolFraction);
}

export function distributePrizes(
  totalPool: number,
  rolloverAmount = 0
): PrizeDistribution {
  const base = totalPool + rolloverAmount;
  return {
    fiveMatch: Math.floor(base * 0.4),
    fourMatch: Math.floor(base * 0.35),
    threeMatch: Math.floor(base * 0.25),
    charity: 0, // calculated separately from subscription %
  };
}

/** Split a tier's prize equally among all winners in that tier */
export function splitPrize(tierPool: number, winnerCount: number): number {
  if (winnerCount === 0) return 0;
  return Math.floor(tierPool / winnerCount);
}
