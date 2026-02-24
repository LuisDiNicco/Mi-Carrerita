import { useState, useEffect, useLayoutEffect, useRef, type ChangeEvent } from 'react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RetroCalendarProps {
  value: string; // DD/MM/YYYY format
  onChange: (date: string) => void; // Callback with DD/MM/YYYY format
  onClose: () => void;
}

/**
 * RetroCalendar: A pixelated, retro-styled date picker
 * Displays a month view with clickable days.
 * Returns selected date in DD/MM/YYYY format.
 */
export const RetroCalendar = ({ value, onChange, onClose }: RetroCalendarProps) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const calendarRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  // Position the calendar using fixed coordinates based on the trigger element's viewport rect.
  // This makes the popup immune to any parent overflow, scroll, or zoom level.
  useLayoutEffect(() => {
    const calendarEl = calendarRef.current;
    if (!calendarEl) return;

    const parent = calendarEl.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const calHeight = calendarEl.offsetHeight;
    const calWidth = calendarEl.offsetWidth;
    const gap = 6;

    const spaceBelow = window.innerHeight - parentRect.bottom;
    const spaceAbove = parentRect.top;

    // Pick the side with more space; prefer below when equal
    let top: number;
    if (spaceBelow >= calHeight + gap || spaceBelow >= spaceAbove) {
      top = parentRect.bottom + gap;
    } else {
      top = parentRect.top - calHeight - gap;
    }

    // Clamp vertically so the calendar never escapes the viewport
    top = Math.max(8, Math.min(top, window.innerHeight - calHeight - 8));

    // Align left edge with the parent, clamped horizontally
    let left = parentRect.left;
    if (left + calWidth > window.innerWidth - 8) {
      left = window.innerWidth - calWidth - 8;
    }
    left = Math.max(8, left);

    setFixedStyle({ position: 'fixed', top, left, visibility: 'visible' });
  }, []);

  // Parse the input value (DD/MM/YYYY) to set initial selection
  useEffect(() => {
    if (value && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number);
      setSelectedDay(day);
      setCurrentDate(new Date(year, month - 1));
    }
  }, [value]);

  // Calendar grid helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar grid (0=Sunday, but in Spanish 0=Monday)
  // JS getDay returns 0-6 where 0=Sunday, we need to adjust for Monday start
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const totalCells = 42;
  const calendarDays = Array.from({ length: totalCells }, (_, i) => {
    if (i < adjustedFirstDay) return null;
    const day = i - adjustedFirstDay + 1;
    return day > daysInMonth ? null : day;
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDay(null);
  };

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = Number(event.target.value);
    setCurrentDate(new Date(selectedYear, month, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // Format as DD/MM/YYYY
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    onChange(formattedDate);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    handleDayClick(today.getDate());
    setCurrentDate(today);
  };

  // Week day headers (Monday to Sunday)
  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div
      ref={calendarRef}
      style={fixedStyle}
      className="z-[10000] bg-surface border-2 border-app rounded-lg shadow-retro p-4 w-[22rem] animate-[fadeIn_0.2s_ease-out]"
    >
      {/* Header: Month & Year Navigation */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-app-border">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded hover:bg-elevated border border-transparent hover:border-app transition-all"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} className="text-app" />
        </button>

        <h2 className="font-retro font-bold text-app uppercase tracking-wider text-center flex-1">
          {monthName} <span className="text-sm">{year}</span>
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded hover:bg-elevated border border-transparent hover:border-app transition-all"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} className="text-app" />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Año</span>
        <select
          className="flex-1 bg-elevated border-2 border-app-border rounded px-2 py-1.5 text-sm text-app focus:border-unlam-500 outline-none"
          value={year}
          onChange={handleYearChange}
          aria-label="Seleccionar año"
        >
          {Array.from({ length: 70 }, (_, index) => currentYear + 5 - index).map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-muted uppercase tracking-widest h-6 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            onClick={() => day && handleDayClick(day)}
            disabled={!day}
            className={cn(
              'h-8 flex items-center justify-center rounded text-sm font-bold',
              'border-2 transition-all',
              'disabled:opacity-30 disabled:cursor-default disabled:border-transparent',
              day === selectedDay
                ? 'bg-unlam-500 border-unlam-800 text-[#0B2A14] shadow-subtle'
                : day
                  ? 'bg-elevated border-app-border hover:border-app hover:bg-surface cursor-pointer'
                  : 'border-transparent bg-transparent'
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Footer: Quick actions */}
      <div className="flex gap-2 pt-3 border-t-2 border-app-border">
        <button
          onClick={handleToday}
          className="flex-1 px-3 py-2 text-xs font-bold text-app bg-surface border-2 border-app rounded hover:bg-elevated transition-all text-center uppercase tracking-wider"
        >
          Hoy
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-3 py-2 text-xs font-bold text-muted bg-elevated border-2 border-app-border rounded hover:border-app hover:text-app transition-all text-center uppercase tracking-wider"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
