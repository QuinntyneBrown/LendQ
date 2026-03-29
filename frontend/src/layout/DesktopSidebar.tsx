import { useNavigate } from "react-router-dom";
import {
  Landmark,
  LayoutDashboard,
  Banknote,
  HandCoins,
  Users,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { useAuth } from "@/auth/hooks";

export function DesktopSidebar() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("Admin");

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      data-testid="desktop-sidebar"
      className="w-[280px] min-h-screen bg-surface border-r border-border flex flex-col py-6 px-4"
    >
      <div className="flex items-center gap-3 px-2 pb-6">
        <Landmark size={28} className="text-primary" />
        <span className="font-heading text-xl font-extrabold text-text-primary">
          LendQ
        </span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" href="/dashboard" />
        <NavItem
          icon={Banknote}
          label="My Loans"
          href="/loans?view=creditor"
        />
        <NavItem
          icon={HandCoins}
          label="Borrowings"
          href="/loans?view=borrower"
        />
        {isAdmin && <NavItem icon={Users} label="Users" href="/users" />}
        <NavItem icon={Bell} label="Notifications" href="/notifications" />
        <NavItem icon={Settings} label="Settings" href="/settings" />
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div
          data-testid="user-avatar"
          className="flex items-center gap-3 px-2 py-2 w-full"
        >
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold text-sm">
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              data-testid="sidebar-user-name"
              className="text-sm font-medium text-text-primary truncate"
            >
              {user?.name ?? "User"}
            </span>
            <span
              data-testid="sidebar-user-email"
              className="text-xs text-text-muted truncate"
            >
              {user?.email ?? ""}
            </span>
          </div>
        </div>
        <button
          data-testid="sidebar-sign-out"
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-2 py-2 mt-1 text-sm text-danger-text hover:bg-danger rounded-button transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default DesktopSidebar;
