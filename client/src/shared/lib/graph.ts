import type { Subject } from "../types/academic";
import { SubjectStatus } from "../types/academic";

export const PROGRESS_CHECKPOINTS = [25, 50, 75, 100];

export const SEARCH_RESULTS_LIMIT = 6;

export type GraphEdge = {
  from: string;
  to: string;
};

const RECOMMENDATION_BONUS = 2;

function buildSubjectByPlanCode(subjects: Subject[]): Map<string, Subject> {
  return new Map(subjects.map((subject) => [subject.planCode, subject]));
}

function computeDistanceToSink(
  subjects: Subject[],
  edges: GraphEdge[],
): Map<string, number> {
  const nodeIds = new Set(subjects.map((subject) => subject.id));
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  nodeIds.forEach((id) => {
    adjacency.set(id, []);
    indegree.set(id, 0);
  });

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return;
    adjacency.get(edge.from)?.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((count, id) => {
    if (count === 0) queue.push(id);
  });

  const topo: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    topo.push(current);
    adjacency.get(current)?.forEach((next) => {
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if ((indegree.get(next) ?? 0) === 0) queue.push(next);
    });
  }

  const distance = new Map<string, number>();
  nodeIds.forEach((id) => distance.set(id, 0));

  for (let i = topo.length - 1; i >= 0; i -= 1) {
    const node = topo[i];
    const nextNodes = adjacency.get(node) ?? [];
    if (nextNodes.length === 0) {
      distance.set(node, 0);
      continue;
    }
    const maxNext = Math.max(
      ...nextNodes.map((next) => distance.get(next) ?? 0),
    );
    distance.set(node, maxNext + 1);
  }

  return distance;
}

function buildCriticalPathFromDistance(
  edges: GraphEdge[],
  distance: Map<string, number>,
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const distances = Array.from(distance.values());
  const criticalLength = distances.length > 0 ? Math.max(...distances) : 0;

  const criticalNodeIds = new Set<string>();
  const criticalEdgeIds = new Set<string>();

  if (criticalLength <= 0 || distance.size === 0) return { nodeIds: criticalNodeIds, edgeIds: criticalEdgeIds };

  const candidates = Array.from(distance.entries())
    .filter(([, dist]) => dist === criticalLength)
    .map(([id]) => id);

  const unlocks = buildUnlockMap(edges);
  candidates.sort((a, b) => (unlocks.get(b) ?? 0) - (unlocks.get(a) ?? 0));

  if (candidates.length > 0) {
    let current = candidates[0];
    criticalNodeIds.add(current);

    let currentDist = criticalLength;
    while (currentDist > 0) {
      const outEdges = edges.filter(e => e.from === current);
      const nextSteps = outEdges
        .filter(e => distance.get(e.to) === currentDist - 1)
        .sort((a, b) => {
          const unlocksA = unlocks.get(a.to) ?? 0;
          const unlocksB = unlocks.get(b.to) ?? 0;
          return unlocksB - unlocksA;
        });

      if (nextSteps.length > 0) {
        const nextEdge = nextSteps[0];
        criticalEdgeIds.add(`${nextEdge.from}-${nextEdge.to}`);
        criticalNodeIds.add(nextEdge.to);
        current = nextEdge.to;
        currentDist--;
      } else {
        break;
      }
    }
  }

  return { nodeIds: criticalNodeIds, edgeIds: criticalEdgeIds };
}

export function buildEdges(subjects: Subject[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const byPlanCode = new Map(
    subjects.map((subject) => [subject.planCode, subject.id]),
  );

  subjects.forEach((subject) => {
    subject.correlativeIds.forEach((requiredCode: string) => {
      const requiredId = byPlanCode.get(requiredCode);
      if (requiredId) {
        edges.push({ from: requiredId, to: subject.id });
      }
    });
  });

  return edges;
}

export function buildUnlockMap(edges: GraphEdge[]): Map<string, number> {
  const unlocks = new Map<string, number>();
  edges.forEach((edge) => {
    unlocks.set(edge.from, (unlocks.get(edge.from) ?? 0) + 1);
  });
  return unlocks;
}

export function getCriticalPath(
  subjects: Subject[],
  edges: GraphEdge[],
): {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
} {
  const distance = computeDistanceToSink(subjects, edges);
  return buildCriticalPathFromDistance(edges, distance);
}

export function getRecommendations(
  subjects: Subject[],
  edges: GraphEdge[],
  desiredCount: number,
): Subject[] {
  const subjectByPlanCode = buildSubjectByPlanCode(subjects);
  const available = subjects.filter(
    (subject) =>
      subject.status === SubjectStatus.DISPONIBLE &&
      subject.correlativeIds.every((reqCode: string) => {
        const required = subjectByPlanCode.get(reqCode);
        return !required || required.status === SubjectStatus.APROBADA;
      }),
  );

  if (available.length === 0) return [];

  const distanceToSink = computeDistanceToSink(subjects, edges);
  const { nodeIds: criticalNodes } = buildCriticalPathFromDistance(
    edges,
    distanceToSink,
  );

  const scored = available.map((subject) => {
    const base = distanceToSink.get(subject.id) ?? 0;
    const bonus = criticalNodes.has(subject.id) ? RECOMMENDATION_BONUS : 0;
    return {
      subject,
      score: base + bonus,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.subject.year - b.subject.year);

  return scored.slice(0, desiredCount).map((entry) => entry.subject);
}



// ==================== NEW RECOMMENDATION SYSTEM ====================

export interface RecommendationWithReason {
  subject: Subject;
  reasons: string[];
  score: number;
}

const PROYECTO_FINAL_NAME = "Proyecto Final";

/**
 * Encuentra las materias que desbloquean el Proyecto Final
 */
export function getSubjectsThatUnlockThesis(
  subjects: Subject[],
  edges: GraphEdge[],
): Set<string> {
  const thesisSubjects = subjects.filter((s) => s.name === PROYECTO_FINAL_NAME);

  if (thesisSubjects.length === 0) return new Set();

  const thesisIds = new Set(thesisSubjects.map((s) => s.id));
  const unlocksThesis = new Set<string>();

  // Encontrar todas las materias que son correlativas directas del Proyecto Final
  edges.forEach((edge) => {
    if (thesisIds.has(edge.to)) {
      unlocksThesis.add(edge.from);
    }
  });

  return unlocksThesis;
}

/**
 * Genera recomendaciones con razones explicativas y scoring basado en prioridades
 */
export function getRecommendationsWithReasons(
  subjects: Subject[],
  edges: GraphEdge[],
  desiredCount: number,
  excludeIds: string[] = [],
  timetables?: { subjectId: string }[],
): RecommendationWithReason[] {
  const excludeSet = new Set(excludeIds);
  const subjectByPlanCode = buildSubjectByPlanCode(subjects);

  // Both DISPONIBLE and RECURSADA are valid candidates
  const available = subjects.filter(
    (subject) =>
      (subject.status === SubjectStatus.DISPONIBLE ||
        subject.status === SubjectStatus.RECURSADA) &&
      !excludeSet.has(subject.id) &&
      subject.correlativeIds.every((reqCode: string) => {
        const required = subjectByPlanCode.get(reqCode);
        return (
          !required ||
          required.status === SubjectStatus.APROBADA ||
          required.status === SubjectStatus.EQUIVALENCIA
        );
      }),
  );

  if (available.length === 0) return [];

  const distanceToSink = computeDistanceToSink(subjects, edges);
  const { nodeIds: criticalNodes } = buildCriticalPathFromDistance(
    edges,
    distanceToSink,
  );
  const unlocksThesis = getSubjectsThatUnlockThesis(subjects, edges);
  const unlockMap = buildUnlockMap(edges);
  const scheduledIds = new Set((timetables ?? []).map((t) => t.subjectId));

  const scored = available.map((subject) => {
    const reasons: string[] = [];
    let score = 0;

    // Prioridad 1: Título Intermedio (+100)
    if (subject.isIntermediateDegree) {
      reasons.push("📌 Título Intermedio");
      score += 100;
    }

    // Prioridad 2: Desbloquea Proyecto Final (+80)
    if (unlocksThesis.has(subject.id)) {
      reasons.push("🎯 Desbloquea Proyecto Final");
      score += 80;
    }

    // Prioridad 3: Camino Crítico (+50)
    if (criticalNodes.has(subject.id)) {
      reasons.push("🔥 Camino Crítico");
      score += 50;
    }

    // Prioridad 4: Desbloquea otras materias (+10 por cada una)
    const unlocksCount = unlockMap.get(subject.id) ?? 0;
    if (unlocksCount > 0) {
      reasons.push(
        `🔓 Desbloquea ${unlocksCount} ${unlocksCount === 1 ? "materia" : "materias"}`,
      );
      score += unlocksCount * 10;
    }

    // Desempate: distancia al sink
    const distance = distanceToSink.get(subject.id) ?? 0;
    score += distance * 0.1;

    // Penalización: materias optativas tienen prioridad mínima
    if (subject.isOptional) {
      score -= 1000;
      reasons.push('⚠️ Materia Optativa (baja prioridad)');
    }

    return {
      subject,
      reasons,
      score,
    };
  });

  // Detectar si todas las disponibles tienen score base 0
  // (caso típico de alumnos de 5to año donde ya no quedan correlativas que desbloquear)
  const allScoresZero = scored.every((s) => s.score === 0);

  if (allScoresZero) {
    // Prioridad especial: Proyecto Final primero (+200)
    scored.forEach((s) => {
      if (s.subject.name === PROYECTO_FINAL_NAME) {
        s.score += 200;
        s.reasons.unshift("⭐ Proyecto Final");
      }
    });

    // Segundo criterio: materias que ya tienen horario cargado
    if (scheduledIds.size > 0) {
      scored.forEach((s) => {
        if (scheduledIds.has(s.subject.id)) {
          s.score += 10;
          s.reasons.push("📅 Horario asignado");
        }
      });
    }
  }

  // Ordenar por score (descendente), luego por año (ascendente)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.subject.year - b.subject.year;
  });

  return scored.slice(0, desiredCount);
}

