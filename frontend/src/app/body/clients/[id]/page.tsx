"use client";

import { use, useEffect, useState } from "react";
import Card from "@/components/Card";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Activity,
  CheckCircle2,
  WalletCards,
  History,
  BellRing,
} from "lucide-react";
import { fetchClientByIdFromApi } from "@/lib/api";

type ClientDirection = "Body" | "Coworking" | "Coffee";
type ClientStatus = "Активный" | "Новый" | "Ушедший";

type Subscription = { name: string; validTill: string };

type ClientProfile = {
  id: string;
  name: string;
  phone: string;
  contractNumber?: string | null;
  subscriptionNumber?: string | null;
  birthDate?: string | null;
  instagram?: string | null;
  source?: string;
  direction: ClientDirection;
  status: ClientStatus;
  subscriptions: Subscription[];
  visits: string[];
  activationDate?: string | null;
  contraindications?: string | null;
  coachNotes?: string | null;
};

const directionLabels: Record<ClientDirection, string> = {
  Body: "Body&mind",
  Coworking: "Coworking (резиденты)",
  Coffee: "Детская",
};

const statusTone: Record<ClientStatus, string> = {
  Новый: "rgba(59, 130, 246, 0.85)",
  Активный: "rgba(22, 163, 74, 0.85)",
  Ушедший: "rgba(220, 38, 38, 0.85)",
};

type PageProps = { params: Promise<{ id: string }> };

export default function BodyClientDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClientByIdFromApi<ClientProfile>(id, { cache: "no-store" });
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Клиент не найден");
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/body/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Загрузка...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Link href="/body/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Клиент не найден</div>
      </div>
    );
  }

  const statusColor = statusTone[client.status];
  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sub = client.subscriptions?.[0];
  const lastVisit = client.visits && client.visits.length
    ? new Date(client.visits[client.visits.length - 1]).toLocaleDateString("ru-RU")
    : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/body/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
            <ArrowLeft className="h-4 w-4" /> Назад к клиентам
          </Link>
          <span className="text-xs px-2 py-1 rounded-full border border-[var(--card-border)] bg-[var(--muted)] text-[var(--muted-foreground)]">
            Клиент ID: {client.id}
          </span>
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Профиль клиента
        </span>
      </div>

      {/* Заголовок с информацией о клиенте */}
      <div className="relative overflow-hidden" style={{ borderRadius: 30, background: "var(--panel)", border: "1px solid var(--card-border)" }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${statusColor}15, transparent)` }} />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <div 
              className="h-16 w-16 rounded-full flex items-center justify-center shrink-0 text-lg font-semibold"
              style={{ background: statusColor + "20", color: statusColor }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: statusColor + "20", color: statusColor }}
                >
                  {client.status}
                </span>
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}
                >
                  {directionLabels[client.direction]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm lg:items-end" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{client.phone}</span>
              {client.instagram && <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{client.instagram}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
                Договор: {client.contractNumber || "—"}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
                Абонемент: {client.subscriptionNumber || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Абонемент</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Номер договора, абонемента, срок</p>
            </div>
            <WalletCards className="h-5 w-5" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Номер договора</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{client.contractNumber || '—'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Номер абонемента</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{client.subscriptionNumber || '—'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Срок абонемента</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{sub?.validTill ? new Date(sub.validTill).toLocaleDateString('ru-RU') : '—'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Активация</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{client.activationDate ? new Date(client.activationDate).toLocaleDateString('ru-RU') : 'с первого визита'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Дата рождения</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{client.birthDate ? new Date(client.birthDate).toLocaleDateString('ru-RU') : '—'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Направление</div>
              <div className="font-medium" style={{ color: 'var(--foreground)' }}>{directionLabels[client.direction]}</div>
            </div>
          </div>
        </Card>

        <Card style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Посещения</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Последний визит, активность</p>
            </div>
            <Activity className="h-5 w-5" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Последний визит</span>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{lastVisit}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Всего визитов</span>
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{client.visits?.length || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>История визитов</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Фиксируем для активации абонемента</p>
            </div>
            <History className="h-5 w-5" />
          </div>
          {client.visits?.length ? (
            <div className="space-y-2 text-sm">
              {client.visits.map((v) => (
                <div key={v} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2">
                  <span style={{ color: 'var(--foreground)' }}>{new Date(v).toLocaleDateString('ru-RU')}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Пока нет визитов</div>
          )}
        </Card>

        <Card style={{ borderRadius: 24 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Примечания</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Противопоказания, заметки тренера</p>
            </div>
            <BellRing className="h-5 w-5" />
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Противопоказания</div>
              <div style={{ color: 'var(--foreground)' }}>{client.contraindications || '—'}</div>
            </div>
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--muted)] p-3">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Заметки тренера</div>
              <div style={{ color: 'var(--foreground)' }}>{client.coachNotes || '—'}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
