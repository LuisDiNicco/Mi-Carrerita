import { TrophyEvaluationContext } from '../types/trophy.types';

export abstract class TrophyEvaluator {
    abstract readonly supportedCodes: string[];
    abstract evaluate(code: string, context: TrophyEvaluationContext): boolean;
}
