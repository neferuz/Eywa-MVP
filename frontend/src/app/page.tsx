"use client";

import Card from "@/components/Card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Activity,
  Bot,
  ArrowUpRight,
  CreditCard,
  BarChart3,
  Target,
  ArrowRight,
  ChevronDown,
  MoreVertical,
  Zap,
  Sparkles,
  TrendingUp as TrendingUpIcon,
  Award,
  Clock,
  CheckCircle,
  Circle,
  LineChart,
  PieChart,
  TrendingDown as TrendingDownIcon,
  FileText,
  ArrowRightIcon,
  Play,
} from "lucide-react";
import Link from "next/link";
import { fetchDashboardSummary } from "@/lib/api";
import { useEffect, useState } from "react";

type DashboardSummary = {
  kpi: {
    label: string;
    value: string;
    unit?: string | null;
    change: string;
    trend: "up" | "down";
    icon: string;
    color: string;
  }[];
  load: { label: string; value: number; detail: string; color: string }[];
  highlights: { title: string; detail: string; tone: string }[];
};

const fallbackSummary: DashboardSummary = {
  kpi: [
    { label: "Выручка", value: "2 450 000", unit: "сум", change: "+12.5%", trend: "up", icon: "DollarSign", color: "#10B981" },
    { label: "Проданных абонементов", value: "45", unit: "", change: "+8.3%", trend: "up", icon: "CreditCard", color: "#8B5CF6" },
    { label: "Кол-во новых клиентов", value: "128", unit: "", change: "+9.1%", trend: "up", icon: "Users", color: "#6366F1" },
    { label: "Кол-во записей на сегодня", value: "57", unit: "", change: "-2.7%", trend: "down", icon: "Calendar", color: "#F59E0B" },
  ],
  load: [
    { label: "Коворкинг", value: 71, detail: "21/30 мест", color: "#10B981" },
    { label: "Детская", value: 58, detail: "Группы 6-10 лет", color: "#EF4444" },
    { label: "Body Mind", value: 78, detail: "12 занятий · 98 записей", color: "#6366F1" },
    { label: "Pilates Reformer", value: 85, detail: "18 занятий · 108 записей", color: "#C86B58" },
  ],
  highlights: [
    { title: "Body: удержание +6%", detail: "Абонементы 12 занятий растут быстрее остальных.", tone: "positive" },
    { title: "Coffee: чек ↓3.2%", detail: "Провал по десертам в вечернее время.", tone: "warning" },
    { title: "Coworking: 2 отказа", detail: "Не хватает тишины в open-space, проверьте зону meeting rooms.", tone: "neutral" },
  ],
};

const iconMap = {
  DollarSign,
  CreditCard,
  Users,
  Calendar,
} as const;

// Данные для графика
const chartData = [
  { day: "Mon", new: 8, returning: 3 },
  { day: "Tue", new: 10, returning: 6 },
  { day: "Wed", new: 8, returning: 4 },
  { day: "Thu", new: 3, returning: 1 },
  { day: "Fri", new: 10, returning: 5 },
];

const maxValue = 10;

// Deterministic pseudo-random function for consistent SSR/CSR rendering
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary<DashboardSummary>();
        setSummary(data);
      } catch {
        setSummary(fallbackSummary);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.kpi.map((kpi) => {
          const Icon = iconMap[kpi.icon as keyof typeof iconMap] ?? Activity;
          const isPositive = kpi.trend === "up";
          return (
            <Card key={kpi.label} style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ 
                    width: "2.5rem", 
                    height: "2.5rem", 
                    borderRadius: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    background: `${kpi.color}15`,
                    color: kpi.color,
                  }}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "0.25rem", 
                    padding: "0.25rem 0.5rem", 
                    borderRadius: "8px", 
                    background: "var(--muted)" 
                  }}>
                    {isPositive ? (
                      <TrendingUpIcon className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
                    ) : (
                      <TrendingDownIcon className="h-3.5 w-3.5" style={{ color: "#EF4444" }} />
                    )}
                    <span
                      style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: 600,
                        color: isPositive ? "#10B981" : "#EF4444" 
                      }}
                    >
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em" 
                }}>
                  {kpi.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--foreground)" }}>
                    {kpi.value}
                  </span>
                  {kpi.unit && (
                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                      {kpi.unit}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card className="lg:col-span-2" style={{ padding: "1.5rem" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                Новые клиенты
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                За последние 5 дней
              </p>
            </div>
            <div style={{ 
              padding: "0.75rem", 
              borderRadius: "12px", 
              background: "var(--muted)", 
              border: "1px solid var(--card-border)" 
            }}>
              <BarChart3 className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
          </div>
          
          <div className="relative h-56">
            <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.4 }}>
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            
            <div className="ml-10 flex items-end justify-between gap-3 h-full">
              {chartData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-end justify-end gap-1.5" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t-xl"
                      style={{
                        height: `${(data.returning / maxValue) * 100}%`,
                        background: "var(--muted)",
                        minHeight: data.returning > 0 ? "12px" : "0",
                        border: "1px solid var(--card-border)",
                      }}
                    />
                    <div
                      className="w-full rounded-t-xl"
                      style={{
                        height: `${(data.new / maxValue) * 100}%`,
                        background: "linear-gradient(180deg, var(--foreground) 0%, var(--foreground)dd 100%)",
                        minHeight: data.new > 0 ? "12px" : "0",
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.6 }}>
                    {data.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "1.5rem", 
            marginTop: "1.5rem", 
            paddingTop: "1.5rem", 
            borderTop: "1px solid var(--card-border)" 
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ 
                width: "0.75rem", 
                height: "0.75rem", 
                borderRadius: "4px", 
                background: "var(--foreground)" 
              }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                Новые
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ 
                width: "0.75rem", 
                height: "0.75rem", 
                borderRadius: "4px", 
                background: "var(--muted)", 
                border: "1px solid var(--card-border)" 
              }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                Возвращающиеся
              </span>
            </div>
          </div>
        </Card>

        {/* Right Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ padding: "1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem" }}>
                68%
              </div>
              <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--muted-foreground)" }}>
                Успешных сделок
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "0.125rem", height: "5rem" }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const isFilled = i < 41;
                // Use deterministic seeded random for consistent SSR/CSR rendering
                // Round to integer pixels to avoid floating-point precision issues
                const height = Math.round(seededRandom(i) * 18 + 12);
                return (
                  <div
                    key={i}
                    style={{
                      flexGrow: 1,
                      flexShrink: 1,
                      flexBasis: 0,
                      height: `${height}px`,
                      borderTopLeftRadius: "4px",
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "0px",
                      borderBottomLeftRadius: "0px",
                      background: isFilled 
                        ? "var(--foreground)"
                        : "var(--muted)",
                      border: isFilled ? "none" : "1px solid var(--card-border)",
                      minHeight: "0.5rem",
                    }}
                  />
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "var(--muted)",
              }}>
                <Clock className="h-5 w-5" style={{ color: "var(--foreground)" }} />
              </div>
              <div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.25rem" 
                }}>
                  Задач в процессе
                </div>
                <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--foreground)" }}>
                  53
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
              Активных задач
            </div>
          </Card>
        </div>
      </div>

      {/* Load Section */}
      <Card style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
              Загрузка по направлениям
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Статистика загруженности
            </p>
          </div>
          <div style={{ 
            padding: "0.75rem", 
            borderRadius: "12px", 
            background: "var(--muted)", 
            border: "1px solid var(--card-border)" 
          }}>
            <Activity className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.load.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                background: "var(--muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Activity className="h-4 w-4" style={{ color: item.color }} />
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                  {item.label}
                </div>
              </div>
              
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.5rem" }}>
                  {item.value}%
                </div>
                <div
                  style={{ 
                    height: "0.5rem", 
                    width: "100%", 
                    borderRadius: "9999px", 
                    overflow: "hidden",
                    background: "var(--background)", 
                    border: "1px solid var(--card-border)" 
                  }}
                >
                  <div
                    style={{ 
                      height: "100%", 
                      borderRadius: "9999px", 
                      transition: "width 0.3s ease",
                      width: `${item.value}%`, 
                      background: item.color
                    }}
                  />
                </div>
              </div>
              
              <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Highlights */}
        <Card style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "var(--muted)",
              }}>
                <Sparkles className="h-5 w-5" style={{ color: "var(--foreground)" }} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                  AI Highlights
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                  Важные инсайты
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {summary.highlights.map((item, idx) => (
              <div
                key={idx}
                style={{ 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  border: "1px solid var(--card-border)",
                  background: "var(--muted)", 
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <Award className="h-4 w-4 flex-shrink-0" style={{ color: "var(--foreground)", marginTop: "0.125rem" }} />
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>
                    {item.title}
                  </div>
                </div>
                <div style={{ fontSize: "0.8125rem", lineHeight: "1.5", color: "var(--muted-foreground)", marginLeft: "1.75rem" }}>
                  {item.detail}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Prepayments & Quick Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ 
                width: "2.5rem", 
                height: "2.5rem", 
                borderRadius: "12px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "var(--muted)",
              }}>
                <CreditCard className="h-5 w-5" style={{ color: "var(--foreground)" }} />
              </div>
              <div>
                <div style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 500, 
                  color: "var(--muted-foreground)", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em", 
                  marginBottom: "0.25rem" 
                }}>
                  Предоплаты от клиентов
                </div>
                <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--foreground)" }}>
                  $ 15.890
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
              Общая сумма предоплат
            </div>
          </Card>

          <Card style={{ padding: "1.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.25rem" }}>
                Быстрые переходы
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                Финансы, маркетинг и операционное управление
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Финансы", href: "/finance", icon: DollarSign, color: "#10B981" },
                { label: "Маркетинг", href: "/marketing", icon: Zap, color: "#8B5CF6" },
                { label: "AI Insights", href: "/ai", icon: Bot, color: "#6366F1" },
                { label: "Загрузка", href: "/load", icon: Activity, color: "#F59E0B" },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="dashboard-quick-link"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--card-border)",
                      color: "var(--foreground)",
                      background: "var(--muted)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
                      <div
                        style={{ 
                          width: "2.5rem", 
                          height: "2.5rem", 
                          borderRadius: "12px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center",
                          background: `${link.color}15`,
                          color: link.color 
                        }}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, flex: 1 }}>{link.label}</span>
                      <ArrowUpRight className="h-4 w-4" style={{ opacity: 0.5 }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
