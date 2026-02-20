import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubjectUpdatePanel } from './SubjectUpdatePanel';
import { SubjectStatus } from '../../../shared/types/academic';
import type { Subject } from '../../../shared/types/academic';

describe('SubjectUpdatePanel', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    const mockPendingSubject: Subject = {
        id: 's1',
        planCode: 'MAT',
        name: 'Matematica',
        status: SubjectStatus.PENDIENTE,
        grade: null,
        difficulty: null,
        statusDate: null,
        notes: null,
        year: 1,
        hours: 96,
        correlativeIds: [],
        isIntermediateDegree: false,
    };

    const mockApprovedSubject: Subject = {
        ...mockPendingSubject,
        id: 's2',
        status: SubjectStatus.APROBADA,
        grade: 8,
        statusDate: '2023-12-10T00:00:00.000Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no debería renderizar si isOpen es falso', () => {
        render(
            <SubjectUpdatePanel
                subject={mockPendingSubject}
                isOpen={false}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );
        expect(screen.queryByText('Matematica')).not.toBeInTheDocument();
    });

    it('debería renderizar correctamente si isOpen es true', () => {
        render(
            <SubjectUpdatePanel
                subject={mockPendingSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );
        expect(screen.getByText('Matematica')).toBeInTheDocument();
        expect(screen.getByText('Código: MAT')).toBeInTheDocument();
    });

    it('debería mostrar alerta de Forzar Cambio si se intenta guardar desde PENDIENTE a otro estado', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockPendingSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Cambiamos el estado de PENDIENTE a EN_CURSO
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: SubjectStatus.EN_CURSO } });

        // Hacemos clic en Guardar
        const saveButton = screen.getByText('Guardar Cambios');
        fireEvent.click(saveButton);

        // Verificamos que se muestre la advertencia
        expect(await screen.findByText('¿Forzar Cambio?')).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();

        // Confirmamos forzar cambio
        const forceButton = screen.getByText('Forzar cambio');
        fireEvent.click(forceButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                status: SubjectStatus.EN_CURSO,
                grade: null,
                difficulty: null,
                statusDate: null,
                notes: null
            });
        });
    });

    it('debería autocompletar la nota a 2 al seleccionar RECURSADA', () => {
        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: SubjectStatus.RECURSADA } });

        const inputs = screen.getAllByRole('textbox');
        // The grade input should have value '2'
        expect((inputs[0] as HTMLInputElement).value).toBe('2');
    });

    it('debería arrojar error si se intenta guardar APROBADA sin nota', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockPendingSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Cambiar a APROBADA
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: SubjectStatus.APROBADA } });

        // Forzar guardado abrirá el prompt de "Forzar Cambio"
        const saveButton = screen.getByText('Guardar Cambios');
        fireEvent.click(saveButton);

        const forceButton = screen.getByText('Forzar cambio');
        fireEvent.click(forceButton);

        // Verificamos error en pantalla
        expect(await screen.findByText(/La nota es obligatoria para materias Aprobadas/)).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('debería guardar la fecha limpiando el timezone', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // mockApprovedSubject entered with 2023-12-10T00:00:00.000Z
        // Status Date input is the input[maxLength="10"]
        const inputs = screen.getAllByRole('textbox');
        const dateInput = inputs.find(i => (i as HTMLInputElement).maxLength === 10) as HTMLInputElement;
        expect(dateInput.value).toBe('2023-12-10');

        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                statusDate: '2023-12-10',
            }));
        });
    });
});
