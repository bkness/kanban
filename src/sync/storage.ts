// Where the board persists in localStorage. Guests use the original key;
// a signed-in user gets their own key, which doubles as an offline cache of
// their cloud board — so signing in never overwrites the guest board.
export const GUEST_KEY = "kanban-storage";
const SAMPLE_KEY = "kanban-storage:sample";
const USER_HINT_KEY = "kanban-user";

export const userKey = (userId: string) => `kanban-storage:${userId}`;

// Remembered so a reload shows the account's cached board immediately,
// instead of flashing the guest board while /api/auth/me is in flight
export function readUserHint() {
    try {
        return localStorage.getItem(USER_HINT_KEY);
    } catch {
        return null;
    }
}

export function writeUserHint(userId: string | null) {
    try {
        if (userId) localStorage.setItem(USER_HINT_KEY, userId);
        else localStorage.removeItem(USER_HINT_KEY);
    } catch {
        // storage unavailable (private mode): the hint is only an optimization
    }
}

// ?sample opens a busy demo board (store/sampleBoard.ts) under its own key,
// so it never touches the guest or account board. Sync is off there.
export const isSampleMode = () => {
    try {
        return new URLSearchParams(window.location.search).has("sample");
    } catch {
        return false;
    }
};

export const initialStorageKey = () => {
    if (isSampleMode()) return SAMPLE_KEY;
    const hint = readUserHint();
    return hint ? userKey(hint) : GUEST_KEY;
};
