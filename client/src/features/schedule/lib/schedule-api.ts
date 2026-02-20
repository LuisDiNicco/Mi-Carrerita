import { authFetch } from "../../auth/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type TimePeriod =
    | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6'
    | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6'
    | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface TimetableDto {
    id: string;
    subjectId: string;
    subjectName: string;
    planCode: string;
    period: TimePeriod;
    dayOfWeek: DayOfWeek;
    dayLabel: string;
}

export interface CreateTimetableDto {
    subjectId: string;
    period: TimePeriod;
    dayOfWeek: DayOfWeek;
}

export interface ConflictDto {
    subject1Id: string;
    subject1Name: string;
    subject2Id: string;
    subject2Name: string;
    period: string;
    dayOfWeek: string;
    dayLabel: string;
}

export async function fetchTimetables(): Promise<TimetableDto[]> {
    const response = await authFetch(`${API_URL}/schedule/timetable`, {
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) throw new Error("Error fetching timetables");
    return response.json();
}

const DAY_TO_NUM: Record<DayOfWeek, number> = {
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
};

export async function createTimetable(dto: CreateTimetableDto): Promise<TimetableDto> {
    const payload = {
        subjectId: dto.subjectId,
        period: dto.period,
        dayOfWeek: DAY_TO_NUM[dto.dayOfWeek]
    };

    const response = await authFetch(`${API_URL}/schedule/timetable`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Error creating timetable");
    return response.json();
}

export async function deleteTimetable(subjectId: string): Promise<void> {
    const response = await authFetch(`${API_URL}/schedule/timetable/${subjectId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting timetable");
}

export async function checkConflicts(): Promise<ConflictDto[]> {
    const response = await authFetch(`${API_URL}/schedule/conflicts`, {
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) throw new Error("Error checking conflicts");
    return response.json();
}

export interface RecommendationResultDto {
    recommendedSubjects: any[]; // refine if needed
    conflicts: ConflictDto[];
    hasConflicts: boolean;
}

export async function fetchRecommendations(): Promise<RecommendationResultDto> {
    const response = await authFetch(`${API_URL}/schedule/recommendations`, {
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error("Error fetching recommendations");
    return response.json();
}
