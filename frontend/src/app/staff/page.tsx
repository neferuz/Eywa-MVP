"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { Users, Calendar, TrendingUp, HandCoins, ArrowUpRight, Clock } from "lucide-react";

const snapshot = [
  { label: "Сотрудников", value: 64, icon: Users, color: "#6366F1", href: "/staff/list" },
  { label: "Средний KPI", value: "82%", icon: TrendingUp, color: "#10B981", href: "/staff/kpi" },
  { label: "Смены сегодня", value: 28, icon: Calendar, color: "#F59E0B", href: "/staff/schedule" },
  { label: "ФОТ месяц", value: "2.4 млн ₽", icon: HandCoins, color: "#EF4444", href: "/staff/payments" },
];

const quickLinks = [
  { title: "Список сотрудников", subtitle: "Роли, отделы, статусы", href: "/staff/list" },
  { title: "KPI и эффективность", subtitle: "План/факт, рейтинги, отзывы", href: "/staff/kpi" },
  { title: "График и смены", subtitle: "Шаблоны смен, закрытие табелей", href: "/staff/schedule" },
  { title: "Зарплаты и начисления", subtitle: "ФОТ, бонусы, выплаты", href: "/staff/payments" },
  { title: "Отпуска и отсутствия", subtitle: "Учет неявок, замены, остатки дней", href: "/staff/vacations" },
  { title: "Отчёты", subtitle: "HR-аналитика и тренды", href: "/staff/reports" },
];

const alerts = [
  { title: "Отпуск Анны Козловой", desc: "13–20 ноября · требуется замена в Coworking", color: "#F59E0B" },
  { title: "KPI ниже порога", desc: "Бариста — средний KPI 68% vs цели 75%", color: "#EF4444" },
  { title: "ФОТ", desc: "План на ноябрь выполнен на 42%", color: "#6366F1" },
];

export default function StaffOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA STAFF</div>
        <h1 className="text-2xl font-semibold mt-1">Команда и операционный HR</h1>
        <p className="text-sm text-zinc-500 mt-1">Контролируйте смены, KPI, начисления и отсутствие сотрудников.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {snapshot.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "20", color: item.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
                </div>
                <div className="text-2xl font-semibold">{item.value}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Важные уведомления</div>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.title} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--foreground)' }}>{alert.title}</span>
                  <span className="text-xs font-semibold" style={{ color: alert.color }}>Внимание</span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{alert.desc}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>Быстрые действия</div>
          <div className="space-y-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="p-3 rounded-xl border transition-colors hover:border-foreground/30" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</div>
                  <div className="text-xs text-zinc-500 mt-1">{item.subtitle}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                    Перейти <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
