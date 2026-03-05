import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { checkOverallAverage, groupBySemester, semesterIndex } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AverageEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'PERFECT_SCORE_10',
        'AVERAGE_80_OVERALL',
        'SEMESTER_AVERAGE_NINE',
        'EXCELLENCE_85_PLUS',
        'GROWING_AVERAGE',
        'PERFECT_AVERAGE',
        'CONSISTENT_EXCELLENCE',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const records = context.subjectRecords;

        switch (code) {
            case 'PERFECT_SCORE_10':
                return records.some((r) => r.finalGrade === 10);
            case 'AVERAGE_80_OVERALL':
                return checkOverallAverage(records, 8);
            case 'EXCELLENCE_85_PLUS':
                return checkOverallAverage(records, 8.5);
            case 'PERFECT_AVERAGE':
                return checkOverallAverage(records, 9);
            case 'SEMESTER_AVERAGE_NINE':
                return this.checkSemesterAverageThreshold(context, 9);
            case 'GROWING_AVERAGE':
                return this.checkGrowingAverage(context, 3);
            case 'CONSISTENT_EXCELLENCE':
                return this.checkConsistentExcellence(context);
            default:
                return false;
        }
    }

    private checkSemesterAverageThreshold(context: TrophyEvaluationContext, threshold: number): boolean {
        const semesterGroups = groupBySemester(context.subjectRecords);
        for (const semesterRecords of semesterGroups.values()) {
            const grades = semesterRecords
                .map((r) => r.finalGrade)
                .filter((grade): grade is number => typeof grade === 'number');
            if (grades.length === 0) continue;
            const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
            if (average >= threshold) return true;
        }
        return false;
    }

    private checkGrowingAverage(context: TrophyEvaluationContext, minConsecutive: number): boolean {
        const semesterGroups = groupBySemester(context.subjectRecords);
        const sorted = Array.from(semesterGroups.entries())
            .map(([key, recs]) => ({
                index: semesterIndex(key),
                avg: (() => {
                    const grades = recs
                        .map((r) => r.finalGrade)
                        .filter((g): g is number => typeof g === 'number' && g > 0);
                    return grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
                })(),
            }))
            .filter((s) => s.avg !== null)
            .sort((a, b) => a.index - b.index);

        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].avg! > sorted[i - 1].avg!) {
                streak++;
                if (streak >= minConsecutive) return true;
            } else {
                streak = 1;
            }
        }
        return false;
    }

    private checkConsistentExcellence(context: TrophyEvaluationContext): boolean {
        const semesterGroups = groupBySemester(context.subjectRecords);
        const semesterAverages: number[] = [];
        for (const semesterRecords of semesterGroups.values()) {
            const grades = semesterRecords
                .map((r) => r.finalGrade)
                .filter((grade): grade is number => typeof grade === 'number' && grade > 0);
            if (grades.length === 0) continue;
            const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
            semesterAverages.push(average);
        }
        if (semesterAverages.length === 0) return false;
        const excellentCount = semesterAverages.filter((avg) => avg >= 8.5).length;
        return excellentCount / semesterAverages.length >= 0.8;
    }
}
