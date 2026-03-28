import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  onClick?: () => void;
}

export function NavItem({ icon: Icon, label, href, onClick }: NavItemProps) {
  const location = useLocation();
  const isActive =
    href === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(href.split("?")[0]);

  return (
    <Link
      to={href}
      data-active={isActive ? "true" : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-button text-[15px] transition-colors ${
        isActive
          ? "bg-primary-light text-primary font-semibold"
          : "text-text-secondary font-medium hover:bg-gray-50"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}

export default NavItem;
