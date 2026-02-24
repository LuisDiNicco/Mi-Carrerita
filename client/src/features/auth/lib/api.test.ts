/**
 * Tests for auth/lib/api.ts
 * Covers: extractApiMessage (via thrown errors), registerUser, loginUser, authFetch
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth";
import { registerUser, loginUser, authFetch } from "./api";

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
    clone: vi.fn(),
  } as unknown as Response;
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  clearAccessToken();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("registerUser", () => {
  it("sets access token and returns data on success", async () => {
    const mockData = { accessToken: "tok-abc", user: { id: "1", email: "u@e.com", name: "User" } };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(201, mockData));
    const result = await registerUser({ email: "u@e.com", password: "Pass1234" });
    expect(result.accessToken).toBe("tok-abc");
    expect(getAccessToken()).toBe("tok-abc");
  });

  it("throws with server string message on 400", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(400, { message: "El email ya existe." }));
    await expect(registerUser({ email: "dup@e.com", password: "Pass1234" })).rejects.toThrow("El email ya existe.");
  });

  it("joins array of messages on validation error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mockResponse(400, { message: ["El email no es valido.", "La contrasena es muy corta."] })
    );
    await expect(registerUser({ email: "bad", password: "1" })).rejects.toThrow("El email no es valido.");
  });

  it("uses fallback message when server returns null", async () => {
    const badResp = { ok: false, status: 500, json: vi.fn().mockRejectedValue(new Error("no json")) } as unknown as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(badResp);
    await expect(registerUser({ email: "u@e.com", password: "Pass1234" })).rejects.toThrow("No se pudo crear la cuenta");
  });
});

describe("loginUser", () => {
  it("sets access token and returns data on success", async () => {
    const mockData = { accessToken: "tok-login", user: { id: "2", email: "l@e.com", name: "Logg" } };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(200, mockData));
    const result = await loginUser({ email: "l@e.com", password: "Pass1234" });
    expect(result.accessToken).toBe("tok-login");
    expect(getAccessToken()).toBe("tok-login");
  });

  it("throws with server string message on 401", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(401, { message: "Credenciales incorrectas." }));
    await expect(loginUser({ email: "x@e.com", password: "wrong" })).rejects.toThrow("Credenciales incorrectas.");
  });

  it("uses fallback message when body is not parseable", async () => {
    const badResp = { ok: false, status: 500, json: vi.fn().mockRejectedValue(new Error("no json")) } as unknown as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(badResp);
    await expect(loginUser({ email: "x@e.com", password: "pass" })).rejects.toThrow("No se pudo iniciar");
  });
});

describe("authFetch", () => {
  it("includes Authorization header when a token is set", async () => {
    setAccessToken("my-token");
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse(200, {}));
    globalThis.fetch = fetchSpy;
    await authFetch("http://test.com/api/data");
    const calledHeaders = fetchSpy.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get("Authorization")).toBe("Bearer my-token");
  });

  it("does not include Authorization header when no token set", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse(200, {}));
    globalThis.fetch = fetchSpy;
    await authFetch("http://test.com/api/data");
    const calledHeaders = fetchSpy.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get("Authorization")).toBeNull();
  });

  it("returns response directly for non-401 status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse(200, { data: "ok" }));
    const result = await authFetch("http://test.com/api/data");
    expect(result.status).toBe(200);
  });

  it("retries with new token on 401 when refresh succeeds", async () => {
    setAccessToken("old-token");
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(mockResponse(401, { message: "Unauthorized" }))
      .mockResolvedValueOnce(mockResponse(200, { accessToken: "new-token" }))
      .mockResolvedValueOnce(mockResponse(200, { data: "success" }));
    globalThis.fetch = fetchSpy;
    const result = await authFetch("http://test.com/api/protected");
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(result.status).toBe(200);
    expect(getAccessToken()).toBe("new-token");
  });

  it("returns 401 and clears token when refresh fails", async () => {
    setAccessToken("expired-token");
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(mockResponse(401, { message: "Unauthorized" }))
      .mockResolvedValueOnce(mockResponse(401, { message: "Refresh failed" }));
    globalThis.fetch = fetchSpy;
    const result = await authFetch("http://test.com/api/protected");
    expect(result.status).toBe(401);
    expect(getAccessToken()).toBeNull();
  });
});
