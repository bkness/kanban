import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";
import { useSortable } from "@dnd-kit/sortable";
import { dueStatus, formatDue } from "../utils/due";

export default function KanbanCard({ cardId, columnId, isDoneColumn }: { cardId: string, columnId: string, isDoneColumn: boolean }) {
    const card = useKanbanStore((state) => state.cards[cardId]);
    const labels = useKanbanStore((state) => state.labels);
    const openCard = useUiStore((state) => state.openCard);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cardId, data: { type: "card", columnId } });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };
    const status = dueStatus(card.dueDate, isDoneColumn);

    return (
        <div
            ref={setNodeRef}
            className={`card${isDoneColumn ? " is-done" : ""}${isDragging ? " is-dragging" : ""}`}
            style={style}
            {...attributes}
            {...listeners}
            // dnd-kit's sensor only starts a drag after 5px of movement, so a
            // plain click (or Enter) reaches here and opens the editor
            onClick={() => openCard(cardId)}
            onKeyDown={(e) => {
                listeners?.onKeyDown?.(e);
                if (e.key === "Enter") openCard(cardId);
            }}
            aria-label={`Edit card: ${card.title}`}
        >
            {card.labelIds.length > 0 && (
                <div className="card-labels">
                    {card.labelIds.map((id) => labels[id] && (
                        <span key={id} className={`label label-${labels[id].color}`}>{labels[id].text}</span>
                    ))}
                </div>
            )}
            <div className="card-title">{card.title}</div>
            {card.description && <div className="card-desc">{card.description}</div>}
            {card.dueDate && (
                <div className="card-footer">
                    <div className={`card-due${status ? ` ${status}` : ""}`}>
                        {status === "done" ? "✓" : "📅"} {formatDue(card.dueDate)}
                    </div>
                </div>
            )}
        </div>
    );
}
