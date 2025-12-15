"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Aperture, Lock, Mail, Loader2, AlertCircle } from "lucide-react";
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
    <div 
      style={{ 
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflow: "hidden",
        background: "var(--background)"
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.35)",
            }}
          >
            <Aperture className="h-5 w-5" style={{ color: "#fff" }} />
          </div>
        </div>
        <Card style={{ padding: "2rem" }}>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              <h1 style={{ 
                fontSize: "1.25rem", 
                fontWeight: 600, 
                color: "var(--foreground)",
                marginBottom: "0.25rem"
              }}>
                Вход в админ-панель
              </h1>
              <p style={{ 
                fontSize: "0.875rem", 
                color: "var(--muted-foreground)" 
              }}>
                Только для администраторов
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ 
                fontSize: "0.8125rem", 
                fontWeight: 600, 
                color: "var(--foreground)", 
                letterSpacing: "-0.01em",
                marginBottom: "0.375rem"
              }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail 
                  className="absolute left-3 h-4 w-4 pointer-events-none" 
                  style={{ 
                    color: "var(--muted-foreground)", 
                    top: "50%", 
                    transform: "translateY(-50%)" 
                  }} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@eywa.com"
                  style={{
                    width: "100%",
                    paddingLeft: "2.5rem",
                    paddingRight: "0.875rem",
                    paddingTop: "0.625rem",
                    paddingBottom: "0.625rem",
                    borderRadius: "12px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ 
                fontSize: "0.8125rem", 
                fontWeight: 600, 
                color: "var(--foreground)", 
                letterSpacing: "-0.01em",
                marginBottom: "0.375rem"
              }}>
                Пароль
              </label>
              <div style={{ position: "relative" }}>
                <Lock 
                  className="absolute left-3 h-4 w-4 pointer-events-none" 
                  style={{ 
                    color: "var(--muted-foreground)", 
                    top: "50%", 
                    transform: "translateY(-50%)" 
                  }} 
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    paddingLeft: "2.5rem",
                    paddingRight: "0.875rem",
                    paddingTop: "0.625rem",
                    paddingBottom: "0.625rem",
                    borderRadius: "12px",
                    border: "1.5px solid var(--card-border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--card-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#EF4444",
                fontSize: "0.875rem",
              }}>
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "12px",
                  border: "none",
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                  opacity: loading ? 0.5 : 1,
                  pointerEvents: loading ? "none" : "auto",
                  minWidth: "120px",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.35)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.25)";
                  }
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Входим..." : "Войти"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
