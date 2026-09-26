export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;   // bcrypt ignores bytes past 72

export function parseCredentials(body: unknown) {
    if (!body || typeof body !== "object") return null;
    const { email, password } = body as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string") return null;
    return { email: email.trim().toLowerCase(), password };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);

// Shape check for a saved board: the five keys the client's store persists.
// Enough to reject garbage; the client owns the finer invariants.
export function isBoardData(v: unknown) {
    return isRecord(v)
        && isRecord(v.columns) && isRecord(v.cards) && isRecord(v.cardOrder) && isRecord(v.labels)
        && Array.isArray(v.columnOrder) && v.columnOrder.every((id) => typeof id === "string");
}
