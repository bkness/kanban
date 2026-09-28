import type { Card, Column, Label } from '../types';

// What a first-time visitor sees (the store persists to localStorage, so
// this only applies until they change something). Real work from the
// portfolio launch, so the demo board isn't lorem ipsum.

const labels: Record<string, Label> = {
    web:      { id: 'web',      text: 'Web',      color: 'blue' },
    backend:  { id: 'backend',  text: 'Backend',  color: 'violet' },
    security: { id: 'security', text: 'Security', color: 'rose' },
    docs:     { id: 'docs',     text: 'Docs',     color: 'amber' },
};

const columnList: Column[] = [
    { id: 'todo',  title: 'Up next' },
    { id: 'doing', title: 'In progress' },
    { id: 'done',  title: 'Shipped' },
];

export type Seed = { title: string; description: string; labelIds: string[]; dueInDays?: number };

const seeds: Record<string, Seed[]> = {
    todo: [
        { title: 'Beginner setup walkthrough for forged init', description: 'Guided install that explains each step and asks before changing anything.', labelIds: ['web'], dueInDays: 14 },
        { title: 'Auto-verify flagged npm publishers', description: 'Check provenance and org membership before warning.', labelIds: ['security', 'backend'] },
        { title: 'Sync this board to an account', description: 'Boards live in your browser today.', labelIds: ['backend'] },
    ],
    doing: [
        { title: 'Kanban design pass', description: 'Card editing, labels and due dates on the board.', labelIds: ['web'], dueInDays: 3 },
        { title: 'Resume link refresh', description: 'Point every project at its live demo.', labelIds: ['docs'], dueInDays: 2 },
    ],
    done: [
        { title: 'Night Owlz in the browser', description: 'Expo web export with a desktop showcase and Apple Maps.', labelIds: ['web'] },
        { title: 'One-click demo accounts', description: 'devlogger and ledger sign in without signing up.', labelIds: ['backend'] },
        { title: 'forged 0.4: known-malware lookup', description: 'OSV.dev checks, provenance, trusted publishing.', labelIds: ['security'] },
        { title: 'Fix missing tags migration', description: 'Production was missing a column added with db push.', labelIds: ['backend'] },
    ],
};

function isoDaysFromNow(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function starterBoard() {
    return buildBoard(labels, columnList, seeds);
}

// Turns seed lists into the store's normalized shape. Ids are stable
// ("<column>-<index>") so tests and resets are deterministic.
export function buildBoard(labels: Record<string, Label>, columnList: Column[], seeds: Record<string, Seed[]>) {
    const now = new Date().toISOString();
    const columns: Record<string, Column> = {};
    const cards: Record<string, Card> = {};
    const cardOrder: Record<string, string[]> = {};

    for (const column of columnList) {
        columns[column.id] = column;
        cardOrder[column.id] = (seeds[column.id] ?? []).map((seed, i) => {
            const id = `${column.id}-${i}`;
            cards[id] = {
                id,
                title: seed.title,
                description: seed.description,
                columnId: column.id,
                labelIds: seed.labelIds,
                dueDate: seed.dueInDays === undefined ? null : isoDaysFromNow(seed.dueInDays),
                createdAt: now,
                updatedAt: now,
            };
            return id;
        });
    }

    return { columns, cards, cardOrder, labels, columnOrder: columnList.map((c) => c.id) };
}
