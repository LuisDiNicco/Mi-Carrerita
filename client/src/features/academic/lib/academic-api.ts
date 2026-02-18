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
  if (!Array.isArray(data)) {
    throw new Error("Invalid academic graph response");
  }

  return data;
}
