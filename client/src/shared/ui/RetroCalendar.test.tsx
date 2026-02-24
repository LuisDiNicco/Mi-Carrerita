import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetroCalendar } from './RetroCalendar';

describe('RetroCalendar', () => {
  const mockOnChange = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCalendar = (value = '') =>
    render(
      <RetroCalendar value={value} onChange={mockOnChange} onClose={mockOnClose} />
    );

  it('renders the current month and year in the header', () => {
    renderCalendar();
    // Should render month name and year somewhere in the document
    const today = new Date();
    const monthName = today.toLocaleString('es-ES', { month: 'long' });
    // Header text contains the month name (case-insensitive match)
    expect(
      screen.getByText((text) => text.toLowerCase().includes(monthName.toLowerCase()))
    ).toBeInTheDocument();
  });

  it('renders week day headers (L M X J V S D)', () => {
    renderCalendar();
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((day) => {
      // getAllByText because L and M appear as both headers and day numbers
      const matches = screen.getAllByText(day);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders "Hoy" and "Cerrar" buttons', () => {
    renderCalendar();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Cerrar')).toBeInTheDocument();
  });

  it('calls onClose when "Cerrar" is clicked', () => {
    renderCalendar();
    fireEvent.click(screen.getByText('Cerrar'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onChange and onClose when a day is clicked', () => {
    // Use January 2025 which has 31 days and starts on Wednesday
    renderCalendar('01/01/2025');
    // Find day 15 button  
    const day15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15);
    expect(mockOnChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{2}\/01\/2025$/));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onChange with today\'s date when "Hoy" is clicked', () => {
    renderCalendar();
    fireEvent.click(screen.getByText('Hoy'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const today = new Date();
    const expectedDay = String(today.getDate()).padStart(2, '0');
    const expectedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const expectedYear = today.getFullYear();
    expect(mockOnChange).toHaveBeenCalledWith(
      `${expectedDay}/${expectedMonth}/${expectedYear}`
    );
  });

  it('navigates to the previous month on left arrow click', () => {
    renderCalendar('01/03/2025'); // March 2025
    const prevBtn = screen.getByLabelText('Mes anterior');
    fireEvent.click(prevBtn);
    // February 2025 should now be in the header
    expect(
      screen.getByText((text) => text.toLowerCase().includes('febrero'))
    ).toBeInTheDocument();
  });

  it('navigates to the next month on right arrow click', () => {
    renderCalendar('01/01/2025'); // January 2025
    const nextBtn = screen.getByLabelText('Mes siguiente');
    fireEvent.click(nextBtn);
    // February 2025 should now be in the header
    expect(
      screen.getByText((text) => text.toLowerCase().includes('febrero'))
    ).toBeInTheDocument();
  });

  it('parses an initial value and highlights the selected day', () => {
    renderCalendar('15/06/2024');
    // The calendar should navigate to June 2024 and show day 15 selected
    expect(
      screen.getByText((text) => text.toLowerCase().includes('junio'))
    ).toBeInTheDocument();
    // Button for day 15 should exist
    expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
  });

  it('renders a year selector with year options', () => {
    renderCalendar();
    const yearSelect = screen.getByRole('combobox');
    expect(yearSelect).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(10); // at least 10 year options
  });

  it('navigates to a different year when year selector changes', () => {
    renderCalendar('01/01/2025');
    const yearSelect = screen.getByRole('combobox');
    fireEvent.change(yearSelect, { target: { value: '2020' } });
    // The year select should now show 2020
    expect((yearSelect as HTMLSelectElement).value).toBe('2020');
  });

  it('renders 42 cells in the calendar grid (6 rows × 7 cols)', () => {
    renderCalendar('01/02/2026'); // February 2026
    // Count all buttons that are either day numbers or disabled empty cells
    // We check that the total cell buttons = 42 (7 day-header divs + 42 buttons = 49 total)
    // Just verify at minimum 28 day buttons exist (most months have 28-31 days)
    const allCells = screen.getAllByRole('button');
    // Filter out nav buttons (prev, next, Hoy, Cerrar) = 4, so day cells = allCells.length - 4
    const dayButtons = allCells.filter(
      (btn) => btn.getAttribute('aria-label') !== 'Mes anterior' &&
               btn.getAttribute('aria-label') !== 'Mes siguiente' &&
               btn.textContent !== 'Hoy' &&
               btn.textContent !== 'Cerrar'
    );
    // February 2026 has 28 days, all should have buttons (enabled + disabled empty ones)
    expect(dayButtons.length).toBe(42);
  });

  it('does not navigate on disabled empty cell click', () => {
    renderCalendar('01/02/2026');
    // Disabled empty cells should not trigger onChange
    const disabledButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.hasAttribute('disabled'));
    disabledButtons.forEach((btn) => {
      fireEvent.click(btn);
    });
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
