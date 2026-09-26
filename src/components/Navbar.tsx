import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";


export default function Navbar() {
    // Boards save in the browser; reset restores the starter board
    const resetBoard = useKanbanStore((state) => state.resetBoard);
    const addCard = useKanbanStore((state) => state.addCard);
    const firstColumnId = useKanbanStore((state) => state.columnOrder[0]);
    const openCard = useUiStore((state) => state.openCard);

    return (
        <nav className="nav">
            <div className="nav-left">
                <div className="nav-brand">
                    <div className="nav-brand-icon">⊞</div>
                    Kabana De´ Bkness
                </div>
                <div className="nav-divider"></div>
                <div className="nav-breadcrumb">
                    <span>Product</span>
                    <span className="nav-sep">/</span>
                    <span className="active">Launch board</span>
                </div>
            </div>
            <div className="nav-right">
                <button
                    className="btn-ghost"
                    onClick={() => {
                        if (window.confirm("Reset to the starter board? Your changes will be lost.")) resetBoard();
                    }}
                >
                    ↺ Reset board
                </button>
                <button
                    className="btn-primary"
                    disabled={!firstColumnId}
                    onClick={() => firstColumnId && openCard(addCard(firstColumnId, "New card"))}
                >
                    + New card
                </button>
            </div>
        </nav>
    );
}