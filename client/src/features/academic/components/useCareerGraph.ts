import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkerType, useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

import type { Subject } from "../../../shared/types/academic";
import { SubjectStatus } from "../../../shared/types/academic";
import { useAcademicStore } from "../store/academic-store";
import { authFetch } from "../../auth/lib/api";
import {
  buildEdges,
  getCriticalPath,
  SEARCH_RESULTS_LIMIT,
} from "../../../shared/lib/graph";
import { GRAPH_LAYOUT, layoutNodesByYear } from "../lib/graph-layout";
import {
  EDGE_MARKER,
  EDGE_STYLES,
  FOCUS_TIMEOUT_MS,
  SEARCH_MIN_CHARS,
  SEARCH_ZOOM,
  UPDATE_FLASH_MS,
} from "../lib/graph-constants";
import { buildYearSeparatorNodes } from "../lib/year-separators";

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
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recentUpdateId, setRecentUpdateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);

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

        const response = await authFetch(`${API_URL}/academic-career/graph`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data: Subject[] = await response.json();

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
    const coreSubjects = subjects.filter((subject) => !subject.isOptional);
    const edgesList = buildEdges(coreSubjects);
    return getCriticalPath(coreSubjects, edgesList);
  }, [showCriticalPath, subjects]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < SEARCH_MIN_CHARS) return [];
    return subjects
      .filter(
        (subject) =>
          subject.name.toLowerCase().includes(query) ||
          subject.planCode.toLowerCase().includes(query),
      )
      .slice(0, SEARCH_RESULTS_LIMIT);
  }, [searchQuery, subjects]);

  const enrichedNodes = useMemo(
    () =>
      nodes.map((node) => {
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
      }),
    [criticalPath.nodeIds, focusedId, nodes, recentUpdateId],
  );

  const enrichedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const edgeKey = `${edge.source}-${edge.target}`;
        const isCritical = criticalPath.edgeIds.has(edgeKey);
        const targetSubject = subjectById.get(edge.target);
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
      }),
    [criticalPath.edgeIds, edges, subjectById],
  );

  const yearSeparatorNodes = useMemo(
    () => buildYearSeparatorNodes(subjects, nodes),
    [nodes, subjects],
  );

  const containerClass = isFullscreen
    ? "fixed inset-0 z-40 bg-app p-6 w-full h-full"
    : "w-full h-[70vh] bg-app rounded-xl overflow-hidden";

  const handleSelectSubject = useCallback(
    (subject: Subject) => {
      const node = nodesRef.current.find((item) => item.id === subject.id);
      if (!node) return;
      const centerX = node.position.x + GRAPH_LAYOUT.nodeWidth / 2;
      const centerY = node.position.y + GRAPH_LAYOUT.nodeHeight / 2;
      if (flowInstance) {
        flowInstance.setCenter(centerX, centerY, {
          zoom: SEARCH_ZOOM,
          duration: 300,
        });
      }
      setFocusedId(subject.id);
      setSearchQuery("");
      setSearchOpen(false);
      setTimeout(() => setFocusedId(null), FOCUS_TIMEOUT_MS);
    },
    [flowInstance],
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
        throw new Error("No se pudo guardar la materia.");
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
    nodes: enrichedNodes,
    edges: enrichedEdges,
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
  };
};
