import { expect, test, type Page, type Route } from "@playwright/test";

// Client-side sync flows against a mocked /api. The real API is exercised
// separately against a deployed preview.

const USER = { id: "u1", email: "sam@example.com" };

const cloudBoard = (title = "From the cloud") => ({
    columns: { c1: { id: "c1", title: "Cloud column" } },
    cards: { k1: { id: "k1", title, description: "", columnId: "c1", labelIds: [], dueDate: null, createdAt: "", updatedAt: "" } },
    cardOrder: { c1: ["k1"] },
    labels: {},
    columnOrder: ["c1"],
});

const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

type Mock = { signedIn: boolean; board: { data: unknown; version: number }; puts: { data: any; version: number }[]; putReply?: (body: any) => [unknown, number] };

async function mockApi(page: Page, init: Partial<Mock> = {}) {
    const m: Mock = { signedIn: false, board: { data: null, version: 0 }, puts: [], ...init };
    await page.route("**/api/**", async (route) => {
        const req = route.request();
        const path = new URL(req.url()).pathname;
        if (path === "/api/auth/me") return m.signedIn ? json(route, { user: USER }) : json(route, { error: "Not signed in." }, 401);
        if (path === "/api/auth/login" || path === "/api/auth/signup") {
            m.signedIn = true;
            return json(route, { user: USER }, path.endsWith("signup") ? 201 : 200);
        }
        if (path === "/api/auth/logout") {
            m.signedIn = false;
            return route.fulfill({ status: 204 });
        }
        if (path === "/api/board" && req.method() === "GET") return json(route, m.board);
        if (path === "/api/board" && req.method() === "PUT") {
            const body = req.postDataJSON();
            m.puts.push(body);
            if (m.putReply) {
                const [reply, status] = m.putReply(body);
                return json(route, reply, status);
            }
            m.board = { data: body.data, version: body.version + 1 };
            return json(route, { version: m.board.version });
        }
        return json(route, { error: "unmocked" }, 500);
    });
    return m;
}

async function signIn(page: Page, mode: "Sign in" | "Create account" = "Sign in") {
    await page.getByRole("button", { name: "Sign in" }).click();
    if (mode === "Create account") await page.getByRole("button", { name: /Create an account/ }).click();
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password").fill("correct horse");
    await page.locator("dialog.auth").getByRole("button", { name: mode }).click();
    await expect(page.locator(".account-email")).toHaveText(USER.email);
}

test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
});

test("signing up uploads the guest board to the new account", async ({ page }) => {
    const api = await mockApi(page);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    await signIn(page, "Create account");
    await expect.poll(() => api.puts.length).toBe(1);
    expect(api.puts[0].version).toBe(0);
    expect(Object.keys(api.puts[0].data.cards)).toHaveLength(9);
    await expect(page.locator(".card")).toHaveCount(9);
});

test("signing in loads the account board, and signing out restores the guest board", async ({ page }) => {
    await mockApi(page, { board: { data: cloudBoard(), version: 4 } });
    await page.reload();
    // change the guest board so we can tell it survived
    await page.locator(".card", { hasText: "Resume link refresh" }).click();
    await page.locator(".editor-title").fill("Guest-only edit");
    await page.getByRole("button", { name: "Done" }).click();

    await signIn(page);
    await expect(page.locator(".card")).toHaveCount(1);
    await expect(page.locator(".card")).toContainText("From the cloud");

    await page.locator(".account-btn").click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.locator(".card")).toHaveCount(9);
    await expect(page.locator(".card", { hasText: "Guest-only edit" })).toBeVisible();
});

test("edits save after a pause, based on the loaded version", async ({ page }) => {
    const api = await mockApi(page, { signedIn: true, board: { data: cloudBoard(), version: 3 } });
    await page.reload();
    await expect(page.locator(".card")).toHaveCount(1);
    await expect(page.locator(".card")).toContainText("From the cloud");

    await page.locator(".card").click();
    await page.locator(".editor-title").fill("Edited");
    await page.getByRole("button", { name: "Done" }).click();

    await expect.poll(() => api.puts.length).toBeGreaterThan(0);
    const last = api.puts[api.puts.length - 1];
    expect(last.version).toBe(3);
    expect(last.data.cards.k1.title).toBe("Edited");
    await expect(page.locator(".sync-dot")).toHaveClass(/sync-saved/);
});

test("a save conflict loads the newer board and says so", async ({ page }) => {
    await mockApi(page, {
        signedIn: true,
        board: { data: cloudBoard(), version: 3 },
        putReply: () => [{ data: cloudBoard("Saved on another device"), version: 7 }, 409],
    });
    await page.reload();
    await expect(page.locator(".card")).toHaveCount(1);
    await expect(page.locator(".card")).toContainText("From the cloud");

    await page.locator(".add-card-btn").click();
    await page.getByRole("button", { name: "Done" }).click();

    await expect(page.locator(".sync-notice")).toContainText("changed in another tab or device");
    await expect(page.locator(".card")).toHaveCount(1);
    await expect(page.locator(".card")).toContainText("Saved on another device");
});

test("a failed sign-in shows the server's message", async ({ page }) => {
    await mockApi(page);
    await page.route("**/api/auth/login", (route) => json(route, { error: "Incorrect email or password." }, 401));
    await page.reload();
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByLabel("Email").fill(USER.email);
    await page.getByLabel("Password").fill("wrong password");
    await page.locator("dialog.auth").getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText("Incorrect email or password.");
    await expect(page.locator(".card")).toHaveCount(9);
});
