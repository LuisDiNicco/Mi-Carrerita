import { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType } from './SubjectNode';
import { YearSeparatorNode } from './YearSeparatorNode';
import type { YearSeparatorNodeType } from './YearSeparatorNode';
import { SubjectStatus } from '../../../shared/types/academic';
import type { Subject } from '../../../shared/types/academic';
import { RetroLoading, RetroError } from '../../../shared/ui/RetroComponents';
import { SubjectUpdatePanel } from './SubjectUpdatePanel';
import { ProgressTrack } from './ProgressTrack';
import { Map, Maximize, Minimize, AlertTriangle } from 'lucide-react';
import {
  BACKGROUND_CONFIG,
  UI_LABELS,
  VIEWPORT_CONFIG,
} from '../lib/graph-constants';
import { useCareerGraph } from './useCareerGraph';

const nodeTypes: NodeTypes = {
  subject: SubjectNode,
  yearSeparator: YearSeparatorNode,
};

interface CareerGraphProps {
  progress: number;
  stats: {
    total: number;
    approved: number;
    inProgress: number;
    available: number;
  };
}

export const CareerGraph = ({ progress, stats }: CareerGraphProps) => {
  const {
    loading,
    error,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setFlowInstance,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    searchResults,
    handleSelectSubject,
    showCriticalPath,
    setShowCriticalPath,
    isFullscreen,
    setIsFullscreen,
    containerClass,
    activeSubject,
    setActiveSubject,
    isPanelOpen,
    setIsPanelOpen,
    handleSaveSubject,
    yearSeparatorNodes,
    refetch,
  } = useCareerGraph();

  const graphNodes = useMemo(
    () => [...yearSeparatorNodes, ...nodes],
    [yearSeparatorNodes, nodes]
  );

  const [showMinimap, setShowMinimap] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroLoading message="CARGANDO CARRERITA..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroError title="¡OH NO!" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Progress and Stats Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-app-accent rounded-full"></div>
          <h2 className="text-xl font-bold font-retro text-app uppercase tracking-wide">
            Progreso de tu Carrera
          </h2>
        </div>
        <div className="space-y-4 rounded-2xl border-2 border-app-border bg-app-bg p-6 shadow-retro">
          <ProgressTrack progress={progress} />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border-2 border-app-border bg-elevated p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Total</p>
              <p className="text-3xl font-bold text-app">{stats.total}</p>
            </div>
            <div className="rounded-lg border-2 border-app-border bg-elevated p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Aprobadas</p>
              <p className="text-3xl font-bold text-app">{stats.approved}</p>
            </div>
            <div className="rounded-lg border-2 border-app-border bg-elevated p-4">
              <p className="text-xs uppercase tracking-wider text-muted">En curso</p>
              <p className="text-3xl font-bold text-app">{stats.inProgress}</p>
            </div>
            <div className="rounded-lg border-2 border-app-border bg-elevated p-4">
              <p className="text-xs uppercase tracking-wider text-muted">Disponibles</p>
              <p className="text-3xl font-bold text-app">{stats.available}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Tree Graph */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-unlam-500 rounded-full"></div>
          <h2 className="text-xl font-bold font-retro text-app uppercase tracking-wide">
            Árbol de Materias
          </h2>
        </div>
        <div className={containerClass}>
          <ReactFlow
            nodes={graphNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={setFlowInstance}
            fitView
            fitViewOptions={{
              padding: VIEWPORT_CONFIG.fitPadding,
              minZoom: VIEWPORT_CONFIG.minZoom,
              maxZoom: VIEWPORT_CONFIG.maxZoom,
            }}
            minZoom={VIEWPORT_CONFIG.minZoom}
            maxZoom={VIEWPORT_CONFIG.maxZoom}
            defaultViewport={{ x: 0, y: 0, zoom: VIEWPORT_CONFIG.defaultZoom }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            onNodeDoubleClick={(_, node) => {
              const subject = (node.data as { subject?: Subject }).subject;
              if (subject) {
                setActiveSubject(subject);
                setIsPanelOpen(true);
              }
            }}
          >
            <Background
              color={BACKGROUND_CONFIG.color}
              gap={BACKGROUND_CONFIG.gap}
              size={BACKGROUND_CONFIG.size}
              variant={BackgroundVariant.Dots}
              style={{ opacity: BACKGROUND_CONFIG.opacity }}
            />

            <Controls
              className="!bg-surface !border-2 !border-app !shadow-subtle
                     [&>button]:!bg-unlam-500 [&>button]:!border-0
                     [&>button]:hover:!bg-unlam-600
                     !font-retro"
              showInteractive={false}
            />

            {showMinimap && (
              <MiniMap
                className="!border-2 !border-app !shadow-subtle !rounded-lg overflow-hidden animate-[fadeIn_0.2s_ease-in]"
                nodeColor={(node) => {
                  const isSubjectNode = (n: Node): n is SubjectNodeType =>
                    n.type === 'subject' && 'subject' in n.data;

                  const isSeparatorNode = (n: Node): n is YearSeparatorNodeType =>
                    n.type === 'yearSeparator' && 'label' in n.data;

                  if (isSubjectNode(node)) {
                    const status = node.data.subject.status;
                    const colorMap = {
                      [SubjectStatus.APROBADA]: '#7BCB7A',
                      [SubjectStatus.REGULARIZADA]: '#B4E6A6',
                      [SubjectStatus.EN_CURSO]: '#8FB5DD',
                      [SubjectStatus.DISPONIBLE]: '#F7E8A3',
                      [SubjectStatus.PENDIENTE]: '#8A9B8A',
                      [SubjectStatus.RECURSADA]: '#E57373',
                      [SubjectStatus.EQUIVALENCIA]: '#10B981',
                    };
                    return colorMap[status] || '#6B7280';
                  }
                  if (isSeparatorNode(node)) {
                    return '#2E3A2E';
                  }
                  return '#9CA3AF';
                }}
                maskColor={BACKGROUND_CONFIG.miniMapMask}
              />
            )}

            <Panel position="top-left" className="m-3 max-w-[280px]">
              <div className="flex flex-col gap-2">
                <div className="rounded-xl border border-app bg-surface/90 backdrop-blur-sm p-3 shadow-subtle hover:shadow-soft transition-all">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center justify-between">
                    <span>Buscar materia</span>
                    <span className="bg-elevated px-1.5 py-0.5 rounded text-[8px] border border-app-border">Ctrl+K</span>
                  </label>
                  <div className="relative mt-2">
                    <input
                      className="w-full rounded-lg border border-app bg-elevated pl-8 pr-3 py-1.5 text-xs text-app focus:ring-2 focus:ring-unlam-500/50 outline-none transition-all"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setSearchOpen(true);
                      }}
                      onFocus={() => setSearchOpen(true)}
                      placeholder="Ej: Algebra"
                    />
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                  </div>
                  {searchOpen && searchResults.length > 0 && (
                    <div
                      className="mt-2 space-y-1.5 overflow-y-auto rounded-lg border border-app/50 bg-elevated/95 p-1.5 shadow-xl animate-[fadeIn_0.15s_ease-out]"
                      style={{ maxHeight: '200px' }}
                    >
                      {searchResults.map((subject) => (
                        <button
                          key={subject.id}
                          className="w-full rounded-md border border-transparent hover:border-unlam-500/30 bg-surface/50 px-3 py-1.5 text-left text-xs text-app hover:bg-surface transition-all group"
                          onClick={() => handleSelectSubject(subject)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold group-hover:text-unlam-500 transition-colors truncate pr-2">{subject.name}</span>
                            <span className="text-[9px] text-muted whitespace-nowrap bg-elevated px-1.5 py-0.5 rounded">{subject.planCode}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsFullscreen((prev) => !prev)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2 text-xs font-bold font-retro transition-all shadow-subtle hover:-translate-y-0.5 hover:shadow-soft ${isFullscreen
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-surface border-app text-app hover:bg-elevated hover:border-unlam-500/50'
                      }`}
                    title={isFullscreen ? UI_LABELS.fullscreenOff : UI_LABELS.fullscreenOn}
                  >
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                    <span>{isFullscreen ? 'Restaurar' : 'Pantalla Completa'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCriticalPath((prev) => !prev)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border p-2 text-xs font-bold font-retro transition-all shadow-subtle hover:-translate-y-0.5 hover:shadow-soft ${showCriticalPath
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/30 ring-2 ring-yellow-500/20'
                      : 'bg-surface border-app text-app hover:bg-elevated hover:border-unlam-500/50'
                      }`}
                    title={showCriticalPath ? UI_LABELS.criticalOn : UI_LABELS.criticalOff}
                  >
                    <AlertTriangle size={14} className={showCriticalPath ? "animate-pulse" : ""} />
                    <span>{showCriticalPath ? 'Ruta Crítica' : 'Ruta Crítica'}</span>
                  </button>

                  <button
                    onClick={() => setShowMinimap((prev) => !prev)}
                    className={`flex items-center justify-center w-10 rounded-xl border transition-all shadow-subtle hover:-translate-y-0.5 hover:shadow-soft ${showMinimap
                      ? 'bg-unlam-500/20 border-unlam-500/50 text-unlam-400 hover:bg-unlam-500/30 ring-2 ring-unlam-500/20'
                      : 'bg-surface border-app text-app hover:bg-elevated hover:border-unlam-500/50'
                      }`}
                    title={showMinimap ? 'Ocultar Minimapa' : 'Ver Minimapa'}
                  >
                    {showMinimap ? <Map size={16} className="text-unlam-400" /> : <Map size={16} />}
                  </button>
                </div>
              </div>
            </Panel>
          </ReactFlow>

          <SubjectUpdatePanel
            subject={activeSubject}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            onSave={handleSaveSubject}
          />
        </div>
      </section>
    </div>
  );
};
