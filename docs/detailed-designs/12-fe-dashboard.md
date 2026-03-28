# Module 12: Frontend - Dashboard

**Requirements**: L1-5, L1-10, L2-5.1, L2-5.2, L2-5.3, L2-5.4, L2-7.5, L2-10.2, L2-10.3

**Backend API**: [05-dashboard.md](05-dashboard.md)

## Overview

The dashboard UI is composed from three independently loaded sections: summary cards, active-loan tabs, and recent activity. Each section tolerates partial failure and exposes data freshness rather than implying perfect real-time state.

## Class Diagram

![Class - Dashboard](diagrams/rendered/fe_class_dashboard.png)

*Source: [diagrams/plantuml/fe_class_dashboard.puml](diagrams/plantuml/fe_class_dashboard.puml)*

## Section Queries

| Section | Endpoint | Notes |
|---|---|---|
| Summary cards | `GET /api/v1/dashboard/summary` | Displays `generated_at` and projection lag hints |
| Loans tab | `GET /api/v1/dashboard/loans` | Separate cached views for creditor and borrower tabs |
| Activity feed | `GET /api/v1/dashboard/activity` | Incremental loading for older events |

## Sequence Diagram

![Sequence - Dashboard Load](diagrams/rendered/fe_seq_dashboard_load.png)

*Source: [diagrams/plantuml/fe_seq_dashboard_load.puml](diagrams/plantuml/fe_seq_dashboard_load.puml)*

## UX Rules

- Skeletons render per section.
- A failed section shows an inline retry action without disrupting the rest of the page.
- The dashboard header includes a manual refresh affordance and freshness timestamp.
- Cards and tables reuse responsive layouts from `ui-design.pen`; mobile stacks vertically, tablet uses a two-column summary grid, desktop uses the full multi-column layout.
