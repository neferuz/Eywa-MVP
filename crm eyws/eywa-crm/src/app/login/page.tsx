"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aperture, Lock, Mail } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тестовая логика: сразу пускаем в CRM без проверки
    router.push("/");
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 overflow-hidden" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.35)",
            }}
          >
            <Aperture className="h-5 w-5 text-white" />
          </div>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>Вход в админ-панель</h1>
              <p className="text-sm text-zinc-500 mt-1">Только для администраторов</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "var(--foreground)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 w-full pl-9 pr-3 text-sm"
                  placeholder="admin@eywa.com"
                  style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: "var(--foreground)" }}>Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 w-full pl-9 pr-3 text-sm"
                  placeholder="••••••••"
                  style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="btn-outline h-10 px-6 text-sm font-medium"
                disabled={loading}
                style={{
                  background: loading ? "#6366F1" + "20" : undefined,
                  color: loading ? "#6366F1" : undefined,
                  borderColor: loading ? "#6366F1" : undefined,
                }}
              >
                {loading ? "Входим..." : "Войти"}
              </button>
            </div>
          </form>
        </Card>
        <div className="text-center mt-4 text-xs text-zinc-500">
          Демо-экран. Авторизация не подключена.
        </div>
      </div>
    </div>
  );
}
