/**
 * Academic History helpers
 * Query building and filtering logic
 */

import { Prisma } from '@prisma/client';
import { AcademicHistoryFilterDto } from '../dto';

/**
 * Build Prisma where clause from filter DTO
 */
export function buildWhereClause(
  userId: string,
  filter: AcademicHistoryFilterDto,
): Prisma.AcademicRecordWhereInput {
  const where: Prisma.AcademicRecordWhereInput = { userId };

  // Date range filter
  if (filter.dateFrom || filter.dateTo) {
    where.statusDate = {};
    if (filter.dateFrom) {
      where.statusDate.gte = new Date(filter.dateFrom);
    }
    if (filter.dateTo) {
      where.statusDate.lte = new Date(filter.dateTo);
    }
  }

  // Grade range filter
  if (filter.gradeMin !== undefined || filter.gradeMax !== undefined) {
    where.finalGrade = {};
    if (filter.gradeMin !== undefined) {
      where.finalGrade.gte = filter.gradeMin;
    }
    if (filter.gradeMax !== undefined) {
      where.finalGrade.lte = filter.gradeMax;
    }
  }

  // Status filter
  if (filter.status) {
    where.status = filter.status;
  }

  // Intermediate/Final filter
  if (filter.isIntermediate !== undefined) {
    where.isIntermediate = filter.isIntermediate;
  }

  return where;
}

/**
 * Build Prisma where clause for subject filters
 */
export function buildSubjectWhereClause(
  filter: AcademicHistoryFilterDto,
): Prisma.SubjectWhereInput {
  const where: Prisma.SubjectWhereInput = {};

  // Subject code filter
  if (filter.planCode) {
    where.planCode = { contains: filter.planCode };
  }

  // Subject year filter
  if (filter.year !== undefined) {
    where.year = filter.year;
  }

  return where;
}

/**
 * Infer semester from year and date
 */
export function inferSemesterFromDate(date: Date | null, year: number): number {
  if (!date) return 1; // Default to semester 1 if no date
  const month = date.getMonth() + 1; // 1-12
  // First semester: Jan-Jun (1-6), Second semester: Jul-Dec (7-12)
  return month <= 6 ? 1 : 2;
}

/**
 * Build order by clause
 */
export function buildOrderByClause(
  sortBy?: string,
): Prisma.AcademicRecordOrderByWithRelationInput {
  const sort = sortBy || 'date';

  const orderBy: Prisma.AcademicRecordOrderByWithRelationInput =
    sort === 'grade'
      ? { finalGrade: 'desc' }
      : sort === 'code'
        ? { subject: { planCode: 'asc' } }
        : sort === 'status'
          ? { status: 'asc' }
          : { statusDate: 'desc' };

  return orderBy;
}
