# UI Design Audit: Implementation vs Design

**Audit Date:** 2026-03-29
**Design Source:** `docs/ui-design.pen`
**Staging URL:** https://lemon-wave-0a1790b0f.6.azurestaticapps.net

---

## 1. Design System / Tokens

### 1.1 Colors
| Token | Design | Code | Status |
|-------|--------|------|--------|
| Primary | `#FF6B6B` | `#FF6B6B` | OK |
| Primary Light | `#FFF1F0` | `#FFF1F0` | OK |
| Surface | `#FFFFFF` | `#FFFFFF` | OK |
| Background | `#F6F7F8` | `#F6F7F8` | OK |
| Border | `#F3F4F6` | `#F3F4F6` | OK |
| Border Strong | `#E5E7EB` | `#E5E7EB` | OK |
| Text Primary | `#1A1A1A` | `#1A1A1A` | OK |
| Text Secondary | `#6B7280` | `#6B7280` | OK |
| Text Muted | `#9CA3AF` | `#9CA3AF` | OK |
| Warning Text | `#D97706` | `#CA8A04` | **MISMATCH** |
| Danger Text | `#DC2626` | `#DC2626` | OK |
| Success Text | `#16A34A` | `#16A34A` | OK |
| PaidOff badge | `#6366F1` on `#F0F5FF` | `#2563EB` on `#F0F5FF` | **MISMATCH** |
| Unread bg | `#FFF8F7` | `#FFF8F7` | OK |

**Changes needed:**
- [ ] `tailwind.config.js`: Change `warning.text` from `#CA8A04` to `#D97706` to match design
- [ ] `tailwind.config.js`: Change `info.text` from `#2563EB` to `#6366F1` to match design Paid Off badge color

### 1.2 Typography
| Property | Design | Code | Status |
|----------|--------|------|--------|
| Heading font | Bricolage Grotesque | Bricolage Grotesque | OK |
| Body font | DM Sans | DM Sans | OK |
| Nav item size | 15px / 500 | Varies (NavItem) | Check below |
| Button font size | 15px / 600 | `text-base` (16px) md, `text-sm` (14px) sm | **MISMATCH** |

**Changes needed:**
- [ ] `Button.tsx`: The `md` size uses `text-base` (16px) but design specifies 15px. Change to `text-[15px]`

### 1.3 Border Radius
| Component | Design | Code | Status |
|-----------|--------|------|--------|
| Button | 12px | `rounded-button` (12px) | OK |
| Input | 12px | `rounded-input` (12px) | OK |
| Badge | 12px | `rounded-badge` (12px) | OK |
| Card | 16px | `rounded-card` (16px) | OK |
| Modal | 20px | `rounded-modal` (20px) | OK |

---

## 2. Components

### 2.1 Button (`ui/Button.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Padding | `12px 24px` | `px-6 py-3` (24px/12px) md | OK |
| Font | DM Sans 15px 600 | `font-body font-semibold text-base` (16px) | **MISMATCH** |
| Icon size | 18px | 18px | OK |
| Icon-label gap | 8px | `gap-2` (8px) | OK |
| Secondary bg | `#F6F7F8` | `bg-background` (#F6F7F8) | OK |
| Secondary border | 1px `#E5E7EB` | `border border-border-strong` | OK |
| Destructive bg | `#FEE2E2` | `bg-danger` (#FEE2E2) | OK |
| Destructive text | `#DC2626` | `text-danger-text` | OK |
| Ghost text | `#6B7280` | `text-text-secondary` | OK |

**Changes needed:**
- [ ] `Button.tsx`: Change `md` size from `text-base` to `text-[15px]` to match design's 15px font

### 2.2 Input (`ui/Input.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Label | 13px / 500 / `#6B7280` | `text-[13px] font-medium text-text-secondary` | OK |
| Label-field gap | 6px | `gap-1.5` (6px) | OK |
| Field border | 1px `#E5E7EB` | `border border-border-strong` | OK |
| Field radius | 12px | `rounded-input` | OK |
| Field padding | `12px 16px` | `px-4 py-3` (16px/12px) | OK |
| Placeholder | 15px / normal / `#9CA3AF` | `text-[15px] placeholder:text-text-muted` | OK |
| Icon | 18px / `#9CA3AF` | 18px / `text-text-muted` | OK |
| Icon left offset | 16px | `left-3` (12px) | **MISMATCH** |
| Text left with icon | 42px (16+18+8) | `pl-10` (40px) | **MISMATCH** |

**Changes needed:**
- [ ] `Input.tsx`: Change icon position from `left-3` (12px) to `left-4` (16px) to match design's 16px icon inset
- [ ] `Input.tsx`: Change `pl-10` (40px) to `pl-[42px]` to match design's 42px text offset (16px padding + 18px icon + 8px gap)

### 2.3 MetricCard (`ui/MetricCard.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Layout | Vertical stack (icon, label, value) | Horizontal (icon left, text right) | **MISMATCH** |
| Padding | 20px | `p-5` (20px) | OK |
| Gap | 8px (vertical) | `gap-4` (16px horizontal) | **MISMATCH** |
| Icon bg size | 40x40 | 40x40 | OK |
| Icon bg radius | 12px | `rounded-button` (12px) | OK |
| Icon bg color | `#FFF1F0` | `bg-primary-light` | OK |
| Label | 13px / 500 | 13px / medium | OK |
| Value size | 28px / 800 | `text-[28px] font-extrabold` (desktop) | OK |
| Card radius | 16px | `rounded-card` | OK |
| Card border | 1px `#F3F4F6` | `border border-border` | OK |

**Changes needed:**
- [ ] `MetricCard.tsx`: Change layout from horizontal (icon left, text right) to **vertical stack** (icon on top, label below, value at bottom) to match design. The design shows icon container on top, then label, then large value below — all in a vertical column with 8px gap

### 2.4 Modal (`ui/Modal.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Radius | 20px | `rounded-modal` (20px) | OK |
| Shadow | 0 8px 32px rgba(0,0,0,0.1) | `shadow-modal` | OK |
| Header padding | `16px 24px` | `px-6 py-4` (24px/16px) | OK |
| Header border | 1px bottom `#F3F4F6` | `border-b border-border` | OK |
| Title font | Bricolage 18px 700 | `text-lg font-bold` (18px) | OK |
| Close icon | 20px `#9CA3AF` | 20px `text-text-muted` | OK |
| Body padding | 24px | `px-6 py-4` (24px/16px) | **MISMATCH** |
| Footer padding | `12px 24px` | `px-6 py-4` (24px/16px) | **MISMATCH** |
| Footer border | 1px top `#F3F4F6` | `border-t border-border` | OK |
| Mobile | Full-width bottom sheet, rounded top | Full screen (no radius) | **MISMATCH** |

**Changes needed:**
- [ ] `Modal.tsx`: Change body padding from `px-6 py-4` to `px-6 py-6` (24px all sides) to match design's 24px padding
- [ ] `Modal.tsx`: Change footer padding from `px-6 py-4` to `px-6 py-3` (12px vertical, 24px horizontal) to match design's `12px 24px`
- [ ] `Modal.tsx`: On mobile, change from full-screen (`w-full h-full`) to bottom-sheet style with rounded top corners (`rounded-t-modal`) and auto height, anchored to bottom of viewport

### 2.5 Badge (`ui/Badge.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Padding | `4px 12px` | `px-3 py-1` (12px/4px) | OK |
| Font | DM Sans 12px 600 | `text-xs font-semibold font-body` | OK |
| Radius | 12px | `rounded-badge` (12px) | OK |
| Dot size | 6px | `w-1.5 h-1.5` (6px) | OK |
| Dot-text gap | 4px | `gap-1` (4px) | OK |
| Active colors | `#16A34A` on `#DCFCE7` | `text-success-text bg-success` | OK |
| Overdue colors | `#DC2626` on `#FEE2E2` | `text-danger-text bg-danger` | OK |
| Paused colors | `#D97706` on `#FFFBEB` | `text-warning-text bg-warning` | **MISMATCH** (see 1.1) |

**Changes needed:**
- [ ] Fix cascades from the warning text color fix in section 1.1

### 2.6 Toast (`notifications/ToastMessage.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Width | 360px | 360px | OK |
| Padding | `14px 16px` | `px-4 py-3.5` (16px/14px) | OK |
| Radius | 12px | `rounded-[12px]` | OK |
| Shadow | `0 4px 12px rgba(0,0,0,0.05)` | `shadow-toast` | OK |
| Icon size | 20px | 20px | OK |
| Close icon | 16px `#9CA3AF` | 16px `text-text-muted` | OK |
| Message font | DM Sans 14px 500 | `text-sm font-body` (14px, missing 500) | **MISMATCH** |
| Gap | 12px | `gap-3` (12px) | OK |
| Success border | 1px `#DCFCE7` | `border-[#DCFCE7]` | OK |
| Warning icon color | `#D97706` | `text-amber-500` (`#F59E0B`) | **MISMATCH** |

**Changes needed:**
- [ ] `ToastMessage.tsx`: Add `font-medium` to message text to match design's 500 weight
- [ ] `ToastMessage.tsx`: Change warning icon color from `text-amber-500` to `text-[#D97706]` to match design

---

## 3. Auth Screens

### 3.1 Login Page (`auth/LoginPage.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Desktop layout | Left panel (red) + Right panel (form) | Left hidden on <lg, right centered | OK |
| Left panel bg | `#FF6B6B` | `bg-primary` | OK |
| Left panel width | `fill_container` (flexible) | `w-1/2` | OK |
| Right panel width | 520px | `flex-1` | OK (stretches) |
| Form width | 400px | `max-w-[400px]` | OK |
| Title font | Bricolage 32px 700 | `text-[32px] font-bold` | OK |
| Subtitle | 15px normal `#6B7280` | `text-text-secondary` (default 14px) | **MISMATCH** |
| Form gap | 24px | `gap-4` (16px) | **MISMATCH** |
| Title-subtitle gap | 4px (design) | `mt-1` (4px) | OK |
| Title-to-form gap | ~32px | `mt-8` (32px) | OK |
| Remember me font | 13px 500 | `text-sm` (14px) | **MISMATCH** |
| Forgot link | 13px 600 `#FF6B6B` | `text-sm text-primary font-medium` (14px/500) | **MISMATCH** |
| Divider "or" | 13px 500 `#9CA3AF` | `text-text-muted text-sm` (14px) | **MISMATCH** |
| Sign Up link text | 14px normal `#6B7280` | `text-sm text-text-secondary` | OK |
| Sign Up link | 14px 600 `#FF6B6B` | `text-primary font-medium` (500) | **MISMATCH** |

**Changes needed:**
- [ ] `LoginPage.tsx`: Change subtitle to `text-[15px]` to match design
- [ ] `LoginPage.tsx`: Change form gap from `gap-4` (16px) to `gap-6` (24px) to match design
- [ ] `LoginPage.tsx`: Change "Remember me" from `text-sm` to `text-[13px]`
- [ ] `LoginPage.tsx`: Change "Forgot Password?" from `text-sm font-medium` to `text-[13px] font-semibold`
- [ ] `LoginPage.tsx`: Change divider "or" from `text-sm` to `text-[13px]`
- [ ] `LoginPage.tsx`: Change "Sign Up" link from `font-medium` to `font-semibold` (600 weight)

### 3.2 Sign Up Page (`auth/SignUpPage.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Title | Bricolage 32px 700 | `text-[32px] font-bold` | OK |
| Subtitle | 15px normal | default (14px) | **MISMATCH** |
| Form gap | 24px (after fix) | `gap-4` (16px) | **MISMATCH** |
| Confirm Password icon | Lock (design) | ShieldCheck | **MISMATCH** |
| "Sign In" link weight | 600 | `font-medium` (500) | **MISMATCH** |

**Changes needed:**
- [ ] `SignUpPage.tsx`: Change subtitle to `text-[15px]`
- [ ] `SignUpPage.tsx`: Change form gap from `gap-4` to `gap-6` (24px)
- [ ] `SignUpPage.tsx`: Change Confirm Password icon from `ShieldCheck` to `Lock` to match design
- [ ] `SignUpPage.tsx`: Change Sign In link from `font-medium` to `font-semibold`
- [ ] `SignUpPage.tsx`: Remove `mt-2` on the button and footer text (design uses uniform gap)

### 3.3 Forgot Password Page (`auth/ForgotPasswordPage.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Title | Bricolage 32px 700 | `text-[32px] font-bold` | OK |
| Subtitle | 15px normal | default (14px) | **MISMATCH** |
| Form gap | 24px | `gap-4` (16px) | **MISMATCH** |
| Back link text | "Sign in" | "Back to Login" | **MISMATCH** |
| Back link weight | 600 | `font-medium` (500) | **MISMATCH** |

**Changes needed:**
- [ ] `ForgotPasswordPage.tsx`: Change subtitle to `text-[15px]`
- [ ] `ForgotPasswordPage.tsx`: Change form gap from `gap-4` to `gap-6`
- [ ] `ForgotPasswordPage.tsx`: Change "Back to Login" text to "Sign in" to match design
- [ ] `ForgotPasswordPage.tsx`: Change link from `font-medium` to `font-semibold`
- [ ] `ForgotPasswordPage.tsx`: Remove `mt-2` on button and footer text

---

## 4. Layout / Navigation

### 4.1 Desktop Sidebar (`layout/DesktopSidebar.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Width | 280px | `w-[280px]` | OK |
| Padding | `24px 16px` | `py-6 px-4` (24px/16px) | OK |
| Background | `#FFFFFF` | `bg-surface` | OK |
| Border right | 1px `#F3F4F6` | `border-r border-border` | OK |
| Logo icon | Landmark 28px | Landmark 28px | OK |
| Logo text | 20px 800 Bricolage | `text-xl font-bold` (700) | **MISMATCH** |
| Nav item gap | 4px | `gap-1` (4px) | OK |
| Nav active bg | `#FFF1F0` | (via NavItem) | Check |
| Nav active text | `#FF6B6B` 600 | (via NavItem) | Check |
| Nav default text | `#6B7280` 500 | (via NavItem) | Check |
| Nav icon size | 20px | (via NavItem) | Check |
| Nav padding | `10px 16px` | (via NavItem) | Check |
| Nav radius | 12px | (via NavItem) | Check |
| Divider | 1px `#F3F4F6` | `border-t border-border` | OK |
| Sign Out icon | LogOut | LogOut | OK |
| Sign Out text color | danger-text (`#DC2626`) | `text-danger-text` | OK |

**Changes needed:**
- [ ] `DesktopSidebar.tsx`: Change logo text from `font-bold` (700) to `font-extrabold` (800) to match design

### 4.2 Mobile Header (`layout/MobileHeader.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Height | 56px | `h-14` (56px) | OK |
| Background | `#FFFFFF` | `bg-surface` | OK |
| Border bottom | 1px `#F3F4F6` | `border-b border-border` | OK |
| Padding | `0 16px` | `px-4` (16px) | OK |
| Logo icon | 24px | 24px | OK |
| Logo text | 20px 800 | `text-lg font-bold` (18px/700) | **MISMATCH** |
| Bell button | 36x36 rounded-10 `#F6F7F8` | (via NotificationBell) | Check |
| Avatar | 36x36 rounded-full `#FF6B6B` | `w-8 h-8` (32x32) | **MISMATCH** |

**Changes needed:**
- [ ] `MobileHeader.tsx`: Change logo text from `text-lg font-bold` to `text-xl font-extrabold` (20px/800) to match design
- [ ] `MobileHeader.tsx`: Change avatar from `w-8 h-8` (32px) to `w-9 h-9` (36px) to match design

### 4.3 Mobile Bottom Nav (`layout/MobileBottomNav.tsx`)

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Height | 64px | `h-16` (64px) | OK |
| Background | `#FFFFFF` | `bg-surface` | OK |
| Border top | 1px `#F3F4F6` | `border-t border-border` | OK |
| Padding | `8px 0 16px 0` | `pt-2 pb-4` (8px/16px) | OK |
| Tab icon size | 22px | 22px | OK |
| Tab label size | 10px / 500-600 | `text-[11px]` | **MISMATCH** |
| Active color | `#FF6B6B` | `text-primary` | OK |
| Inactive color | `#9CA3AF` | `text-text-muted` | OK |
| Icon-label gap | 4px | `gap-1` (4px) | OK |
| "More" icon | `menu` (hamburger) | `MoreHorizontal` (dots) | **MISMATCH** |

**Changes needed:**
- [ ] `MobileBottomNav.tsx`: Change tab label from `text-[11px]` to `text-[10px]` to match design
- [ ] `MobileBottomNav.tsx`: Change "More" icon from `MoreHorizontal` (three dots) to `Menu` (hamburger) to match design

### 4.4 Desktop Main Content Area

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Padding | 32px | `p-8` (32px) | OK |
| Gap | 24px | `gap-6` (24px) | OK |
| Background | `#F6F7F8` | `bg-background` (via body) | OK |

---

## 5. Dashboard Page

### 5.1 Summary Cards Grid

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Desktop columns | 4 | `xl:grid-cols-4` | OK |
| Tablet columns | 2 | `sm:grid-cols-2` | OK |
| Mobile columns | 1 | `grid-cols-1` | OK |
| Gap | 16px | `gap-4` (16px) | OK |

### 5.2 Dashboard Header

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Title | Bricolage 28px 700 | `text-2xl font-bold` (24px) | **MISMATCH** |
| Subtitle | 15px normal `#6B7280` | `text-sm text-text-secondary` (14px) | **MISMATCH** |

**Changes needed:**
- [ ] `DashboardPage.tsx`: Change title from `text-2xl` (24px) to `text-[28px]` to match design
- [ ] `DashboardPage.tsx`: Change subtitle from `text-sm` (14px) to `text-[15px]` to match design

---

## 6. User Management Page

### 6.1 Page Header

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Title | Bricolage 28px 700 | `text-2xl` (24px) | **MISMATCH** |
| Subtitle | 15px normal | `text-sm` (14px) | **MISMATCH** |
| Subtitle text | "Manage users, roles, and permissions" | "Manage users and roles" | **MISMATCH** |

**Changes needed:**
- [ ] `UserListPage.tsx`: Change title from `text-2xl` to `text-[28px]`
- [ ] `UserListPage.tsx`: Change subtitle from `text-sm` to `text-[15px]`
- [ ] `UserListPage.tsx`: Change subtitle text to "Manage users, roles, and permissions"

### 6.2 Delete User Dialog

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Warning icon bg | 56x56 rounded-full `#FEE2E2` | inline style 56x56 `#FEE2E2` | OK |
| Title in modal | "Delete User?" | "Delete User?" (via Modal title) | OK |
| Confirm text | 14px center | `text-sm text-text-secondary` | OK |
| Modal title | Hidden (icon + title in body) | Shown as modal header | **MISMATCH** |

**Changes needed:**
- [ ] `DeleteUserDialog.tsx`: The design shows the delete confirmation as a centered layout with icon, title "Delete User?", and description all in the body — no separate modal header title. Consider hiding the modal header title or using a custom layout that matches the design's centered icon-title-message pattern

---

## 7. Loan Detail Page

### 7.1 Header

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Breadcrumbs | "My Loans > Kitchen Renovation" | Back arrow button only | **MISMATCH** |
| Title | Bricolage 28px 700 | `text-2xl` (24px) | **MISMATCH** |
| Edit button | Secondary with pencil icon | Secondary with Edit icon | OK |
| Record button | Primary with plus icon | Primary with CreditCard icon | **MISMATCH** |

**Changes needed:**
- [ ] `LoanDetailPage.tsx`: Consider adding breadcrumb navigation above the title to match design
- [ ] `LoanDetailPage.tsx`: Change title from `text-2xl` to `text-[28px]`
- [ ] `LoanDetailPage.tsx`: Change Record Payment button icon from `CreditCard` to `Plus` to match design

### 7.2 Loan Info Card

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Layout | Card with header bar + key-value rows | Card with `p-6`, `dl` grid | **MISMATCH** |
| Card header | "Loan Details" with border-bottom | `h2` inside card body | **MISMATCH** |
| Label style | 13px 500 `#9CA3AF` | `text-xs text-text-muted` (12px) | **MISMATCH** |
| Value style | 14px 500 `#1A1A1A` | `text-sm font-medium` (14px) | OK |
| Row layout | Full-width space-between rows | 2-column grid | **MISMATCH** |

**Changes needed:**
- [ ] `LoanDetailPage.tsx`: Restructure loan info card to use a header bar ("Loan Details" with bottom border) + single-column key-value rows with `justify-between`, matching the design's list layout instead of a 2-column grid
- [ ] `LoanDetailPage.tsx`: Change detail labels from `text-xs` (12px) to `text-[13px]` to match design

---

## 8. Notification Dropdown

| Property | Design | Code | Status |
|----------|--------|------|--------|
| Width | 380px | `w-[380px]` | OK |
| Radius | 16px | `rounded-card` (16px) | OK |
| Header | "Notifications" + badge + "Mark all read" | Similar structure | OK |
| Title font | 14px 700 Bricolage | `text-sm font-heading font-bold` | OK |
| "Mark all read" | 12px 600 `#FF6B6B` | `text-xs text-[#FF6B6B]` | OK |
| Footer | "View all notifications" 13px 600 `#FF6B6B` | `text-sm text-primary` (14px) | **MISMATCH** |
| Unread item bg | `#FFF8F7` | (via NotificationItem) | Check |

**Changes needed:**
- [ ] `NotificationDropdown.tsx`: Change footer text from `text-sm` (14px) to `text-[13px]` to match design
- [ ] `NotificationDropdown.tsx`: Add `font-semibold` to footer text to match design's 600 weight

---

## 9. Summary of All Changes

### Critical (Layout/Structure)
1. **MetricCard layout** — Change from horizontal to vertical stack to match design
2. **Modal mobile** — Change from full-screen to bottom-sheet with rounded top corners
3. **Loan Detail info card** — Restructure from 2-col grid to single-col key-value rows with card header

### High Priority (Typography)
4. **Button font size** — `text-base` (16px) to `text-[15px]`
5. **All page titles** — `text-2xl` (24px) to `text-[28px]` across Dashboard, User Management, Loan Detail
6. **All page subtitles** — `text-sm` (14px) to `text-[15px]` across all pages
7. **Auth form gaps** — `gap-4` (16px) to `gap-6` (24px) across Login, Sign Up, Forgot Password
8. **Auth link weights** — `font-medium` (500) to `font-semibold` (600) for action links

### Medium Priority (Details)
9. **Input icon position** — `left-3` to `left-4`, `pl-10` to `pl-[42px]`
10. **Warning color** — `#CA8A04` to `#D97706`
11. **PaidOff badge color** — `#2563EB` to `#6366F1`
12. **Modal body/footer padding** — Adjust to match design specs
13. **Desktop sidebar logo weight** — `font-bold` to `font-extrabold`
14. **Mobile header logo** — `text-lg font-bold` to `text-xl font-extrabold`
15. **Mobile header avatar** — 32px to 36px
16. **Mobile bottom nav label** — `text-[11px]` to `text-[10px]`
17. **Mobile bottom nav "More" icon** — `MoreHorizontal` to `Menu`

### Low Priority (Text Content)
18. **ForgotPassword link text** — "Back to Login" to "Sign in"
19. **UserList subtitle** — "Manage users and roles" to "Manage users, roles, and permissions"
20. **SignUp confirm icon** — `ShieldCheck` to `Lock`
21. **Loan Detail record icon** — `CreditCard` to `Plus`
22. **Toast message weight** — Add `font-medium`
23. **Toast warning icon color** — `text-amber-500` to `text-[#D97706]`
24. **Notification footer** — `text-sm` to `text-[13px] font-semibold`

---

## 10. Files to Modify

| File | Changes |
|------|---------|
| `tailwind.config.js` | Warning text color, info text color |
| `src/ui/Button.tsx` | Font size 15px |
| `src/ui/Input.tsx` | Icon left position, text padding |
| `src/ui/MetricCard.tsx` | Vertical layout restructure |
| `src/ui/Modal.tsx` | Body/footer padding, mobile bottom-sheet |
| `src/ui/Badge.tsx` | Cascading from color fix |
| `src/auth/LoginPage.tsx` | Form gap, font sizes, link weights |
| `src/auth/SignUpPage.tsx` | Form gap, font sizes, icon, link weight |
| `src/auth/ForgotPasswordPage.tsx` | Form gap, font sizes, link text/weight |
| `src/dashboard/DashboardPage.tsx` | Title/subtitle font sizes |
| `src/users/UserListPage.tsx` | Title/subtitle sizes, subtitle text |
| `src/users/DeleteUserDialog.tsx` | Modal layout (centered icon pattern) |
| `src/loans/LoanDetailPage.tsx` | Title size, info card structure, icons |
| `src/layout/DesktopSidebar.tsx` | Logo font weight |
| `src/layout/MobileHeader.tsx` | Logo font, avatar size |
| `src/layout/MobileBottomNav.tsx` | Label size, More icon |
| `src/notifications/NotificationDropdown.tsx` | Footer font size/weight |
| `src/notifications/ToastMessage.tsx` | Message weight, warning icon color |
