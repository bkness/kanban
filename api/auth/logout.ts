import { endSession } from "../_lib/session.js";

export async function POST(request: Request) {
    return new Response(null, { status: 204, headers: { "set-cookie": await endSession(request) } });
}
