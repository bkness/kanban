import { error, json } from "../_lib/http.js";
import { getUser } from "../_lib/session.js";

export async function GET(request: Request) {
    const user = await getUser(request);
    return user ? json({ user }) : error(401, "Not signed in.");
}
