import { useEffect, useState } from "react";
import { useKanbanStore } from "../store/kanbanStore";

const colSelector = (id: string) => `.board [data-column-id="${CSS.escape(id)}"]`;

// A tab per column that scrolls the board to it. Tabs for columns currently
// on screen are highlighted. Only shown when the columns don't all fit.
export default function ColumnTabs() {
    const columnOrder = useKanbanStore((s) => s.columnOrder);
    const columns = useKanbanStore((s) => s.columns);
    const cardOrder = useKanbanStore((s) => s.cardOrder);
    const setCollapsed = useKanbanStore((s) => s.setColumnCollapsed);
    const [overflowing, setOverflowing] = useState(false);
    const [visible, setVisible] = useState<Set<string>>(new Set());

    // Show the tabs only while the board is wider than the window
    useEffect(() => {
        const board = document.querySelector<HTMLElement>(".board");
        if (!board) return;
        const check = () => setOverflowing(board.scrollWidth > board.clientWidth + 1);
        const ro = new ResizeObserver(check);
        ro.observe(board);
        board.querySelectorAll("[data-column-id]").forEach((el) => ro.observe(el));
        check();
        return () => ro.disconnect();
    }, [columnOrder.length]);

    // Track which columns are mostly in view
    useEffect(() => {
        const board = document.querySelector<HTMLElement>(".board");
        if (!board || !overflowing) return;
        const io = new IntersectionObserver((entries) => {
            setVisible((prev) => {
                const next = new Set(prev);
                for (const e of entries) {
                    const id = (e.target as HTMLElement).dataset.columnId!;
                    if (e.intersectionRatio >= 0.6) next.add(id);
                    else next.delete(id);
                }
                return next;
            });
        }, { root: board, threshold: [0, 0.6, 1] });
        board.querySelectorAll("[data-column-id]").forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [overflowing, columnOrder.length]);

    if (!overflowing) return null;

    return (
        <nav className="col-tabs" aria-label="Jump to column">
            {columnOrder.map((id) => {
                const title = columns[id]?.title ?? "";
                const count = cardOrder[id]?.length ?? 0;
                const collapsed = !!columns[id]?.collapsed;
                // A collapsed column expands first, then scrolls once it has its full width
                const jump = () => {
                    if (collapsed) setCollapsed(id, false);
                    requestAnimationFrame(() => document.querySelector(colSelector(id))
                        ?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }));
                };
                return (
                    <button
                        key={id}
                        className={`col-tab${visible.has(id) && !collapsed ? " is-visible" : ""}${collapsed ? " is-collapsed" : ""}`}
                        onClick={jump}
                    >
                        {title}
                        <span className="col-tab-count">{count}</span>
                    </button>
                );
            })}
        </nav>
    );
}
