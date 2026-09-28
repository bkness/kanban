import { useEffect, useRef, useState } from "react";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../sync/authStore";

const SYNC_TEXT = { idle: "", saving: "Saving…", saved: "Saved", offline: "Offline — will retry" } as const;

export default function AccountMenu() {
    const status = useAuthStore((s) => s.status);
    const user = useAuthStore((s) => s.user);
    const sync = useAuthStore((s) => s.sync);
    const logout = useAuthStore((s) => s.logout);
    const setAuthOpen = useUiStore((s) => s.setAuthOpen);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", onDown);
        return () => document.removeEventListener("pointerdown", onDown);
    }, [open]);

    if (status === "checking") return null;

    if (status === "guest" || !user) {
        return <button className="btn-ghost" onClick={() => setAuthOpen(true)}>Sign in</button>;
    }

    return (
        <div className="account" ref={ref}>
            <button
                className="btn-ghost account-btn"
                aria-expanded={open}
                aria-label={`Account: ${user.email}. ${SYNC_TEXT[sync]}`}
                onClick={() => setOpen((o) => !o)}
            >
                <span className={`sync-dot sync-${sync}`} aria-hidden="true" />
                <span className="account-email">{user.email}</span>
            </button>
            {open && (
                <div className="col-popover account-popover" role="menu">
                    <div className="account-status" role="status">{SYNC_TEXT[sync] || "Synced"}</div>
                    <button role="menuitem" onClick={() => { setOpen(false); void logout(); }}>Sign out</button>
                </div>
            )}
        </div>
    );
}
