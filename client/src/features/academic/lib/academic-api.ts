import type { Subject } from "../../../shared/types/academic";
import { authFetch } from "../../auth/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchAcademicGraph(): Promise<Subject[]> {
  const response = await authFetch(`${API_URL}/academic-career/graph`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data: Subject[] = await response.json();
  return data;
}

export async function updateSubjectRecord(
  subjectId: string,
  payload: {
    status: string;
    grade?: number | null;
    difficulty?: number | null;
    notes?: string | null;
    statusDate?: string | null;
    isIntermediate?: boolean;
  }
): Promise<Subject> {
  const response = await authFetch(`${API_URL}/academic-career/subjects/${subjectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export interface AcademicHistoryRecord {
  id: string;
  status: string;
  finalGrade: number | null;
  statusDate: string | null;
  subject: {
    name: string;
    planCode: string;
    year: number;
  };
}

export async function fetchAcademicHistory(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ data: AcademicHistoryRecord[]; total: number; page: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", String(params.page));
  if (params?.limit) query.append("limit", String(params.limit));
  if (params?.search) query.append("search", params.search);

  const response = await authFetch(`${API_URL}/academic-history?${query.toString()}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ========================
// PDF Upload Functions
// ========================

/** Parsed record returned by the backend after uploading a Historia Académica PDF */
export interface ParsedAcademicRecord {
  planCode: string;
  name: string;
  date: string; // DD/MM/YYYY
  grade: number | null;
  acta: string;
}

/** Upload a Historia Académica PDF and receive parsed records for preview */
export async function uploadHistoriaPdf(
  file: File
): Promise<{ data: ParsedAcademicRecord[] }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await authFetch(`${API_URL}/history/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message || `Error ${response.status}: No se pudo procesar el PDF.`);
  }

  return response.json();
}

/** Batch record DTO for saving */
export interface BatchAcademicRecordPayload {
  planCode: string;
  status: string;
  finalGrade?: number | null;
  statusDate?: string | null; // ISO date
}

/** Save batch of parsed academic records */
export async function batchSaveHistory(
  records: BatchAcademicRecordPayload[]
): Promise<{ count: number }> {
  const response = await authFetch(`${API_URL}/history/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });

  if (!response.ok) {
    throw new Error("Error al guardar los registros.");
  }

  return response.json();
}
