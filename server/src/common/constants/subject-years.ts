export interface YearInfo {
  year: number;
  isIntermediateDegree: boolean;
}

export const SUBJECT_YEAR_MAP: Record<string, YearInfo> = {
  // PRIMER AÑO
  '3621': { year: 1, isIntermediateDegree: true },
  '3622': { year: 1, isIntermediateDegree: true },
  '3623': { year: 1, isIntermediateDegree: true },
  '3624': { year: 1, isIntermediateDegree: true },
  '3625': { year: 1, isIntermediateDegree: true },
  '3626': { year: 1, isIntermediateDegree: true },
  '3627': { year: 1, isIntermediateDegree: true },
  '3628': { year: 1, isIntermediateDegree: true },
  '3629': { year: 1, isIntermediateDegree: true },
  '3630': { year: 1, isIntermediateDegree: true },
  '3631': { year: 1, isIntermediateDegree: true },
  '3632': { year: 1, isIntermediateDegree: true },
  '911': { year: 1, isIntermediateDegree: true },
  '901': { year: 1, isIntermediateDegree: true },
  '912': { year: 1, isIntermediateDegree: true },
  '902': { year: 1, isIntermediateDegree: true },

  // SEGUNDO AÑO
  '3633': { year: 2, isIntermediateDegree: true },
  '3634': { year: 2, isIntermediateDegree: true },
  '3635': { year: 2, isIntermediateDegree: true },
  '3636': { year: 2, isIntermediateDegree: true },
  '3637': { year: 2, isIntermediateDegree: true },
  '3638': { year: 2, isIntermediateDegree: true },
  '3639': { year: 2, isIntermediateDegree: true },
  '3640': { year: 2, isIntermediateDegree: true },
  '3641': { year: 2, isIntermediateDegree: true },
  '3642': { year: 2, isIntermediateDegree: true },
  '3643': { year: 2, isIntermediateDegree: true },
  '3644': { year: 2, isIntermediateDegree: true },
  '3676': { year: 2, isIntermediateDegree: true },
  '3680': { year: 2, isIntermediateDegree: true },
  '903': { year: 2, isIntermediateDegree: true },
  '904': { year: 2, isIntermediateDegree: true },

  // TERCER AÑO
  '3645': { year: 3, isIntermediateDegree: true },
  '3646': { year: 3, isIntermediateDegree: true },
  '3647': { year: 3, isIntermediateDegree: true },
  '3648': { year: 3, isIntermediateDegree: true },
  '3649': { year: 3, isIntermediateDegree: true },
  '3650': { year: 3, isIntermediateDegree: true },
  '3651': { year: 3, isIntermediateDegree: true },
  '3652': { year: 3, isIntermediateDegree: true },
  '3653': { year: 3, isIntermediateDegree: true },
  '3654': { year: 3, isIntermediateDegree: true },
  '3655': { year: 3, isIntermediateDegree: true },
  '3675': { year: 3, isIntermediateDegree: true },

  // CUARTO AÑO
  '3656': { year: 4, isIntermediateDegree: false },
  '3657': { year: 4, isIntermediateDegree: false },
  '3658': { year: 4, isIntermediateDegree: false },
  '3659': { year: 4, isIntermediateDegree: false },
  '3660': { year: 4, isIntermediateDegree: false },
  '3661': { year: 4, isIntermediateDegree: false },
  '3662': { year: 4, isIntermediateDegree: false },
  '3663': { year: 4, isIntermediateDegree: false },
  '3664': { year: 4, isIntermediateDegree: false },
  '3665': { year: 4, isIntermediateDegree: false },
  '3666': { year: 4, isIntermediateDegree: false },
  '3667': { year: 4, isIntermediateDegree: false },

  // QUINTO AÑO
  '3668': { year: 5, isIntermediateDegree: false },
  '3669': { year: 5, isIntermediateDegree: false },
  '3670': { year: 5, isIntermediateDegree: false },
  '3671': { year: 5, isIntermediateDegree: false },
  '3672': { year: 5, isIntermediateDegree: false },
  '3673': { year: 5, isIntermediateDegree: false },
  '3674': { year: 5, isIntermediateDegree: false },
};

export function getYearInfo(planCode: string): YearInfo {
  return (
    SUBJECT_YEAR_MAP[planCode] || {
      year: 0,
      isIntermediateDegree: false,
    }
  );
}

export function isIntermediateDegreeSubject(planCode: string): boolean {
  return getYearInfo(planCode).isIntermediateDegree;
}
