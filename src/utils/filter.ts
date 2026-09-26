import type { Card } from '../types';

export const isFiltering = (query: string, labelFilter: string[]) =>
    query.trim() !== '' || labelFilter.length > 0;

// Search matches title or description (case-insensitive). Label filter
// matches cards with ANY selected label. Both must pass when both are set.
export function matchesFilter(card: Card, query: string, labelFilter: string[]) {
    const q = query.trim().toLowerCase();
    if (q && !`${card.title}\n${card.description}`.toLowerCase().includes(q)) return false;
    if (labelFilter.length && !card.labelIds.some((id) => labelFilter.includes(id))) return false;
    return true;
}
