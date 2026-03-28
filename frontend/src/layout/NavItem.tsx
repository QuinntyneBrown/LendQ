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
  const [targetPath, targetSearch = ""] = href.split("?");
  const currentParams = new URLSearchParams(location.search);
  const targetParams = new URLSearchParams(targetSearch);
  const pathnameMatches =
    targetPath === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(targetPath);
  const searchMatches = Array.from(targetParams.entries()).every(
    ([key, value]) => currentParams.get(key) === value,
  );
  const isActive = pathnameMatches && searchMatches;

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
