Feature: Land Manager Improvements

Status: Completed (2026-08-03)

Context

Improve the Land Manager functionality, usability, and performance.

Before implementing:
• Analyse the existing Land Manager code structure.
• Understand how tabs, routing, filters, card data, and deed history are currently implemented.
• Reuse existing components, filters, and data helpers where possible.
• Do not duplicate logic.
• Keep the implementation simple and consistent with the existing architecture.
• Avoid unnecessary refactoring.
• If an existing approach should be changed, explain why before implementing.

───

1. Improve Land Manager Card Filters

Extend the existing card filtering system.

Bloodline filter

Add a Bloodline multi-select filter.

Requirements:
• Apply this initially to:
◦ Land Manager → Production tab
• Reuse existing card details data to determine available bloodlines.
• Avoid maintaining a hardcoded bloodline list if possible.

Investigate:
• Whether Card Details already contains all required information.
• Whether this approach will automatically support future bloodlines.

The current planner implementation appears to use a fixed list that may require manual updates. Prefer a dynamic solution.

───

Additional filters

Add:
Max PP filter
Allow filtering cards by maximum PP value.

Max Level Only filter
Add a checkbox:
"Max Level Only"

When enabled:
• only show cards that have reached their maximum level.

Ensure these filters integrate with the existing filtering system instead of creating separate logic.

───

2. Deed History Improvements

Add roll amount information to the Deed History page.

Requirements:

• Add a Roll Amount column/value.
• Display it similarly to the existing Chance Amount information.
• Reuse existing formatting and components where possible (just add to table assume data structue is already available).

3. Investigate bug
   Investigate transaction (unstake dec action in land manager)
   8c7dbef6fab3b9ea68b2c71713821f2d9df35768
   This was a unstake dec transaction why did it report back to today panel 1 succes 2 failed while all are successfully can you find if there is a bug? In processing multiple unstakes in one transaction?

4. Improve Land Manager plot Filters

Extend the existing land filtering system.

Element filter
Add element icons (fire/water/earth/...) called terrain boost.
So we have fire/each etc can filter plot that have a positive biome boost on the element / color.
fire find all that have red_biome_modifier positive
check export type BiomeModifiers = Record<CardElement, number>;

───

Acceptance Criteria

The Land Manager should have:

✅ Dynamic bloodline filtering
✅ Max PP filtering
✅ Max Level Only filtering
✅ Improved page structure if beneficial
✅ Deed History showing Roll Amount
✅ No duplicated filter logic
✅ Consistent UI with existing application patterns
✅ Run build command and format:all fix outstanding errors
✅ Update change log add to the unreleased version info and or create minor version bump when not done yet in this branch.

After completion:
• Provide a summary of files changed.
• Explain architectural decisions.
• Mention any performance improvements.
• Update this feature as completed.

Completion notes:
• Dynamic bloodline options are derived from cached card details (`sub_type`), excluding empty values, deduplicated, and sorted.
• Positive terrain boost filtering uses staking biome modifiers (red/blue/white/black/green/gold) via shared `BiomeModifiers` mapping.
• Terrain boost UI is implemented as a dedicated grouped icon filter component.
• Deed history roll amount column is included for fragment and labor's luck rows.
• DEC power action summary counting was corrected for batched broadcasts.
• Verification run completed: `npm run test:node`, `npx tsc --noEmit`, `npm run format:check`, `npm run build`.
