export const MODELS = {
  fast: "gpt-4o-mini" as const,
  accurate: "gpt-4o" as const,
};

export const AUTO_APPROVE_THRESHOLD = 100_000; // ¥100,000
export const JAPAN_TAX_RATES = [0.08, 0.1] as const; // 8% reduced, 10% standard
