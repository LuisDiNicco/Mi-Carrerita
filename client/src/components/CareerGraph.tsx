// client/src/components/CareerGraph.tsx (VERSIÓN MEJORADA)
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  BackgroundVariant,
  Panel,
  MarkerType
} from '@xyflow/react';
import type { Node, Edge, NodeTypes, ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css'; 
import dagre from 'dagre';

import { SubjectNode } from './SubjectNode';
import type { SubjectNodeType } from './SubjectNode';
import { SubjectStatus } from '../types/academic';
import type { Subject } from '../types/academic';
import { RetroLoading, RetroError } from './ui/RetroComponents';
import { SubjectUpdatePanel } from './SubjectUpdatePanel';
import { useAcademicStore } from '../store/academic-store';
import { GRAPH_LAYOUT, SEARCH_RESULTS_LIMIT, buildEdges, getCriticalPath } from '../lib/graph';
import { RetroButton } from './ui/RetroButton';

// Tipos de nodo
const nodeTypes: NodeTypes = {
  subject: SubjectNode,
};

// Variables de entorno (crear archivo .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const VIEWPORT_CONFIG = {
  minZoom: 0.1,
  maxZoom: 1.5,
  defaultZoom: 0.8,
  fitPadding: 0.2,
};

const UI_LABELS = {
  fullscreenOn: 'Pantalla completa',
  fullscreenOff: 'Salir de pantalla completa',
  criticalOn: 'Ocultar camino critico',
  criticalOff: 'Ver camino critico',
};

const EDGE_STYLES = {
  normal: {
    stroke: '#5BBE63',
    strokeWidth: 2,
  },
  blocked: {
    stroke: '#8A9B8A',
    strokeWidth: 2,
  },
  critical: {
    stroke: '#E85D5D',
    strokeWidth: 4,
  },
};

const EDGE_MARKER = {
  width: 18,
  height: 18,
};

const BACKGROUND_CONFIG = {
  color: '#7BCB7A',
  gap: 28,
  size: 2,
  opacity: 0.3,
  miniMapMask: 'rgba(10, 20, 12, 0.65)',
};

const UPDATE_FLASH_MS = 1400;
const SEARCH_MIN_CHARS = 1;
const SEARCH_ZOOM = 1.2;
const FOCUS_TIMEOUT_MS = 2000;
const SEARCH_PANEL_WIDTH_PX = 320;
const SEARCH_LIST_MAX_HEIGHT_PX = 220;

export const CareerGraph = () => {
  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const setSubjects = useAcademicStore((state) => state.setSubjects);
  const subjects = useAcademicStore((state) => state.subjects);
  const updateSubject = useAcademicStore((state) => state.updateSubject);
  const nodesRef = useRef<Node[]>([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentUpdateId, setRecentUpdateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const layoutNodes = (subjects: Subject[], edges: { from: string; to: string }[]) => {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: 'LR',
      ranksep: GRAPH_LAYOUT.rankSep,
      nodesep: GRAPH_LAYOUT.nodeSep,
      marginx: GRAPH_LAYOUT.marginX,
      marginy: GRAPH_LAYOUT.marginY,
    });

    subjects.forEach((subject) => {
      graph.setNode(subject.id, {
        width: GRAPH_LAYOUT.nodeWidth,
        height: GRAPH_LAYOUT.nodeHeight,
      });
    });

    edges.forEach((edge) => {
      graph.setEdge(edge.from, edge.to);
    });

    dagre.layout(graph);

    return subjects.map((subject) => {
      const node = graph.node(subject.id);
      return {
        x: node.x - GRAPH_LAYOUT.nodeWidth / 2,
        y: node.y - GRAPH_LAYOUT.nodeHeight / 2,
      };
    });
  };

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  /**
   * Fetch de datos del backend
   */
  const fetchCareerData = useCallback(async (options?: { preserveLayout?: boolean; silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_URL}/academic-career/graph`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
        
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: Subject[] = await response.json();

      // Validación básica
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No se recibieron materias del servidor');
      }

      const edgesList = buildEdges(data);
      const positionMap = new Map(nodesRef.current.map((node) => [node.id, node.position]));
      const canReusePositions =
        Boolean(options?.preserveLayout) && data.every((subject) => positionMap.has(subject.id));
      const positions = canReusePositions
        ? data.map((subject) => positionMap.get(subject.id)!)
        : layoutNodes(data, edgesList);

      const newNodes: SubjectNodeType[] = data.map((subject, index) => ({
        id: subject.id,
        type: 'subject',
        position: positions[index],
        data: { subject },
        draggable: true,
        selectable: true,
      }));

      const newEdges: Edge[] = edgesList.map((edge) => ({
        id: `e-${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        animated: false,
        style: EDGE_STYLES.normal,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: EDGE_MARKER.width,
          height: EDGE_MARKER.height,
          color: EDGE_STYLES.normal.stroke,
        },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setSubjects(data);
      setError(null);

    } catch (err) {
      console.error('Error al cargar la carrera:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error desconocido al cargar los datos';
      setError(errorMessage);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [setNodes, setEdges, setSubjects]);

  // Cargar datos al montar
  useEffect(() => {
    fetchCareerData();
  }, [fetchCareerData]);

  const criticalPath = useMemo(() => {
    if (!showCriticalPath) {
      return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    }
    const coreSubjects = subjects.filter((subject) => !subject.isOptional);
    const edgesList = buildEdges(coreSubjects);
    return getCriticalPath(coreSubjects, edgesList);
  }, [showCriticalPath, subjects]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < SEARCH_MIN_CHARS) return [];
    return subjects
      .filter((subject) =>
        subject.name.toLowerCase().includes(query) ||
        subject.planCode.toLowerCase().includes(query)
      )
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [searchQuery, subjects]);

  const enrichedNodes = nodes.map((node) => {
    const subject = (node.data as { subject?: Subject }).subject;
    return {
      ...node,
      data: {
        subject,
        isCritical: subject ? criticalPath.nodeIds.has(subject.id) : false,
        isRecentlyUpdated: subject ? subject.id === recentUpdateId : false,
        isFocused: subject ? subject.id === focusedId : false,
      },
    };
  });

  const enrichedEdges = edges.map((edge) => {
    const edgeKey = `${edge.source}-${edge.target}`;
    const isCritical = criticalPath.edgeIds.has(edgeKey);
    const targetSubject = subjects.find((subject) => subject.id === edge.target);
    const isBlocked = targetSubject?.status === SubjectStatus.PENDIENTE;
    const edgeColor = isCritical
      ? EDGE_STYLES.critical.stroke
      : isBlocked
        ? EDGE_STYLES.blocked.stroke
        : EDGE_STYLES.normal.stroke;

    return {
      ...edge,
      animated: isCritical,
      style: isCritical
        ? EDGE_STYLES.critical
        : isBlocked
          ? EDGE_STYLES.blocked
          : EDGE_STYLES.normal,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: EDGE_MARKER.width,
        height: EDGE_MARKER.height,
        color: edgeColor,
      },
    };
  });

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-40 bg-app p-6 w-full h-full'
    : 'w-full h-[70vh] bg-app rounded-xl overflow-hidden';

  const handleSelectSubject = (subject: Subject) => {
    const node = nodesRef.current.find((item) => item.id === subject.id);
    if (!node) return;
    const centerX = node.position.x + GRAPH_LAYOUT.nodeWidth / 2;
    const centerY = node.position.y + GRAPH_LAYOUT.nodeHeight / 2;
    if (flowInstance) {
      flowInstance.setCenter(centerX, centerY, { zoom: SEARCH_ZOOM, duration: 300 });
    }
    setFocusedId(subject.id);
    setSearchQuery('');
    setSearchOpen(false);
    setTimeout(() => setFocusedId(null), FOCUS_TIMEOUT_MS);
  };

  // Renderizado condicional de Loading
  if (loading) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroLoading message="CARGANDO CARRERITA..." />
      </div>
    );
  }

  // Renderizado condicional de Error
  if (error) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center bg-surface">
        <RetroError 
          title="¡OH NO!"
          message={error}
          onRetry={fetchCareerData}
        />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <ReactFlow
        nodes={enrichedNodes}
        edges={enrichedEdges}
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
        // Configuraciones de accesibilidad
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
        {/* Fondo estilo retro con puntos */}
        <Background 
          color={BACKGROUND_CONFIG.color}
          gap={BACKGROUND_CONFIG.gap} 
          size={BACKGROUND_CONFIG.size}
          variant={BackgroundVariant.Dots}
          style={{ opacity: BACKGROUND_CONFIG.opacity }}
        />

        {/* Controles personalizados */}
        <Controls 
          className="!bg-surface !border-2 !border-app !shadow-subtle
                     [&>button]:!bg-unlam-500 [&>button]:!border-0
                     [&>button]:hover:!bg-unlam-600
                     !font-retro"
          showInteractive={false}
        />

        {/* MiniMap con colores personalizados */}
        <MiniMap 
          className="!border-2 !border-app !shadow-subtle !rounded-lg overflow-hidden"
          nodeColor={(node) => {
            const isSubjectNode = (n: Node): n is SubjectNodeType => 
              n.type === 'subject' && 'subject' in n.data;

            if (isSubjectNode(node)) {
              const status = node.data.subject.status;
              const colorMap = {
                [SubjectStatus.APROBADA]: '#7BCB7A',
                [SubjectStatus.REGULARIZADA]: '#B4E6A6', 
                [SubjectStatus.EN_CURSO]: '#8FB5DD',
                [SubjectStatus.DISPONIBLE]: '#F7E8A3',
                [SubjectStatus.PENDIENTE]: '#8A9B8A',
              };
              return colorMap[status] || '#6B7280';
            }
            return '#9CA3AF';
          }}
          maskColor={BACKGROUND_CONFIG.miniMapMask}
        />

        <Panel position="top-left" className="m-4">
          <div
            className="bg-surface border border-app rounded-lg p-3 shadow-subtle"
            style={{ width: SEARCH_PANEL_WIDTH_PX }}
          >
            <label className="text-xs uppercase tracking-widest text-muted">
              Buscar materia
            </label>
            <input
              className="mt-2 w-full bg-surface border border-app rounded-lg px-3 py-2 text-app"
              placeholder="Nombre o codigo"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
            />
            {searchOpen && searchResults.length > 0 && (
              <div
                className="mt-2 overflow-auto rounded-lg border border-app bg-elevated"
                style={{ maxHeight: SEARCH_LIST_MAX_HEIGHT_PX }}
              >
                {searchResults.map((subject) => (
                  <button
                    key={subject.id}
                    className="w-full text-left px-3 py-2 text-sm text-app hover:bg-surface"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSubject(subject)}
                  >
                    <div className="text-xs text-muted">{subject.planCode}</div>
                    <div className="font-semibold">{subject.name}</div>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              Doble clic en una materia para actualizar el estado.
            </p>
          </div>
        </Panel>

        <Panel position="top-right" className="m-4 flex flex-col gap-2">
          <RetroButton
            size="sm"
            variant="primary"
            onClick={() => setIsFullscreen((prev) => !prev)}
          >
            {isFullscreen ? UI_LABELS.fullscreenOff : UI_LABELS.fullscreenOn}
          </RetroButton>
          <RetroButton
            size="sm"
            variant="danger"
            onClick={() => setShowCriticalPath((prev) => !prev)}
          >
            {showCriticalPath ? UI_LABELS.criticalOn : UI_LABELS.criticalOff}
          </RetroButton>
        </Panel>

        {/* Leyenda (abajo a la derecha) */}
        <Panel position="bottom-right" className="m-4">
          <div className="bg-surface border-2 border-app p-3 rounded-lg shadow-subtle
                          font-retro text-xs text-app">
            <div className="font-bold mb-2 text-center">LEYENDA</div>
            <div className="space-y-1">
              <LegendItem emoji="🔒" label="Bloqueada" />
              <LegendItem emoji="🎯" label="Disponible" />
              <LegendItem emoji="📚" label="En Curso" />
              <LegendItem emoji="✅" label="Regular" />
              <LegendItem emoji="🏆" label="Aprobada" />
            </div>
          </div>
        </Panel>
      </ReactFlow>

      <SubjectUpdatePanel
        subject={activeSubject}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setActiveSubject(null);
        }}
        onSave={async (payload) => {
          if (!activeSubject) return;
          const response = await fetch(`${API_URL}/academic-career/subjects/${activeSubject.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            throw new Error('No se pudo actualizar la materia.');
          }
          updateSubject(activeSubject.id, {
            status: payload.status,
            grade: payload.grade,
            statusDate: payload.statusDate,
            notes: payload.notes,
          });
          setNodes((current) =>
            current.map((node) => {
              if (node.id !== activeSubject.id) return node;
              const subject = (node.data as { subject?: Subject }).subject;
              return {
                ...node,
                data: {
                  ...node.data,
                  subject: subject
                    ? {
                        ...subject,
                        status: payload.status,
                        grade: payload.grade,
                        statusDate: payload.statusDate,
                        notes: payload.notes,
                      }
                    : subject,
                },
              };
            })
          );
          setRecentUpdateId(activeSubject.id);
          setTimeout(() => setRecentUpdateId(null), UPDATE_FLASH_MS);
          setTimeout(() => {
            fetchCareerData({ preserveLayout: true, silent: true });
          }, UPDATE_FLASH_MS);
        }}
      />
    </div>
  );
};

// Componentes auxiliares
const LegendItem = ({ emoji, label }: { emoji: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span>{emoji}</span>
    <span>{label}</span>
  </div>
);
