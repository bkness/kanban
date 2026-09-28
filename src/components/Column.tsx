import { useEffect, useRef, useState } from "react";
import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useShallow } from "zustand/shallow";
import KanbanCard from "./KanbanCard";
import { isFiltering, matchesFilter } from "../utils/filter";

const ACCENTS = ["amber", "blue", "violet"];

export default function Column({ columnId, index, isDoneColumn }: { columnId: string, index: number, isDoneColumn: boolean }) {
    const column = useKanbanStore((state) => state.columns[columnId]);
    const cards = useKanbanStore(useShallow((state) =>
        (state.cardOrder[columnId] ?? []).map((cardId) => state.cards[cardId])
    ));
    const addCard = useKanbanStore((state) => state.addCard);
    const renameColumn = useKanbanStore((state) => state.renameColumn);
    const deleteColumn = useKanbanStore((state) => state.deleteColumn);
    const openCard = useUiStore((state) => state.openCard);
    const query = useUiStore((state) => state.query);
    const labelFilter = useUiStore((state) => state.labelFilter);
    const filtering = isFiltering(query, labelFilter);
    // Hidden cards keep their place in cardOrder; drops still index into the full order
    const visibleCards = filtering ? cards.filter((card) => matchesFilter(card, query, labelFilter, column.title)) : cards;
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: columnId, data: { type: "column", columnId } });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    const [renaming, setRenaming] = useState(false);
    const [draft, setDraft] = useState(column.title);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close the menu on any click outside it
    useEffect(() => {
        if (!menuOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("pointerdown", onDown);
        return () => document.removeEventListener("pointerdown", onDown);
    }, [menuOpen]);

    const startRename = () => {
        setDraft(column.title);
        setRenaming(true);
        setMenuOpen(false);
    };

    const commitRename = () => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== column.title) renameColumn(columnId, trimmed);
        setRenaming(false);
    };

    const remove = () => {
        setMenuOpen(false);
        const extra = cards.length ? ` and its ${cards.length} card${cards.length === 1 ? "" : "s"}` : "";
        if (window.confirm(`Delete "${column.title}"${extra}?`)) deleteColumn(columnId);
    };

    return (
        <div ref={setNodeRef} className="col" style={style} {...attributes} data-column-id={columnId}>
            {/* the last ("done") column is always green, like the mockup */}
            <div className={`col-accent accent-${isDoneColumn ? "emerald" : ACCENTS[index % 3]}`} />
            <div className="col-header">
                <div className="col-drag" {...listeners} aria-label={`Move column ${column.title}`}>⠿</div>
                {renaming ? (
                    <input
                        className="col-title-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenaming(false);
                        }}
                        aria-label="Column name"
                        autoFocus
                    />
                ) : (
                    <button className="col-title" onClick={startRename} title="Rename column">
                        {column.title}
                    </button>
                )}
                <div className="col-count">{filtering ? `${visibleCards.length}/${cards.length}` : cards.length}</div>
                <div className="col-menu-wrap" ref={menuRef}>
                    <button
                        className="col-menu"
                        aria-label={`Column options for ${column.title}`}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        ···
                    </button>
                    {menuOpen && (
                        <div className="col-popover" role="menu">
                            <button role="menuitem" onClick={startRename}>Rename</button>
                            <button role="menuitem" className="danger" onClick={remove}>Delete column</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-body">
                <SortableContext items={visibleCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {visibleCards.map((card) => (
                        <KanbanCard key={card.id} cardId={card.id} columnId={columnId} isDoneColumn={isDoneColumn} />
                    ))}
                </SortableContext>
                {filtering && visibleCards.length === 0 && <div className="col-empty">No matching cards</div>}
            </div>
            <div className="col-footer">
                <button className="add-card-btn" onClick={() => openCard(addCard(columnId, "New card"))}>
                    ＋ Add card
                </button>
            </div>
        </div>
    );
}
