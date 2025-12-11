"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Users, Target, Instagram, MessageCircle, Activity } from "lucide-react";
import { fetchMarketingTraffic, MarketingTrafficChannel, MarketingTrafficResponse } from "@/lib/api";

const ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  telegram: MessageCircle,
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

export default function MarketingTrafficPage() {
  const [data, setData] = useState<MarketingTrafficResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const response = await fetchMarketingTraffic({ signal: controller.signal });
        setData(response);
        setError(null);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        const message = (err as Error).message || "Не удалось загрузить данные";
        if (message.includes("подключиться к серверу")) {
          setError("Бекенд недоступен. Проверьте http://localhost:8000");
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const channels = useMemo(() => {
    if (!data) return [] as (MarketingTrafficChannel & { icon: typeof Instagram })[];
    return data.channels.map((channel) => ({
      ...channel,
      icon: ICONS[channel.id] || Activity,
    }));
  }, [data]);

  const trend = useMemo(
    () =>
      (data?.trend ?? []).map((point) => ({
        name: formatDateLabel(point.date),
        value: point.leads,
      })),
    [data],
  );

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">EYWA MARKETING · Источники заявок</h1>

      {loading && (
        <Card>
          <div className="py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Загружаем данные с бекенда...
          </div>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <div className="py-6 space-y-2">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Не удалось получить статистику
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {error}
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#6366F1" + "20", color: "#6366F1" }}
                >
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Всего лидов
                </div>
              </div>
              <div className="text-2xl font-semibold">{summary?.total_leads ?? 0}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#10B981" + "20", color: "#10B981" }}
                >
                  <Target className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Конверсия (в продажи)
                </div>
              </div>
              <div className="text-2xl font-semibold">{formatPercent(summary?.conversion ?? 0)}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#F59E0B" + "20", color: "#F59E0B" }}
                >
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Пробные заявки
                </div>
              </div>
              <div className="text-2xl font-semibold">{summary?.total_trials ?? 0}</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: "#10B981" + "20", color: "#10B981" }}
                >
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Оплачено
                </div>
              </div>
              <div className="text-2xl font-semibold">{summary?.total_sales ?? 0}</div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Каналы привлечения
            </div>
            <div className="space-y-3">
              {channels.length === 0 && (
                <div
                  className="rounded-lg border p-4 text-sm"
                  style={{ background: "var(--muted)", borderColor: "var(--card-border)", color: "var(--muted-foreground)" }}
                >
                  Пока нет заявок, чтобы построить статистику.
                </div>
              )}
              {channels.map((row) => {
                const Icon = row.icon;
                const convColor = row.conversion >= 0.2 ? "#10B981" : row.conversion >= 0.1 ? "#F59E0B" : "#EF4444";
                return (
                  <div
                    key={row.id}
                    className="flex items-center gap-4 p-3 rounded-lg"
                    style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ background: row.accent + "20", color: row.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium">{row.name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-zinc-500" />
                            <span className="text-zinc-500">{row.leads} лидов</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" style={{ color: convColor }} />
                            <span className="font-medium" style={{ color: convColor }}>
                              {formatPercent(row.conversion)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div>
                          <span className="text-zinc-500">Спросили цену: </span>
                          <span className="font-medium">{row.inquiry}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Пробный: </span>
                          <span className="font-medium">{row.trial}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Оплатили: </span>
                          <span className="font-medium">{row.sale}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ background: convColor + "20" }}
                      >
                        <span className="text-lg font-bold" style={{ color: convColor }}>
                          {formatPercent(row.conversion)}
                        </span>
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
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Лиды по каналам
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ background: "#6366F1" }} />
                  <span className="text-zinc-500">Лиды</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--panel)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "12px",
                      }}
                    />
                    <Bar dataKey="leads" name="Лиды" fill="#6366F1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <div className="mb-4 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Динамика лидов (14 дней)
              </div>
              <div className="h-64">
                {trend.length === 0 ? (
                  <div
                    className="h-full flex items-center justify-center text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Нет данных для графика.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="marketingTrafficLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                      <XAxis dataKey="name" stroke="currentColor" tick={{ fontSize: 12 }} />
                      <YAxis stroke="currentColor" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--panel)",
                          border: "1px solid var(--card-border)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#marketingTrafficLeads)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
