import { describe, it, expect } from 'vitest';
import {
    buildEdges,
    buildUnlockMap,
    getRecommendationsWithReasons,
    getSubjectsThatUnlockThesis,
} from './graph';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';

const createMockSubject = (id: string, planCode: string, year: number, status: SubjectStatus, correlativeIds: string[] = []): Subject => ({
    id,
    planCode,
    name: `Subject ${id} `,
    year,
    hours: 96,
    isOptional: false,
    correlativeIds,
    status,
    isIntermediateDegree: false,
    grade: null
});

describe('Graph Algorithms', () => {
    const subjects: Subject[] = [
        createMockSubject('1', 'MATH1', 1, SubjectStatus.APROBADA),
        createMockSubject('2', 'MATH2', 1, SubjectStatus.DISPONIBLE, ['MATH1']),
        createMockSubject('3', 'MATH3', 2, SubjectStatus.PENDIENTE, ['MATH2']),
        createMockSubject('4', 'ELEC1', 1, SubjectStatus.APROBADA),
        createMockSubject('5', 'ELEC2', 2, SubjectStatus.PENDIENTE, ['ELEC1', 'MATH2']),
        createMockSubject('6', 'THESIS', 5, SubjectStatus.PENDIENTE, ['MATH3', 'ELEC2'])
    ];
    subjects[5].name = 'Proyecto Final'; // Required for getSubjectsThatUnlockThesis

    it('buildEdges should correctly link dependencies', () => {
        const edges = buildEdges(subjects);
        expect(edges).toContainEqual({ from: '1', to: '2' });
        expect(edges).toContainEqual({ from: '2', to: '3' });
        expect(edges).toContainEqual({ from: '4', to: '5' });
        expect(edges).toContainEqual({ from: '2', to: '5' });
        expect(edges.length).toBe(6);
    });

    it('buildUnlockMap should count how many subjects each node unlocks', () => {
        const edges = buildEdges(subjects);
        const unlockMap = buildUnlockMap(edges);

        expect(unlockMap.get('1')).toBe(1); // unlocks MATH2
        expect(unlockMap.get('2')).toBe(2); // unlocks MATH3, ELEC2
        expect(unlockMap.get('4')).toBe(1); // unlocks ELEC2
    });

    it('getSubjectsThatUnlockThesis should identify thesis prerequisites', () => {
        const edges = buildEdges(subjects);
        const unlocksThesis = getSubjectsThatUnlockThesis(subjects, edges);

        expect(unlocksThesis.has('3')).toBe(true);
        expect(unlocksThesis.has('5')).toBe(true);
        expect(unlocksThesis.size).toBe(2);
    });

    it('getRecommendationsWithReasons should prioritize intermediate degree, thesis unlockers, and critical paths', () => {
        const customSubjects: Subject[] = [
            createMockSubject('1', 'S1', 1, SubjectStatus.APROBADA),
            createMockSubject('2', 'S2', 1, SubjectStatus.DISPONIBLE, ['S1']),
            { ...createMockSubject('3', 'S3', 2, SubjectStatus.DISPONIBLE, ['S1']), isIntermediateDegree: true },
            createMockSubject('4', 'S4', 2, SubjectStatus.DISPONIBLE, ['S1'])
        ];
        // Modifying S4 to unlock Proyecto Final
        customSubjects.push({ ...createMockSubject('5', 'Proyecto Final', 5, SubjectStatus.PENDIENTE, ['S4']), name: 'Proyecto Final' });

        const edges = buildEdges(customSubjects);
        const recommendations = getRecommendationsWithReasons(customSubjects, edges, 5);

        expect(recommendations.length).toBe(3); // S2, S3, S4 are available
        // S4 should be first because it unlocks 'Proyecto Final' (+80) and is Critical Path (+50)
        expect(recommendations[0].subject.id).toBe('4');
        expect(recommendations[0].reasons.some(r => r.includes('Proyecto Final'))).toBe(true);
        // S3 should be second because it gives an intermediate degree (+100)
        expect(recommendations[1].subject.id).toBe('3');
        expect(recommendations[1].reasons[0]).toContain('Título Intermedio');
    });

    it('getRecommendationsWithReasons should filter out subjects with unapproved requirements', () => {
        const edges = buildEdges(subjects);
        // MATH2 is available because MATH1 is approved.
        // MATH3 is NOT available because MATH2 is DISPONIBLE.
        // ELEC2 is NOT available because MATH2 is DISPONIBLE.
        const recommendations = getRecommendationsWithReasons(subjects, edges, 5);
        expect(recommendations.length).toBe(1);
        expect(recommendations[0].subject.id).toBe('2'); // only MATH2
    });
});
