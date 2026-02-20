import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCareerGraph } from './useCareerGraph';
import * as academicApi from '../lib/academic-api';
import * as authApi from '../../auth/lib/api';
import { SubjectStatus } from '../../../shared/types/academic';
import { useAcademicStore } from '../store/academic-store';

vi.mock('../lib/academic-api', () => ({
    fetchAcademicGraph: vi.fn(),
}));

vi.mock('../../auth/lib/api', () => ({
    authFetch: vi.fn(),
}));

// Mock Xyflow to avoid ResizeObserver/DOM issues in JSDOM
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    const react = await import('react');
    return {
        ...actual,
        useNodesState: (initial: any) => {
            const [nodes, setNodes] = react.useState(initial);
            const onNodesChange = react.useCallback(() => { }, []);
            return [nodes, setNodes, onNodesChange];
        },
        useEdgesState: (initial: any) => {
            const [edges, setEdges] = react.useState(initial);
            const onEdgesChange = react.useCallback(() => { }, []);
            return [edges, setEdges, onEdgesChange];
        },
    };
});

describe('useCareerGraph hook', () => {
    const mockSubject = {
        id: 's1',
        planCode: 'MAT',
        name: 'Matematica',
        status: SubjectStatus.PENDIENTE,
        year: 1,
        hours: 96,
        isOptional: false,
        correlativeIds: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAcademicStore.setState({ subjects: [] });
    });

    it('debería inicializar cargando y fetchear los datos de la API', async () => {
        (academicApi.fetchAcademicGraph as any).mockResolvedValue([mockSubject]);

        const { result } = renderHook(() => useCareerGraph());

        expect(result.current.loading).toBe(true);

        // Wait for the async fetch to finish inside useEffect
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(academicApi.fetchAcademicGraph).toHaveBeenCalled();
        expect(result.current.loading).toBe(false);
        expect(result.current.nodes.length).toBe(1);
        expect(result.current.nodes[0].id).toBe('s1');
        expect(result.current.error).toBeNull();
    });

    it('debería manejar errores de red y desactivar el loading', async () => {
        (academicApi.fetchAcademicGraph as any).mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useCareerGraph());

        expect(result.current.loading).toBe(true);

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network Error');
        expect(result.current.nodes.length).toBe(0);
    });

    it('handleSaveSubject debería enviar la petición y recargar el grafo silenciosamente', async () => {
        (academicApi.fetchAcademicGraph as any).mockResolvedValue([mockSubject]);

        // Simulate successful JSON response
        (authApi.authFetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        const { result } = renderHook(() => useCareerGraph());

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 10)); // wait fetch
        });

        // Simulate setting active subject before saving
        act(() => {
            result.current.setActiveSubject(mockSubject as any);
        });

        const payload = {
            status: SubjectStatus.APROBADA,
            grade: 10,
            difficulty: null,
            statusDate: null,
            notes: null,
        };

        await act(async () => {
            await result.current.handleSaveSubject(payload);
        });

        expect(authApi.authFetch).toHaveBeenCalledWith(
            expect.stringContaining('/academic-career/subjects/s1'),
            expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify(payload)
            })
        );

        // Should fetch graph again but silent
        expect(academicApi.fetchAcademicGraph).toHaveBeenCalledTimes(2);
    });
});
