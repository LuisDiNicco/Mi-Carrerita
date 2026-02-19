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
export interface TrophyDto extends TrophyDefinitionDto {
  unlocked: boolean;
  unlockedAt?: string; // ISO date string
  progress: number; // 0-100 (%)
  metadata?: Record<string, unknown>; // Custom data per trophy (subjects, grades, etc.)
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
