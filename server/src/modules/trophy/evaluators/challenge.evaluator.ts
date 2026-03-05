import { TrophyEvaluator } from './base.evaluator';
import { TrophyEvaluationContext } from '../types/trophy.types';
import { isPassed } from '../helpers/evaluator-helpers';
import { Injectable } from '@nestjs/common';
import { SubjectStatus } from '../../../common/constants/academic-enums';
import { AcademicRecordWithSubject } from '../types/trophy.types';

@Injectable()
export class ChallengeEvaluator implements TrophyEvaluator {
    readonly supportedCodes = [
        'MIXED_STATUS_PASS',
        'SUMMER_WARRIOR',
        'DIFFICULT_SUBJECT_PASSED',
        'DIFFICULTY_RESEARCHER',
        'HIGH_DIFFICULTY_MASTERY',
        'CHALLENGE_ACCEPTED',
        'DIVERSIFIED_YEARS',
        'ALL_ENGLISH_COMPLETED',
    ];

    evaluate(code: string, context: TrophyEvaluationContext): boolean {
        const records = context.subjectRecords;
        const passedRecords = records.filter(isPassed);

        switch (code) {
            case 'MIXED_STATUS_PASS':
                return this.checkMixedStatus(records);
            case 'SUMMER_WARRIOR':
                return this.checkSummerWarrior(records);
            case 'DIFFICULT_SUBJECT_PASSED':
                return passedRecords.some((r) => (r.difficulty ?? 0) >= 80);
            case 'DIFFICULTY_RESEARCHER':
                return records.filter((r) => r.difficulty !== null && r.difficulty !== undefined).length >= 5;
            case 'HIGH_DIFFICULTY_MASTERY':
                return passedRecords.filter((r) => (r.difficulty ?? 0) >= 70).length >= 5;
            case 'CHALLENGE_ACCEPTED':
                return passedRecords.filter((r) => (r.difficulty ?? 0) >= 70).length >= 10;
            case 'DIVERSIFIED_YEARS':
                return new Set(passedRecords.map((r) => r.subject.year)).size >= 4;
            case 'ALL_ENGLISH_COMPLETED':
                return this.checkAllEnglishCompleted(records);
            default:
                return false;
        }
    }

    private checkMixedStatus(records: AcademicRecordWithSubject[]): boolean {
        const hasRegularized = records.some((r) => r.status === SubjectStatus.REGULARIZADA);
        const hasFinal = records.some((r) => r.status === SubjectStatus.APROBADA);
        return hasRegularized && hasFinal;
    }

    private checkSummerWarrior(records: AcademicRecordWithSubject[]): boolean {
        return records.some((r) => {
            if (!isPassed(r) || !r.statusDate) return false;
            const month = new Date(r.statusDate).getMonth() + 1;
            return month === 12 || month === 1 || month === 2;
        });
    }

    private checkAllEnglishCompleted(records: AcademicRecordWithSubject[]): boolean {
        const ENGLISH_CODES = ['901', '902', '903', '904'];
        return ENGLISH_CODES.every((code) =>
            records.some((r) => r.subject.planCode === code && isPassed(r)),
        );
    }
}
