import { useEffect, useRef, useState } from "react";
import { useUiStore } from "../store/uiStore";
import { useAuthStore } from "../sync/authStore";

type Mode = "signin" | "signup";

// Same native <dialog> pattern as the card editor
export default function AuthDialog() {
    const open = useUiStore((s) => s.authOpen);
    const setAuthOpen = useUiStore((s) => s.setAuthOpen);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className="editor auth"
            aria-labelledby="auth-title"
            onCancel={(e) => { e.preventDefault(); setAuthOpen(false); }}
            onClick={(e) => { if (e.target === e.currentTarget) setAuthOpen(false); }}
        >
            {/* remounted on each open so fields and errors start fresh */}
            {open && <AuthForm onDone={() => setAuthOpen(false)} />}
        </dialog>
    );
}

function AuthForm({ onDone }: { onDone: () => void }) {
    const login = useAuthStore((s) => s.login);
    const signup = useAuthStore((s) => s.signup);
    const [mode, setMode] = useState<Mode>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const signingUp = mode === "signup";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
            await (signingUp ? signup : login)(email, password);
            onDone();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setPending(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <div className="auth-body">
                <h2 id="auth-title" className="shortcuts-title">{signingUp ? "Create an account" : "Sign in"}</h2>
                <p className="auth-lede">
                    {signingUp
                        ? "Your current board is saved to the new account and syncs across your devices."
                        : "Signing in loads your saved board. The board in this browser stays here for when you sign out."}
                </p>
                <label className="editor-label" htmlFor="auth-email">Email</label>
                <input
                    id="auth-email"
                    className="editor-input"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                />
                <label className="editor-label" htmlFor="auth-password">Password</label>
                <input
                    id="auth-password"
                    className="editor-input"
                    type="password"
                    autoComplete={signingUp ? "new-password" : "current-password"}
                    required
                    minLength={signingUp ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {signingUp && <p className="auth-hint">At least 8 characters.</p>}
                {error && <p className="auth-error" role="alert">{error}</p>}
            </div>
            <div className="editor-actions">
                <button
                    type="button"
                    className="auth-switch"
                    onClick={() => { setMode(signingUp ? "signin" : "signup"); setError(null); }}
                >
                    {signingUp ? "Have an account? Sign in" : "New here? Create an account"}
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                    {pending ? "…" : signingUp ? "Create account" : "Sign in"}
                </button>
            </div>
        </form>
    );
}
