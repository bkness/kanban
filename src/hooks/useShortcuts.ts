import { useEffect } from "react";
import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";

// Typing in a field must never trigger a shortcut ("n" in a card title)
function isTyping(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

// Board-wide single-key shortcuts: / search, n new card, ? help.
// Esc is handled where it applies (native <dialog>, the search box).
export function useShortcuts() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTyping(e.target)) return;
            // An open modal (card editor, help) owns the keyboard
            if (document.querySelector("dialog[open]")) return;

            const ui = useUiStore.getState();
            if (e.key === "/") {
                e.preventDefault();         // otherwise "/" lands in the box
                document.getElementById("board-search")?.focus();
            } else if (e.key === "n" || e.key === "N") {
                const board = useKanbanStore.getState();
                const firstColumnId = board.columnOrder[0];
                if (!firstColumnId) return;
                e.preventDefault();
                ui.openCard(board.addCard(firstColumnId, "New card"));
            } else if (e.key === "?") {
                e.preventDefault();
                ui.setHelpOpen(true);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);
}
