import { AcademicRecordWithSubject } from '../types/trophy.types';
import { SubjectStatus } from '../../../common/constants/academic-enums';

export function isPassed(r: AcademicRecordWithSubject): boolean {
    return (
        r.status === SubjectStatus.APROBADA ||
        r.status === SubjectStatus.EQUIVALENCIA
    );
}

export function groupBySemester(records: AcademicRecordWithSubject[]): Map<string, AcademicRecordWithSubject[]> {
    const groups = new Map<string, AcademicRecordWithSubject[]>();
    for (const r of records) {
        const semester = ('semester' in r.subject ? Number((r.subject as Record<string, unknown>).semester) : 1) || 1;
        const key = `${r.subject.year}-${semester}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(r);
    }
    return groups;
}

export function semesterIndex(key: string): number {
    const [year, semester] = key.split('-').map(Number);
    return year * 10 + (semester || 0);
}

export function checkOverallAverage(records: AcademicRecordWithSubject[], threshold: number): boolean {
    const grades = records
        .map((r) => r.finalGrade)
        .filter((grade): grade is number => typeof grade === 'number' && grade > 0);
    if (grades.length === 0) return false;
    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    return average >= threshold;
}

export function checkHoursCompleted(records: AcademicRecordWithSubject[], minHours: number): boolean {
    const completed = records
        .filter((r) => r.status === SubjectStatus.APROBADA || r.status === SubjectStatus.REGULARIZADA)
        .reduce((sum, r) => sum + (r.subject.hours || 0), 0);
    return completed >= minHours;
}
