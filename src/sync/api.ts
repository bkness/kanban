import type { BoardData } from "./boardData";

export type User = { id: string; email: string };
export type SavedBoard = { data: BoardData | null; version: number };

export class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(path, {
        ...init,
        credentials: "same-origin",
        headers: init.body ? { "content-type": "application/json", ...init.headers } : init.headers,
    });
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const body = isJson ? await res.json() : null;
    // A non-JSON reply means there's no API here (e.g. `vite preview`)
    if (!isJson && res.status !== 204) throw new ApiError(res.status || 503, "Accounts are unavailable here.");
    if (!res.ok && res.status !== 409) throw new ApiError(res.status, body?.error ?? "Something went wrong.");
    return body as T;
}

export const api = {
    me: () => request<{ user: User }>("/api/auth/me"),
    login: (email: string, password: string) =>
        request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    signup: (email: string, password: string) =>
        request<{ user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: () => request<null>("/api/auth/logout", { method: "POST" }),
    getBoard: () => request<SavedBoard>("/api/board"),

    // 200 → { version }; 409 → the newer SavedBoard to load instead
    async putBoard(data: BoardData, version: number, keepalive = false) {
        const res = await fetch("/api/board", {
            method: "PUT",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ data, version }),
            keepalive,          // lets a save finish while the tab is closing
        });
        const body = await res.json().catch(() => null);
        if (res.status === 409) return { conflict: true as const, ...(body as SavedBoard) };
        if (!res.ok) throw new ApiError(res.status, body?.error ?? "Save failed.");
        return { conflict: false as const, version: (body as { version: number }).version };
    },
};
