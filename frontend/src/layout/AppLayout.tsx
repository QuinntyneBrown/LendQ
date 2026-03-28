import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useBreakpoint } from "./useBreakpoint";
import { DesktopSidebar } from "./DesktopSidebar";
import { TabletSidebar } from "./TabletSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { NotificationBell } from "@/notifications/NotificationBell";

export function AppLayout() {
  const { isDesktop, isTablet } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className="flex min-h-screen">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-end px-8 py-4 border-b border-border bg-surface">
            <NotificationBell />
          </header>
          <main className="flex-1 p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader
          showHamburger
          onHamburgerClick={() => setSidebarOpen(true)}
        />
        <TabletSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  // Mobile
  return (
    <div className="min-h-screen flex flex-col pb-16">
      <MobileHeader />
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}

export default AppLayout;
