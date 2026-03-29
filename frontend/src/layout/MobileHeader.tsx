import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/auth/hooks";

interface MobileHeaderProps {
  onHamburgerClick?: () => void;
  showHamburger?: boolean;
}

export function MobileHeader({
  onHamburgerClick,
  showHamburger,
}: MobileHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header
      data-testid="mobile-header"
      className="sticky top-0 z-30 h-14 bg-surface border-b border-border flex items-center justify-between px-4"
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
        <span className="font-heading text-xl font-extrabold text-text-primary">
          LendQ
        </span>
      </div>
      <div className="flex items-center gap-2 relative" ref={menuRef}>
        <div id="mobile-bell-slot" />
        <button
          data-testid="user-avatar"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm border-none cursor-pointer"
        >
          {user?.name?.charAt(0) ?? "U"}
        </button>
        {menuOpen && (
          <div
            data-testid="user-menu-dropdown"
            className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-card shadow-modal z-50"
          >
            <div className="px-4 py-3 border-b border-border">
              <p
                data-testid="user-menu-name"
                className="text-sm font-medium text-text-primary truncate"
              >
                {user?.name ?? "User"}
              </p>
              <p
                data-testid="user-menu-email"
                className="text-xs text-text-muted truncate"
              >
                {user?.email ?? ""}
              </p>
            </div>
            <div className="p-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-text hover:bg-danger rounded-button transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default MobileHeader;
