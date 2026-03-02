import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { checkHoursCompleted } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HoursEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'HOURS_100_COMPLETED',
        'HOURS_200_COMPLETED',
        'MARATHON_CHAMPION',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const records = context.subjectRecords;

        switch (code) {
            case 'HOURS_100_COMPLETED':
                return checkHoursCompleted(records, 100);
            case 'HOURS_200_COMPLETED':
                return checkHoursCompleted(records, 200);
            case 'MARATHON_CHAMPION':
                return checkHoursCompleted(records, 350);
            default:
                return false;
        }
    }
}
