import { describe, it, expect, beforeEach } from 'vitest';
import { useAcademicStore } from './academic-store';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';

describe('useAcademicStore', () => {
    const initialSubjects: Subject[] = [
        {
            id: 's1',
            name: 'Math',
            planCode: 'MAT',
            status: SubjectStatus.PENDIENTE,
            grade: null,
            difficulty: 5,
            year: 2,
            hours: 96,
            correlativeIds: [],
            isIntermediateDegree: false,
            isOptional: false,
        },
        {
            id: 's2',
            name: 'Analisis II',
            planCode: 'MAT2',
            status: SubjectStatus.APROBADA,
            grade: 8,
            difficulty: 6,
            year: 3,
            hours: 96,
            correlativeIds: ['1'],
            isIntermediateDegree: false,
            isOptional: false,
        }
    ];

    beforeEach(() => {
        // Clear the store before each test
        useAcademicStore.setState({ subjects: [] });
    });

    it('debería inicializar con subjects vacios', () => {
        expect(useAcademicStore.getState().subjects.length).toBe(0);
    });

    it('setSubjects debería establecer la lista de materias', () => {
        useAcademicStore.getState().setSubjects(initialSubjects);
        expect(useAcademicStore.getState().subjects).toEqual(initialSubjects);
    });

    it('updateSubject debería actualizar los campos parciales de una materia', () => {
        useAcademicStore.getState().setSubjects(initialSubjects);

        // Act
        useAcademicStore.getState().updateSubject('s1', {
            status: SubjectStatus.APROBADA,
            grade: 100,
        });

        // Assert
        const storeSubjects = useAcademicStore.getState().subjects;
        const math = storeSubjects.find(s => s.id === 's1');
        const phy = storeSubjects.find(s => s.id === 's2');

        expect(math?.status).toBe(SubjectStatus.APROBADA);
        expect(math?.grade).toBe(100);
        // Other fields must remain intact
        expect(math?.planCode).toBe('MAT');
        // Other subjects must be unmodified
        expect(phy?.status).toBe(SubjectStatus.APROBADA);
        expect(phy?.grade).toBe(8);
    });
});
