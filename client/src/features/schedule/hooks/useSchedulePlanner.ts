import { useState, useRef, useEffect, useMemo } from 'react';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';

export const PERIODS_4H: Array<{ key: TimePeriod; label: string; slotRange: string; durationHours: number }> = [
    { key: 'M1', label: '08:00 - 12:00 (Maé±ana)', slotRange: '08a12', durationHours: 4 },
    { key: 'T1', label: '14:00 - 18:00 (Tarde)', slotRange: '14a18', durationHours: 4 },
    { key: 'N1', label: '19:00 - 23:00 (Noche)', slotRange: '19a23', durationHours: 4 },
];

export type VisualRow = {
    id: string;
    period: TimePeriod;
    slotRange: string;
    durationHours: number;
    label: string;
    isCanonical: boolean;
};

interface UseSchedulePlannerProps {
    availability: Map<string, boolean>;
    timetables: TimetableDto[];
    offerEntries: TimetableDto[];
    onAvailabilityChange: (data: Map<string, boolean>) => void;
    onAddTimetable: (data: {
        subjectId: string;
        day: DayOfWeek;
        period: TimePeriod;
        slotRange?: string;
        durationHours?: number;
        commission?: string;
    }) => Promise<void>;
}

export function useSchedulePlanner({
    availability,
    timetables,
    offerEntries,
    onAvailabilityChange,
    onAddTimetable,
}: UseSchedulePlannerProps) {
    const [mode, setMode] = useState<'AVAILABILITY' | 'OPTIONS' | 'FINAL'>('AVAILABILITY');
    const [hoveredCell, setHoveredCell] = useState<string | null>(null);

    // Availability dragging state
    const isDragging = useRef(false);
    const dragMode = useRef<'add' | 'remove'>('add');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetCell, setTargetCell] = useState<{ day: DayOfWeek, period: TimePeriod, slotRange: string } | null>(null);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const normalizePeriod = (period: string) => {
        if (period.startsWith('M')) return 'M1';
        if (period.startsWith('T')) return 'T1';
        if (period.startsWith('N')) return 'N1';
        return period as TimePeriod;
    };

    const parseSlotRange = (slotRange?: string): { start: number; end: number } | null => {
        if (!slotRange) return null;
        const match = slotRange.match(/^(\d{2})a(\d{2})$/);
        if (!match) return null;

        const start = Number(match[1]);
        const end = Number(match[2]);
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;

        return { start, end };
    };

    const detectPeriodFromRange = (slotRange?: string): TimePeriod => {
        const parsed = parseSlotRange(slotRange);
        if (!parsed) return 'M1';
        if (parsed.start < 12) return 'M1';
        if (parsed.start < 19) return 'T1';
        return 'N1';
    };

    const formatRangeLabel = (slotRange: string) => {
        const parsed = parseSlotRange(slotRange);
        if (!parsed) return slotRange;
        return `${parsed.start.toString().padStart(2, '0')}:00 - ${parsed.end.toString().padStart(2, '0')}:00`;
    };

    const dynamicRows = useMemo<VisualRow[]>(() => {
        const canonicalRows: VisualRow[] = PERIODS_4H.map((period) => ({
            id: period.slotRange,
            period: period.key,
            slotRange: period.slotRange,
            durationHours: period.durationHours,
            label: period.label,
            isCanonical: true,
        }));

        const canonicalRangeSet = new Set(canonicalRows.map((row) => row.slotRange));
        const extraByRange = new Map<string, VisualRow>();

        for (const offer of offerEntries) {
            if (offer.isRemote || !offer.slotRange) continue;
            if (canonicalRangeSet.has(offer.slotRange)) continue;

            const parsed = parseSlotRange(offer.slotRange);
            if (!parsed) continue;

            if (!extraByRange.has(offer.slotRange)) {
                extraByRange.set(offer.slotRange, {
                    id: `range-${offer.slotRange}`,
                    period: detectPeriodFromRange(offer.slotRange),
                    slotRange: offer.slotRange,
                    durationHours: offer.durationHours ?? Math.max(1, parsed.end - parsed.start),
                    label: `${formatRangeLabel(offer.slotRange)} (Oferta)`,
                    isCanonical: false,
                });
            }
        }

        const allRows = [...canonicalRows, ...Array.from(extraByRange.values())];

        allRows.sort((left, right) => {
            const leftRange = parseSlotRange(left.slotRange);
            const rightRange = parseSlotRange(right.slotRange);
            const leftStart = leftRange?.start ?? 99;
            const rightStart = rightRange?.start ?? 99;
            if (leftStart !== rightStart) return leftStart - rightStart;

            const leftEnd = leftRange?.end ?? 99;
            const rightEnd = rightRange?.end ?? 99;
            return leftEnd - rightEnd;
        });

        return allRows;
    }, [offerEntries]);

    const rowsForMode = mode === 'AVAILABILITY'
        ? dynamicRows.filter((row) => row.isCanonical)
        : dynamicRows;

    const toggleAvailability = (day: string, periodKey: string) => {
        if (mode !== 'AVAILABILITY') return;
        const key = `${day}-${periodKey}`;

        const newMap = new Map(availability);
        if (dragMode.current === 'add') {
            newMap.set(key, true);
        } else {
            newMap.delete(key);
        }
        onAvailabilityChange(newMap);
    };

    const handleMouseDown = (day: string, periodKey: string) => {
        if (mode !== 'AVAILABILITY') return;
        isDragging.current = true;
        const key = `${day}-${periodKey}`;
        dragMode.current = availability.has(key) ? 'remove' : 'add';
        toggleAvailability(day, periodKey);
    };

    const handleMouseEnter = (day: string, periodKey: string) => {
        setHoveredCell(`${day}-${periodKey}`);
        if (mode === 'AVAILABILITY' && isDragging.current) {
            toggleAvailability(day, periodKey);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleCellClick = (day: DayOfWeek, period: TimePeriod, slotRange: string) => {
        if (mode !== 'OPTIONS') return;
        const offersForCell = getCellOffers(day, period, slotRange);
        if (offersForCell.length === 0) return;

        setTargetCell({ day, period, slotRange });
        setSelectedOfferId('');
        setIsModalOpen(true);
    };

    const getCellContent = (day: DayOfWeek, periodKey: string, slotRange: string) => {
        return timetables.find((t) => {
            if (t.dayOfWeek !== day) return false;
            if (normalizePeriod(t.period) !== periodKey) return false;
            const rowRange = slotRange || '';
            const timetableRange = t.slotRange || '';
            return rowRange === timetableRange;
        });
    };

    const getCellOffers = (day: DayOfWeek, periodKey: string, slotRange: string) => {
        return offerEntries.filter((offer) => {
            if (offer.isRemote) return false;
            if (offer.dayOfWeek !== day) return false;
            if (normalizePeriod(offer.period) !== periodKey) return false;
            const offerRange = offer.slotRange || '';
            return offerRange === slotRange;
        });
    };

    const confirmAddClass = async () => {
        if (!targetCell || !selectedOfferId) return;

        const selectedOffer = getCellOffers(targetCell.day, targetCell.period, targetCell.slotRange)
            .find((offer) => offer.id === selectedOfferId);
        if (!selectedOffer) return;

        try {
            await onAddTimetable({
                subjectId: selectedOffer.subjectId,
                day: targetCell.day,
                period: targetCell.period,
                slotRange: selectedOffer.slotRange,
                durationHours: selectedOffer.durationHours,
                commission: selectedOffer.commission,
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Conflict checking / saving error:", error);
            setIsModalOpen(false);
        }
    };

    const colorForSubject = (subjectId: string) => {
        const palette = [
            'bg-primary/20 border-primary/40 text-primary',
            'bg-emerald-500/20 border-emerald-500/40 text-emerald-100',
            'bg-violet-500/20 border-violet-500/40 text-violet-100',
            'bg-amber-500/20 border-amber-500/40 text-amber-100',
            'bg-pink-500/20 border-pink-500/40 text-pink-100',
            'bg-cyan-500/20 border-cyan-500/40 text-cyan-100',
        ];

        let hash = 0;
        for (let index = 0; index < subjectId.length; index += 1) {
            hash = ((hash << 5) - hash) + subjectId.charCodeAt(index);
            hash |= 0;
        }

        return palette[Math.abs(hash) % palette.length];
    };

    const filteredModalSubjects = targetCell
        ? getCellOffers(targetCell.day, targetCell.period, targetCell.slotRange).filter((offer) => {
            const query = searchQuery.toLowerCase();
            return offer.subjectName.toLowerCase().includes(query) || offer.planCode.toLowerCase().includes(query);
        })
        : [];

    return {
        mode,
        setMode,
        hoveredCell,
        isModalOpen,
        setIsModalOpen,
        targetCell,
        selectedOfferId,
        setSelectedOfferId,
        searchQuery,
        setSearchQuery,
        rowsForMode,
        handleMouseDown,
        handleMouseEnter,
        handleCellClick,
        confirmAddClass,
        getCellContent,
        getCellOffers,
        colorForSubject,
        filteredModalSubjects,
    };
}

