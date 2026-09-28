import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useKanbanStore } from "../store/kanbanStore";
import { useUiStore } from "../store/uiStore";

// Edits save as you type. A native <dialog> gives Esc-to-close, focus
// containment and modal semantics for free.
export default function CardEditor() {
    const cardId = useUiStore((s) => s.editingCardId);
    const closeCard = useUiStore((s) => s.closeCard);
    const card = useKanbanStore((s) => (cardId ? s.cards[cardId] : undefined));
    const dialogRef = useRef<HTMLDialogElement>(null);
    // The form owns the title draft; it registers its close handler here so
    // Esc and backdrop clicks commit the title the same way Done does
    const closeRef = useRef<() => void>(() => closeCard());
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (card && !dialog.open) dialog.showModal();
        if (!card && dialog.open) dialog.close();
    }, [card]);

    if (!card || !cardId) return <dialog ref={dialogRef} className="editor" />;

    return (
        <dialog
            ref={dialogRef}
            className="editor"
            aria-labelledby="editor-title"
            onCancel={(e) => { e.preventDefault(); closeRef.current(); }}
            // clicking the backdrop (the dialog element itself) closes it
            onClick={(e) => { if (e.target === e.currentTarget) closeRef.current(); }}
        >
            {/* keyed by card id so the title draft starts fresh for each card */}
            <EditorForm key={cardId} cardId={cardId} onClose={closeCard} closeRef={closeRef} />
        </dialog>
    );
}

function EditorForm({ cardId, onClose, closeRef }: { cardId: string; onClose: () => void; closeRef: RefObject<() => void> }) {
    const card = useKanbanStore((s) => s.cards[cardId]);
    const labels = useKanbanStore((s) => s.labels);
    const columnTitle = useKanbanStore((s) => s.columns[card.columnId]?.title ?? "");
    const updateCard = useKanbanStore((s) => s.updateCard);
    const deleteCard = useKanbanStore((s) => s.deleteCard);
    const addLabel = useKanbanStore((s) => s.addLabel);
    const [title, setTitle] = useState(card.title);

    const commitTitle = () => {
        const trimmed = title.trim();
        if (trimmed) updateCard(cardId, { title: trimmed });
        else setTitle(card.title); // a card needs a title — keep the old one
    };

    const close = () => {
        commitTitle();
        onClose();
    };

    const toggleLabel = (labelId: string) => {
        const has = card.labelIds.includes(labelId);
        updateCard(cardId, {
            labelIds: has ? card.labelIds.filter((id) => id !== labelId) : [...card.labelIds, labelId],
        });
    };

    const remove = () => {
        if (window.confirm(`Delete "${card.title}"?`)) {
            onClose();
            deleteCard(cardId);
        }
    };

    useEffect(() => {
        closeRef.current = close;
    });

    return (
        <>
            <div className="editor-body">
                <div className="editor-meta">{columnTitle}</div>
                <label className="editor-field">
                    <span className="sr-only">Title</span>
                    <input
                        id="editor-title"
                        className="editor-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        placeholder="Card title"
                    />
                </label>

                <label className="editor-field">
                    <span className="editor-label">Description</span>
                    <textarea
                        className="editor-input"
                        rows={4}
                        value={card.description}
                        onChange={(e) => updateCard(cardId, { description: e.target.value })}
                        placeholder="Add more detail"
                    />
                </label>

                <fieldset className="editor-field">
                    <legend className="editor-label">Labels</legend>
                    <div className="editor-labels">
                        {Object.values(labels).map((label) => {
                            const on = card.labelIds.includes(label.id);
                            return (
                                <button
                                    key={label.id}
                                    type="button"
                                    aria-pressed={on}
                                    className={`label label-${label.color} label-toggle${on ? " is-on" : ""}`}
                                    onClick={() => toggleLabel(label.id)}
                                >
                                    {label.text}
                                </button>
                            );
                        })}
                    </div>
                    <NewLabel
                        onCreate={(text, color) =>
                            updateCard(cardId, { labelIds: [...card.labelIds, addLabel({ text, color })] })
                        }
                    />
                </fieldset>

                <label className="editor-field">
                    <span className="editor-label">Due date</span>
                    <div className="editor-due">
                        <input
                            type="date"
                            className="editor-input"
                            value={card.dueDate ?? ""}
                            // max keeps the year field to 4 digits; the check also drops
                            // anything else the browser lets through (e.g. year 10000)
                            max="9999-12-31"
                            onChange={(e) => {
                                const v = e.target.value;
                                if (!v) updateCard(cardId, { dueDate: null });
                                else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) updateCard(cardId, { dueDate: v });
                            }}
                        />
                        {card.dueDate && (
                            <button type="button" className="btn-ghost" onClick={() => updateCard(cardId, { dueDate: null })}>
                                Clear
                            </button>
                        )}
                    </div>
                </label>
            </div>

            <div className="editor-actions">
                <button type="button" className="btn-danger" onClick={remove}>Delete card</button>
                <button type="button" className="btn-primary" onClick={close}>Done</button>
            </div>
        </>
    );
}

const LABEL_COLORS = ["blue", "violet", "emerald", "amber", "rose"] as const;

// "+ New label": name it, pick a color, and it's created and added to this card
function NewLabel({ onCreate }: { onCreate: (text: string, color: string) => void }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [color, setColor] = useState<string>(LABEL_COLORS[0]);

    const create = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onCreate(trimmed.slice(0, 24), color);
        setText("");
        setOpen(false);
    };

    if (!open) {
        return (
            <button type="button" className="label-new" onClick={() => setOpen(true)}>
                ＋ New label
            </button>
        );
    }

    return (
        <div className="label-form">
            <input
                className="editor-input label-form-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); create(); }
                    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); }
                }}
                placeholder="Label name"
                aria-label="New label name"
                maxLength={24}
                autoFocus
            />
            <div className="label-swatches" role="radiogroup" aria-label="Label color">
                {LABEL_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={color === c}
                        aria-label={c}
                        className={`label-swatch swatch-${c}${color === c ? " is-on" : ""}`}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>
            <button type="button" className="btn-primary" onClick={create} disabled={!text.trim()}>Add</button>
        </div>
    );
}
