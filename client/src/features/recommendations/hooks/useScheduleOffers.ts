import { useState, useRef, useEffect } from 'react';
import type { TimetableDto, TimePeriod, DayOfWeek, ParsedTimetableOffer } from '../../schedule/lib/schedule-api';
import { fetchTimetables, uploadOfertaPdf } from '../../schedule/lib/schedule-api';
import { fetchAcademicGraph } from '../../academic/lib/academic-api';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
import { useAcademicStore } from '../../academic/store/academic-store';

export const DAYS_FOR_MANUAL: { key: DayOfWeek; label: string }[] = [
    { key: 'MONDAY', label: 'Lunes' },
    { key: 'TUESDAY', label: 'Martes' },
    { key: 'WEDNESDAY', label: 'Miércoles' },
    { key: 'THURSDAY', label: 'Jueves' },
    { key: 'FRIDAY', label: 'Viernes' },
    { key: 'SATURDAY', label: 'Sábado' },
];

export const PERIODS_FOR_MANUAL: { key: TimePeriod; label: string }[] = [
    { key: 'M1', label: 'Maé±ana (08:00 - 12:00)' },
    { key: 'T1', label: 'Tarde (14:00 - 18:00)' },
    { key: 'N1', label: 'Noche (19:00 - 23:00)' },
];

const OFFER_DAY_TO_WEEK: Record<string, DayOfWeek> = {
    Lunes: 'MONDAY',
    Martes: 'TUESDAY',
    Miércoles: 'WEDNESDAY',
    Jueves: 'THURSDAY',
    Viernes: 'FRIDAY',
    Sábado: 'SATURDAY',
};

const OFFER_PERIOD_TO_SLOT: Record<string, TimePeriod> = {
    'Maé±ana': 'M1',
    'Tarde': 'T1',
    'Noche': 'N1',
};

export function useScheduleOffers(subjects: Subject[]) {
    const setSubjects = useAcademicStore((state: any) => state.setSubjects);

    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [inlineMessage, setInlineMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    const [timetables, setTimetables] = useState<TimetableDto[]>([]);
    const [offerEntries, setOfferEntries] = useState<TimetableDto[]>([]);
    const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());

    const ofertaFileRef = useRef<HTMLInputElement>(null);
    const [isUploadingOferta, setIsUploadingOferta] = useState(false);
    const [ofertaData, setOfertaData] = useState<ParsedTimetableOffer[]>([]);
    const [ofertaMessage, setOfertaMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Manual schedule state
    const [manualSubjectId, setManualSubjectId] = useState('');
    const [manualDay, setManualDay] = useState<DayOfWeek>('MONDAY');
    const [manualPeriod, setManualPeriod] = useState<TimePeriod>('M1');

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            try {
                setIsLoading(true);
                setLoadError(null);

                let graphFromApi: Subject[] | null = null;
                if (subjects.length === 0) {
                    graphFromApi = await fetchAcademicGraph();
                }
                const timetablesFromApi = await fetchTimetables();

                if (!active) return;
                if (graphFromApi) setSubjects(graphFromApi);

                const storedTimetables = localStorage.getItem('user_timetables');
                if (storedTimetables) {
                    try {
                        setTimetables(JSON.parse(storedTimetables));
                    } catch (e) {
                        setTimetables(timetablesFromApi);
                    }
                } else {
                    setTimetables(timetablesFromApi);
                }

                const storedAvail = localStorage.getItem('user_availability');
                if (storedAvail) {
                    try {
                        setAvailability(new Map(JSON.parse(storedAvail)));
                    } catch (e) { }
                }

                const storedOferta = localStorage.getItem('oferta_materias');
                if (storedOferta) {
                    try {
                        const parsedOffers = JSON.parse(storedOferta) as ParsedTimetableOffer[];
                        setOfertaData(parsedOffers);
                        const storedOfferEntries = localStorage.getItem('offer_entries');
                        if (storedOfferEntries) {
                            setOfferEntries(JSON.parse(storedOfferEntries));
                        } else {
                            const builtEntries = buildTimetablesFromOferta(parsedOffers);
                            setOfferEntries(builtEntries);
                            localStorage.setItem('offer_entries', JSON.stringify(builtEntries));
                        }
                    } catch (e) { }
                }

                const storedOfferEntries = localStorage.getItem('offer_entries');
                if (!storedOferta && storedOfferEntries) {
                    try {
                        setOfferEntries(JSON.parse(storedOfferEntries));
                    } catch (e) { }
                }

            } catch (err) {
                if (!active) return;
                const message = err instanceof Error ? err.message : 'Error al cargar datos.';
                setLoadError(message);
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadData();
        return () => { active = false; };
    }, [setSubjects, subjects.length]);

    const handleAvailabilityChange = (newMap: Map<string, boolean>) => {
        setAvailability(newMap);
        localStorage.setItem('user_availability', JSON.stringify(Array.from(newMap.entries())));
    };

    const saveTimetablesLocal = (updated: TimetableDto[]) => {
        setTimetables(updated);
        localStorage.setItem('user_timetables', JSON.stringify(updated));
    };

    const saveOfferEntriesLocal = (updated: TimetableDto[]) => {
        setOfferEntries(updated);
        localStorage.setItem('offer_entries', JSON.stringify(updated));
    };

    const normalizePlanCode = (code: string) => code.replace(/^0+/, '') || '0';

    const parseOfferMeta = (offer: ParsedTimetableOffer): { slotRange: string; durationHours: number; isRemote: boolean } => {
        const daysRaw = offer.days?.trim() || '';
        if (daysRaw.toLowerCase() === 'a distancia') {
            return { slotRange: 'A distancia', durationHours: 0, isRemote: true };
        }
        const range = daysRaw.match(/(\d{2}a\d{2})$/)?.[1]
            ?? (offer.periodLabel === 'Maé±ana' ? '08a12' : offer.periodLabel === 'Tarde' ? '14a18' : '19a23');
        const parsed = range.match(/^(\d{2})a(\d{2})$/);
        const durationHours = parsed ? Math.max(0, Number(parsed[2]) - Number(parsed[1])) : 4;
        return { slotRange: range, durationHours, isRemote: false };
    };

    const buildTimetablesFromOferta = (offers: ParsedTimetableOffer[]): TimetableDto[] => {
        const availableSubjects = subjects.filter(
            (subject) => subject.status === SubjectStatus.DISPONIBLE || subject.status === SubjectStatus.RECURSADA,
        );
        const subjectByPlanCode = new Map(availableSubjects.map((s) => [normalizePlanCode(s.planCode), s]));
        const generated: TimetableDto[] = [];
        for (const offer of offers) {
            const subject = subjectByPlanCode.get(normalizePlanCode(offer.planCode));
            if (!subject) continue;
            const meta = parseOfferMeta(offer);
            if (meta.isRemote) {
                generated.push({
                    id: `offer-${subject.id}-remote-${offer.commission}`,
                    subjectId: subject.id,
                    dayOfWeek: 'MONDAY',
                    dayLabel: 'A distancia',
                    period: 'M1',
                    subjectName: subject.name,
                    planCode: subject.planCode,
                    commission: offer.commission,
                    slotRange: meta.slotRange,
                    durationHours: meta.durationHours,
                    isRemote: true,
                });
                continue;
            }
            const dayOfWeek = OFFER_DAY_TO_WEEK[offer.dayLabel];
            const period = OFFER_PERIOD_TO_SLOT[offer.periodLabel];
            if (!dayOfWeek || !period) continue;
            generated.push({
                id: `offer-${subject.id}-${dayOfWeek}-${period}-${offer.commission}-${offer.days ?? 'std'}`,
                subjectId: subject.id,
                dayOfWeek,
                dayLabel: DAYS_FOR_MANUAL.find((day) => day.key === dayOfWeek)?.label ?? dayOfWeek,
                period,
                subjectName: subject.name,
                planCode: subject.planCode,
                commission: offer.commission,
                slotRange: meta.slotRange,
                durationHours: meta.durationHours,
                isRemote: false,
            });
        }
        return generated;
    };

    const handleAddTimetable = async (data: {
        subjectId: string;
        day: DayOfWeek;
        period: TimePeriod;
        slotRange?: string;
        durationHours?: number;
        commission?: string;
    }) => {
        const subject = subjects.find(s => s.id === data.subjectId);
        const existingSlot = timetables.find(t => t.dayOfWeek === data.day && t.period === data.period && (t.slotRange ?? '') === (data.slotRange ?? ''));
        const newTimetable: TimetableDto = {
            id: existingSlot?.id ?? Math.random().toString(36).substring(7),
            subjectId: data.subjectId,
            dayOfWeek: data.day,
            dayLabel: data.day,
            period: data.period,
            subjectName: subject?.name || 'Materia Desconocida',
            planCode: subject?.planCode || '',
            slotRange: data.slotRange,
            durationHours: data.durationHours,
            commission: data.commission,
            isRemote: false,
        };
        const cleaned = timetables.filter(t => !(t.dayOfWeek === data.day && t.period === data.period && (t.slotRange ?? '') === (data.slotRange ?? '')));
        saveTimetablesLocal([...cleaned, newTimetable]);
    };

    const handleRemoveTimetable = async (subjectId: string) => {
        saveTimetablesLocal(timetables.filter(t => t.subjectId !== subjectId));
    };

    const handleAddManualTimetable = () => {
        if (!manualSubjectId) return;
        const subject = subjects.find(s => s.id === manualSubjectId);
        const newTimetable: TimetableDto = {
            id: `manual-offer-${manualSubjectId}-${manualDay}-${manualPeriod}-${Math.random().toString(36).substring(7)}`,
            subjectId: manualSubjectId,
            dayOfWeek: manualDay,
            dayLabel: DAYS_FOR_MANUAL.find(d => d.key === manualDay)?.label ?? manualDay,
            period: manualPeriod,
            subjectName: subject?.name || 'Materia Desconocida',
            planCode: subject?.planCode || '',
            commission: 'Manual',
            slotRange: manualPeriod === 'M1' ? '08a12' : manualPeriod === 'T1' ? '14a18' : '19a23',
            durationHours: 4,
            isRemote: false,
        };
        saveOfferEntriesLocal([...offerEntries, newTimetable]);
        setManualSubjectId('');
        setInlineMessage({ text: `Horario de oferta agregado: ${subject?.name}`, type: 'success' });
        setTimeout(() => setInlineMessage(null), 3000);
    };

    const handleAutoComplete = async (recommendations: any[]) => {
        const offerBySlot = new Map<string, TimetableDto[]>();
        for (const offer of offerEntries.filter((entry) => !entry.isRemote)) {
            const key = `${offer.dayOfWeek}-${offer.period}`;
            const list = offerBySlot.get(key) || [];
            list.push(offer);
            offerBySlot.set(key, list);
        }
        const availableSlots = Array.from(availability.entries())
            .filter(([, isAvail]) => isAvail)
            .map(([key]) => {
                const [day, period] = key.split('-');
                return { day: day as DayOfWeek, period: period as TimePeriod };
            });
        const emptySlots = availableSlots.filter(
            slot => !timetables.some(t => t.dayOfWeek === slot.day && t.period === slot.period)
        );
        if (emptySlots.length === 0) {
            setInlineMessage({ text: "No hay slots disponibles vacé­os. Configurá tu disponibilidad en la grilla primero.", type: 'info' });
            return;
        }
        const unassignedRecommendations = recommendations.filter(
            r => !timetables.some(t => t.subjectId === r.subject.id)
        );
        if (unassignedRecommendations.length === 0) {
            setInlineMessage({ text: "Todas las materias recomendadas ya están en el horario.", type: 'info' });
            return;
        }
        const newTimetables = [...timetables];
        let addedCount = 0;
        for (const rec of unassignedRecommendations) {
            if (emptySlots.length === 0) break;
            const slotIndex = emptySlots.findIndex((slot) => {
                const key = `${slot.day}-${slot.period}`;
                const options = offerBySlot.get(key) || [];
                return options.some((option) => option.subjectId === rec.subject.id);
            });
            if (slotIndex === -1) continue;
            const slot = emptySlots.splice(slotIndex, 1)[0];
            const key = `${slot.day}-${slot.period}`;
            const options = offerBySlot.get(key) || [];
            const selectedOffer = options.find((option) => option.subjectId === rec.subject.id);
            const subject = subjects.find(s => s.id === rec.subject.id);
            newTimetables.push({
                id: Math.random().toString(36).substring(7),
                subjectId: rec.subject.id,
                dayOfWeek: slot.day,
                dayLabel: DAYS_FOR_MANUAL.find(d => d.key === slot.day)?.label ?? slot.day,
                period: slot.period,
                subjectName: subject?.name || 'Materia',
                planCode: subject?.planCode || '',
                slotRange: selectedOffer?.slotRange,
                durationHours: selectedOffer?.durationHours,
                commission: selectedOffer?.commission,
                isRemote: false,
            });
            addedCount++;
        }
        if (addedCount > 0) {
            saveTimetablesLocal(newTimetables);
            setInlineMessage({ text: `Auto-completado: se asignaron ${addedCount} materia${addedCount > 1 ? 's' : ''} a slots vacé­os.`, type: 'success' });
            setTimeout(() => setInlineMessage(null), 4000);
        }
    };

    const handleOfertaFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setIsUploadingOferta(true);
        setOfertaMessage(null);
        try {
            const result = await uploadOfertaPdf(file);
            if (result.data.length === 0) {
                setOfertaMessage({ text: 'No se encontraron ofertas. Verificá que el PDF sea válido.', type: 'error' });
                return;
            }
            const importedTimetables = buildTimetablesFromOferta(result.data);
            setOfertaData(result.data);
            localStorage.setItem('oferta_materias', JSON.stringify(result.data));
            saveOfferEntriesLocal(importedTimetables);
            setOfertaMessage({
                text: `Se parsearon ${result.data.length} registros y se cargaron ${importedTimetables.length} horarios de oferta para tus materias disponibles.`,
                type: 'success',
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al procesar el PDF.';
            setOfertaMessage({ text: message, type: 'error' });
        } finally {
            setIsUploadingOferta(false);
        }
    };

    return {
        isLoading,
        loadError,
        inlineMessage,
        setInlineMessage,
        timetables,
        offerEntries,
        availability,
        ofertaFileRef,
        isUploadingOferta,
        ofertaData,
        setOfertaData,
        ofertaMessage,
        setOfertaMessage,
        manualSubjectId,
        setManualSubjectId,
        manualDay,
        setManualDay,
        manualPeriod,
        setManualPeriod,
        handleAvailabilityChange,
        handleAddTimetable,
        handleRemoveTimetable,
        handleAddManualTimetable,
        handleAutoComplete,
        handleOfertaFileSelect,
        saveOfferEntriesLocal,
    };
}

