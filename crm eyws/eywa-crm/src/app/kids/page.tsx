"use client";

import Card from "@/components/Card";
import Link from "next/link";
import { Users, Calendar, DollarSign, ArrowUpRight, Sparkles } from "lucide-react";

const summary = [
  { label: "Групп сегодня", value: 12, icon: Calendar, color: "#6366F1" },
  { label: "Детей в базе", value: "186", icon: Users, color: "#10B981" },
  { label: "Выручка за месяц", value: "312 000 ₽", icon: DollarSign, color: "#F59E0B" },
];

const attendance = [
  { day: "Пн", groups: 9, avg: 7 },
  { day: "Вт", groups: 10, avg: 8 },
  { day: "Ср", groups: 12, avg: 9 },
  { day: "Чт", groups: 11, avg: 8 },
  { day: "Пт", groups: 8, avg: 6 },
  { day: "Сб", groups: 6, avg: 5 },
  { day: "Вс", groups: 4, avg: 4 },
];

const revenueByProgram = [
  { program: "STEAM Lab", revenue: 142000, share: 45 },
  { program: "Art Kids", revenue: 98000, share: 31 },
  { program: "Dance junior", revenue: 72000, share: 24 },
];

const quickLinks = [
  { title: "Посещаемость", subtitle: "Отчёт по дням недели и заполняемости групп", href: "/kids/attendance" },
  { title: "Продажи", subtitle: "Доходы по программам, абонементы, остатки", href: "/kids/revenue" },
  { title: "Программы", subtitle: "Учебный план, наставники, расписание", href: "/body/services" },
  { title: "AI рекомендации", subtitle: "Следующие кампании удержания", href: "/ai" },
];

export default function KidsOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.12em] text-zinc-500">EYWA KIDS</div>
        <h1 className="text-2xl font-semibold mt-1">Детские программы</h1>
        <p className="text-sm text-zinc-500 mt-1">Отслеживайте посещаемость групп и выручку по программам.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "20", color: item.color }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</div>
              </div>
              <div className="text-2xl font-semibold">{item.value}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Посещаемость по дням недели</div>
              <p className="text-xs text-zinc-500 mt-1">Количество групп и среднее посещение.</p>
            </div>
          </div>
          <div className="space-y-3">
            {attendance.map((row) => (
              <div key={row.day} className="grid grid-cols-3 gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{row.day}</div>
                <div className="text-sm text-zinc-500">Групп: {row.groups}</div>
                <div className="text-sm text-zinc-500">Средняя посещаемость: {row.avg}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Выручка по программам</div>
          </div>
          <div className="space-y-3">
            {revenueByProgram.map((item) => (
              <div key={item.program} className="p-3 rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--foreground)' }}>{item.program}</span>
                  <span className="font-semibold" style={{ color: '#6366F1' }}>{item.revenue.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.share}%`, background: '#6366F1' }} />
                </div>
                <div className="text-xs text-zinc-500 mt-1">{item.share}% от общей выручки Kids</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Быстрые переходы</div>
            <p className="text-xs text-zinc-500 mt-1">Отчёты по посещаемости и продажам.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="p-4 rounded-xl border transition-colors hover:border-foreground/30" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.title}</div>
                <div className="text-xs text-zinc-500 mt-1">{item.subtitle}</div>
                <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
                  Перейти <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
