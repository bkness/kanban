import { create } from 'zustand';

// Which card's editor is open. Deliberately not persisted — reopening an
// editor after a refresh would be surprising.
type UiState = {
    editingCardId: string | null;
    openCard: (cardId: string) => void;
    closeCard: () => void;
};

export const useUiStore = create<UiState>()((set) => ({
    editingCardId: null,
    openCard: (cardId) => set({ editingCardId: cardId }),
    closeCard: () => set({ editingCardId: null }),
}));
