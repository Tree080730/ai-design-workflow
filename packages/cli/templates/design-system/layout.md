# Layout

## Target surfaces

- Primary surface: `[confirm from product context]`
- Content container and page gutters: `[confirm from evidence]`
- Responsive breakpoints: `[confirm when needed]`

## Geometry and alignment contract

For each page pattern, record:

- The top-level grid, column proportions, and repeated section gaps.
- Shared alignment anchors for containers, cards, headings, body content, and actions.
- Which modules must share a row or equal height, and which may size independently.
- Important text or control baselines when they affect scanning or comparison.
- How the grid, reading order, spacing, and sticky regions change at each breakpoint.

When regions must align across columns, place them on shared parent grid tracks or document an equivalent constraint. Matching gap values alone do not create cross-column alignment. Mark relationships as `[to confirm]` when the available evidence is insufficient.

## Rules

- Prefer a small set of repeatable containers and section gaps.
- Define responsive behavior at the page-pattern level before adding component-specific exceptions.
- Record intentional overflow, sticky regions, and safe-area behavior.
- Verify container edges, grid tracks, section edges, key baselines, equal-height relationships, overflow, and reading order at representative desktop and narrow widths.
