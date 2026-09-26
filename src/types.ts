export type Label = {
    id:          string,
    text:        string,
    color:       string,
};

export type Card = {
    id:          string,
    title:       string,
    description: string,
    columnId:    string,
    labelIds:    string[],
    dueDate:     string | null,
    createdAt:   string,
    updatedAt:   string,
}

export type Column = {
    id:          string,
    title:       string,
}

export type KanbanState = {
    // data
    columns:       Record<string, Column>;
    cards:         Record<string, Card>;
    columnOrder:   string[];
    cardOrder:     Record<string, string[]>;
    labels:        Record<string, Label>;     

    // column actions
    addColumn:     (title: string) => void;
    deleteColumn:  (columnId: string) => void;
    renameColumn:  (columnId: string, title: string) => void;
    moveColumn:    (activeId: string, overId: string) => void;
   
    // card actions
    addCard:       (columnId: string, title: string) => string;
    deleteCard:    (cardId: string) => void;
    updateCard:    (cardId: string, updates: Partial<Pick<Card, "title" | "description" | "labelIds" | "dueDate">>) => void;
    moveCard:      (cardId: string, toColumnId: string, toIndex: number) => void;

    // board actions
    resetBoard:    () => void;

    // label actions
    addLabel:      (label: Omit<Label, "id">) => void;
    deleteLabel:   (labelId: string) => void;
}