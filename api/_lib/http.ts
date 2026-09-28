export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
    });

export const error = (status: number, message: string, headers: Record<string, string> = {}) =>
    json({ error: message }, status, headers);

// Mutating requests must be JSON. A cross-site <form> can't send
// application/json without a CORS preflight, which we never grant — so this
// plus SameSite=Lax on the cookie covers CSRF.
export async function readJson<T>(request: Request, maxBytes = 262_144): Promise<T | null> {
    if (!request.headers.get("content-type")?.includes("application/json")) return null;
    const text = await request.text();
    if (text.length > maxBytes) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

export const clientIp = (request: Request) =>
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
