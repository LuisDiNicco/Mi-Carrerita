import type { Subject } from "../../../shared/types/academic";

export function groupSubjectsByYear(
  subjects: Subject[],
): Map<number, Subject[]> {
  const grouped = new Map<number, Subject[]>();

  subjects.forEach((subject) => {
    const year = subject.year;
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(subject);
  });

  return grouped;
}

export function getYearLabel(year: number): string {
  if (year === 0) return "Transversal";
  return `Año ${year}`;
}
