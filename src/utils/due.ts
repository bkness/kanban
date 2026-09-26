// Due dates are stored as "YYYY-MM-DD" (from <input type="date">), so compare
// them as local calendar days rather than UTC timestamps.
function toLocalDay(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const DAY = 86_400_000;
const SOON_DAYS = 2;

export type DueStatus = "done" | "overdue" | "soon" | null;

export function dueStatus(dueDate: string | null, isDone: boolean): DueStatus {
    if (!dueDate) return null;
    if (isDone) return "done";
    const daysLeft = (toLocalDay(dueDate).getTime() - today().getTime()) / DAY;
    if (daysLeft < 0) return "overdue";
    if (daysLeft <= SOON_DAYS) return "soon";
    return null;
}

export function formatDue(dueDate: string) {
    return toLocalDay(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
