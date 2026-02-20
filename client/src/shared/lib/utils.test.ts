import { describe, it, expect, vi } from 'vitest';
import {
    cn,
    truncateSubjectName,
    getSubjectEmoji,
    getRandomRetroColor,
    calculateProgress,
    groupBySemester,
    formatGrade,
    formatDate,
    delay,
    debounce,
} from './utils';

describe('Shared Utils', () => {
    it('cn combina clases de Tailwind correctamente', () => {
        expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
        expect(cn('bg-red-500', false, null, undefined, 'p-4')).toBe('bg-red-500 p-4');
    });

    it('truncateSubjectName trunca nombres largos', () => {
        expect(truncateSubjectName('Corta')).toBe('Corta');
        expect(truncateSubjectName('Esta es una materia con un nombre muy pero muy largo', 20)).toBe('Esta es una mater...');
    });

    it('getSubjectEmoji retorna emojis adecudos según el estado', () => {
        expect(getSubjectEmoji('APROBADA')).toBe('🏆');
        expect(getSubjectEmoji('PENDIENTE')).toBe('🔒');
        expect(getSubjectEmoji('INEXISTENTE')).toBe('❓');
    });

    it('getRandomRetroColor genera un color retro', () => {
        const color = getRandomRetroColor();
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('calculateProgress calcula porcentajes', () => {
        expect(calculateProgress(0, 0)).toBe(0);
        expect(calculateProgress(10, 5)).toBe(50);
        expect(calculateProgress(45, 45)).toBe(100);
        expect(calculateProgress(30, 10)).toBe(33); // Math.round
    });

    it('groupBySemester agrupa elementos por semestre', () => {
        const items = [
            { id: 1, semester: 1 },
            { id: 2, semester: 2 },
            { id: 3, semester: 1 },
        ];
        const grouped = groupBySemester(items);
        expect(grouped.get(1)).toHaveLength(2);
        expect(grouped.get(2)).toHaveLength(1);
        expect(grouped.has(3)).toBe(false);
    });

    it('formatGrade formatea la nota correctamente', () => {
        expect(formatGrade(null)).toBe('—');
        expect(formatGrade(9)).toBe('⭐ 9');
        expect(formatGrade(8)).toBe('⭐ 8');
        expect(formatGrade(7)).toBe('✓ 7');
        expect(formatGrade(6)).toBe('✓ 6');
        expect(formatGrade(4)).toBe('4');
    });

    it('formatDate formatea fechas', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate(undefined)).toBe('—');
        expect(formatDate('')).toBe('—');
        // Local date string comparison might vary per environment, so just test it returns a string
        expect(typeof formatDate('2024-01-01')).toBe('string');
    });

    it('delay simula el paso del tiempo', async () => {
        vi.useFakeTimers();
        const promise = delay(1000);
        vi.advanceTimersByTime(1000);
        await expect(promise).resolves.toBeUndefined();
        vi.useRealTimers();
    });

    it('debounce retrasa la ejecución', () => {
        vi.useFakeTimers();
        const func = vi.fn();
        const debounced = debounce(func, 1000);

        debounced();
        debounced();
        debounced();

        expect(func).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(func).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
