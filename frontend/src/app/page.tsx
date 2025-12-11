import Card from "@/components/Card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Users,
  Calendar,
  Activity,
  Bot,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { fetchDashboardSummary } from "@/lib/api";

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
    { label: "Выручка", value: "2 450 000", unit: "₽", change: "+12.5%", trend: "up", icon: "DollarSign", color: "#10B981" },
    { label: "Расходы", value: "1 120 000", unit: "₽", change: "+4.2%", trend: "down", icon: "Wallet", color: "#EF4444" },
    { label: "Кол-во новых клиентов", value: "128", unit: "", change: "+9.1%", trend: "up", icon: "Users", color: "#6366F1" },
    { label: "Кол-во записей на сегодня", value: "57", unit: "", change: "-2.7%", trend: "down", icon: "Calendar", color: "#F59E0B" },
  ],
  load: [
  { label: "BODY", value: 78, detail: "3 зала · 15 тренеров", color: "#6366F1" },
  { label: "COWORKING", value: 71, detail: "21/30 мест", color: "#10B981" },
  { label: "COFFEE", value: 64, detail: "Avg чек 480 ₽", color: "#F59E0B" },
  { label: "KIDS", value: 58, detail: "Группы 6-10 лет", color: "#EF4444" },
  ],
  highlights: [
  { title: "Body: удержание +6%", detail: "Абонементы 12 занятий растут быстрее остальных.", tone: "positive" },
  { title: "Coffee: чек ↓3.2%", detail: "Провал по десертам в вечернее время.", tone: "warning" },
  { title: "Coworking: 2 отказа", detail: "Не хватает тишины в open-space, проверьте зону meeting rooms.", tone: "neutral" },
  ],
};

const iconMap = {
  DollarSign,
  Wallet,
  Users,
  Calendar,
} as const;

const quickLinks = [
  { label: "Финансы", href: "/finance" },
  { label: "Маркетинг", href: "/marketing" },
  { label: "AI Insights", href: "/ai" },
  { label: "Загрузка центра", href: "/load" },
];

async function getSummary(): Promise<DashboardSummary> {
  try {
    return await fetchDashboardSummary<DashboardSummary>();
  } catch {
    return fallbackSummary;
  }
}

export default async function Home() {
  const summary = await getSummary();

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.kpi.map((kpi) => {
          const Icon = iconMap[kpi.icon as keyof typeof iconMap] ?? Activity;
          const isPositive = kpi.trend === "up";
          return (
            <Card key={kpi.label}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: kpi.color + "20", color: kpi.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{kpi.label}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-2xl font-semibold">{kpi.value}</div>
                {kpi.unit && <span className="text-sm" style={{ color: 'var(--foreground)' }}>{kpi.unit}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.change}
                </span>
                <span className="text-xs text-zinc-500">vs прошлый период</span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Загрузка по направлениям</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary.load.map((item) => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.label}</div>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full" style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                </div>
                <div className="mt-2 text-xs text-zinc-500">{item.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Link href="/load" className="text-xs flex items-center gap-1 text-zinc-500 hover:text-foreground">
              Подробнее о загрузке <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>AI Highlights</div>
          </div>
          <div className="space-y-3">
            {summary.highlights.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{item.title}</div>
                <div className="text-xs text-zinc-500">{item.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Link href="/ai" className="text-xs flex items-center gap-1 text-zinc-500 hover:text-foreground">
              Перейти в AI Insights <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Быстрые переходы</div>
            <p className="text-xs text-zinc-500 mt-1">Финансы, маркетинг и операционное управление в один клик.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <span>{link.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
