# Fix: Staging Deployment Failure (2026-03-29)

## Symptom

The `deploy-staging.yml` GitHub Actions workflow failed on push to `main` (run `23714999118`). The `deploy-frontend` job failed during `npm run build` (`tsc -b && vite build`) with 20+ TypeScript compilation errors.

## Root Cause

The frontend uses **Zod v4** (`4.3.6`), but several schemas and components were written with Zod v3 API patterns that are incompatible with v4. The errors fell into three categories:

### 1. `required_error` removed in Zod v4

Zod v4 replaced the `required_error` option with `error`. Six schema files used the old API:

```ts
// Zod v3 (broken)
z.number({ required_error: "Principal is required" })

// Zod v4 (fixed)
z.number({ error: "Principal is required" })
```

**Affected files:**
- `src/recurring-loans/schemas.ts` (3 occurrences)
- `src/savings/schemas.ts` (4 occurrences)
- `src/savings/AddFundsDialog.tsx` (1 occurrence)

### 2. `z.preprocess()` infers `unknown` in Zod v4

`z.preprocess()` no longer carries through the inner schema's type in Zod v4, causing the inferred form data type to contain `unknown` fields (`interest_rate_percent`, `max_occurrences`). This made the `zodResolver` output incompatible with the `useForm<CreateRecurringLoanFormData>` generic.

**Fix:** Removed `z.preprocess()` wrappers and used plain `.optional().nullable()` chains instead. The NaN-to-undefined conversion was unnecessary since `react-hook-form`'s `valueAsNumber` and Zod's number validation already handle empty inputs correctly.

**Affected files:**
- `src/recurring-loans/schemas.ts`

### 3. TypeScript strict type errors

- **Duplicate `name` props (TS2783):** `register("field")` spreads a `name` prop, but the JSX also had an explicit `name="field"` attribute. Removed the redundant explicit `name` from `<Input>` elements (kept on `<Select>` which requires it).

- **`Record<string, unknown>` cast (TS2352):** Direct cast from a typed interface to `Record<string, unknown>` fails because the interface lacks an index signature. Fixed by casting through `unknown` first: `(obj as unknown as Record<string, unknown>)`.

- **Conditional resolver union type (TS2322):** `zodResolver(isEdit ? updateSchema : createSchema)` produced a union resolver type incompatible with the form's single generic type. Fixed with an explicit cast: `as Resolver<CreateSavingsGoalFormData>`.

**Affected files:**
- `src/recurring-loans/CreateRecurringLoanDialog.tsx`
- `src/recurring-loans/RecurringLoanDetailPage.tsx`
- `src/recurring-loans/RecurringLoanListPage.tsx`
- `src/savings/CreateEditSavingsGoalDialog.tsx`

## Files Changed

| File | Changes |
|------|---------|
| `frontend/src/recurring-loans/schemas.ts` | `required_error` → `error`; removed `z.preprocess` wrappers |
| `frontend/src/recurring-loans/CreateRecurringLoanDialog.tsx` | Removed duplicate `name` props from `<Input>` elements |
| `frontend/src/recurring-loans/RecurringLoanDetailPage.tsx` | Added `unknown` intermediate cast; typed `recurringLoan` prop |
| `frontend/src/recurring-loans/RecurringLoanListPage.tsx` | Added `unknown` intermediate cast |
| `frontend/src/savings/schemas.ts` | `required_error` → `error` |
| `frontend/src/savings/AddFundsDialog.tsx` | `required_error` → `error` |
| `frontend/src/savings/CreateEditSavingsGoalDialog.tsx` | Added `Resolver` type cast for conditional schema |

## Verification

- `tsc -b --noEmit` passes with zero errors
- `npm run build` completes successfully
