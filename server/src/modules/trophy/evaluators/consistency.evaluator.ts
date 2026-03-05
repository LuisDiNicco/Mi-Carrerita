import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { groupBySemester, isPassed } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsistencyEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'CONSISTENCY_BRONZE',
        'CONSISTENCY_SILVER',
        'CONSISTENCY_GOLD',
        'QUICK_PROGRESS',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const records = context.subjectRecords;

        switch (code) {
            case 'CONSISTENCY_BRONZE':
                return this.checkConsistency(context, 4);
            case 'CONSISTENCY_SILVER':
                return this.checkConsistency(context, 8);
            case 'CONSISTENCY_GOLD':
                return this.checkConsistency(context, 12);
            case 'QUICK_PROGRESS':
                return this.checkQuickProgress(context);
            default:
                return false;
        }
    }

    private checkConsistency(context: TrophyEvaluationContext, minSemesters: number): boolean {
        const semesterGroups = groupBySemester(context.subjectRecords);
        let count = 0;
        for (const semesterRecords of semesterGroups.values()) {
            if (semesterRecords.some((r) => isPassed(r))) {
                count += 1;
            }
        }
        return count >= minSemesters;
    }

    private checkQuickProgress(context: TrophyEvaluationContext): boolean {
        const semesterGroups = groupBySemester(context.subjectRecords);
        for (const semesterRecords of semesterGroups.values()) {
            const completedHours = semesterRecords
                .filter((r) => isPassed(r))
                .reduce((sum, r) => sum + (r.subject.hours || 0), 0);
            if (completedHours >= 15) {
                return true;
            }
        }
        return false;
    }
}
