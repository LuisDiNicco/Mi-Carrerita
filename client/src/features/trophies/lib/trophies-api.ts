import { authFetch } from "../../auth/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type TrophyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface TrophyDto {
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
}

export interface TrophyTierBreakdownDto {
    tier: TrophyTier;
    unlocked: number;
    total: number;
    percentage: number;
}

export interface TrophyCaseDto {
    totalTrophies: number;
    unlockedCount: number;
    unlockedPercentage: number;
    byTier: {
        bronze: TrophyTierBreakdownDto;
        silver: TrophyTierBreakdownDto;
        gold: TrophyTierBreakdownDto;
        platinum: TrophyTierBreakdownDto;
    };
    trophies: TrophyDto[];
    recentlyUnlocked: TrophyDto[];
}

export async function fetchTrophyCase(): Promise<TrophyCaseDto> {
    const response = await authFetch(`${API_URL}/trophies`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

export async function checkAndUnlockTrophies(): Promise<TrophyDto[]> {
    const response = await authFetch(`${API_URL}/trophies/check`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    // The backend might return TrophyCheckResultDto or TrophyDto[]?
    // Controller says Promise<TrophyDto[]>.
    // But checkAndUnlock method in service usually returns newly unlocked.
    return response.json();
}
