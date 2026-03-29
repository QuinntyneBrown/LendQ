import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Banknote,
  HandCoins,
  PiggyBank,
  Repeat,
  Wallet,
  Bell,
  Menu,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/auth/hooks";

interface TabProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

function Tab({ icon, label, href, isActive }: TabProps) {
  return (
    <Link
      to={href}
      data-active={isActive ? "true" : undefined}
      className={`flex flex-col items-center gap-1 text-[10px] ${
        isActive ? "text-primary font-semibold" : "text-text-muted"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, roles } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = roles.includes("Admin");

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path.split("?")[0]);

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      {moreOpen && (
        <div
          data-testid="more-menu"
          className="fixed bottom-16 right-2 bg-surface border border-border rounded-card shadow-modal p-1 z-50 min-w-[160px]"
        >
          <Link
            to="/loans/recurring"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded-button"
          >
            <Repeat size={16} />
            Recurring Loans
          </Link>
          <Link
            to="/account"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded-button"
          >
            <Wallet size={16} />
            Account
          </Link>
          <Link
            to="/savings"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded-button"
          >
            <PiggyBank size={16} />
            Savings
          </Link>
          {isAdmin && (
            <Link
              to="/users"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded-button"
            >
              <Users size={16} />
              Users
            </Link>
          )}
          <Link
            to="/settings"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50 rounded-button"
          >
            <Settings size={16} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-text hover:bg-danger rounded-button"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}

      <nav
        data-testid="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border flex items-center justify-around px-0 pt-2 pb-4 z-40"
      >
        <Tab
          icon={<LayoutDashboard size={22} />}
          label="Home"
          href="/dashboard"
          isActive={isActive("/dashboard")}
        />
        <Tab
          icon={<Banknote size={22} />}
          label="Loans"
          href="/loans?view=creditor"
          isActive={
            isActive("/loans") &&
            location.search.includes("creditor")
          }
        />
        <Tab
          icon={<HandCoins size={22} />}
          label="Owed"
          href="/loans?view=borrower"
          isActive={
            isActive("/loans") &&
            location.search.includes("borrower")
          }
        />
        <Tab
          icon={<Bell size={22} />}
          label="Alerts"
          href="/notifications"
          isActive={isActive("/notifications")}
        />
        <button
          onClick={() => setMoreOpen((v) => !v)}
          data-active={moreOpen ? "true" : undefined}
          className={`flex flex-col items-center gap-1 text-[10px] bg-transparent border-none cursor-pointer ${
            moreOpen ? "text-primary font-semibold" : "text-text-muted"
          }`}
        >
          <Menu size={22} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default MobileBottomNav;
