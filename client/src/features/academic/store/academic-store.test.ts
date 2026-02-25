import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademicStore, recalculateAvailability } from './academic-store';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';

describe('useAcademicStore', () => {
    // s1: no correlatives → should become DISPONIBLE after recalculation
    // s2: correlative 'MAT' (s1's planCode) → DISPONIBLE only once s1 is passed
    const s1Base: Subject = {
        id: 's1',
        name: 'Math',
        planCode: 'MAT',
        status: SubjectStatus.PENDIENTE,
        grade: null,
        difficulty: 5,
        year: 1,
        hours: 96,
        correlativeIds: [],
        isIntermediateDegree: false,
        isOptional: false,
    };
    const s2Base: Subject = {
        id: 's2',
        name: 'Analisis II',
        planCode: 'MAT2',
        status: SubjectStatus.PENDIENTE,
        grade: null,
        difficulty: 6,
        year: 2,
        hours: 96,
        correlativeIds: ['MAT'],
        isIntermediateDegree: false,
        isOptional: false,
    };

    beforeEach(() => {
        useAcademicStore.setState({ subjects: [] });
        localStorage.clear();
        sessionStorage.clear();
    });

    it('debería inicializar con subjects vacios', () => {
        expect(useAcademicStore.getState().subjects.length).toBe(0);
    });

    it('setSubjects recalcula DISPONIBLE para materias sin correlativas', () => {
        useAcademicStore.getState().setSubjects([s1Base, s2Base]);
        const { subjects } = useAcademicStore.getState();
        // s1 has no correlatives → DISPONIBLE
        expect(subjects.find(s => s.id === 's1')?.status).toBe(SubjectStatus.DISPONIBLE);
        // s2 requires MAT (s1) which is not yet passed → PENDIENTE
        expect(subjects.find(s => s.id === 's2')?.status).toBe(SubjectStatus.PENDIENTE);
    });

    it('setSubjects persists to sessionStorage for guests (default getter = guest)', () => {
        useAcademicStore.getState().setSubjects([s1Base]);
        const stored = sessionStorage.getItem('mi-carrerita-academic-guest');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!) as Subject[];
        expect(parsed.find(s => s.id === 's1')?.status).toBe(SubjectStatus.DISPONIBLE);
    });

    it('setSubjectsFromServer sets subjects WITHOUT sessionStorage', () => {
        useAcademicStore.getState().setSubjectsFromServer([s1Base, s2Base]);
        expect(useAcademicStore.getState().subjects).toEqual([s1Base, s2Base]);
        // setSubjectsFromServer must NOT write to sessionStorage
        const stored = sessionStorage.getItem('mi-carrerita-academic-guest');
        expect(stored).toBeNull();
    });

    it('updateSubject applies partial patch and recalculates cascading availability', () => {
        useAcademicStore.getState().setSubjects([s1Base, s2Base]);

        // Approve s1 (Math) — s2 should become DISPONIBLE
        useAcademicStore.getState().updateSubject('s1', {
            status: SubjectStatus.APROBADA,
            grade: 8,
        });

        const { subjects } = useAcademicStore.getState();
        const math = subjects.find(s => s.id === 's1');
        const analisis = subjects.find(s => s.id === 's2');

        expect(math?.status).toBe(SubjectStatus.APROBADA);
        expect(math?.grade).toBe(8);
        expect(math?.planCode).toBe('MAT');

        // s2 was PENDIENTE; after s1 is APROBADA, its correlative 'MAT' is met
        expect(analisis?.status).toBe(SubjectStatus.DISPONIBLE);
    });

    it('clearSubjects empties memory and sessionStorage', () => {
        useAcademicStore.getState().setSubjects([s1Base]);
        useAcademicStore.getState().clearSubjects();
        expect(useAcademicStore.getState().subjects.length).toBe(0);
        expect(sessionStorage.getItem('mi-carrerita-academic-guest')).toBeNull();
    });
});

describe('recalculateAvailability', () => {
    it('marks subjects with no correlatives as DISPONIBLE', () => {
        const subjects: Subject[] = [{
            id: 's1', planCode: 'A', name: 'A', year: 1, hours: 64,
            status: SubjectStatus.PENDIENTE, grade: null,
            correlativeIds: [], isIntermediateDegree: false,
        }];
        const result = recalculateAvailability(subjects);
        expect(result[0].status).toBe(SubjectStatus.DISPONIBLE);
    });

    it('keeps PENDIENTE when correlative not yet passed', () => {
        const subjects: Subject[] = [
            {
                id: 's1', planCode: 'A', name: 'A', year: 1, hours: 64,
                status: SubjectStatus.PENDIENTE, grade: null,
                correlativeIds: [], isIntermediateDegree: false,
            },
            {
                id: 's2', planCode: 'B', name: 'B', year: 2, hours: 64,
                status: SubjectStatus.PENDIENTE, grade: null,
                correlativeIds: ['A'], isIntermediateDegree: false,
            },
        ];
        const result = recalculateAvailability(subjects);
        expect(result.find(s => s.id === 's2')?.status).toBe(SubjectStatus.PENDIENTE);
    });

    it('unlocks subject once correlative is REGULARIZADA', () => {
        const subjects: Subject[] = [
            {
                id: 's1', planCode: 'A', name: 'A', year: 1, hours: 64,
                status: SubjectStatus.REGULARIZADA, grade: null,
                correlativeIds: [], isIntermediateDegree: false,
            },
            {
                id: 's2', planCode: 'B', name: 'B', year: 2, hours: 64,
                status: SubjectStatus.PENDIENTE, grade: null,
                correlativeIds: ['A'], isIntermediateDegree: false,
            },
        ];
        const result = recalculateAvailability(subjects);
        expect(result.find(s => s.id === 's2')?.status).toBe(SubjectStatus.DISPONIBLE);
    });

    it('does not touch subjects that are already actioned', () => {
        const subjects: Subject[] = [{
            id: 's1', planCode: 'A', name: 'A', year: 1, hours: 64,
            status: SubjectStatus.EN_CURSO, grade: null,
            correlativeIds: [], isIntermediateDegree: false,
        }];
        const result = recalculateAvailability(subjects);
        expect(result[0].status).toBe(SubjectStatus.EN_CURSO);
    });
});

