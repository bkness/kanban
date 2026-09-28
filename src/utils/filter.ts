import type { Card } from '../types';

export const isFiltering = (query: string, labelFilter: string[]) =>
    query.trim() !== '' || labelFilter.length > 0;

// Search matches the card's title, description, or column name
// (case-insensitive), so searching a column shows its cards. Label filter
// matches cards with ANY selected label. Both must pass when both are set.
export function matchesFilter(card: Card, query: string, labelFilter: string[], columnTitle = "") {
    const q = query.trim().toLowerCase();
    if (q && !`${card.title}\n${card.description}\n${columnTitle}`.toLowerCase().includes(q)) return false;
    if (labelFilter.length && !card.labelIds.some((id) => labelFilter.includes(id))) return false;
    return true;
}
