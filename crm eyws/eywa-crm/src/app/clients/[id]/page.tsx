import Card from "@/components/Card";
import { getClientById } from "@/data/clients";
import Link from "next/link";
import { ArrowLeft, Phone, AtSign, User2, Share2, ExternalLink, Calendar, CreditCard, FileText, AlertTriangle, StickyNote, Instagram, MessageCircle, UsersRound, Globe } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = getClientById(id);
  if (!client) {
    return (
      <div className="space-y-4">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Назад к клиентам
        </Link>
        <div className="text-sm text-zinc-500">Клиент не найден.</div>
      </div>
    );
  }

  const initials = client.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const igHandle = client.instagram?.replace(/^@/, "") || "";
  const igUrl = igHandle ? `https://instagram.com/${igHandle}` : undefined;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Активный": return "#10B981";
      case "Новый": return "#6366F1";
      case "Ушедший": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "Body": return "#6366F1";
      case "Coworking": return "#10B981";
      case "Coffee": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Instagram": return Instagram;
      case "Telegram": return MessageCircle;
      case "Рекомендации": return UsersRound;
      case "Google": return Globe;
      default: return Share2;
    }
  };

  const SourceIcon = getSourceIcon(client.source);
  const statusColor = getStatusColor(client.status);
  const directionColor = getDirectionColor(client.direction);

  return (
    <div className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
        <ArrowLeft className="h-4 w-4" /> Назад к клиентам
      </Link>

      <div className="relative overflow-hidden" style={{ borderRadius: 30, background: "var(--panel)", border: "1px solid var(--card-border)" }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${directionColor}15, transparent)` }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold shrink-0" style={{ background: directionColor + "20", color: directionColor }}>
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold mb-2">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-medium" style={{ background: statusColor + "20", color: statusColor }}>
                  {client.status}
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-medium" style={{ background: directionColor + "20", color: directionColor }}>
                  {client.direction}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {client.phone && (
              <a
                href={`tel:${client.phone.replace(/\s|\(|\)|-/g, "")}`}
                className="btn-outline"
              >
                <Phone className="h-4 w-4" /> Позвонить
              </a>
            )}
            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <Instagram className="h-4 w-4" /> Instagram <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User2 className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Контакты</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User2 className="h-4 w-4 text-zinc-500" />
              <span style={{ color: 'var(--foreground)' }}>{client.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-zinc-500" />
              <a href={`tel:${client.phone.replace(/\s|\(|\)|-/g, "")}`} className="hover:underline" style={{ color: 'var(--foreground)' }}>
                {client.phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AtSign className="h-4 w-4 text-zinc-500" />
              <span style={{ color: 'var(--foreground)' }}>{client.instagram || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <SourceIcon className="h-4 w-4 text-zinc-500" />
              <span style={{ color: 'var(--foreground)' }}>{client.source}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Абонементы</div>
          </div>
          {client.subscriptions.length ? (
            <div className="space-y-3">
              {client.subscriptions.map((s, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>{s.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span>до {new Date(s.validTill).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Нет активных</div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Последние визиты</div>
          </div>
          {client.visits.length ? (
            <div className="space-y-2">
              {client.visits.slice(0, 5).map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg" style={{ background: 'var(--muted)' }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: directionColor }} />
                  <span style={{ color: 'var(--foreground)' }}>{new Date(v).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">Нет визитов</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Противопоказания</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{client.contraindications || "Нет противопоказаний"}</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="h-4 w-4 text-zinc-500" />
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Заметки тренера</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--muted)', border: '1px solid var(--card-border)' }}>
            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{client.coachNotes || "Нет заметок"}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}


