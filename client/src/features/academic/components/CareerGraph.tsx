import { useMemo } from 'react';
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
import { CheckpointLegend } from './CheckpointLegend';
import { RetroButton } from '../../../shared/ui/RetroButton';
import {
  BACKGROUND_CONFIG,
  SEARCH_LIST_MAX_HEIGHT_PX,
  SEARCH_PANEL_WIDTH_PX,
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
    <div className="space-y-6">
      {/* Progress and Stats Section */}
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

      {/* Career Tree Graph */}
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

          <CheckpointLegend />

          <MiniMap
            className="!border-2 !border-app !shadow-subtle !rounded-lg overflow-hidden"
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

          <Panel position="top-left" className="m-4">
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-app bg-surface p-3 shadow-subtle">
                <label className="text-xs uppercase tracking-widest text-muted">Buscar materia</label>
                <input
                  className="mt-2 w-full rounded-lg border border-app bg-elevated px-3 py-2 text-sm text-app"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Ej: Algebra"
                />
                {searchOpen && searchResults.length > 0 && (
                  <div
                    className="mt-2 space-y-2 overflow-y-auto rounded-lg border border-app bg-surface p-2"
                    style={{ width: SEARCH_PANEL_WIDTH_PX, maxHeight: SEARCH_LIST_MAX_HEIGHT_PX }}
                  >
                    {searchResults.map((subject) => (
                      <button
                        key={subject.id}
                        className="w-full rounded-md border border-app bg-elevated px-3 py-2 text-left text-sm text-app hover:bg-surface"
                        onClick={() => handleSelectSubject(subject)}
                      >
                        <p className="text-xs text-muted">{subject.planCode}</p>
                        <p className="font-semibold">{subject.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <RetroButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsFullscreen((prev) => !prev)}
                >
                  {isFullscreen ? UI_LABELS.fullscreenOff : UI_LABELS.fullscreenOn}
                </RetroButton>
                <RetroButton
                  variant="warning"
                  size="sm"
                  onClick={() => setShowCriticalPath((prev) => !prev)}
                >
                  {showCriticalPath ? UI_LABELS.criticalOn : UI_LABELS.criticalOff}
                </RetroButton>
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
    </div>
  );
};
