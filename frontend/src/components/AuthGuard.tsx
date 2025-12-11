"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Пропускаем страницу логина
    if (pathname?.startsWith("/login")) {
      return;
    }

    // Проверяем токен только на клиенте
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  // Всегда возвращаем children - редирект произойдет через useEffect
  return <>{children}</>;
}

