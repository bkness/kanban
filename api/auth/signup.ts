import bcrypt from "bcryptjs";
import { sql } from "../_lib/db.js";
import { clientIp, error, json, readJson } from "../_lib/http.js";
import { isRateLimited, recordAttempt } from "../_lib/rateLimit.js";
import { createSession } from "../_lib/session.js";
import { EMAIL_RE, PASSWORD_MAX, PASSWORD_MIN, parseCredentials } from "../_lib/validate.js";

export async function POST(request: Request) {
    const creds = parseCredentials(await readJson(request));
    if (!creds) return error(400, "Send an email and password as JSON.");
    const { email, password } = creds;
    if (!EMAIL_RE.test(email) || email.length > 254) return error(400, "That doesn't look like an email address.");
    if (password.length < PASSWORD_MIN) return error(400, `Password must be at least ${PASSWORD_MIN} characters.`);
    if (new TextEncoder().encode(password).length > PASSWORD_MAX) return error(400, "Password is too long.");

    // Every signup counts (not just failures): it stops account spam from one IP
    const key = `signup:${clientIp(request)}`;
    if (await isRateLimited(key, 5, 60)) return error(429, "Too many sign-ups. Try again in an hour.");
    await recordAttempt(key);

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
        INSERT INTO users (email, password_hash) VALUES (${email}, ${hash})
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email`;
    const user = rows[0] as { id: string; email: string } | undefined;
    if (!user) return error(409, "An account with that email already exists. Sign in instead.");

    return json({ user }, 201, { "set-cookie": await createSession(user.id) });
}
