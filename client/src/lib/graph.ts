import type { Subject } from '../types/academic';
import { SubjectStatus } from '../types/academic';

export const GRAPH_LAYOUT = {
  nodeWidth: 280,
  nodeHeight: 200,
  rankSep: 160,
  nodeSep: 120,
  marginX: 60,
  marginY: 60,
};

export const PROGRESS_CHECKPOINTS = [25, 50, 75, 100];

export const SEARCH_RESULTS_LIMIT = 6;

export type GraphEdge = {
  from: string;
  to: string;
};

const RECOMMENDATION_BONUS = 2;

export function buildEdges(subjects: Subject[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const byPlanCode = new Map(subjects.map((subject) => [subject.planCode, subject.id]));

  subjects.forEach((subject) => {
    subject.requiredSubjectIds.forEach((requiredCode) => {
      const requiredId = byPlanCode.get(requiredCode);
      if (requiredId) {
        edges.push({ from: requiredId, to: subject.id });
      }
    });
  });

  return edges;
}

export function getCriticalPath(subjects: Subject[], edges: GraphEdge[]): {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
} {
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
  const parent = new Map<string, string | null>();
  nodeIds.forEach((id) => {
    distance.set(id, 0);
    parent.set(id, null);
  });

  topo.forEach((node) => {
    const currentDistance = distance.get(node) ?? 0;
    adjacency.get(node)?.forEach((next) => {
      const nextDistance = currentDistance + 1;
      if (nextDistance > (distance.get(next) ?? 0)) {
        distance.set(next, nextDistance);
        parent.set(next, node);
      }
    });
  });

  let maxNode: string | null = null;
  let maxDistance = -1;
  distance.forEach((value, key) => {
    if (value > maxDistance) {
      maxDistance = value;
      maxNode = key;
    }
  });

  const criticalNodeIds = new Set<string>();
  const criticalEdgeIds = new Set<string>();
  let cursor: string | null = maxNode;
  while (cursor) {
    criticalNodeIds.add(cursor);
    const prev: string | null = parent.get(cursor) ?? null;
    if (prev) {
      criticalEdgeIds.add(`${prev}-${cursor}`);
    }
    cursor = prev;
  }

  return { nodeIds: criticalNodeIds, edgeIds: criticalEdgeIds };
}

export function getRecommendations(
  subjects: Subject[],
  edges: GraphEdge[],
  desiredCount: number
): Subject[] {
  const available = subjects.filter(
    (subject) => subject.status === SubjectStatus.DISPONIBLE && !subject.isOptional
  );

  if (available.length === 0) return [];

  const { nodeIds: criticalNodes } = getCriticalPath(subjects, edges);
  const distanceToSink = getLongestDistanceToSink(subjects, edges);

  const scored = available.map((subject) => {
    const base = distanceToSink.get(subject.id) ?? 0;
    const bonus = criticalNodes.has(subject.id) ? RECOMMENDATION_BONUS : 0;
    return {
      subject,
      score: base + bonus,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.subject.semester - b.subject.semester);

  return scored.slice(0, desiredCount).map((entry) => entry.subject);
}

function getLongestDistanceToSink(subjects: Subject[], edges: GraphEdge[]): Map<string, number> {
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
    const maxNext = Math.max(...nextNodes.map((next) => distance.get(next) ?? 0));
    distance.set(node, maxNext + 1);
  }

  return distance;
}
