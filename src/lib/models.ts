export const MODELS = {
  fast: "claude-haiku-4-5-20251001" as const,
  accurate: "claude-sonnet-4-6" as const,
};

export const AUTO_APPROVE_THRESHOLD = 100_000; // ¥100,000
export const JAPAN_TAX_RATES = [0.08, 0.1] as const; // 8% reduced, 10% standard
