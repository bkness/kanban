import { sql } from "./db.js";

// Counts attempts in Postgres so the limit holds across function instances.
// Returns true when the key is over its limit for the window.
export async function isRateLimited(key: string, max: number, windowMinutes: number) {
    const rows = await sql`
        SELECT count(*)::int AS n FROM auth_attempts
        WHERE key = ${key} AND at > now() - make_interval(mins => ${windowMinutes})`;
    return (rows[0] as { n: number }).n >= max;
}

export async function recordAttempt(key: string) {
    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;
    // Opportunistic cleanup keeps the table small without a cron job
    if (Math.random() < 0.05) await sql`DELETE FROM auth_attempts WHERE at < now() - interval '1 day'`;
}
