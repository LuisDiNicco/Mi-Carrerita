import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGraphSearch } from './useGraphSearch';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
import { FOCUS_TIMEOUT_MS } from '../lib/graph-constants';

vi.useFakeTimers();

describe('useGraphSearch hook', () => {
    const mockSubjects: Subject[] = [
        { id: '1', name: 'Analisis I', planCode: 'MAT', status: SubjectStatus.PENDIENTE, year: 1, hours: 96, isOptional: false, correlativeIds: [], grade: null, isIntermediateDegree: false },
        { id: '2', name: 'Analisis II', planCode: 'MAT2', status: SubjectStatus.PENDIENTE, year: 2, hours: 96, isOptional: false, correlativeIds: ['1'], grade: null, isIntermediateDegree: false },
    ];

    const mockNodes = [
        { id: '1', position: { x: 100, y: 100 }, data: { subject: mockSubjects[0] } },
        { id: '2', position: { x: 200, y: 200 }, data: { subject: mockSubjects[1] } },
    ] as any;

    const mockSetFocusedId = vi.fn();
    const mockFlowInstance = {
        setCenter: vi.fn(),
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it('debería filtrar materias basado en el nombre y código', () => {
        const { result } = renderHook(() => useGraphSearch(mockSubjects, mockNodes, mockFlowInstance, mockSetFocusedId));

        act(() => {
            result.current.setSearchQuery('mate');
        });

        expect(result.current.searchResults).toHaveLength(2); // Matematica Discreta, Analisis Matematico

        act(() => {
            result.current.setSearchQuery('SYS102');
        });
        expect(result.current.searchResults).toHaveLength(1);
        expect(result.current.searchResults[0].id).toBe('2');
    });

    it('no debería buscar si el query es muy corto', () => {
        const { result } = renderHook(() => useGraphSearch(mockSubjects, mockNodes, mockFlowInstance, mockSetFocusedId));

        act(() => {
            result.current.setSearchQuery(''); // Less than SEARCH_MIN_CHARS (1)
        });

        expect(result.current.searchResults).toHaveLength(0);
    });

    it('maneja handleSelectSubject centrando el nodo y manejando el foco', () => {
        const { result } = renderHook(() => useGraphSearch(mockSubjects, mockNodes, mockFlowInstance, mockSetFocusedId));

        act(() => {
            result.current.setSearchQuery('mate');
            result.current.setSearchOpen(true);
        });

        act(() => {
            result.current.handleSelectSubject(mockSubjects[0]);
        });

        expect(mockFlowInstance.setCenter).toHaveBeenCalledWith(
            expect.any(Number), // x
            expect.any(Number), // y
            expect.objectContaining({ zoom: expect.any(Number), duration: 300 })
        );
        expect(mockSetFocusedId).toHaveBeenCalledWith('1');
        expect(result.current.searchQuery).toBe('');
        expect(result.current.searchOpen).toBe(false);

        // Advance timer to trigger timeout clear
        act(() => {
            vi.advanceTimersByTime(FOCUS_TIMEOUT_MS);
        });

        expect(mockSetFocusedId).toHaveBeenCalledWith(null);
    });

    it('limpia el timeout si el componente es desmontado', () => {
        const { result, unmount } = renderHook(() => useGraphSearch(mockSubjects, mockNodes, mockFlowInstance, mockSetFocusedId));

        act(() => {
            result.current.handleSelectSubject(mockSubjects[0]);
        });

        // Timeout is set now. Let's unmount before it triggers.
        unmount();

        act(() => {
            vi.advanceTimersByTime(FOCUS_TIMEOUT_MS);
        });

        // It should have been called ONCE (when handleSelectSubject was run), but NOT a second time with `null`.
        expect(mockSetFocusedId).toHaveBeenCalledTimes(1);
    });
});
