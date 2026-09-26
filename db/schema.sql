-- Kanban accounts + cloud sync. Apply once per database:
--   psql "$DATABASE_URL" -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text NOT NULL UNIQUE,          -- stored lowercased
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Session tokens live only in the user's cookie; the DB keeps a SHA-256 of
-- each, so a leaked table can't be replayed as logins.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash text PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

-- One board per user, stored as the client's normalized state. `version`
-- is an optimistic lock: a save must name the version it was based on.
CREATE TABLE IF NOT EXISTS boards (
    user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data       jsonb NOT NULL,
    version    integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Failed sign-in / sign-up attempts, for rate limiting across function
-- instances (an in-memory counter resets on every cold start).
CREATE TABLE IF NOT EXISTS auth_attempts (
    key text NOT NULL,                           -- "login:<ip>", "signup:<ip>"
    at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_key_at_idx ON auth_attempts (key, at);
