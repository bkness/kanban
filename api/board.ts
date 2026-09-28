import { sql } from "./_lib/db.js";
import { error, json, readJson } from "./_lib/http.js";
import { getUser } from "./_lib/session.js";
import { isBoardData } from "./_lib/validate.js";

type Saved = { data: unknown; version: number };

async function current(userId: string): Promise<Saved> {
    const rows = await sql`SELECT data, version FROM boards WHERE user_id = ${userId}`;
    return (rows[0] as Saved | undefined) ?? { data: null, version: 0 };
}

// version 0 = no board saved yet
export async function GET(request: Request) {
    const user = await getUser(request);
    if (!user) return error(401, "Not signed in.");
    return json(await current(user.id));
}

// Optimistic lock: the client sends the version its edits are based on. If
// another tab or device saved in between, nothing is written and the client
// gets 409 with the newer board to load instead.
export async function PUT(request: Request) {
    const user = await getUser(request);
    if (!user) return error(401, "Not signed in.");

    const body = await readJson<{ data?: unknown; version?: unknown }>(request);
    if (!body || !Number.isInteger(body.version) || !isBoardData(body.data)) {
        return error(400, "Send { data, version } with a valid board.");
    }
    const version = body.version as number;
    const data = JSON.stringify(body.data);

    const rows = version === 0
        ? await sql`
            INSERT INTO boards (user_id, data) VALUES (${user.id}, ${data}::jsonb)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING version`
        : await sql`
            UPDATE boards SET data = ${data}::jsonb, version = version + 1, updated_at = now()
            WHERE user_id = ${user.id} AND version = ${version}
            RETURNING version`;

    if (rows.length === 0) return json(await current(user.id), 409);
    return json({ version: (rows[0] as { version: number }).version });
}
