import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KanbanState } from '../types';
import { starterBoard } from './starterBoard';
import { initialStorageKey } from '../sync/storage';

export const useKanbanStore = create<KanbanState>()(
    persist(
        (set) => ({
            // data — a starter board until the visitor's own board is saved
            ...starterBoard(),

            // column actions
            addColumn: (title) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    columns: { ...state.columns, [id]: { id, title } },
                    columnOrder: [...state.columnOrder, id],
                    cardOrder: { ...state.cardOrder, [id]: [] },
                }));
            },
            deleteColumn: (columnId) => {
                set((state) => {
                    const { [columnId]: _, ...columns } = state.columns;
                    const { [columnId]: __, ...cardOrder } = state.cardOrder;
                    const cards = { ...state.cards };
                    state.cardOrder[columnId].forEach((cardId) => delete cards[cardId]);
                    return {
                        columns,
                        columnOrder: state.columnOrder.filter((id) => id !== columnId),
                        cardOrder,
                        cards,
                    };
                });
            },
            renameColumn: (columnId, title) => {
                set((state) => ({
                    columns: { ...state.columns, [columnId]: { ...state.columns[columnId], title } },
                }));
            },
            moveColumn: (activeId, overId) => {
                set((state) => {
                    const newColumnOrder = [...state.columnOrder];
                    const activeIndex = newColumnOrder.indexOf(activeId);
                    const overIndex = newColumnOrder.indexOf(overId);
                    newColumnOrder.splice(activeIndex, 1);
                    newColumnOrder.splice(overIndex, 0, activeId);
                    return { columnOrder: newColumnOrder };
                });
            },

            // card actions
            addCard: (columnId, title) => {
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                set((state) => ({
                    cards: { ...state.cards, [id]: { id, title, description: '', columnId, labelIds: [], dueDate: null, createdAt: now, updatedAt: now } },
                    cardOrder: { ...state.cardOrder, [columnId]: [...state.cardOrder[columnId], id] },
                }));
                return id;
            },
            deleteCard: (cardId) => {
                set((state) => {
                    const { [cardId]: _, ...cards } = state.cards;
                    const columnId = state.cards[cardId].columnId;
                    return {
                        cards,
                        cardOrder: { ...state.cardOrder, [columnId]: state.cardOrder[columnId].filter((id) => id !== cardId) },
                    };
                });
            },
            updateCard: (cardId, updates) => {
                set((state) => ({
                    cards: { ...state.cards, [cardId]: { ...state.cards[cardId], ...updates, updatedAt: new Date().toISOString() } },
                }));
            },
            moveCard: (cardId, toColumnId, toIndex) => {
                set((state) => {
                    const fromColumnId = state.cards[cardId].columnId;
                    const newCardOrderFrom = state.cardOrder[fromColumnId].filter((id) => id !== cardId);
                    const newCardOrderTo = fromColumnId === toColumnId 
                    ? [...newCardOrderFrom]
                    : [...state.cardOrder[toColumnId]]; 
                    newCardOrderTo.splice(toIndex, 0, cardId);
                    return {
                        cards: { ...state.cards, [cardId]: { ...state.cards[cardId], columnId: toColumnId } },
                        cardOrder: { ...state.cardOrder, [fromColumnId]: newCardOrderFrom, [toColumnId]: newCardOrderTo },
                    };
                });
            },

            // label actions
            addLabel: (label) => {
                const id = crypto.randomUUID();
                set((state) => ({
                    labels: { ...state.labels, [id]: { id, ...label } },
                }));
                return id;
            },
            deleteLabel: (labelId) => {
                set((state) => {
                    const { [labelId]: _, ...labels } = state.labels;
                    const cards = { ...state.cards };
                    Object.keys(cards).forEach((id) => {
                        if (cards[id].labelIds.includes(labelId)) {
                            cards[id] = { ...cards[id], labelIds: cards[id].labelIds.filter((l) => l !== labelId)

                            };
                        }
                    });
                    return { labels, cards };
                });
            },

            // board actions
            resetBoard: () => set(starterBoard()),
        }),
        {
            // guest key, or the signed-in user's cache (see sync/storage.ts)
            name: initialStorageKey(),
        }
    )
);  