import {
  SubjectStatus,
  CorrelativityCondition,
  isSubjectStatus,
} from '../../../common/constants/academic-enums';
import type { SubjectWithRecords } from '../types/subject-with-records.type';

export function resolveSubjectStatus(
  subject: SubjectWithRecords,
  finalApprovedIds: Set<string>,
  regularApprovedIds: Set<string>,
): SubjectStatus {
  const record = subject.records[0];

  let status: SubjectStatus = SubjectStatus.PENDIENTE;

  if (record && isSubjectStatus(record.status)) {
    status = record.status;
  }

  if (status !== SubjectStatus.PENDIENTE) {
    return status;
  }

  const meetsAllPrerequisites = subject.prerequisites.every((req) => {
    const prereqId = req.prerequisiteId;

    if (req.condition === CorrelativityCondition.FINAL_APROBADO) {
      return finalApprovedIds.has(prereqId);
    }

    if (req.condition === CorrelativityCondition.REGULAR_CURSADA) {
      return regularApprovedIds.has(prereqId);
    }

    return true;
  });

  return meetsAllPrerequisites ? SubjectStatus.DISPONIBLE : status;
}
