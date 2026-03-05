import { useState, useMemo } from 'react';
import { buildEdges, getRecommendationsWithReasons } from '../../../shared/lib/graph';
import type { Subject } from '../../../shared/types/academic';
import type { TimetableDto } from '../../schedule/lib/schedule-api';

const DEFAULT_COUNT = 4;
export const MAX_COUNT = 15;

export function useRecommendations(subjects: Subject[], timetables: TimetableDto[]) {
    const [desiredCount, setDesiredCount] = useState(DEFAULT_COUNT);
    const [inputValue, setInputValue] = useState(String(DEFAULT_COUNT));
    const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [scoreInfoOpen, setScoreInfoOpen] = useState(false);

    const recommendations = useMemo(() => {
        const edges = buildEdges(subjects);
        return getRecommendationsWithReasons(
            subjects,
            edges,
            desiredCount,
            Array.from(excludedIds),
            timetables,
        );
    }, [subjects, desiredCount, excludedIds, timetables]);

    const recommendedIds = useMemo(() => new Set(recommendations.map(r => r.subject.id)), [recommendations]);

    const handleGeneratePlan = () => {
        const count = parseInt(inputValue, 10);
        if (!isNaN(count) && count > 0 && count <= MAX_COUNT) {
            setDesiredCount(count);
            setLockedIds(new Set());
            setExcludedIds(new Set());
        }
    };

    const handleToggleLock = (subjectId: string) => {
        setLockedIds((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) {
                next.delete(subjectId);
            } else {
                next.add(subjectId);
                setExcludedIds((excl) => {
                    const nextExcl = new Set(excl);
                    nextExcl.delete(subjectId);
                    return nextExcl;
                });
            }
            return next;
        });
    };

    const handleToggleExclude = (subjectId: string) => {
        setExcludedIds((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) {
                next.delete(subjectId);
            } else {
                next.add(subjectId);
                setLockedIds((locked) => {
                    const nextLocked = new Set(locked);
                    nextLocked.delete(subjectId);
                    return nextLocked;
                });
            }
            return next;
        });
    };

    const handleRecalculate = () => {
        const newExcluded = new Set(excludedIds);
        recommendations.forEach((rec) => {
            if (!lockedIds.has(rec.subject.id)) {
                newExcluded.add(rec.subject.id);
            }
        });
        setExcludedIds(newExcluded);
        setLockedIds(new Set());
    };

    return {
        desiredCount,
        setDesiredCount,
        inputValue,
        setInputValue,
        lockedIds,
        excludedIds,
        scoreInfoOpen,
        setScoreInfoOpen,
        recommendations,
        recommendedIds,
        handleGeneratePlan,
        handleToggleLock,
        handleToggleExclude,
        handleRecalculate,
    };
}

