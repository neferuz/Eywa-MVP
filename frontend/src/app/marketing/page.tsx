"use client";

import Card from "@/components/Card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Instagram,
  MessageCircle,
  Globe,
  UsersRound,
  TrendingUp,
  ArrowDownRight,
  Percent,
} from "lucide-react";

const sources = [
  { channel: "Instagram", leads: 120, bookings: 42, sales: 28, cpl: 180, icon: Instagram, color: "#E4405F" },
  { channel: "Telegram", leads: 80, bookings: 33, sales: 20, cpl: 150, icon: MessageCircle, color: "#0088CC" },
  { channel: "Сайт", leads: 65, bookings: 25, sales: 14, cpl: 210, icon: Globe, color: "#6366F1" },
  { channel: "Рекомендации", leads: 55, bookings: 40, sales: 34, cpl: 50, icon: UsersRound, color: "#10B981" },
];

const funnelStages = [
  { stage: "Заявка", value: 320 },
  { stage: "Запись", value: 140 },
  { stage: "Визит", value: 110 },
  { stage: "Продажа", value: 96 },
];

const roiTrend = [
  { name: "Авг", value: 1.6 },
  { name: "Сен", value: 1.72 },
  { name: "Окт", value: 1.85 },
  { name: "Ноя", value: 1.94 },
  { name: "Дек", value: 2.05 },
];

const roiByChannel = sources.map((s) => ({
  channel: s.channel,
  roi: Number((s.sales * 28_000 / (s.leads * s.cpl)).toFixed(2)),
}));

export default function MarketingPage() {
  const totalLeads = sources.reduce((sum, s) => sum + s.leads, 0);
  const totalSales = sources.reduce((sum, s) => sum + s.sales, 0);
  const avgConversion = Math.round((totalSales / totalLeads) * 1000) / 10;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA MARKETING · Общий обзор</h1>
        <div className="text-xs text-zinc-500">Данные обновлены: 11 ноября 2025</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#6366F1" + "20", color: "#6366F1" }}>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Всего лидов</div>
          </div>
          <div className="text-2xl font-semibold">{totalLeads}</div>
          <div className="text-xs text-zinc-500 mt-1">+18% к прошлому месяцу</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#10B981" + "20", color: "#10B981" }}>
              <Percent className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Конверсия в продажу</div>
          </div>
          <div className="text-2xl font-semibold">{avgConversion.toFixed(1)}%</div>
          <div className="text-xs text-zinc-500 mt-1">С этапа «заявка» до оплаты</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#EF4444" + "20", color: "#EF4444" }}>
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Средний CPL</div>
          </div>
          <div className="text-2xl font-semibold">
            {Math.round(sources.reduce((sum, s) => sum + s.cpl, 0) / sources.length)} ₽
          </div>
          <div className="text-xs text-zinc-500 mt-1">Средняя стоимость заявки по всем каналам</div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 текст-sm font-medium" style={{ color: "var(--foreground)" }}>Источники заявок</div>
        <div className="space-y-3">
          {sources.map((source) => {
            const Icon = source.icon;
            const bookingRate = (source.bookings / source.leads) * 100;
            const saleRate = (source.sales / source.leads) * 100;
            return (
              <div
                key={source.channel}
                className="flex items-center gap-4 p-3 rounded-lg"
                style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: source.color + "20", color: source.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium">{source.channel}</span>
                    <span className="text-xs text-zinc-500">{source.leads} заявок</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-zinc-500">Записей</div>
                      <div className="font-medium">{source.bookings} ({bookingRate.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">Продаж</div>
                      <div className="font-medium">{source.sales} ({saleRate.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">CPL</div>
                      <div className="font-medium">{source.cpl.toLocaleString("ru-RU")} ₽</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Конверсии · заявка → запись → продажа</div>
            <div className="text-xs text-zinc-500">Воронка по всем каналам</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelStages} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketingFunnel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="stage" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Количество"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fill="url(#marketingFunnel)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>ROI по каналам</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiByChannel} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="channel" stroke="currentColor" tick={{ fontSize: 11 }} />
                <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)}x`, "ROI"]}
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="roi" name="ROI" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>ROI · динамика окупаемости</div>
          <div className="text-xs text-zinc-500">цель &gt; 2.0x</div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roiTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} />
              <YAxis stroke="currentColor" tick={{ fontSize: 12 }} domain={[1, "auto"]} />
              <Tooltip
                formatter={(val: number) => [`${val.toFixed(2)}x`, "ROI"]}
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "12px",
                }}
              />
              <Line type="monotone" dataKey="value" name="ROI" stroke="#F59E0B" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

