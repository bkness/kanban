import { expect, test, type Page } from "@playwright/test";

// Every test starts from the starter board (boards persist in localStorage)
test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator(".card").first()).toBeVisible();
});

const column = (page: Page, title: string) => page.locator(".col", { has: page.locator(".col-title", { hasText: title }) });
const editor = (page: Page) => page.locator("dialog.editor[open]");

test("starter board shows columns, cards, labels and stats", async ({ page }) => {
    await expect(page.locator(".col-title")).toHaveText(["Up next", "In progress", "Shipped"]);
    await expect(page.locator(".card")).toHaveCount(9);
    await expect(page.locator(".board-stats")).toContainText("9 cards");
    await expect(page.locator(".board-stats")).toContainText("4 done");
    await expect(column(page, "Up next").locator(".label").first()).toBeVisible();
});

// Regression: App.tsx used to render <body>, which made React's event lookup
// loop forever on the first text input's selectionchange and froze the tab
test("text inputs don't freeze the page", async ({ page }) => {
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await expect(editor(page)).toBeVisible();
    await page.locator(".editor-title").fill("still responsive");
    expect(await page.evaluate(() => document.querySelector<HTMLInputElement>(".editor-title")?.value)).toBe("still responsive");
});

test("edit a card: title, description, label, due date — and it persists", async ({ page }) => {
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.locator(".editor-title").fill("Resume refresh v2");
    await page.locator(".editor textarea").fill("Swap devlog for devlogger.");
    await page.locator(".editor .label-toggle", { hasText: "Security" }).click();
    await page.locator('.editor input[type="date"]').fill("2020-01-01");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(editor(page)).toHaveCount(0);

    const card = page.locator(".card", { hasText: "Resume refresh v2" });
    await expect(card).toContainText("Swap devlog for devlogger.");
    await expect(card.locator(".label", { hasText: "Security" })).toBeVisible();
    await expect(card.locator(".card-due")).toHaveClass(/overdue/);
    await expect(page.locator(".board-stats")).toContainText("1 overdue");

    await page.reload();
    await expect(page.locator(".card", { hasText: "Resume refresh v2" })).toBeVisible();
});

test("a blank title keeps the old one", async ({ page }) => {
    await page.locator(".card", { hasText: "Kanban design pass" }).click();
    await page.locator(".editor-title").fill("   ");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.locator(".card", { hasText: "Kanban design pass" })).toBeVisible();
});

test("Esc closes the editor", async ({ page }) => {
    await page.locator(".card", { hasText: "Kanban design pass" }).click();
    await expect(editor(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editor(page)).toHaveCount(0);
});

test("add card opens its editor in that column", async ({ page }) => {
    await column(page, "In progress").getByRole("button", { name: "＋ Add card" }).click();
    await expect(editor(page)).toContainText("In progress");
    await page.locator(".editor-title").fill("Write e2e tests");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(column(page, "In progress").locator(".card", { hasText: "Write e2e tests" })).toBeVisible();
});

test("delete a card after confirming", async ({ page }) => {
    page.once("dialog", (d) => d.accept());
    await page.locator(".card", { hasText: "Kanban design pass" }).click();
    await page.getByRole("button", { name: "Delete card" }).click();
    await expect(page.locator(".card", { hasText: "Kanban design pass" })).toHaveCount(0);
});

test("rename a column by clicking its title", async ({ page }) => {
    await page.locator(".col-title", { hasText: "Up next" }).click();
    await page.locator(".col-title-input").fill("Backlog");
    await page.keyboard.press("Enter");
    await expect(page.locator(".col-title", { hasText: "Backlog" })).toBeVisible();
});

test("delete a column from its menu", async ({ page }) => {
    page.once("dialog", (d) => d.accept());
    await column(page, "Up next").getByRole("button", { name: /Column options/ }).click();
    await page.getByRole("menuitem", { name: "Delete column" }).click();
    await expect(page.locator(".col-title", { hasText: "Up next" })).toHaveCount(0);
    await expect(page.locator(".card")).toHaveCount(6);
});

test("drag a card to another column", async ({ page }) => {
    const card = page.locator(".card", { hasText: "Kanban design pass" });
    const target = column(page, "Shipped").locator(".col-body");
    const from = (await card.boundingBox())!;
    const to = (await target.boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 3 }); // past the 5px threshold
    await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 12 });
    await page.mouse.up();
    await expect(column(page, "Shipped").locator(".card", { hasText: "Kanban design pass" })).toBeVisible();
    await expect(editor(page)).toHaveCount(0); // a drag must not open the editor
});

test("reset board restores the starter board", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.locator(".card", { hasText: "Kanban design pass" }).click();
    await page.getByRole("button", { name: "Delete card" }).click();
    await expect(page.locator(".card")).toHaveCount(8);
    await page.getByRole("button", { name: /Reset board/ }).click();
    await expect(page.locator(".card")).toHaveCount(9);
});

const filterChip = (page: Page, text: string) => page.locator(".filter-bar .label-toggle", { hasText: text });

test("search narrows cards across columns and shows per-column counts", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search cards" }).fill("demo");
    // title "One-click demo accounts" + description "…its live demo."
    await expect(page.locator(".card")).toHaveCount(2);
    await expect(page.locator(".filter-status")).toContainText("2 matches");
    await expect(column(page, "Up next").locator(".col-count")).toHaveText("0/3");
    await expect(column(page, "Up next").locator(".col-empty")).toHaveText("No matching cards");
    await expect(column(page, "Shipped").locator(".col-count")).toHaveText("1/4");
});

test("label chips filter by any selected label, and combine with search", async ({ page }) => {
    await filterChip(page, "Security").click();
    await expect(filterChip(page, "Security")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".card")).toHaveCount(2);

    await filterChip(page, "Docs").click();
    await expect(page.locator(".card")).toHaveCount(3);

    // "forged init" is a Web card, so only the Security one survives
    await page.getByRole("searchbox", { name: "Search cards" }).fill("forged");
    await expect(page.locator(".card")).toHaveCount(1);
    await expect(page.locator(".card")).toContainText("forged 0.4");
});

test("clear and Escape reset the filter", async ({ page }) => {
    const search = page.getByRole("searchbox", { name: "Search cards" });
    await search.fill("demo");
    await filterChip(page, "Backend").click();
    await page.locator(".filter-clear").click();
    await expect(search).toHaveValue("");
    await expect(filterChip(page, "Backend")).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".card")).toHaveCount(9);

    await search.fill("zzz-nothing");
    await expect(page.locator(".card")).toHaveCount(0);
    await search.press("Escape");
    await expect(search).toHaveValue("");
    await expect(page.locator(".card")).toHaveCount(9);
});

test("/ focuses search without typing a slash", async ({ page }) => {
    await page.locator("body").press("/");
    const search = page.getByRole("searchbox", { name: "Search cards" });
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("");
});

test("n adds a card to the first column and opens it", async ({ page }) => {
    await page.locator("body").press("n");
    await expect(editor(page)).toBeVisible();
    await expect(page.locator(".editor-title")).toHaveValue("New card");
    await expect(column(page, "Up next").locator(".card")).toHaveCount(4);
});

test("shortcuts don't fire while typing or while a dialog is open", async ({ page }) => {
    // typing "n" in the search box searches; it doesn't create a card
    await page.getByRole("searchbox", { name: "Search cards" }).fill("n");
    await page.getByRole("searchbox", { name: "Search cards" }).press("n");
    await expect(editor(page)).toHaveCount(0);
    await page.locator(".filter-clear").click();
    await expect(page.locator(".card")).toHaveCount(9);

    // with the editor open, "n" and "?" belong to the editor
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.getByRole("button", { name: "Done" }).focus();
    await page.keyboard.press("n");
    await page.keyboard.press("?");
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator(".card")).toHaveCount(9);
});

test("? opens the shortcuts list and Esc closes it", async ({ page }) => {
    await page.locator("body").press("?");
    const help = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(help).toBeVisible();
    await expect(help).toContainText("Pick up / drop the focused card");
    await page.keyboard.press("Escape");
    await expect(help).toBeHidden();

    await page.getByRole("button", { name: "Keyboard shortcuts" }).click();
    await expect(help).toBeVisible();
    await help.getByRole("button", { name: "Got it" }).click();
    await expect(help).toBeHidden();
});

test("search matches column names too", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search cards" }).fill("in progr");
    await expect(page.locator(".card")).toHaveCount(2);
    await expect(column(page, "In progress").locator(".col-count")).toHaveText("2/2");
});

test("create a label from the card editor", async ({ page }) => {
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.getByRole("button", { name: "＋ New label" }).click();
    await page.getByLabel("New label name").fill("Urgent");
    await page.getByRole("radio", { name: "rose" }).click();
    await page.getByLabel("New label name").press("Enter");
    // created and applied to this card
    await expect(page.locator(".editor .label-toggle", { hasText: "Urgent" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.locator(".card", { hasText: "Resume link refresh" }).locator(".label-rose", { hasText: "Urgent" })).toBeVisible();
    // and it's filterable
    await page.locator(".filter-bar .label-toggle", { hasText: "Urgent" }).click();
    await expect(page.locator(".card")).toHaveCount(1);
});

test("due date year is capped at 4 digits", async ({ page }) => {
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    const due = page.locator('.editor input[type="date"]');
    await expect(due).toHaveAttribute("max", "9999-12-31");
    await due.fill("2030-01-15");
    await expect(due).toHaveValue("2030-01-15");
});

test("navbar fits on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    for (const name of ["Reset board", "New card", "Sign in"]) {
        const box = await page.getByRole("button", { name, exact: true }).boundingBox();
        expect(box, name).not.toBeNull();
        expect(box!.x + box!.width, `${name} right edge`).toBeLessThanOrEqual(375);
    }
});

test("?sample opens the busy board without touching the guest board", async ({ page }) => {
    // edit the guest board first
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.locator(".editor-title").fill("Guest edit");
    await page.getByRole("button", { name: "Done" }).click();

    await page.goto("/?sample");
    await expect(page.locator(".sample-banner")).toBeVisible();
    await expect(page.locator(".col")).toHaveCount(8);
    await expect(page.locator(".card")).toHaveCount(32);
    await page.locator(".card").first().click();
    await page.locator(".editor-title").fill("Sample edit");
    await page.getByRole("button", { name: "Done" }).click();

    await page.getByRole("link", { name: "Back to my board" }).click();
    await expect(page.locator(".sample-banner")).toHaveCount(0);
    await expect(page.locator(".card", { hasText: "Guest edit" })).toBeVisible();
    await expect(page.locator(".card", { hasText: "Sample edit" })).toHaveCount(0);
});

test("column tabs appear only when columns overflow, and jump to a column", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator(".col-tabs")).toHaveCount(0);   // 3 columns fit

    await page.goto("/?sample");
    const tabs = page.getByRole("navigation", { name: "Jump to column" });
    await expect(tabs.locator(".col-tab")).toHaveCount(8);
    const shipped = page.locator('.board [data-column-id="shipped"]');
    await expect(shipped).not.toBeInViewport({ ratio: 0.6 });
    await tabs.getByRole("button", { name: /Shipped/ }).click();
    await expect(shipped).toBeInViewport({ ratio: 0.9 });
    await expect(tabs.getByRole("button", { name: /Shipped/ })).toHaveClass(/is-visible/);
});

test("tall columns scroll inside; the page itself never scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 700 });
    await page.goto("/?sample");
    await expect(page.locator(".card").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
    // Backlog is taller than the window, but its Add card button stays on screen
    await expect(page.locator('[data-column-id="backlog"] .add-card-btn')).toBeInViewport();
});

test("move a card to another column from the editor", async ({ page }) => {
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.getByLabel("Column", { exact: true }).selectOption({ label: "Shipped" });
    await page.getByRole("button", { name: "Done" }).click();
    await expect(column(page, "Shipped").locator(".card", { hasText: "Resume link refresh" })).toBeVisible();
    await expect(column(page, "In progress").locator(".card")).toHaveCount(1);
});
