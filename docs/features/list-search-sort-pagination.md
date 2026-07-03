# List Search, Sort & Pagination (site-wide convention)

Every browsable list — admin tables, public catalogs, personal dashboards — carries the same three controls: **text search**, a **sort select**, and **pagination**. One convention, defined in `DESIGN.md` §10 ("List search, filter, sort & pagination"); this doc is the implementation companion.

## The pattern
- **Search**: shadcn `Input` with a leading Lucide `Search` glyph (`relative` wrapper, icon absolutely positioned, `pl-9` input). Case-insensitive substring over the item's human-readable fields; combines with any status/category filters using AND. Empty query returns the list unchanged.
- **Sort**: shadcn `Select` next to the search box. The **first option always preserves the list's natural order** (`featured` / `newest` / `default`) so nothing changes until picked. Comparators run on a **copy** (`[...list].sort(...)`) inside the same memo — never mutate state.
- **Pagination**: the shared **`ListPager`** (`src/components/ui/list-pager.tsx`): `page` / `pageCount` / `onPageChange`, renders `‹ Prev · Page X of Y · Next ›`, and **returns null on a single page**. Caller slices its filtered+sorted array; clamp `currentPage = Math.min(page, pageCount)`; reset to page 1 on any search/sort/filter/tab change via `useEffect`.
- **Empty states**: "no data yet" (onboarding copy) is always distinct from "no matches" (short message). Controls render only when there's data.
- **Page sizes** by density: card grids 9 · review/service lists 12 · admin tables 10–15 · personal lists 9–10 · tight lists 8.

## The two special cases (do not "fix" these)
- **AdminProviders** and **AdminMentors** use index-based inline editing / manual move-up-down ordering. They get search by **hiding non-matches in place** (`if (!filtered.includes(item)) return null;` inside the full-array map) so index handlers stay correct — and they are **excluded from sort and pagination** entirely.
- **AdminSubmissions** (3 independent tabs, low counts) and the **Achievements wall** (bespoke provider-grouped layout) are excluded from pagination.

## Coverage
- **Admin**: Udemy, Community, Providers, Events, Mentors, Mentorship Services, Trainers (both tables independently), Mentor Reviews, Training Reviews, Submissions, Inquiries, Coupons — plus the pages that predated the sweep (Achievements, CertCatalog, Enrollments, Payments, Transactions, RazorpayInvoices, MentorshipBookings, TrainingList, EventRegistrations).
- **Public**: Yatri Store, Exam Dumps, Reviews, Achievements wall (search+sort only) — plus pre-existing Events, Training, Mentorship Directory.
- **Personal**: My Receipts, My Certificates, My Trainings, My Events, My Mentorship Bookings.

## Sort options by data type
Products → Featured · Price low→high · high→low · Name A–Z. Dated records → Newest · Oldest. Reviews → Newest · Highest rated · Lowest rated. Grouped/curated → curated default · Name A–Z · domain count (e.g. "Most certifications").

## Verified
Search (match + no-match + reset) and sort (Name A–Z reorder) confirmed at runtime on production; pagination confirmed in the deployed bundle (Reviews has 51 rows → 5 pages).

## Adding a new list — checklist
1. `search` / `sort` / `page` state; reset effect for page.
2. One memo: filter → sort-copy → slice; render the paged slice; `<ListPager …/>` as the last child of the results branch.
3. Distinct no-match empty state; hide controls when the source list is empty.
4. If rows are index-edited: hide-in-place for search, skip sort/pagination.
