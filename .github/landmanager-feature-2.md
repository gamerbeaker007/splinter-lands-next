# Feature: Land Manager Workflow Improvements

## Context

Improve the Land Manager workflow by moving Rental and Purchase actions closer to where users manage production.

This feature is primarily a UI and workflow improvement. Existing business logic should be reused wherever possible.

Before implementing:

* Analyse the current Land Manager structure.
* Reuse existing components, hooks, services and actions.
* Extend existing functionality instead of creating new implementations.
* Do not duplicate Rental, Purchase, DEC or filtering logic.
* Keep the implementation simple and consistent with the existing architecture.
* Preserve existing functionality while improving usability.
* Avoid unnecessary third-party (SPL) API calls while combining workflows.

---

## 1. Replace Tabs with Pages

Replace the current tab-based navigation with separate pages.

The Land Manager should contain the following pages:

* Harvest
* Production
* Worksite
* Rental Overview

Keep routing and navigation consistent with the rest of the application.

---

## 2. Move Rental & Purchase Actions into Production

The Production page becomes the primary workflow for managing production-related actions.

Move the existing Rental and Purchase functionality from the current Rental tab into the Production page.

Display two accordions using a responsive flex layout:

* Rental Actions
* Purchase Actions

Reuse the existing functionality without changing the underlying business logic.

Include the existing:

* Settings
* Authority actions

These should behave exactly as they do today.

### Filtering Behaviour

Currently, the Rental and Purchase workflows do **not** support filtering.

After moving these workflows into the Production page:

* Rental actions should operate only on the currently filtered plots.
* Purchase actions should operate only on the currently filtered plots.
* Reuse the existing Production filtering implementation.
* Do not introduce separate filtering logic for Rental or Purchase.

The filtering should naturally follow the Production page state rather than maintaining its own copy.

---

## 3. Production Filters

Extend the existing filtering system.

Do not create a separate filtering implementation.

### Empty Workers

The **Show Empty Workers Only** filter already exists.

Investigate whether it can be moved into the standard Land filter section so it behaves like the other default filters.

### Powered / Unpowered

The **Powered** and **Unpowered** filters are also currently outside the standard Land filter section.

Investigate whether these can also be moved into the default filtering section to create a more consistent filtering experience.

If this can be done cleanly using the existing filter architecture, implement it.

---

## 4. Bulk Actions

Below the Production table, add a **Bulk Actions** accordion.

Move the existing Production bulk actions into this accordion.

Also include:

* DEC actions
* Refresh Rentals

Reuse the existing implementations.

### Behaviour

* Production bulk actions should continue to behave as they do today.
* **DEC actions should continue to operate exactly as they currently do and should *not* use the Production filters.**
* Refresh Rentals should reuse the existing implementation.

No underlying business logic should change unless required to support the Rental and Purchase filtering described above.

---

## 5. Rental Overview Page

The Rental Overview page should contain:

* Current rental table
* Renew Rentals functionality

Reuse the existing components and behaviour.

The existing **Rental Authority** action should remain available from the Rental Overview so users can continue performing **Renew Rentals** from this page.

No other functional changes are required.

---

## 6. Hook & Performance Requirements

Since multiple workflows are now combined into the Production page:

* Reuse shared hooks wherever possible.
* Avoid duplicate state management.
* Keep a single source of truth for shared Production data.
* Prevent unnecessary third-party (SPL) API requests.
* Where requests depend on shared data, prefer chaining them instead of triggering duplicate parallel requests.
* Cache shared data where appropriate so identical requests are not executed multiple times.
* Combining these workflows should not increase the number of external API requests.
* Keep the overall data flow simple, predictable and easy to maintain.

---

## 7. Action Behaviour

All existing actions should continue to work exactly as they do today.

The only behavioural changes are:

* Rental actions operate on the currently filtered plots.
* Purchase actions operate on the currently filtered plots.

The following behaviour must remain unchanged:

* DEC actions continue to work exactly as they do today and do **not** operate on the filtered Production dataset.
* Existing Rental, Purchase and DEC business logic should remain unchanged unless required to support the new Rental/Purchase filtering behaviour.

---

# Acceptance Criteria

* Land Manager uses pages instead of tabs.
* Production becomes the central workflow page.
* Rental and Purchase actions are embedded into the Production page.
* Rental and Purchase actions operate on the currently filtered Production dataset.
* DEC actions retain their existing behaviour and are not driven by Production filtering.
* Existing filtering is extended rather than duplicated.
* Empty Workers filter is part of the standard Land filter section (if feasible).
* Powered and Unpowered filters are part of the standard Land filter section (if feasible).
* Bulk Actions contains all existing Production bulk actions.
* Bulk Actions also includes DEC actions and Refresh Rentals.
* Rental Overview contains both the rental table and Renew Rentals.
* Rental Authority remains available on the Rental Overview.
* Shared hooks are reused where appropriate.
* No unnecessary third-party (SPL) API requests are introduced.
* Existing functionality and behaviour remain unchanged unless explicitly described above.

---

# Completion Checklist

Before considering this feature complete:

* Update the changelog (add to current unreleased version).
* Run the project formatter (`format:all`).
* Build the project.
* Resolve any formatting or build issues introduced by the changes.
* Summarise the files changed.
* Explain any architectural decisions.
* Mention any performance improvements or simplifications made.
