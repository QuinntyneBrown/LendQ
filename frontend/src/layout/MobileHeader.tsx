import { Landmark, Menu } from "lucide-react";
import { useAuth } from "@/auth/hooks";

interface MobileHeaderProps {
  onHamburgerClick?: () => void;
  showHamburger?: boolean;
}

export function MobileHeader({
  onHamburgerClick,
  showHamburger,
}: MobileHeaderProps) {
  const { user } = useAuth();

  return (
    <header
      data-testid="mobile-header"
      className="h-14 bg-surface border-b border-border flex items-center justify-between px-4"
    >
      <div className="flex items-center gap-2">
        {showHamburger && (
          <button
            data-testid="hamburger-menu"
            onClick={onHamburgerClick}
            className="p-1 -ml-1 text-text-secondary"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        )}
        <Landmark size={24} className="text-primary" />
        <span className="font-heading text-lg font-bold text-text-primary">
          LendQ
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div id="mobile-bell-slot" />
        <div
          data-testid="user-avatar"
          className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-semibold text-sm"
        >
          {user?.name?.charAt(0) ?? "U"}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
