import {
  LayoutDashboard,
  Banknote,
  HandCoins,
  PiggyBank,
  Repeat,
  Wallet,
  Users,
  Bell,
  Settings,
} from "lucide-react";
import { NavItem } from "./NavItem";
import { useAuth } from "@/auth/hooks";

interface TabletSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function TabletSidebar({ open, onClose }: TabletSidebarProps) {
  const { roles } = useAuth();
  const isAdmin = roles.includes("Admin");

  if (!open) return null;

  return (
    <>
      <div
        data-testid="sidebar-backdrop"
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div
        data-testid="sidebar-overlay"
        className="fixed left-0 top-0 bottom-0 w-[280px] bg-surface z-50 shadow-modal flex flex-col py-6 px-4 animate-slide-in"
      >
        <nav className="flex flex-col gap-1">
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/dashboard"
            onClick={onClose}
          />
          <NavItem
            icon={Banknote}
            label="My Loans"
            href="/loans?view=creditor"
            onClick={onClose}
          />
          <NavItem
            icon={HandCoins}
            label="Borrowings"
            href="/loans?view=borrower"
            onClick={onClose}
          />
          <NavItem
            icon={Repeat}
            label="Recurring Loans"
            href="/loans/recurring"
            onClick={onClose}
          />
          <NavItem
            icon={Wallet}
            label="Account"
            href="/account"
            onClick={onClose}
          />
          <NavItem
            icon={PiggyBank}
            label="Savings"
            href="/savings"
            onClick={onClose}
          />
          {isAdmin && (
            <NavItem
              icon={Users}
              label="Users"
              href="/users"
              onClick={onClose}
            />
          )}
          <NavItem
            icon={Bell}
            label="Notifications"
            href="/notifications"
            onClick={onClose}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            href="/settings"
            onClick={onClose}
          />
        </nav>
      </div>
    </>
  );
}

export default TabletSidebar;
