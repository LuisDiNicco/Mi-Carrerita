import { Search, Upload } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { STATUS_OPTIONS } from '../hooks/useHistoryTable';
import { SubjectStatus } from '../../../shared/types/academic';
import type { RefObject, MutableRefObject } from 'react';

interface HistoryToolbarProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    fileInputRef: RefObject<HTMLInputElement> | MutableRefObject<HTMLInputElement | null>;
    isUploading: boolean;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
}

export function HistoryToolbar({
    searchTerm,
    setSearchTerm,
    fileInputRef,
    isUploading,
    handleFileSelect,
    filterStatus,
    setFilterStatus
}: HistoryToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-elevated/50 p-4 rounded-xl border border-app">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar materia..."
                        className="w-full pl-9 pr-4 py-2 bg-surface border border-app rounded-lg text-sm focus:ring-1 focus:ring-unlam-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-unlam-500/50 text-unlam-500 hover:bg-unlam-500/10 hover:border-unlam-500 transition-all font-bold text-sm whitespace-nowrap disabled:opacity-50"
                >
                    <Upload size={16} />
                    {isUploading ? 'Procesando...' : 'Subir PDF'}
                </button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-nowrap">
                {['ALL', SubjectStatus.APROBADA, SubjectStatus.EN_CURSO, SubjectStatus.REGULARIZADA, SubjectStatus.RECURSADA].map((st) => {
                    const label = st === 'ALL' ? 'Todos' : STATUS_OPTIONS.find(o => o.value === st)?.label || st;

                    return (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 shadow-subtle min-w-[max-content]",
                                filterStatus === st
                                    ? "bg-unlam-500 text-app-accent-ink border-unlam-500"
                                    : "bg-surface text-muted border-app hover:border-unlam-500/50 hover:text-app"
                            )}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

