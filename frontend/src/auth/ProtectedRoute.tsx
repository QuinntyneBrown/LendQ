import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./hooks";

interface ProtectedRouteProps {
  requiredRoles?: string[];
  children: ReactNode;
}

export function ProtectedRoute({ requiredRoles, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, roles } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => roles.includes(role));
    if (!hasRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-text-secondary text-lg">
            Access forbidden. You are not authorized to view this page.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
