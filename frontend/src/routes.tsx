import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/layout/AppLayout";
import { lazyRoute } from "@/utils/lazyWithReload";

const LoginPage = lazyRoute(() => import("@/auth/LoginPage"));
const SignUpPage = lazyRoute(() => import("@/auth/SignUpPage"));
const ForgotPasswordPage = lazyRoute(() => import("@/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazyRoute(() => import("@/auth/ResetPasswordPage"));
const DashboardPage = lazyRoute(() => import("@/dashboard/DashboardPage"));
const LoanListPage = lazyRoute(() => import("@/loans/LoanListPage"));
const LoanDetailPage = lazyRoute(() => import("@/loans/LoanDetailPage"));
const UserListPage = lazyRoute(() => import("@/users/UserListPage"));
const RoleManagementPage = lazyRoute(() => import("@/users/RoleManagementPage"));
const NotificationListPage = lazyRoute(
  () => import("@/notifications/NotificationListPage"),
);
const SettingsPage = lazyRoute(() => import("@/settings/SettingsPage"));
const BankAccountPage = lazyRoute(() => import("@/bank-account/BankAccountPage"));
const SavingsGoalListPage = lazyRoute(() => import("@/savings/SavingsGoalListPage"));
const SavingsGoalDetailPage = lazyRoute(() => import("@/savings/SavingsGoalDetailPage"));
const RecurringLoanListPage = lazyRoute(() => import("@/recurring-loans/RecurringLoanListPage"));
const RecurringLoanDetailPage = lazyRoute(() => import("@/recurring-loans/RecurringLoanDetailPage"));
const AdminBankAccountListPage = lazyRoute(() => import("@/admin/bank-accounts/AdminBankAccountListPage"));
const AdminBankAccountDetailPage = lazyRoute(() => import("@/admin/bank-accounts/AdminBankAccountDetailPage"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/loans" element={<LoanListPage />} />
          <Route path="/loans/recurring" element={<RecurringLoanListPage />} />
          <Route path="/loans/recurring/:recurringId" element={<RecurringLoanDetailPage />} />
          <Route path="/loans/:id" element={<LoanDetailPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredRoles={["Admin"]}>
                <UserListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/roles"
            element={
              <ProtectedRoute requiredRoles={["Admin"]}>
                <RoleManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts"
            element={
              <ProtectedRoute requiredRoles={["Admin"]}>
                <AdminBankAccountListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/accounts/:accountId"
            element={
              <ProtectedRoute requiredRoles={["Admin"]}>
                <AdminBankAccountDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/account" element={<BankAccountPage />} />
          <Route path="/savings" element={<SavingsGoalListPage />} />
          <Route path="/savings/:goalId" element={<SavingsGoalDetailPage />} />
          <Route path="/notifications" element={<NotificationListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
