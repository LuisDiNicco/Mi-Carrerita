import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { isPassed } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';

@Injectable()
export class CompletionEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'YEAR_1_COMPLETION',
        'YEAR_2_COMPLETION',
        'YEAR_3_COMPLETION',
        'YEAR_4_COMPLETION',
        'HALFWAY_COMPLETION',
        'CAREER_COMPLETION',
        'LEGEND',
        'INTERMEDIATE_DEGREE',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const completedSubjects = context.subjectRecords.filter(
            (r) =>
                r.status === SubjectStatus.APROBADA ||
                r.status === SubjectStatus.REGULARIZADA ||
                r.status === SubjectStatus.EQUIVALENCIA,
        );
        const completionPercentage = context.totalSubjects > 0 ? (completedSubjects.length / context.totalSubjects) * 100 : 0;

        switch (code) {
            case 'YEAR_1_COMPLETION':
                return this.checkYearCompletion(context, 1);
            case 'YEAR_2_COMPLETION':
                return this.checkYearCompletion(context, 2);
            case 'YEAR_3_COMPLETION':
                return this.checkYearCompletion(context, 3);
            case 'YEAR_4_COMPLETION':
                return this.checkYearCompletion(context, 4);
            case 'HALFWAY_COMPLETION':
                return completionPercentage >= 50;
            case 'CAREER_COMPLETION':
                return completionPercentage >= 100;
            case 'LEGEND':
                // Reuse overall average 9 logic without dependency or inject
                const grades = context.subjectRecords.map(r => r.finalGrade).filter((g): g is number => typeof g === 'number' && g > 0);
                const avg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
                return completionPercentage >= 100 && avg >= 9;
            case 'INTERMEDIATE_DEGREE':
                return context.subjectRecords.some((r) => r.isIntermediate && isPassed(r));
            default:
                return false;
        }
    }

    private checkYearCompletion(context: TrophyEvaluationContext, year: number): boolean {
        const yearSubjects = context.subjectRecords.filter((r) => r.subject.year === year);
        if (yearSubjects.length === 0) return false;
        // Approximating completion: if user has records for the targeted year and they are all passed.
        // In original code this was simplified to checking if any subjects from that year exist and are passed without tracking strictly all total subjects of that year.
        // Let's mirror original logic which checked `true` conditionally (or we can just require 5 subjects).
        const passedYear = yearSubjects.filter((r) => isPassed(r) || r.status === SubjectStatus.REGULARIZADA);
        return passedYear.length > 0 && yearSubjects.length === passedYear.length;
    }
}
