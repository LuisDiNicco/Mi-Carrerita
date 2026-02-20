import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CareerGraph } from './CareerGraph';
import * as academicApi from '../lib/academic-api';
import * as authApi from '../../auth/lib/api';
import { useAcademicStore } from '../store/academic-store';
import { SubjectStatus } from '../../../shared/types/academic';

// Mock dependencies
vi.mock('../lib/academic-api', () => ({
    fetchAcademicGraph: vi.fn(),
}));

vi.mock('../../auth/lib/api', () => ({
    authFetch: vi.fn(),
}));

/**
 * Partial mock for @xyflow/react
 * Providing a simple wrapper for ReactFlow component to render its children 
 * and custom nodes/controls to maintain JSDOM stability without real SVG measures.
 */
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
        ReactFlow: (props: any) => {
            return (
                <div data-testid="react-flow-mock">
                    {props.nodes.map((n: any) => (
                        <div key={n.id} data-testid={`node-${n.id}`} onDoubleClick={(e) => {
                            if (props.onNodeDoubleClick) {
                                props.onNodeDoubleClick(e, n);
                            }
                        }}>
                            {n.data.subject.name} - {n.data.subject.status}
                        </div>
                    ))}
                    {props.children}
                </div>
            );
        },
        Panel: ({ children }: any) => <div>{children}</div>,
        Background: () => <div />,
        Controls: () => <div />,
        MiniMap: () => <div />,
    };
});

describe('CareerGraph Integration Flow', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        useAcademicStore.setState({ subjects: [] });
    });

    it('Flujo E2E Integrado: Carga materias, abre panel, edita estado, intercepta patch localmente', async () => {

        const mockData = [
            { id: '1', name: 'Analisis I', planCode: 'MAT', status: SubjectStatus.PENDIENTE, year: 1, hours: 96, isOptional: false, correlativeIds: [] }
        ];

        (academicApi.fetchAcademicGraph as any).mockResolvedValue(mockData);

        render(<CareerGraph progress={0} stats={{ total: 1, approved: 0, inProgress: 0, available: 1 }} />);

        // 1. Initial Load: Should fetch graph
        expect(screen.getByText(/CARGANDO CARRERITA/i)).toBeInTheDocument();

        await screen.findByTestId('react-flow-mock', {}, { timeout: 3000 });
        const nodeEl = await screen.findByTestId('node-1');

        // Check if Zustand store was correctly populated
        expect(useAcademicStore.getState().subjects).toHaveLength(1);

        expect(academicApi.fetchAcademicGraph).toHaveBeenCalledTimes(1);

        expect(nodeEl).toBeInTheDocument();
        expect(nodeEl).toHaveTextContent('Analisis I');
        expect(nodeEl).toHaveTextContent('PENDIENTE');

        // We double-click the Subject node to open the SubjectUpdatePanel
        await act(async () => {
            const freshNode = screen.getByTestId('node-1');
            fireEvent.doubleClick(freshNode);
        });

        // Verify Panel is open by checking document.body
        await waitFor(() => {
            expect(document.body.textContent).toContain('Detalles');
        }, { timeout: 3000 });

        // 3. User updates Subject status to APROBADA
        const statusSelect = screen.getByLabelText(/Estado/i);
        await act(async () => {
            fireEvent.change(statusSelect, { target: { value: SubjectStatus.APROBADA } });
        });

        // 4. Fill Grade, required for APROBADA
        const gradeInput = screen.getByPlaceholderText(/Ej: 8/i);
        await act(async () => {
            fireEvent.change(gradeInput, { target: { value: '9' } });
        });

        // 5. Submit Changes
        (authApi.authFetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        const saveButton = screen.getByRole('button', { name: /Guardar Cambios/i });

        await act(async () => {
            fireEvent.click(saveButton);
        });

        // 6. Confirm prompt
        const confirmButton = screen.getByRole('button', { name: /Forzar cambio/i });
        await act(async () => {
            fireEvent.click(confirmButton);
        });

        // Wait for the async API call simulated internally
        await act(async () => {
            // API will resolve
            await new Promise((r) => setTimeout(r, 0));
        });

        expect(authApi.authFetch).toHaveBeenCalledTimes(1);
        expect(authApi.authFetch).toHaveBeenCalledWith(
            expect.stringContaining('/academic-career/subjects/1'),
            expect.objectContaining({
                method: 'PATCH'
            })
        );

        // After success, it fetches the graph silently again
        expect(academicApi.fetchAcademicGraph).toHaveBeenCalledTimes(2);
    });
});
