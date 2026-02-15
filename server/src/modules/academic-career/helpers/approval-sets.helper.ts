import {
  SubjectStatus,
  isSubjectStatus,
} from '../../../common/constants/academic-enums';
import type { SubjectWithRecords } from '../types/subject-with-records.type';

export interface ApprovalSets {
  finalApprovedIds: Set<string>;
  regularApprovedIds: Set<string>;
}

export function buildApprovalSets(
  subjects: SubjectWithRecords[],
): ApprovalSets {
  const finalApprovedIds = new Set<string>();
  const regularApprovedIds = new Set<string>();

  subjects.forEach((subject) => {
    const record = subject.records[0];
    if (!record || !isSubjectStatus(record.status)) return;

    if (record.status === SubjectStatus.APROBADA) {
      finalApprovedIds.add(subject.id);
      regularApprovedIds.add(subject.id);
      return;
    }

    if (record.status === SubjectStatus.REGULARIZADA) {
      regularApprovedIds.add(subject.id);
    }
  });

  return { finalApprovedIds, regularApprovedIds };
}
