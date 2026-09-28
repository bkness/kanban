import type { Column, Label } from '../types';
import { buildBoard, type Seed } from './starterBoard';

// A deliberately busy board for checking layout: many columns (wider than
// most screens), uneven column heights, long titles, every label, and due
// dates that are overdue, due soon, and far off. Open the app with ?sample.
// The project is fictional.

const labels: Record<string, Label> = {
    frontend: { id: 'frontend', text: 'Frontend', color: 'blue' },
    backend:  { id: 'backend',  text: 'Backend',  color: 'violet' },
    design:   { id: 'design',   text: 'Design',   color: 'emerald' },
    bug:      { id: 'bug',      text: 'Bug',      color: 'rose' },
    docs:     { id: 'docs',     text: 'Docs',     color: 'amber' },
    infra:    { id: 'infra',    text: 'Infra',    color: 'violet' },
};

const columnList: Column[] = [
    // not-yet and already-done work start collapsed, so the active lanes
    // (Up next → QA) fit a 1440px screen without scrolling
    { id: 'ideas',    title: 'Ideas',   collapsed: true },
    { id: 'backlog',  title: 'Backlog', collapsed: true },
    { id: 'next',     title: 'Up next' },
    { id: 'progress', title: 'In progress' },
    { id: 'review',   title: 'Code review' },
    { id: 'blocked',  title: 'Blocked' },
    { id: 'qa',       title: 'QA / staging' },
    { id: 'shipped',  title: 'Shipped', collapsed: true },
];

const seeds: Record<string, Seed[]> = {
    ideas: [
        { title: 'Trail conditions widget on product pages', description: 'Show recent reports for the trails a pack is rated for.', labelIds: ['frontend', 'design'] },
        { title: 'Gift cards', description: '', labelIds: ['backend'] },
        { title: 'Rental program for tents and packs', description: 'Reserve online, pick up in store. Needs inventory holds.', labelIds: ['backend', 'design'] },
        { title: 'Size guide quiz', description: 'Three questions to recommend a boot size.', labelIds: ['frontend'] },
    ],
    backlog: [
        { title: 'Migrate product images to a CDN with automatic resizing', description: 'Current images are 3–4 MB originals served straight from the app server.', labelIds: ['infra'] },
        { title: 'Wishlist', description: 'Save products without an account; merge on sign-in.', labelIds: ['frontend', 'backend'] },
        { title: 'Store locator', description: 'Two locations today, a third opening in spring.', labelIds: ['frontend'] },
        { title: 'Accessibility audit of checkout', description: 'Keyboard-only and screen reader pass.', labelIds: ['frontend', 'design'], dueInDays: 30 },
        { title: 'Newsletter signup double opt-in', description: '', labelIds: ['backend'] },
        { title: 'Write the returns policy page', description: 'Plain language; link from order emails.', labelIds: ['docs'] },
        { title: 'Search: typo tolerance ("hydroflask", "carabeener")', description: 'Most failed searches are misspellings.', labelIds: ['backend'] },
    ],
    next: [
        { title: 'Product filters on mobile', description: 'Filters open in a bottom sheet instead of the sidebar.', labelIds: ['frontend', 'design'], dueInDays: 5 },
        { title: 'Order confirmation email redesign', description: 'Match the new brand colors; add pickup instructions.', labelIds: ['design'], dueInDays: 9 },
        { title: 'Rate-limit the contact form', description: 'Spam jumped last week.', labelIds: ['backend', 'bug'], dueInDays: 2 },
        { title: 'Inventory sync every 5 minutes instead of hourly', description: 'Items sell out in store and still show as available online.', labelIds: ['backend', 'infra'], dueInDays: 7 },
        { title: 'Document the deploy process', description: '', labelIds: ['docs', 'infra'] },
    ],
    progress: [
        { title: 'Checkout: save address for next time', description: 'Opt-in checkbox; store per account.', labelIds: ['frontend', 'backend'], dueInDays: 1 },
        { title: 'Fix: cart badge shows the wrong count after removing an item', description: 'Reproduces on Safari only. Cart state updates, badge doesn\'t re-render.', labelIds: ['bug', 'frontend'], dueInDays: -1 },
        { title: 'New homepage hero', description: 'Seasonal photo, one headline, one button.', labelIds: ['design', 'frontend'], dueInDays: 4 },
    ],
    review: [
        { title: 'Product reviews with photos', description: 'Upload up to 4 photos; moderation queue for staff.', labelIds: ['frontend', 'backend'], dueInDays: 3 },
        { title: 'Lazy-load images below the fold', description: '', labelIds: ['frontend'] },
    ],
    blocked: [
        { title: 'Klarna at checkout', description: 'Waiting on merchant account approval.', labelIds: ['backend'], dueInDays: -6 },
        { title: 'Shipping rates for Alaska and Hawaii', description: 'Carrier hasn\'t sent the rate table yet.', labelIds: ['backend'], dueInDays: -2 },
    ],
    qa: [
        { title: 'Low-stock warning on product pages', description: '"Only 3 left" under the price when stock ≤ 5.', labelIds: ['frontend'], dueInDays: 0 },
        { title: 'Password reset emails going to spam', description: 'Added SPF and DKIM records; verifying with test accounts.', labelIds: ['bug', 'infra'], dueInDays: 1 },
        { title: 'Sitemap and product structured data', description: '', labelIds: ['frontend', 'docs'] },
    ],
    shipped: [
        { title: 'Guest checkout', description: 'No account needed; offer to create one after purchase.', labelIds: ['frontend', 'backend'], dueInDays: -10 },
        { title: 'Dark mode', description: '', labelIds: ['design', 'frontend'] },
        { title: 'Fix: coupon codes were case-sensitive', description: '', labelIds: ['bug', 'backend'], dueInDays: -4 },
        { title: 'Move hosting off the old VPS', description: 'Now on a managed platform with preview deploys.', labelIds: ['infra'] },
        { title: 'Product page load under 2s on 4G', description: 'Was 6.5s. Images, fonts, and one big analytics script.', labelIds: ['frontend', 'infra'] },
        { title: 'Care guides for down jackets and boots', description: '', labelIds: ['docs'] },
    ],
};

export function sampleBoard() {
    return buildBoard(labels, columnList, seeds);
}
