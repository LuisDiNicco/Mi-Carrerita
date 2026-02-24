import { describe, it, expect } from 'vitest';
import {
    buildEdges,
    buildUnlockMap,
    getCriticalPath,
    getRecommendations,
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

    it('linear chain A->B->C: hovering A should mark B as full unlock, NOT C', () => {
        // Setup: linear dependency chain
        const chainSubjects: Subject[] = [
            createMockSubject('A', 'A', 1, SubjectStatus.APROBADA), // approved
            createMockSubject('B', 'B', 1, SubjectStatus.DISPONIBLE, ['A']), // requires only A
            createMockSubject('C', 'C', 2, SubjectStatus.PENDIENTE, ['B']), // requires only B
        ];
        
        const edges = buildEdges(chainSubjects);
        
        // Build maps like useCareerGraph does
        const parentMap = new Map<string, Set<string>>();
        const childMap = new Map<string, Set<string>>();
        
        chainSubjects.forEach(s => {
            parentMap.set(s.id, new Set());
            childMap.set(s.id, new Set());
        });
        
        edges.forEach(e => {
            parentMap.get(e.to)?.add(e.from);
            childMap.get(e.from)?.add(e.to);
        });
        
        // Simulate hover on A: should mark B as full unlock, NOT C
        const hoveredId = 'A';
        const directDependents = childMap.get(hoveredId) ?? new Set();
        
        expect(directDependents.has('B')).toBe(true);
        expect(directDependents.has('C')).toBe(false); // C is NOT direct dependent of A
        
        // B requires only A, so it's a full unlock
        const prereqsOfB = parentMap.get('B') ?? new Set();
        expect(prereqsOfB.size).toBe(1);
        expect(prereqsOfB.has('A')).toBe(true);
    });

    it('diamond dependency: A->C and B->C should mark C as partial unlock when hovering A (C requires both A and B)', () => {
        // Diamond: A and B both point to C
        const diamondSubjects: Subject[] = [
            createMockSubject('A', 'A', 1, SubjectStatus.APROBADA),
            createMockSubject('B', 'B', 1, SubjectStatus.DISPONIBLE),
            createMockSubject('C', 'C', 2, SubjectStatus.PENDIENTE, ['A', 'B']), // requires both A and B
        ];
        
        const edges = buildEdges(diamondSubjects);
        
        // Build maps
        const parentMap = new Map<string, Set<string>>();
        const childMap = new Map<string, Set<string>>();
        
        diamondSubjects.forEach(s => {
            parentMap.set(s.id, new Set());
            childMap.set(s.id, new Set());
        });
        
        edges.forEach(e => {
            parentMap.get(e.to)?.add(e.from);
            childMap.get(e.from)?.add(e.to);
        });
        
        // Hover on A
        const hoveredId = 'A';
        const directDependents = childMap.get(hoveredId) ?? new Set();
        
        expect(directDependents.has('C')).toBe(true);
        
        // C requires 2 prereqs (A and B), so it's partial unlock when hovering A
        const prereqsOfC = parentMap.get('C') ?? new Set();
        expect(prereqsOfC.size).toBe(2);
        expect(prereqsOfC.has('A')).toBe(true);
        expect(prereqsOfC.has('B')).toBe(true);
    });

    it('getRecommendationsWithReasons penalizes optional subjects', () => {
        const optionalSubjects: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.APROBADA),
            { ...createMockSubject('2', 'B', 2, SubjectStatus.DISPONIBLE, ['A']), isOptional: true },
            createMockSubject('3', 'C', 2, SubjectStatus.DISPONIBLE, ['A']),
        ];
        const edges = buildEdges(optionalSubjects);
        const recs = getRecommendationsWithReasons(optionalSubjects, edges, 5);
        // C should come before optional B
        expect(recs[0].subject.id).toBe('3');
        expect(recs[1].subject.id).toBe('2');
        expect(recs[1].reasons).toContain('⚠️ Materia Optativa (baja prioridad)');
    });

    it('getRecommendationsWithReasons promotes Proyecto Final when all scores are zero', () => {
        // Isolated subjects with no correlatives so no critical path / no unlocks → allScoresZero
        const lateSubjects: Subject[] = [
            { ...createMockSubject('2', 'PF', 5, SubjectStatus.DISPONIBLE), name: 'Proyecto Final' },
            { ...createMockSubject('3', 'OT', 5, SubjectStatus.DISPONIBLE), name: 'Otra Materia' },
        ];
        const edges = buildEdges(lateSubjects);
        const recs = getRecommendationsWithReasons(lateSubjects, edges, 5);
        // Proyecto Final should be first (bonus +200 when allScoresZero)
        expect(recs[0].subject.name).toBe('Proyecto Final');
        expect(recs[0].reasons).toContain('⭐ Proyecto Final');
    });

    it('getRecommendationsWithReasons promotes scheduled subjects when all scores are zero', () => {
        const lateSubjects: Subject[] = [
            { ...createMockSubject('2', 'BM', 5, SubjectStatus.DISPONIBLE), name: 'Mat B' },
            { ...createMockSubject('3', 'CM', 5, SubjectStatus.DISPONIBLE), name: 'Mat C' },
        ];
        const edges = buildEdges(lateSubjects);
        const timetables = [{ subjectId: '3' }]; // Mat C has a schedule
        const recs = getRecommendationsWithReasons(lateSubjects, edges, 5, [], timetables);
        // Mat C should be first because it has scheduled slots when allScoresZero
        expect(recs[0].subject.id).toBe('3');
        expect(recs[0].reasons).toContain('📅 Horario asignado');
    });

    it('getRecommendationsWithReasons returns empty when no subjects available', () => {
        const noAvailable: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.PENDIENTE),
        ];
        const edges = buildEdges(noAvailable);
        const recs = getRecommendationsWithReasons(noAvailable, edges, 5);
        expect(recs).toHaveLength(0);
    });

    it('getRecommendationsWithReasons respects excludeIds', () => {
        const simpleSubjects: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.APROBADA),
            createMockSubject('2', 'B', 1, SubjectStatus.DISPONIBLE, ['A']),
            createMockSubject('3', 'C', 1, SubjectStatus.DISPONIBLE, ['A']),
        ];
        const edges = buildEdges(simpleSubjects);
        const recs = getRecommendationsWithReasons(simpleSubjects, edges, 5, ['2']);
        expect(recs.some(r => r.subject.id === '2')).toBe(false);
        expect(recs.some(r => r.subject.id === '3')).toBe(true);
    });

    it('getRecommendationsWithReasons sorts by year when scores are tied', () => {
        // Two fully isolated DISPONIBLE subjects (no edges) → allScoresZero=true
        // After allScoresZero branch, neither is Proyecto Final and neither has a timetable
        // so both keep score=0 → sort falls through to year tiebreaker
        const tiedSubjects: Subject[] = [
            { ...createMockSubject('2', 'BM', 3, SubjectStatus.DISPONIBLE), name: 'Mat B' },
            { ...createMockSubject('3', 'CM', 1, SubjectStatus.DISPONIBLE), name: 'Mat C' },
        ];
        const edges = buildEdges(tiedSubjects); // no edges (no correlativeIds)
        const recs = getRecommendationsWithReasons(tiedSubjects, edges, 5);
        // Both have score=0 after allScoresZero processing → sorted by year ascending
        // Mat C (year=1) should come before Mat B (year=3)
        const ids = recs.map(r => r.subject.id);
        expect(ids.indexOf('3')).toBeLessThan(ids.indexOf('2'));
    });

    it('getCriticalPath returns empty sets when no subjects', () => {
        const result = getCriticalPath([], []);
        expect(result.nodeIds.size).toBe(0);
        expect(result.edgeIds.size).toBe(0);
    });

    it('getCriticalPath handles disconnected graph (break branch)', () => {
        // A graph with two disconnected components: A and B-C chain
        // The critical path from C can reach B but can't go further (A is disconnected)
        const subjects: Subject[] = [
            createMockSubject('a', 'A', 1, SubjectStatus.APROBADA),
            createMockSubject('b', 'B', 1, SubjectStatus.DISPONIBLE),
            createMockSubject('c', 'C', 2, SubjectStatus.PENDIENTE, ['B']),
        ];
        const edges = buildEdges(subjects);
        // C depends on B, A is isolated
        const result = getCriticalPath(subjects, edges);
        // Critical path should include c (deepest terminal node) and b
        expect(result.nodeIds.has('c')).toBe(true);
    });

    it('getRecommendations (simple) filters available and returns top N', () => {
        const subjects: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.APROBADA),
            createMockSubject('2', 'B', 1, SubjectStatus.DISPONIBLE, ['A']),
            createMockSubject('3', 'C', 2, SubjectStatus.PENDIENTE, ['B']),
            createMockSubject('4', 'D', 1, SubjectStatus.DISPONIBLE, ['A']),
        ];
        const edges = buildEdges(subjects);
        const recs = getRecommendations(subjects, edges, 1);
        // Only 1 result out of 2 available (B and D)
        expect(recs.length).toBe(1);
    });

    it('getRecommendations (simple) returns empty when nothing available', () => {
        const subjects: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.PENDIENTE),
        ];
        const edges = buildEdges(subjects);
        const recs = getRecommendations(subjects, edges, 5);
        expect(recs).toHaveLength(0);
    });

    it('getRecommendations (simple) prioritizes critical path subjects', () => {
        const subjects: Subject[] = [
            createMockSubject('1', 'A', 1, SubjectStatus.APROBADA),
            createMockSubject('2', 'B', 1, SubjectStatus.DISPONIBLE, ['A']),
            createMockSubject('3', 'C', 2, SubjectStatus.PENDIENTE, ['B']),
            createMockSubject('4', 'D', 1, SubjectStatus.DISPONIBLE, ['A']),
        ];
        const edges = buildEdges(subjects);
        const recs = getRecommendations(subjects, edges, 2);
        // B leads to C (longer chain), should score higher
        expect(recs[0].id).toBe('2');
    });
});
