// Trophy tier levels
export enum TrophyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// Trophy tier weights (for ranking/rarity)
export const TROPHY_TIER_WEIGHTS: Record<TrophyTier, number> = {
  [TrophyTier.BRONZE]: 1,
  [TrophyTier.SILVER]: 3,
  [TrophyTier.GOLD]: 6,
  [TrophyTier.PLATINUM]: 10,
};

export function isTrophyTier(value: string): value is TrophyTier {
  return Object.values(TrophyTier).includes(value as TrophyTier);
}
