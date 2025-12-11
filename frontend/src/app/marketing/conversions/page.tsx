"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { Search, Filter, ArrowRightCircle, CircleDot, CheckCircle2, ArrowUpRight, Activity } from "lucide-react";
import { fetchMarketingConversions, MarketingConversionRow } from "@/lib/api";

const STAGES = [
  { key: "leads", label: "Заявка" },
  { key: "bookings", label: "Запись" },
  { key: "visits", label: "Визит" },
  { key: "sales", label: "Продажа" },
] as const;

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default function MarketingConversionsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MarketingConversionRow[]>([]);
  const [selected, setSelected] = useState<MarketingConversionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const res = await fetchMarketingConversions({ signal: controller.signal });
        setRows(res.rows);
        setError(null);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        const message = (err as Error).message || "Не удалось загрузить данные";
        if (message.includes("подключиться к серверу")) {
          setError("Бекенд недоступен. Проверьте http://localhost:8000");
        } else {
          setError(message);
        }
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((row) => row.channel.toLowerCase().includes(q.toLowerCase()));
  }, [rows, q]);

  const totals = STAGES.map((stage) => ({
    stage,
    sum: filtered.reduce((acc, row) => acc + row[stage.key], 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EYWA MARKETING · Конверсии</h1>
        <div className="text-xs text-zinc-500">Анализ воронки: заявка → запись → визит → продажа</div>
      </div>

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
            {totals.map(({ stage, sum }) => (
              <Card key={stage.key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "#6366F1" + "20", color: "#6366F1" }}>
                    <ArrowRightCircle className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {stage.label}
                  </div>
                </div>
                <div className="text-2xl font-semibold">{sum}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Конверсия: {totals[0].sum ? formatPercent(sum / totals[0].sum) : "0.0%"}
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  placeholder="Фильтр по каналу"
                  className="h-9 w-full pl-9 pr-3 text-sm"
                  style={{ background: "var(--muted)", border: "1px solid var(--card-border)" }}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Filter className="h-3.5 w-3.5" />
                <span>Кликайте по строке, чтобы увидеть детальную воронку</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm table-grid" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead className="text-left" style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <tr>
                    <th className="py-3 pr-4" style={{ color: "var(--foreground)" }}>
                      Канал
                    </th>
                    {STAGES.map((stage) => (
                      <th key={stage.key} className="py-3 pr-4" style={{ color: "var(--foreground)" }}>
                        {stage.label}
                      </th>
                    ))}
                    <th className="py-3" style={{ color: "var(--foreground)" }}>
                      CR →
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td className="py-4 text-sm text-zinc-500" colSpan={STAGES.length + 2}>
                        Нет данных для отображения.
                      </td>
                    </tr>
                  )}
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderTop: "1px solid var(--card-border)" }}
                      className="hover:bg-black/[.02] dark:hover:bg-white/[.03] transition-colors cursor-pointer"
                      onClick={() => setSelected(row)}
                    >
                      <td className="py-3 pr-4 font-medium" style={{ color: "var(--foreground)" }}>
                        <span className="inline-flex h-2.5 w-2.5 rounded-full mr-2" style={{ background: row.accent }} />
                        {row.channel}
                      </td>
                      {STAGES.map((stage) => (
                        <td key={stage.key} className="py-3 pr-4" style={{ color: "var(--foreground)" }}>
                          {row[stage.key]}
                        </td>
                      ))}
                      <td className="py-3" style={{ color: "var(--foreground)" }}>
                        {formatPercent(row.conversion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Конверсия по каналу">
            {selected && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {selected.channel}
                  </div>
                  <span className="text-xs text-zinc-500">CR → {formatPercent(selected.conversion)}</span>
                </div>
                <div className="space-y-2">
                  {STAGES.map((stage, index) => (
                    <div key={stage.key} className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: selected.accent + "20", color: selected.accent }}>
                        {index === 0 ? <CircleDot className="h-4 w-4" /> : index === STAGES.length - 1 ? <CheckCircle2 className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: "var(--foreground)" }}>
                          {stage.label}
                        </div>
                        <div className="text-xs text-zinc-500">{selected[stage.key]} контактов</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
