import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { isPassed } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';

@Injectable()
export class CountEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'FIRST_SUBJECT_COMPLETED',
        'TEN_SUBJECTS_PASSED',
        'ALL_OPTIONALS_COMPLETED',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const records = context.subjectRecords;
        const passedRecords = records.filter(isPassed);

        const completedSubjects = records.filter(
            (r) =>
                r.status === SubjectStatus.APROBADA ||
                r.status === SubjectStatus.REGULARIZADA ||
                r.status === SubjectStatus.EQUIVALENCIA,
        );

        switch (code) {
            case 'FIRST_SUBJECT_COMPLETED':
                return completedSubjects.length >= 1;
            case 'TEN_SUBJECTS_PASSED':
                return passedRecords.length >= 10;
            case 'ALL_OPTIONALS_COMPLETED':
                const optionals = records.filter((r) => r.subject.isOptional);
                const completedOptionals = optionals.filter(
                    (r) =>
                        r.status === SubjectStatus.APROBADA ||
                        r.status === SubjectStatus.REGULARIZADA ||
                        r.status === SubjectStatus.EQUIVALENCIA
                );
                return optionals.length > 0 && optionals.length === completedOptionals.length;
            default:
                return false;
        }
    }
}
