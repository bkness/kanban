import { neon } from "@neondatabase/serverless";

// Neon's HTTP driver: one fetch per query, no pool to manage — a good fit
// for short-lived functions. Files under api/_lib aren't routes.
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export const sql = neon(url);
