import { useEffect, useRef } from "react";
import { useUiStore } from "../store/uiStore";

const SHORTCUTS: [keys: string[], action: string][] = [
    [["/"], "Search cards"],
    [["N"], "New card in the first column"],
    [["Esc"], "Close the editor or clear search"],
    [["Tab"], "Move between cards"],
    [["Enter"], "Open the focused card"],
    [["Space"], "Pick up / drop the focused card"],
    [["←", "↑", "→", "↓"], "Move a picked-up card"],
    [["?"], "Show this list"],
];

// Same native <dialog> approach as the card editor
export default function ShortcutsHelp() {
    const open = useUiStore((s) => s.helpOpen);
    const setHelpOpen = useUiStore((s) => s.setHelpOpen);
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
            className="editor shortcuts"
            aria-labelledby="shortcuts-title"
            onCancel={(e) => { e.preventDefault(); setHelpOpen(false); }}
            onClick={(e) => { if (e.target === e.currentTarget) setHelpOpen(false); }}
        >
            <div className="shortcuts-body">
                <h2 id="shortcuts-title" className="shortcuts-title">Keyboard shortcuts</h2>
                <dl className="shortcuts-list">
                    {SHORTCUTS.map(([keys, action]) => (
                        <div key={action} className="shortcuts-row">
                            <dt>{keys.map((k) => <kbd key={k}>{k}</kbd>)}</dt>
                            <dd>{action}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div className="editor-actions">
                <span />
                <button className="btn-primary" onClick={() => setHelpOpen(false)} autoFocus>Got it</button>
            </div>
        </dialog>
    );
}
