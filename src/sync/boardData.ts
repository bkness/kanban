import type { KanbanState } from "../types";

// The persisted/synced part of the store (everything except actions)
export const DATA_KEYS = ["columns", "cards", "cardOrder", "labels", "columnOrder"] as const;
export type BoardData = Pick<KanbanState, (typeof DATA_KEYS)[number]>;

export const boardData = (s: BoardData): BoardData => ({
    columns: s.columns,
    cards: s.cards,
    cardOrder: s.cardOrder,
    labels: s.labels,
    columnOrder: s.columnOrder,
});

// Store updates are immutable, so a changed slice means a new reference
export const boardChanged = (a: BoardData, b: BoardData) => DATA_KEYS.some((k) => a[k] !== b[k]);
