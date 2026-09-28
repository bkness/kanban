import { useEffect } from "react";
import { useAuthStore } from "../sync/authStore";

// One-line notice for sync events the user should know about (conflict, expired session)
export default function SyncNotice() {
    const notice = useAuthStore((s) => s.notice);
    const dismiss = useAuthStore((s) => s.dismissNotice);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(dismiss, 8000);
        return () => clearTimeout(t);
    }, [notice, dismiss]);

    if (!notice) return null;
    return (
        <div className="sync-notice" role="status">
            {notice}
            <button className="filter-clear" onClick={dismiss}>Dismiss</button>
        </div>
    );
}
