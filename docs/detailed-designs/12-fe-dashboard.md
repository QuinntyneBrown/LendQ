# Module 12: Frontend - Dashboard

**Requirements**: L1-5, L1-10, L2-5.1, L2-5.2, L2-5.3, L2-5.4, L2-7.5, L2-10.2, L2-10.3

**Backend API**: [05-dashboard.md](05-dashboard.md)

## Overview

The dashboard UI is composed from three independently loaded sections: summary cards, active-loan tabs, and recent activity. Each section tolerates partial failure and exposes data freshness rather than implying perfect real-time state. Sections are loaded via independent Observable streams from `DashboardService`, consumed with the `async` pipe and `ChangeDetectionStrategy.OnPush`.

## Class Diagram

![Class - Dashboard](diagrams/rendered/fe_class_dashboard.png)

*Source: [diagrams/plantuml/fe_class_dashboard.puml](diagrams/plantuml/fe_class_dashboard.puml)*

## DashboardService

`DashboardService` is an `@Injectable({ providedIn: 'root' })` service providing independent Observable streams for each section:

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = '/api/v1/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getLoans(): Observable<DashboardLoans> {
    return this.http.get<DashboardLoans>(`${this.apiUrl}/loans`);
  }

  getActivity(params?: ActivityParams): Observable<ActivityFeed> {
    return this.http.get<ActivityFeed>(`${this.apiUrl}/activity`, { params: toHttpParams(params) });
  }
}
```

## Section Observables

The `DashboardComponent` initializes each section as an independent Observable stream in `ngOnInit`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-summary-cards [data]="summary$ | async" [loading]="summaryLoading$ | async" />
    <app-loan-tabs [data]="loans$ | async" [loading]="loansLoading$ | async" />
    <app-activity-feed [data]="activity$ | async" [loading]="activityLoading$ | async" />
  `,
})
export class DashboardComponent implements OnInit {
  summary$!: Observable<DashboardSummary | null>;
  loans$!: Observable<DashboardLoans | null>;
  activity$!: Observable<ActivityFeed | null>;

  ngOnInit(): void {
    this.summary$ = this.dashboardService.getSummary().pipe(catchError(() => of(null)));
    this.loans$ = this.dashboardService.getLoans().pipe(catchError(() => of(null)));
    this.activity$ = this.dashboardService.getActivity().pipe(catchError(() => of(null)));
  }
}
```

Each section fails independently and can be retried without disrupting sibling sections.

## Section Queries

| Section | Endpoint | Notes |
|---|---|---|
| Summary cards | `GET /api/v1/dashboard/summary` | Displays `generated_at` and projection lag hints |
| Loans tab | `GET /api/v1/dashboard/loans` | Separate cached views for creditor and borrower tabs (`mat-tab-group`) |
| Activity feed | `GET /api/v1/dashboard/activity` | Incremental loading for older events via `mat-paginator` or infinite scroll |

## Sequence Diagram

![Sequence - Dashboard Load](diagrams/rendered/fe_seq_dashboard_load.png)

*Source: [diagrams/plantuml/fe_seq_dashboard_load.puml](diagrams/plantuml/fe_seq_dashboard_load.puml)*

## UX Rules

- Skeleton placeholders (`mat-progress-bar` or custom skeleton components) render per section.
- A failed section shows an inline retry action (`mat-button`) without disrupting the rest of the page.
- The dashboard header includes a manual refresh affordance (`mat-icon-button`) and freshness timestamp.
- Cards (`mat-card`) and tables (`mat-table`) reuse responsive layouts from `ui-design.pen`; mobile stacks vertically, tablet uses a two-column summary grid (`mat-grid-list`), desktop uses the full multi-column layout.
