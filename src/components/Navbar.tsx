import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";
import AccountMenu from "./AccountMenu";


export default function Navbar() {
    // Boards save in the browser; reset restores the starter board
    const resetBoard = useKanbanStore((state) => state.resetBoard);
    const addCard = useKanbanStore((state) => state.addCard);
    const firstColumnId = useKanbanStore((state) => state.columnOrder[0]);
    const openCard = useUiStore((state) => state.openCard);
    const setHelpOpen = useUiStore((state) => state.setHelpOpen);

    return (
        <nav className="nav">
            <div className="nav-left">
                <div className="nav-brand">
                    <div className="nav-brand-icon">⊞</div>
                    Kanban
                </div>
            </div>
            <div className="nav-right">
                <button
                    className="btn-ghost btn-icon"
                    aria-label="Keyboard shortcuts"
                    title="Keyboard shortcuts (?)"
                    onClick={() => setHelpOpen(true)}
                >
                    ?
                </button>
                <button
                    className="btn-ghost"
                    aria-label="Reset board"
                    onClick={() => {
                        if (window.confirm("Reset to the starter board? Your changes will be lost.")) resetBoard();
                    }}
                >
                    ↺<span className="btn-text"> Reset board</span>
                </button>
                <button
                    className="btn-primary"
                    title="New card (N)"
                    aria-label="New card"
                    disabled={!firstColumnId}
                    onClick={() => firstColumnId && openCard(addCard(firstColumnId, "New card"))}
                >
                    +<span className="btn-text"> New card</span>
                </button>
                <AccountMenu />
            </div>
        </nav>
    );
}