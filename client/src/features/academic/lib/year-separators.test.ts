import { describe, it, expect } from 'vitest';
import { buildYearSeparatorNodes } from './year-separators';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';
import type { Node } from '@xyflow/react';

const makeSubject = (id: string, year: number): Subject => ({
  id,
  planCode: `CODE${id}`,
  name: `Materia ${id}`,
  status: SubjectStatus.PENDIENTE,
  grade: null,
  difficulty: null,
  statusDate: null,
  notes: null,
  year,
  hours: 64,
  correlativeIds: [],
  isIntermediateDegree: false,
});

const makeNode = (id: string, x: number, y: number, type = 'subject'): Node => ({
  id,
  type,
  position: { x, y },
  data: {},
});

describe('buildYearSeparatorNodes', () => {
  it('returns empty array when subjects is empty', () => {
    const result = buildYearSeparatorNodes([], [makeNode('a', 0, 0)]);
    expect(result).toEqual([]);
  });

  it('returns empty array when nodes is empty', () => {
    const result = buildYearSeparatorNodes([makeSubject('a', 1)], []);
    expect(result).toEqual([]);
  });

  it('returns empty array when there are no subject-type nodes', () => {
    const nonSubjectNode = makeNode('sep1', 0, 0, 'yearSeparator');
    const result = buildYearSeparatorNodes([makeSubject('a', 1)], [nonSubjectNode]);
    expect(result).toEqual([]);
  });

  it('creates one separator node per year', () => {
    const subjects = [makeSubject('a', 1), makeSubject('b', 2)];
    const nodes = [makeNode('a', 0, 100), makeNode('b', 200, 200)];

    const result = buildYearSeparatorNodes(subjects, nodes);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('year-separator-1');
    expect(result[1].id).toBe('year-separator-2');
  });

  it('sets separator type to "yearSeparator"', () => {
    const subjects = [makeSubject('a', 1)];
    const nodes = [makeNode('a', 0, 100)];

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    expect(sep.type).toBe('yearSeparator');
  });

  it('separator is not draggable or selectable', () => {
    const subjects = [makeSubject('a', 1)];
    const nodes = [makeNode('a', 0, 100)];

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    expect(sep.draggable).toBe(false);
    expect(sep.selectable).toBe(false);
  });

  it('places separator below the lowest subject node in the year', () => {
    const subjects = [makeSubject('s1', 1), makeSubject('s2', 1)];
    const nodes = [makeNode('s1', 0, 100), makeNode('s2', 200, 300)];

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    // Should be placed below max Y (300) + nodeHeight + offset
    // We just verify it's below y=300
    expect(sep.position.y).toBeGreaterThan(300);
  });

  it('uses label from getYearLabel (AÑO X for year > 0)', () => {
    const subjects = [makeSubject('a', 3)];
    const nodes = [makeNode('a', 0, 100)];

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    expect((sep.data as { label: string }).label).toBe('AÑO 3');
  });

  it('uses TRANSVERSAL label for year 0', () => {
    const subjects = [makeSubject('t', 0)];
    const nodes = [makeNode('t', 0, 100)];

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    expect((sep.data as { label: string }).label).toBe('TRANSVERSAL');
  });

  it('skips year group if no matching node positions are found', () => {
    // subjects reference node ids that don't exist in the nodes array
    const subjects = [makeSubject('s1', 1)];
    const nodes = [makeNode('unrelated', 0, 100)]; // no node with id 's1'

    const result = buildYearSeparatorNodes(subjects, nodes);

    expect(result).toEqual([]);
  });

  it('sets width at least MIN_WIDTH (840) for narrow graphs', () => {
    const subjects = [makeSubject('a', 1)];
    const nodes = [makeNode('a', 0, 100)]; // single node, very narrow

    const [sep] = buildYearSeparatorNodes(subjects, nodes);

    expect((sep.data as { width: number }).width).toBeGreaterThanOrEqual(840);
  });

  it('handles multiple years and sorts them ascending', () => {
    const subjects = [makeSubject('a', 3), makeSubject('b', 1), makeSubject('c', 2)];
    const nodes = [
      makeNode('a', 400, 300),
      makeNode('b', 0, 100),
      makeNode('c', 200, 200),
    ];

    const result = buildYearSeparatorNodes(subjects, nodes);

    const ids = result.map((n) => n.id);
    expect(ids).toEqual(['year-separator-1', 'year-separator-2', 'year-separator-3']);
  });
});
