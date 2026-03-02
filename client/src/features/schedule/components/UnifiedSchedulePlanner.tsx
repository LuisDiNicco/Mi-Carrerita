import { cn } from '../../../shared/lib/utils';
import type { DayOfWeek, TimePeriod, TimetableDto } from '../lib/schedule-api';
import { useSchedulePlanner } from '../hooks/useSchedulePlanner';
import { ScheduleGrid } from './ScheduleGrid';
import { ScheduleModal } from './ScheduleModal';

interface UnifiedSchedulePlannerProps {
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
    onRemoveTimetable: (subjectId: string) => Promise<void>;
    recommendedIds: Set<string>;
}

export const UnifiedSchedulePlanner = ({
    availability,
    timetables,
    offerEntries,
    onAvailabilityChange,
    onAddTimetable,
    onRemoveTimetable,
    recommendedIds
}: UnifiedSchedulePlannerProps) => {

    const plannerProps = useSchedulePlanner({
        availability,
        timetables,
        offerEntries,
        onAvailabilityChange,
        onAddTimetable,
    });

    const {
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
    } = plannerProps;

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-elevated p-1 rounded-lg border border-app w-fit shadow-subtle">
                    <button
                        onClick={() => setMode('AVAILABILITY')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'AVAILABILITY'
                                ? "bg-unlam-500 text-app-accent-ink shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        1. Definir Disponibilidad
                    </button>
                    <button
                        onClick={() => setMode('OPTIONS')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'OPTIONS'
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        2. Elegir desde Oferta
                    </button>
                    <button
                        onClick={() => setMode('FINAL')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-bold transition-all",
                            mode === 'FINAL'
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-muted hover:text-app"
                        )}
                    >
                        3. Cursada Elegida
                    </button>
                </div>
            </div>

            <ScheduleGrid
                mode={mode}
                availability={availability}
                rowsForMode={rowsForMode}
                hoveredCell={hoveredCell}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onClickCell={handleCellClick}
                getCellContent={getCellContent}
                getCellOffers={getCellOffers}
                colorForSubject={colorForSubject}
                onRemoveTimetable={onRemoveTimetable}
            />

            <ScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                targetCell={targetCell}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredModalSubjects={filteredModalSubjects}
                recommendedIds={recommendedIds}
                selectedOfferId={selectedOfferId}
                setSelectedOfferId={setSelectedOfferId}
                confirmAddClass={confirmAddClass}
            />

            <div className="flex justify-center pt-2">
                <p className="text-[11px] bg-surface border border-app px-4 py-2 text-muted shadow-sm md:rounded-full rounded-md text-center max-w-full">
                    {mode === 'AVAILABILITY'
                        ? 'ðŸŸ¢ Pulsa o arrastra para marcar disponibilidad.'
                        : mode === 'OPTIONS'
                            ? 'ðŸ“š En esta etapa puedes ver opciones solapadas de oferta y elegir una por celda.'
                            : 'âœ… Esta es tu cursada final elegida. Puedes volver al paso 2 para ajustar.'}
                </p>
            </div>
        </div>
    );
};

