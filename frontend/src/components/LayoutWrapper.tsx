"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith("/login");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen min-h-0">
      <Sidebar />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <Header />
        <main className="px-5 py-5 flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

