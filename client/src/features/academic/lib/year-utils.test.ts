import { describe, it, expect } from 'vitest';
import { groupSubjectsByYear, getYearLabel } from './year-utils';
import type { Subject } from '../../../shared/types/academic';
import { SubjectStatus } from '../../../shared/types/academic';

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

describe('groupSubjectsByYear', () => {
  it('should return an empty map for an empty array', () => {
    const result = groupSubjectsByYear([]);
    expect(result.size).toBe(0);
  });

  it('should group subjects by year correctly', () => {
    const subjects = [
      makeSubject('a', 1),
      makeSubject('b', 1),
      makeSubject('c', 2),
    ];
    const result = groupSubjectsByYear(subjects);
    expect(result.size).toBe(2);
    expect(result.get(1)).toHaveLength(2);
    expect(result.get(2)).toHaveLength(1);
  });

  it('should create a new group for each unique year', () => {
    const subjects = [makeSubject('x', 3), makeSubject('y', 4), makeSubject('z', 5)];
    const result = groupSubjectsByYear(subjects);
    expect(result.size).toBe(3);
    expect(result.get(3)![0].id).toBe('x');
  });

  it('should handle year 0 (transversal subjects)', () => {
    const subjects = [makeSubject('t1', 0), makeSubject('t2', 0)];
    const result = groupSubjectsByYear(subjects);
    expect(result.get(0)).toHaveLength(2);
  });
});

describe('getYearLabel', () => {
  it('should return "TRANSVERSAL" for year 0', () => {
    expect(getYearLabel(0)).toBe('TRANSVERSAL');
  });

  it('should return "AÑO 1" for year 1', () => {
    expect(getYearLabel(1)).toBe('AÑO 1');
  });

  it('should return "AÑO 5" for year 5', () => {
    expect(getYearLabel(5)).toBe('AÑO 5');
  });

  it('should handle any positive integer year', () => {
    expect(getYearLabel(10)).toBe('AÑO 10');
  });
});
