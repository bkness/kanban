import { useKanbanStore } from '../store/kanbanStore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Column from './Column';



export default function KanbanBoard() {
    const columnOrder = useKanbanStore((state) => state.columnOrder);
    const addColumn = useKanbanStore((state) => state.addColumn);
    const moveColumn = useKanbanStore((state) => state.moveColumn);
    const cardOrder = useKanbanStore((state) => state.cardOrder);
    const moveCard = useKanbanStore((state) => state.moveCard);
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === "column") {
            if (active.id !== over.id) moveColumn(String(active.id), String(over.id));
            return;
        }

        if (activeType === "card") {
            let toColumnId: string;
            let toIndex: number;

            if (overType === "card") {
                toColumnId = over.data.current?.columnId;
                toIndex = cardOrder[toColumnId].indexOf(over.id as string);
            } else if (overType === "column") {
                toColumnId = over.id as string;
                toIndex = cardOrder[toColumnId].length;
            } else return;

            moveCard(active.id as string, toColumnId, toIndex);

        }
    };
    return (
        <div className="board-wrapper">
            <div className="toolbar">
                <div className="board-info">
                    <div className="board-eyebrow">Portfolio</div>
                    <div className="board-title">Launch board</div>
                </div>
                <div className="toolbar-actions">
                    <button className="btn-ghost" onClick={() => addColumn('New Column')}>
                        + Add Column
                    </button>
                </div>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    <div className="board">
                        {columnOrder.map((columnId) => (
                            <Column key={columnId} columnId={columnId} />
                        ))}
                        <button className="add-col">＋ Add column</button>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}