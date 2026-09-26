import { createHash, randomBytes } from "node:crypto";
import { sql } from "./db.js";

const COOKIE = "kb_session";
const MAX_AGE_DAYS = 30;

export type User = { id: string; email: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function readCookie(request: Request, name: string) {
    const cookie = request.headers.get("cookie") ?? "";
    for (const part of cookie.split(";")) {
        const [k, ...v] = part.trim().split("=");
        if (k === name) return decodeURIComponent(v.join("="));
    }
    return null;
}

const cookieHeader = (value: string, maxAgeSeconds: number) =>
    `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;

// Creates a session and returns the Set-Cookie header for it
export async function createSession(userId: string) {
    const token = randomBytes(32).toString("base64url");
    await sql`
        INSERT INTO sessions (token_hash, user_id, expires_at)
        VALUES (${hashToken(token)}, ${userId}, now() + make_interval(days => ${MAX_AGE_DAYS}))`;
    return cookieHeader(token, MAX_AGE_DAYS * 24 * 60 * 60);
}

export async function getUser(request: Request): Promise<User | null> {
    const token = readCookie(request, COOKIE);
    if (!token) return null;
    const rows = await sql`
        SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()`;
    return (rows[0] as User | undefined) ?? null;
}

// Deletes the session and returns a Set-Cookie header that clears it
export async function endSession(request: Request) {
    const token = readCookie(request, COOKIE);
    if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
    return cookieHeader("", 0);
}
