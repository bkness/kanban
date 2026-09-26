import { useKanbanStore } from "../store/kanbanStore";  
import { useSortable } from "@dnd-kit/sortable";
    
export default function KanbanCard({ cardId, columnId }: { cardId: string, columnId: string }) {    
    const card = useKanbanStore((state) => state.cards[cardId]);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: cardId, data: { type: "card", columnId } });
    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };  
    return (
        <div ref={setNodeRef} className="card" style={style} {...attributes} {...listeners}>
            <div className="card-title">{card.title}</div>
        </div>
    );
}