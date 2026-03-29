import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AppLayout } from "@/layout/AppLayout";

const LoginPage = lazy(() => import("@/auth/LoginPage"));
const SignUpPage = lazy(() => import("@/auth/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("@/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("@/dashboard/DashboardPage"));
const LoanListPage = lazy(() => import("@/loans/LoanListPage"));
const LoanDetailPage = lazy(() => import("@/loans/LoanDetailPage"));
const UserListPage = lazy(() => import("@/users/UserListPage"));
const RoleManagementPage = lazy(() => import("@/users/RoleManagementPage"));
const NotificationListPage = lazy(
  () => import("@/notifications/NotificationListPage"),
);
const SettingsPage = lazy(() => import("@/settings/SettingsPage"));
const BankAccountPage = lazy(() => import("@/bank-account/BankAccountPage"));
const SavingsGoalListPage = lazy(() => import("@/savings/SavingsGoalListPage"));
const SavingsGoalDetailPage = lazy(() => import("@/savings/SavingsGoalDetailPage"));
const RecurringLoanListPage = lazy(() => import("@/recurring-loans/RecurringLoanListPage"));
const RecurringLoanDetailPage = lazy(() => import("@/recurring-loans/RecurringLoanDetailPage"));

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
