import bcrypt from "bcryptjs";
import { sql } from "../_lib/db.js";
import { clientIp, error, json, readJson } from "../_lib/http.js";
import { isRateLimited, recordAttempt } from "../_lib/rateLimit.js";
import { createSession } from "../_lib/session.js";
import { parseCredentials } from "../_lib/validate.js";

// Compared against when the email doesn't exist, so a wrong email takes as
// long as a wrong password and response time doesn't reveal which accounts exist
const DUMMY_HASH = "$2b$10$UE0j4vnbyhzAWpZeB3bhhudfnoGRmhUegUavMkLe1dtRPEJkUfi0.";

export async function POST(request: Request) {
    const creds = parseCredentials(await readJson(request));
    if (!creds) return error(400, "Send an email and password as JSON.");

    const key = `login:${clientIp(request)}`;
    if (await isRateLimited(key, 10, 15)) return error(429, "Too many attempts. Try again in 15 minutes.");

    const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${creds.email}`;
    const row = rows[0] as { id: string; email: string; password_hash: string } | undefined;
    const ok = await bcrypt.compare(creds.password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !ok) {
        await recordAttempt(key);   // only failures count toward the limit
        return error(401, "Incorrect email or password.");
    }

    return json({ user: { id: row.id, email: row.email } }, 200, { "set-cookie": await createSession(row.id) });
}
