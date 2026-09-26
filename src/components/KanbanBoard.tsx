import { useKanbanStore } from '../store/kanbanStore';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useShallow } from 'zustand/shallow';
import CardEditor from './CardEditor';
import { dueStatus } from '../utils/due';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Column from './Column';
import FilterBar from './FilterBar';



export default function KanbanBoard() {
    const columnOrder = useKanbanStore((state) => state.columnOrder);
    const addColumn = useKanbanStore((state) => state.addColumn);
    const moveColumn = useKanbanStore((state) => state.moveColumn);
    const cardOrder = useKanbanStore((state) => state.cardOrder);
    const moveCard = useKanbanStore((state) => state.moveCard);

    // Only start a drag after 5px of movement, so a plain click on a card
    // opens its editor instead of starting (and dropping) a drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // The last column counts as "done" (Shipped on the starter board)
    const doneColumnId = columnOrder[columnOrder.length - 1];
    const stats = useKanbanStore(useShallow((state) => {
        const all = Object.values(state.cards);
        return {
            total: all.length,
            overdue: all.filter((c) => dueStatus(c.dueDate, c.columnId === doneColumnId) === "overdue").length,
            done: doneColumnId ? (state.cardOrder[doneColumnId] ?? []).length : 0,
        };
    }));
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
                    <div className="board-stats">
                        <div className="board-stat">🗂 <strong>{stats.total}</strong> cards</div>
                        <div className="board-stat">⏱ <strong>{stats.overdue}</strong> overdue</div>
                        <div className="board-stat">✓ <strong>{stats.done}</strong> done</div>
                    </div>
                </div>
                <FilterBar />
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    <div className="board">
                        {columnOrder.map((columnId, index) => (
                            <Column key={columnId} columnId={columnId} index={index} isDoneColumn={columnId === doneColumnId} />
                        ))}
                        <button className="add-col" onClick={() => addColumn('New column')}>＋ Add column</button>
                    </div>
                </SortableContext>
            </DndContext>
            <CardEditor />
        </div>
    );
}