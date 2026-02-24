import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkerType, useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

import type { Subject } from "../../../shared/types/academic";
import { SubjectStatus } from "../../../shared/types/academic";
import { useAcademicStore } from "../store/academic-store";
import { fetchAcademicGraph } from "../lib/academic-api";
import { authFetch } from "../../auth/lib/api";
import {
  buildEdges,
  getCriticalPath,
} from "../../../shared/lib/graph";
import { layoutNodesByYear } from "../lib/graph-layout";
import {
  EDGE_MARKER,
  EDGE_STYLES,
  UPDATE_FLASH_MS,
} from "../lib/graph-constants";
import { buildYearSeparatorNodes } from "../lib/year-separators";
import { useGraphUI } from "./useGraphUI";
import { useGraphSearch } from "./useGraphSearch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useCareerGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const setSubjects = useAcademicStore((state) => state.setSubjects);
  const subjects = useAcademicStore((state) => state.subjects);
  const updateSubject = useAcademicStore((state) => state.updateSubject);
  const nodesRef = useRef<Node[]>([]);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentUpdateId, setRecentUpdateId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  const {
    isFullscreen,
    setIsFullscreen,
    showCriticalPath,
    setShowCriticalPath,
    activeSubject,
    setActiveSubject,
    isPanelOpen,
    setIsPanelOpen,
    containerClass,
  } = useGraphUI();

  const {
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    searchResults,
    handleSelectSubject,
  } = useGraphSearch(subjects, nodes, flowInstance, setFocusedId);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);


  const fetchCareerData = useCallback(
    async (options?: { preserveLayout?: boolean; silent?: boolean }) => {
      try {
        if (!options?.silent) {
          setLoading(true);
        }
        setError(null);

        const data: Subject[] = await fetchAcademicGraph();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No se recibieron materias del servidor");
        }

        const edgesList = buildEdges(data);
        const positionMap = new Map(
          nodesRef.current.map((node) => [node.id, node.position]),
        );
        const canReusePositions =
          Boolean(options?.preserveLayout) &&
          data.every((subject) => positionMap.has(subject.id));
        const positions = canReusePositions
          ? data.map((subject) => positionMap.get(subject.id)!)
          : layoutNodesByYear(data, edgesList);

        const newNodes = data.map((subject, index) => ({
          id: subject.id,
          type: "subject",
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
          type: "smoothstep",
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
        console.error("Error al cargar la carrera:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar los datos";
        setError(errorMessage);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [setEdges, setNodes, setSubjects],
  );

  useEffect(() => {
    fetchCareerData();
  }, [fetchCareerData]);

  const criticalPath = useMemo(() => {
    if (!showCriticalPath) {
      return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    }
    const coreSubjects = subjects.filter(
      (subject) =>
        !subject.isOptional && subject.status !== SubjectStatus.APROBADA
    );
    const edgesList = buildEdges(coreSubjects);
    return getCriticalPath(coreSubjects, edgesList);
  }, [showCriticalPath, subjects]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  /**
   * Build adjacency maps for hover highlighting.
   * parentMap[id] = set of subjects that must be approved before this one (prerequisites)
   * childMap[id]  = set of subjects that this one helps unlock (dependants)
   */
  const { parentMap, childMap } = useMemo(() => {
    const parentMap = new Map<string, Set<string>>();
    const childMap = new Map<string, Set<string>>();
    for (const edge of edges) {
      // edge: source -> target means "source is prerequisite of target"
      if (!childMap.has(edge.source)) childMap.set(edge.source, new Set());
      childMap.get(edge.source)!.add(edge.target);
      if (!parentMap.has(edge.target)) parentMap.set(edge.target, new Set());
      parentMap.get(edge.target)!.add(edge.source);
    }
    return { parentMap, childMap };
  }, [edges]);

  /**
   * Compute which nodes to highlight for a given hovered subject.
   * - ancestors (prerequisites) — shown in orange
   * - descendants that this hovered subject fully enables (all prereqs met once this is approved) — green
   * - descendants where this hovered subject is only a partial prereq — yellow
   */
  const hoverHighlight = useMemo(() => {
    if (!hoveredSubjectId) return { ancestors: new Set<string>(), fullUnlocks: new Set<string>(), partialUnlocks: new Set<string>() };

    // BFS ancestors
    const ancestors = new Set<string>();
    const queue = [...(parentMap.get(hoveredSubjectId) ?? [])];
    while (queue.length) {
      const id = queue.shift()!;
      if (!ancestors.has(id)) {
        ancestors.add(id);
        (parentMap.get(id) ?? new Set()).forEach((pid) => queue.push(pid));
      }
    }

    // ONLY check DIRECT dependents (one edge away)
    const fullUnlocks = new Set<string>();
    const partialUnlocks = new Set<string>();
    
    // Get direct dependents
    const directDependents = childMap.get(hoveredSubjectId) ?? new Set();
    
    directDependents.forEach((dependentId) => {
      const prereqs = parentMap.get(dependentId) ?? new Set();
      const prereqCount = prereqs.size;
      
      if (prereqCount === 1 && prereqs.has(hoveredSubjectId)) {
        // Only requires this node → full unlock
        fullUnlocks.add(dependentId);
      } else if (prereqCount > 1 && prereqs.has(hoveredSubjectId)) {
        // Requires this node + others → partial unlock
        partialUnlocks.add(dependentId);
      }
    });

    return { ancestors, fullUnlocks, partialUnlocks };
  }, [hoveredSubjectId, parentMap, childMap, subjects]);

  /** Called from CareerGraph onNodeMouseEnter / onNodeMouseLeave */
  const handleNodeHover = useCallback((subjectId: string | null) => {
    setHoveredSubjectId(subjectId);
  }, []);

  // Update node metadata in-place to prevent React Flow infinite remeasure loops
  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const nextNodes = nds.map((node) => {
        const subject = (node.data as any).subject as Subject | undefined;
        if (!subject) return node;

        const isCritical = criticalPath.nodeIds.has(subject.id);
        const isRecentlyUpdated = subject.id === recentUpdateId;
        const isFocused = subject.id === focusedId;
        const isPrerequisite = hoverHighlight.ancestors.has(subject.id);
        const isFullUnlock = hoverHighlight.fullUnlocks.has(subject.id);
        const isPartialUnlock = hoverHighlight.partialUnlocks.has(subject.id);
        const isHoveredNode = subject.id === hoveredSubjectId;

        if (
          node.data.isCritical === isCritical &&
          node.data.isRecentlyUpdated === isRecentlyUpdated &&
          node.data.isFocused === isFocused &&
          (node.data as any).isPrerequisite === isPrerequisite &&
          (node.data as any).isFullUnlock === isFullUnlock &&
          (node.data as any).isPartialUnlock === isPartialUnlock &&
          (node.data as any).isHoveredNode === isHoveredNode
        ) {
          return node;
        }

        changed = true;
        return {
          ...node,
          data: {
            ...node.data,
            isCritical,
            isRecentlyUpdated,
            isFocused,
            isPrerequisite,
            isFullUnlock,
            isPartialUnlock,
            isHoveredNode,
          },
        };
      });
      return changed ? nextNodes : nds;
    });
  }, [criticalPath.nodeIds, focusedId, recentUpdateId, hoverHighlight, hoveredSubjectId, setNodes]);

  // Update edge metadata in-place
  useEffect(() => {
    setEdges((eds) => {
      let changed = false;
      const nextEdges = eds.map((edge) => {
        const edgeKey = `${edge.source}-${edge.target}`;
        const isCritical = criticalPath.edgeIds.has(edgeKey);
        const targetSubject = subjectById.get(edge.target);
        const isBlocked = targetSubject?.status === SubjectStatus.PENDIENTE;

        if (
          (edge.data as any)?.isCritical === isCritical &&
          (edge.data as any)?.isBlocked === isBlocked
        ) {
          return edge;
        }

        changed = true;
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
          data: {
            ...edge.data,
            isCritical,
            isBlocked,
          },
        };
      });
      return changed ? nextEdges : eds;
    });
  }, [criticalPath.edgeIds, subjectById, setEdges]);

  const yearSeparatorNodes = useMemo(
    () => buildYearSeparatorNodes(subjects, []),
    [subjects],
  );


  const handleSaveSubject = useCallback(
    async (payload: {
      status: SubjectStatus;
      grade: number | null;
      difficulty: number | null;
      statusDate: string | null;
      notes: string | null;
    }) => {
      if (!activeSubject) return;
      const response = await authFetch(
        `${API_URL}/academic-career/subjects/${activeSubject.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let msg = "No se pudo guardar la materia. Revisá los datos e intentá de nuevo.";
        if (errorData?.message) {
          if (Array.isArray(errorData.message)) {
            msg = errorData.message.join(" - ");
          } else if (typeof errorData.message === "string") {
            msg = errorData.message;
          }
        }
        throw new Error(msg);
      }

      updateSubject(activeSubject.id, payload);
      setRecentUpdateId(activeSubject.id);
      setTimeout(() => setRecentUpdateId(null), UPDATE_FLASH_MS);
      fetchCareerData({ preserveLayout: true, silent: true });
    },
    [activeSubject, fetchCareerData, updateSubject],
  );

  return {
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
    refetch: fetchCareerData,
    hoveredSubjectId,
    handleNodeHover,
  };
};
