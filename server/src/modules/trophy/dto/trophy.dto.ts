import { IsString, IsOptional } from 'class-validator';
import { TrophyTier } from '../../../common/constants/trophy-enums';

/**
 * Trophy System DTOs
 * For managing trophy definitions, unlocks, and case visualization
 */

/** Trophy global definition (unchanging) */
export interface TrophyDefinitionDto {
  id: string;
  code: string; // Unique identifier (e.g., 'FIRST_SUBJECT', 'PERFECT_SCORE')
  name: string;
  description: string;
  tier: TrophyTier; // BRONZE, SILVER, GOLD, PLATINUM
  icon: string; // URL to trophy icon
  rarity: number; // 1-100 (percentage of users who have it)
  criteria?: string; // Description of unlock logic
}

/** User's trophy state and progress */
export class TrophyDto implements TrophyDefinitionDto {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: TrophyTier;
  icon: string;
  rarity: number;
  criteria?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  metadata?: Record<string, unknown>;

  static fromEntity(
    trophy: { id: string; code: string; name: string; description?: string | null; tier: string; icon: string; rarity: number; criteria?: string | null },
    userStatus?: { unlockedAt?: Date | null; progress?: number | null }
  ): TrophyDto {
    const dto = new TrophyDto();
    dto.id = trophy.id;
    dto.code = trophy.code;
    dto.name = trophy.name;
    dto.description = trophy.description || '';
    dto.tier = trophy.tier as TrophyTier;
    dto.icon = trophy.icon;
    dto.rarity = trophy.rarity;
    dto.unlocked = !!userStatus?.unlockedAt;
    dto.unlockedAt = userStatus?.unlockedAt?.toISOString();
    dto.progress = userStatus?.progress || 0;
    dto.criteria = trophy.criteria || undefined;
    return dto;
  }
}

/** Check trophies request (manual trigger) */
export class CheckTrophiesDto {
  @IsOptional()
  @IsString()
  userId?: string; // If admin, can check for specific user
}

/** Trophy tier breakdown */
export interface TrophyTierBreakdownDto {
  tier: TrophyTier;
  unlocked: number;
  total: number;
  percentage: number; // 0-100
}

/** User's complete trophy case */
export interface TrophyCaseDto {
  totalTrophies: number;
  unlockedCount: number;
  unlockedPercentage: number; // 0-100
  byTier: {
    bronze: TrophyTierBreakdownDto;
    silver: TrophyTierBreakdownDto;
    gold: TrophyTierBreakdownDto;
    platinum: TrophyTierBreakdownDto;
  };
  trophies: TrophyDto[];
  recentlyUnlocked: TrophyDto[]; // Last 5 unlocked
}

/** Response from trophy check endpoint */
export interface TrophyCheckResultDto {
  newlyUnlocked: TrophyDto[]; // Trophies unlocked in this check
  totalUnlockedCount: number;
  nextAvailableTrophies: TrophyDto[]; // Closest to unlock (progress > 0)
}
