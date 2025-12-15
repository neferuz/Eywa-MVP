"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SnowEffect from "@/components/SnowEffect";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/login");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <SnowEffect />
      <div className="flex h-screen min-h-0">
        {/* Desktop sidebar - part of flex layout */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>
        {/* Mobile sidebar - fixed position, outside flex flow, doesn't take space */}
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 pointer-events-none">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        {/* Main content - full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col w-full">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="px-4 md:px-5 py-4 md:py-5 flex-1 min-h-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

