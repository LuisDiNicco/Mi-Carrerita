import dagre from "dagre";
import type { Subject } from "../../../shared/types/academic";

export const GRAPH_LAYOUT = {
  rankSep: 250,
  nodeSep: 120,
  marginX: 80,
  marginY: 80,
  nodeWidth: 180,
  nodeHeight: 100,
};

export interface LayoutPosition {
  x: number;
  y: number;
}

export function layoutNodesByYear(
  subjects: Subject[],
  edges: { from: string; to: string }[],
): LayoutPosition[] {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    ranksep: GRAPH_LAYOUT.rankSep,
    nodesep: GRAPH_LAYOUT.nodeSep,
    marginx: GRAPH_LAYOUT.marginX,
    marginy: GRAPH_LAYOUT.marginY,
  });

  subjects.forEach((subject) => {
    graph.setNode(subject.id, {
      width: GRAPH_LAYOUT.nodeWidth,
      height: GRAPH_LAYOUT.nodeHeight,
      rank: subject.year,
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
}
