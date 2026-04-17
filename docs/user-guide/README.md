# LendQ User Guide

A step-by-step guide to using the LendQ private lending management platform. These pages describe the web interface as a user sees it — what buttons to click, what each field means, and what happens next.

> **Audience:** creditors, borrowers, and administrators who use the LendQ web app, plus operators who deploy or troubleshoot it.

## How this guide is organized

The guide is split into short, task-focused pages. Each page is self-contained — you do not need to read them in order. If you are new to LendQ, start with **Getting Started** and **Dashboard**, then jump to whichever section matches the task at hand.

## Table of contents

### Getting started

1. [Getting Started](01-getting-started.md) — create an account, sign in, and find your way around.
2. [Dashboard](02-dashboard.md) — the landing page, summary metrics, and activity feed.
3. [Navigation and Layout](03-navigation.md) — sidebar, bottom nav, notification bell, and the user menu.

### Everyday workflows

4. [Loans](04-loans.md) — create loans, edit terms, view the schedule, and record payments.
5. [Payments](05-payments.md) — record, reschedule, and pause payments.
6. [Recurring Loans](06-recurring-loans.md) — set up a recurring loan schedule that generates loans on a cadence.
7. [Bank Account](07-bank-account.md) — your own wallet inside LendQ: deposits, withdrawals, and transaction history.
8. [Savings Goals](08-savings-goals.md) — define a target and add funds over time.
9. [Notifications](09-notifications.md) — the bell, the list view, and per-type preferences.
10. [Settings](10-settings.md) — personal preferences and notification toggles.

### Administration

11. [User Management](11-admin-users.md) — create, edit, disable, and delete users (Admin only).
12. [Role Management](12-admin-roles.md) — edit permissions per role (Admin only).
13. [Admin — Bank Accounts](13-admin-bank-accounts.md) — provision bank accounts for users, freeze or close accounts, inspect transactions.

### Operations

14. [Deployment](14-deployment.md) — environments, CI/CD, and manual deploys on Azure.
15. [Local Development](15-local-development.md) — run the full stack on your own machine.
16. [Troubleshooting](16-troubleshooting.md) — common errors and how to recover.
17. [Glossary](17-glossary.md) — terminology used across the app.

## Screenshots

Inline screenshots live in [`screenshots/`](screenshots/). Where you see an image that has not been captured yet, the reference is a placeholder — see [`screenshots/README.md`](screenshots/README.md) for instructions on how to capture each one.

## Conventions used in this guide

- **`Monospace`** — text you type, UI labels, file names, URLs, and environment variable names.
- **Bold** — the exact label of a button, field, or menu item you should click.
- **Admin** callouts — features gated to users with the `Admin` role.
- Keyboard shortcuts use `+` between keys (e.g. `Ctrl + K`).
