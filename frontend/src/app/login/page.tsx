"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aperture, Lock, Mail } from "lucide-react";
import { loginApi, getCurrentUserApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const playWelcomeSound = (userEmail: string) => {
    let audioPath = "";
    if (userEmail === "notferuz@gmail.com") {
      audioPath = "http://localhost:8000/api/audio/notferuz.mp3";
    } else if (userEmail === "anastasiya.polovinkina@gmail.com") {
      audioPath = "http://localhost:8000/api/audio/anastasiya.mp3";
    }
    
    if (audioPath) {
      const audio = new Audio(audioPath);
      audio.volume = 0.7; // Устанавливаем громкость
      audio.play().catch((err) => {
        console.log("Не удалось воспроизвести звук:", err);
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const tokenData = await loginApi({ email, password });
      localStorage.setItem("auth_token", tokenData.access_token);
      
      // Получаем информацию о пользователе
      const user = await getCurrentUserApi();
      localStorage.setItem("auth_user", JSON.stringify(user));
      
      // Воспроизводим звук приветствия
      playWelcomeSound(user.email);
      
      // Небольшая задержка перед редиректом, чтобы звук успел начать играть
      setTimeout(() => {
        router.push("/");
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа. Проверьте email и пароль.");
    } finally {
      setLoading(false);
    }
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  className="h-10 w-full pl-9 pr-3 text-sm"
                  placeholder="••••••••"
                  style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
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
      </div>
    </div>
  );
}
