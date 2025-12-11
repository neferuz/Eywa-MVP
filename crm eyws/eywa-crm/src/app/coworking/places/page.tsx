"use client";

import Card from "@/components/Card";
import { MapPin, Users, Building2, Sparkles } from "lucide-react";

type CapsuleType = "capsule" | "event";

interface Capsule {
  id: string;
  name: string;
  seats: number;
  description?: string;
  type: CapsuleType;
}

const CAPSULES: Capsule[] = [
  { id: "capsule-1", name: "Капсула 1", seats: 4, description: "Командная капсула на 4 места", type: "capsule" },
  { id: "capsule-2", name: "Капсула 2", seats: 6, description: "Увеличенная капсула с meeting-зоной", type: "capsule" },
  { id: "capsule-3", name: "Капсула 3", seats: 1, description: "Индивидуальная капсула", type: "capsule" },
  { id: "capsule-4", name: "Капсула 4", seats: 1, description: "Индивидуальная капсула", type: "capsule" },
  { id: "capsule-5", name: "Капсула 5", seats: 1, description: "Индивидуальная капсула", type: "capsule" },
  { id: "event-zone", name: "Ивент-зона", seats: 20, description: "Гибкая зона для воркшопов, ивентов и презентаций", type: "event" },
];

const typeLabel: Record<CapsuleType, string> = {
  capsule: "Капсула",
  event: "Ивент‑зона",
};

const typeTone: Record<CapsuleType, string> = {
  capsule: "#6366F1",
  event: "#F97316",
};

export default function CoworkingPlacesPage() {
  const totalSeats = CAPSULES.reduce((sum, capsule) => sum + capsule.seats, 0);
  const capsuleCount = CAPSULES.filter((capsule) => capsule.type === "capsule").length;
  const eventSeats = CAPSULES.find((capsule) => capsule.type === "event")?.seats ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">EYWA Coworking · Капсулы и места</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Актуальная конфигурация посадочных мест: индивидуальные капсулы, командные пространства и ивент-зона.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Капсулы</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{capsuleCount}</span>
            <span className="text-sm text-zinc-500">единиц</span>
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Всего мест</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{totalSeats}</span>
            <span className="text-sm text-zinc-500">посадок</span>
          </div>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Ивент‑зона</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{eventSeats}</span>
            <span className="text-sm text-zinc-500">человек</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CAPSULES.map((capsule) => {
          const tone = typeTone[capsule.type];
          const Icon = capsule.type === "event" ? Sparkles : Building2;
          return (
            <Card key={capsule.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {capsule.name}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${tone}14`, color: tone }}>
                    <Icon className="h-3.5 w-3.5" />
                    {typeLabel[capsule.type]}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Вместимость</span>
                  <div className="text-2xl font-semibold" style={{ color: tone }}>
                    {capsule.seats}
                  </div>
                  <span className="text-xs text-zinc-500">мест</span>
                </div>
              </div>
              {capsule.description && (
                <p className="text-sm text-zinc-500">{capsule.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>Подключено рабочих мест: {capsule.seats}</span>
                </div>
                <span>ID: {capsule.id}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
