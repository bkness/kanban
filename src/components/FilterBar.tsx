import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";
import { isFiltering, matchesFilter } from "../utils/filter";

export default function FilterBar() {
    const labels = useKanbanStore(useShallow((state) => Object.values(state.labels)));
    const query = useUiStore((state) => state.query);
    const labelFilter = useUiStore((state) => state.labelFilter);
    const setQuery = useUiStore((state) => state.setQuery);
    const toggleLabelFilter = useUiStore((state) => state.toggleLabelFilter);
    const clearFilters = useUiStore((state) => state.clearFilters);
    const active = isFiltering(query, labelFilter);
    // Phones only (CSS): the chips fold behind a toggle to save vertical space
    const [labelsOpen, setLabelsOpen] = useState(false);

    // Only counted while filtering, so the board isn't re-scanned on every change otherwise
    const matchCount = useKanbanStore((state) =>
        active ? Object.values(state.cards).filter((c) => matchesFilter(c, query, labelFilter, state.columns[c.columnId]?.title)).length : 0
    );

    return (
        <div className="filter-bar" role="search">
            <div className="filter-search-wrap">
                <input
                    id="board-search"
                    className="filter-search"
                    type="search"
                    placeholder="Search cards…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setQuery("");
                            e.currentTarget.blur();
                        }
                    }}
                    aria-label="Search cards"
                    aria-keyshortcuts="/"
                />
                {!query && <kbd className="filter-kbd" aria-hidden="true">/</kbd>}
            </div>
            {labels.length > 0 && (
                <button
                    className="filter-toggle"
                    aria-expanded={labelsOpen}
                    aria-controls="filter-labels"
                    onClick={() => setLabelsOpen((o) => !o)}
                >
                    Labels{labelFilter.length > 0 && <span className="filter-toggle-count">{labelFilter.length}</span>}
                </button>
            )}
            <div id="filter-labels" className={`filter-labels${labelsOpen ? " is-open" : ""}`}>
                {labels.map((label) => (
                    <button
                        key={label.id}
                        className={`label label-${label.color} label-toggle${labelFilter.includes(label.id) ? " is-on" : ""}`}
                        aria-pressed={labelFilter.includes(label.id)}
                        onClick={() => toggleLabelFilter(label.id)}
                    >
                        {label.text}
                    </button>
                ))}
            </div>
            {active && (
                <div className="filter-status" aria-live="polite">
                    {matchCount} {matchCount === 1 ? "match" : "matches"}
                    <button className="filter-clear" onClick={clearFilters}>Clear</button>
                </div>
            )}
        </div>
    );
}
