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

    it('debería mostrar fecha en formato DD/MM/YYYY y guardar en ISO', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // The input should now show DD/MM/YYYY (the new user-facing format)
        // mockApprovedSubject has statusDate: '2023-12-10T00:00:00.000Z'
        // fromISODate('2023-12-10') → '10/12/2023'
        const inputs = screen.getAllByRole('textbox');
        const dateInput = inputs.find(i => (i as HTMLInputElement).maxLength === 10) as HTMLInputElement;
        expect(dateInput.value).toBe('10/12/2023');

        fireEvent.click(screen.getByText('Guardar Cambios'));

        // The API call should receive ISO format '2023-12-10'
        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                statusDate: '2023-12-10',
            }));
        });
    });

    it('debería cerrar la confirmación al hacer clic en Regresar', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockPendingSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: SubjectStatus.EN_CURSO } });

        const saveButton = screen.getByText('Guardar Cambios');
        fireEvent.click(saveButton);

        // Confirm dialog is open
        expect(await screen.findByText('¿Forzar Cambio?')).toBeInTheDocument();

        // Click Regresar
        const regresoButton = screen.getByText('Regresar');
        fireEvent.click(regresoButton);

        // Dialog should close, showing the form again
        await waitFor(() => {
            expect(screen.queryByText('¿Forzar Cambio?')).not.toBeInTheDocument();
        });
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('debería arrojar error si la nota ingresada no es un número válido', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Change grade to invalid value via textbox
        const inputs = screen.getAllByRole('textbox');
        const gradeInput = inputs[0] as HTMLInputElement;
        fireEvent.change(gradeInput, { target: { value: '15' } }); // out of 1-10

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(await screen.findByText(/La nota debe ser un número entre 1 y 10/)).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('debería arrojar error si la dificultad está fuera de rango', async () => {
        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        // Set valid grade (required) and invalid difficulty
        const inputs = screen.getAllByRole('textbox');
        const gradeInput = inputs[0];
        fireEvent.change(gradeInput, { target: { value: '8' } });

        const difficultyInput = screen.getByRole('spinbutton');
        fireEvent.change(difficultyInput, { target: { value: '150' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(await screen.findByText(/La dificultad debe ser un número entre 1 y 100/)).toBeInTheDocument();
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('debería mostrar error si onSave lanza una excepción', async () => {
        const errorMessage = 'Error de red al guardar';
        mockOnSave.mockRejectedValueOnce(new Error(errorMessage));

        render(
            <SubjectUpdatePanel
                subject={mockApprovedSubject}
                isOpen={true}
                onClose={mockOnClose}
                onSave={mockOnSave}
            />
        );

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(await screen.findByText(errorMessage)).toBeInTheDocument();
    });
});
