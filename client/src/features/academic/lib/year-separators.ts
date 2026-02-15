import type { Node } from "@xyflow/react";
import type { Subject } from "../../../shared/types/academic";
import { GRAPH_LAYOUT } from "./graph-layout";
import { getYearLabel, groupSubjectsByYear } from "./year-utils";
import type { YearSeparatorNodeData } from "../components/YearSeparatorNode";

const SEPARATOR_Y_OFFSET = 60;
const MIN_WIDTH = 840;
const EXTRA_WIDTH = 240;
const X_PADDING = 120;

export function buildYearSeparatorNodes(
  subjects: Subject[],
  nodes: Node[],
): Node<YearSeparatorNodeData>[] {
  const subjectNodes = nodes.filter((node) => node.type === "subject");
  if (subjects.length === 0 || subjectNodes.length === 0) {
    return [];
  }

  const positionById = new Map(
    subjectNodes.map((node) => [node.id, node.position]),
  );
  const minX = Math.min(...subjectNodes.map((node) => node.position.x));
  const maxX = Math.max(...subjectNodes.map((node) => node.position.x));
  const width = Math.max(
    MIN_WIDTH,
    maxX - minX + GRAPH_LAYOUT.nodeWidth + EXTRA_WIDTH,
  );
  const x = minX - X_PADDING;

  const grouped = groupSubjectsByYear(subjects);
  const years = Array.from(grouped.keys()).sort((a, b) => a - b);

  return years.flatMap((year) => {
    const yearSubjects = grouped.get(year) ?? [];
    const positions = yearSubjects
      .map((subject) => positionById.get(subject.id))
      .filter(Boolean);

    if (positions.length === 0) {
      return [];
    }

    const maxY = Math.max(...positions.map((position) => position!.y));
    const y = maxY + GRAPH_LAYOUT.nodeHeight + SEPARATOR_Y_OFFSET;

    return [
      {
        id: `year-separator-${year}`,
        type: "yearSeparator",
        position: { x, y },
        data: { label: getYearLabel(year), width },
        draggable: false,
        selectable: false,
      },
    ];
  });
}
