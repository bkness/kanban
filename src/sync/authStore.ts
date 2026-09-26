import { create } from "zustand";
import { useKanbanStore } from "../store/kanbanStore";
import { starterBoard } from "../store/starterBoard";
import { api, ApiError, type User } from "./api";
import { boardChanged, boardData, type BoardData } from "./boardData";
import { GUEST_KEY, readUserHint, userKey, writeUserHint } from "./storage";

type SyncStatus = "idle" | "saving" | "saved" | "offline";

type AuthState = {
    status: "checking" | "guest" | "signed-in";
    user: User | null;
    sync: SyncStatus;
    notice: string | null;
    init: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    dismissNotice: () => void;
};

const SAVE_DELAY_MS = 800;

// Sync bookkeeping. Module-level rather than store state: none of it renders.
let version = 0;                  // server version the local board is based on
let dirty = false;                // local edits not yet saved
let saving = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let applyingRemote = false;       // true while loading a server board, so it isn't echoed back
let unsubscribe: (() => void) | null = null;
let listening = false;

export const useAuthStore = create<AuthState>()((set, get) => {
    const kanban = useKanbanStore;

    const applyRemote = (data: BoardData) => {
        applyingRemote = true;
        kanban.setState(data);
        applyingRemote = false;
    };

    const scheduleSave = () => {
        dirty = true;
        set({ sync: "saving" });
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void flush(), SAVE_DELAY_MS);
    };

    async function flush(keepalive = false) {
        if (timer) clearTimeout(timer);
        timer = null;
        if (!dirty || get().status !== "signed-in") return;
        if (saving) return;                 // the running save re-checks `dirty` when it finishes
        saving = true;
        dirty = false;
        let failed = false;
        try {
            const result = await api.putBoard(boardData(kanban.getState()), version, keepalive);
            if (result.conflict) {
                // Another tab/device saved first: its board wins, local edits since then are dropped
                if (result.data) applyRemote(result.data);
                version = result.version;
                dirty = false;
                set({ notice: "This board was changed in another tab or device, so it now shows that version." });
            } else {
                version = result.version;
            }
        } catch (e) {
            failed = true;
            dirty = true;
            if (e instanceof ApiError && e.status === 401) {
                await endLocalSession(false);
                set({ notice: "Your session expired. Sign in again to keep syncing." });
                return;
            }
            set({ sync: "offline" });       // retried on the next edit or when the browser comes back online
        } finally {
            saving = false;
        }
        if (failed) return;
        if (dirty) scheduleSave();
        else set({ sync: "saved" });
    }

    async function startSession(user: User) {
        writeUserHint(user.id);
        // From here on the store persists to this user's key; the guest board stays put
        kanban.persist.setOptions({ name: userKey(user.id) });
        set({ user, status: "signed-in", sync: "saving" });

        try {
            await loadAccountBoard();
        } catch (e) {
            await endLocalSession(false);   // don't leave a half-signed-in board behind
            throw e;
        }

        unsubscribe?.();
        unsubscribe = kanban.subscribe((state, prev) => {
            if (!applyingRemote && boardChanged(state, prev)) scheduleSave();
        });
        set({ sync: "saved" });
    }

    async function loadAccountBoard() {
        const saved = await api.getBoard();
        if (saved.version === 0 || !saved.data) {
            // Empty account: keep what's on screen (the guest board on first sign-up)
            const result = await api.putBoard(boardData(kanban.getState()), 0);
            if (result.conflict && result.data) applyRemote(result.data);
            version = result.version;
        } else {
            applyRemote(saved.data);
            version = saved.version;
        }
        dirty = false;
    }

    // Back to guest mode: the guest board if one was saved, else the starter board.
    // clearCache removes this user's cached board (explicit sign-out on a shared device).
    async function endLocalSession(clearCache: boolean) {
        unsubscribe?.();
        unsubscribe = null;
        if (timer) clearTimeout(timer);
        timer = null;
        version = 0;
        dirty = false;

        const userId = get().user?.id ?? readUserHint();
        writeUserHint(null);
        try {
            if (clearCache && userId) localStorage.removeItem(userKey(userId));
        } catch { /* storage unavailable */ }

        kanban.persist.setOptions({ name: GUEST_KEY });
        let hasGuestBoard = false;
        try {
            hasGuestBoard = localStorage.getItem(GUEST_KEY) !== null;
        } catch { /* storage unavailable */ }
        if (hasGuestBoard) await kanban.persist.rehydrate();
        else applyRemote(starterBoard());

        set({ user: null, status: "guest", sync: "idle" });
    }

    // Pick up saves from other tabs/devices when this tab comes back into view
    async function refresh() {
        if (get().status !== "signed-in" || dirty || saving) return;
        try {
            const saved = await api.getBoard();
            if (saved.data && saved.version > version && !dirty) {
                applyRemote(saved.data);
                version = saved.version;
            }
        } catch { /* stay on the local copy; the next save will reconcile */ }
    }

    function listen() {
        if (listening) return;
        listening = true;
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") void flush(true);
            else void refresh();
        });
        window.addEventListener("online", () => void flush());
    }

    return {
        status: "checking",
        user: null,
        sync: "idle",
        notice: null,

        init: async () => {
            listen();
            try {
                const { user } = await api.me();
                await startSession(user);
            } catch {
                // Not signed in, or no API (static preview / offline): guest mode.
                // Only the local session ends; a cached account board stays for next time.
                if (readUserHint()) await endLocalSession(false);
                set({ status: "guest" });
            }
        },

        login: async (email, password) => {
            const { user } = await api.login(email, password);
            await startSession(user);
        },

        signup: async (email, password) => {
            const { user } = await api.signup(email, password);
            await startSession(user);
        },

        logout: async () => {
            await flush();
            try {
                await api.logout();
            } catch { /* the local sign-out still happens */ }
            await endLocalSession(true);
        },

        dismissNotice: () => set({ notice: null }),
    };
});
