import { create } from "zustand";
import type { Subject } from "../../../shared/types/academic";
import { SubjectStatus } from "../../../shared/types/academic";

const ACADEMIC_STORAGE_KEY = "mi-carrerita-academic-guest";

// ---------------------------------------------------------------------------
// Auth getter — injected from outside to avoid circular imports.
// Defaults to "guest" so that if not configured the app is safe.
// ---------------------------------------------------------------------------
let _isGuestGetter: () => boolean = () => true;

export function configureAcademicStore(opts: { isGuestGetter: () => boolean }) {
  _isGuestGetter = opts.isGuestGetter;
}

// ---------------------------------------------------------------------------
// Availability recalculation
// ---------------------------------------------------------------------------
/**
 * Re-computes DISPONIBLE / PENDIENTE for every subject that hasn't been
 * "actioned" yet (not regularized, approved, etc.).
 *
 * A subject becomes DISPONIBLE when all of its correlativeIds (planCodes)
 * are present in the "passed" set.  We use the broadest set (mirrors the
 * server's regularApprovedIds: REGULARIZADA | APROBADA | EQUIVALENCIA |
 * RECURSADA | EN_CURSO) so that as soon as a subject is regularized its
 * dependents unlock.
 */
export function recalculateAvailability(subjects: Subject[]): Subject[] {
  const passedCodes = new Set<string>();
  for (const s of subjects) {
    if (
      s.status === SubjectStatus.REGULARIZADA ||
      s.status === SubjectStatus.APROBADA ||
      s.status === SubjectStatus.EQUIVALENCIA ||
      s.status === SubjectStatus.RECURSADA ||
      s.status === SubjectStatus.EN_CURSO
    ) {
      passedCodes.add(s.planCode);
    }
  }

  return subjects.map((subject) => {
    // Only recalculate for subjects that haven't been actioned yet
    if (
      subject.status !== SubjectStatus.PENDIENTE &&
      subject.status !== SubjectStatus.DISPONIBLE
    ) {
      return subject;
    }

    const correlatives = subject.correlativeIds ?? [];
    if (correlatives.length === 0) {
      return { ...subject, status: SubjectStatus.DISPONIBLE };
    }

    const allMet = correlatives.every((code) => passedCodes.has(code));
    return {
      ...subject,
      status: allMet ? SubjectStatus.DISPONIBLE : SubjectStatus.PENDIENTE,
    };
  });
}

// ---------------------------------------------------------------------------
// sessionStorage helpers
// ---------------------------------------------------------------------------
function saveGuestProgress(subjects: Subject[]): void {
  try {
    if (subjects.length === 0) {
      sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(ACADEMIC_STORAGE_KEY, JSON.stringify(subjects));
  } catch {
    // sessionStorage may be unavailable (private browsing limits, etc.)
  }
}

function clearGuestProgress(): void {
  try {
    sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
  } catch {
    // noop
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
interface AcademicState {
  subjects: Subject[];

  /**
   * Set all subjects with availability recalculation.
   * Guest users: also persists to sessionStorage.
   * Use this for local updates (manual edits, PDF batch apply, guest first load).
   */
  setSubjects: (subjects: Subject[]) => void;

  /**
   * Set subjects loaded from the server for an authenticated user.
   * Skips local recalculation (server already resolved availability).
   * Never persists to sessionStorage.
   */
  setSubjectsFromServer: (subjects: Subject[]) => void;

  /**
   * Update a single subject's fields.
   * Triggers availability recalculation + guest sessionStorage persistence.
   */
  updateSubject: (subjectId: string, patch: Partial<Subject>) => void;

  /** Clears in-memory subjects and the guest sessionStorage entry. */
  clearSubjects: () => void;

  /** Restore guest subjects from sessionStorage (called during app hydration). */
  hydrateFromLocal: () => void;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  subjects: [],

  setSubjects: (subjects) => {
    const recalculated = recalculateAvailability(subjects);
    set({ subjects: recalculated });
    if (_isGuestGetter()) {
      saveGuestProgress(recalculated);
    }
  },

  setSubjectsFromServer: (subjects) => {
    // Server already resolved availability — no recalculation needed.
    // Never persists to sessionStorage (authenticated users rely on DB).
    set({ subjects });
  },

  updateSubject: (subjectId, patch) => {
    const current = get().subjects;
    const updated = current.map((s) =>
      s.id === subjectId ? { ...s, ...patch } : s,
    );
    const recalculated = recalculateAvailability(updated);
    set({ subjects: recalculated });
    if (_isGuestGetter()) {
      saveGuestProgress(recalculated);
    }
  },

  clearSubjects: () => {
    set({ subjects: [] });
    clearGuestProgress();
  },

  hydrateFromLocal: () => {
    try {
      const stored = sessionStorage.getItem(ACADEMIC_STORAGE_KEY);
      if (stored) {
        const subjects = JSON.parse(stored) as Subject[];
        set({ subjects });
      }
    } catch {
      sessionStorage.removeItem(ACADEMIC_STORAGE_KEY);
    }
  },
}));

