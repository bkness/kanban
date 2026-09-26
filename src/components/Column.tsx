import { useKanbanStore } from "../store/kanbanStore";
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useShallow } from "zustand/shallow";
import KanbanCard from "./KanbanCard";



export default function Column({ columnId }: { columnId: string }) {
    const column = useKanbanStore((state) => state.columns[columnId]);
    const cards = useKanbanStore(useShallow((state) =>
        (state.cardOrder[columnId] ?? []).map((cardId) => state.cards[cardId])
    ));
    const addCard = useKanbanStore((state) => state.addCard);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: columnId, data: { type: "column", columnId } });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    return (
        <div ref={setNodeRef} className="col" style={style} {...attributes}>
            <div className="col-accent" />
            <div className="col-header">
                <div className="col-drag" {...listeners}>⠿</div>
                <div className="col-title">{column.title}</div>
                <div className="col-count">{cards.length}</div>
                <button className="col-menu">···</button>
            </div>
            <div className="col-body">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <KanbanCard key={card.id} cardId={card.id} columnId={columnId} />
                    ))}
                </SortableContext>
            </div>
            <div className="col-footer">
                <button className="add-card-btn" onClick={() => addCard(columnId, 'New Card')}>
                    ＋ Add card
                </button>
            </div>
        </div>
    );
}
