import { create } from 'zustand';

// View state: which card's editor is open, and the board filter. Deliberately
// not persisted — reopening an editor or a stale filter after a refresh would
// be surprising.
type UiState = {
    editingCardId: string | null;
    openCard: (cardId: string) => void;
    closeCard: () => void;

    query: string;
    labelFilter: string[];          // label ids; a card matches if it has any of them
    setQuery: (query: string) => void;
    toggleLabelFilter: (labelId: string) => void;
    clearFilters: () => void;

    helpOpen: boolean;
    setHelpOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>()((set) => ({
    editingCardId: null,
    openCard: (cardId) => set({ editingCardId: cardId }),
    closeCard: () => set({ editingCardId: null }),

    query: '',
    labelFilter: [],
    setQuery: (query) => set({ query }),
    toggleLabelFilter: (labelId) => set((state) => ({
        labelFilter: state.labelFilter.includes(labelId)
            ? state.labelFilter.filter((id) => id !== labelId)
            : [...state.labelFilter, labelId],
    })),
    clearFilters: () => set({ query: '', labelFilter: [] }),

    helpOpen: false,
    setHelpOpen: (helpOpen) => set({ helpOpen }),
}));
