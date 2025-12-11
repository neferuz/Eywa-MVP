export type ClientStatus = "Активный" | "Новый" | "Ушедший";
export type ClientDirection = "Body" | "Coworking" | "Coffee";

export type Subscription = { name: string; validTill: string };
export type Client = {
  id: string;
  name: string;
  phone: string;
  instagram?: string;
  source: "Instagram" | "Telegram" | "Рекомендации" | "Google";
  direction: ClientDirection;
  status: ClientStatus;
  subscriptions: Subscription[];
  visits: string[]; // ISO dates
  contraindications?: string;
  coachNotes?: string;
};

export const CLIENTS: Client[] = [
  {
    id: "c1",
    name: "Иван Петров",
    phone: "+7 900 123-45-67",
    instagram: "@ivan.fit",
    source: "Instagram",
    direction: "Body",
    status: "Активный",
    subscriptions: [{ name: "Body 12 занятий", validTill: "2026-01-15" }],
    visits: ["2025-11-02", "2025-11-05"],
    contraindications: "Нет",
    coachNotes: "Фокус на спине, избегать осевых нагрузок",
  },
  {
    id: "c2",
    name: "Мария Смирнова",
    phone: "+7 901 222-33-44",
    instagram: "@masha.space",
    source: "Рекомендации",
    direction: "Coworking",
    status: "Новый",
    subscriptions: [],
    visits: ["2025-11-01"],
    contraindications: "Аллергия на латекс",
    coachNotes: "—",
  },
  {
    id: "c3",
    name: "Олег Соколов",
    phone: "+7 999 111-22-33",
    instagram: "@oleg.coffee",
    source: "Google",
    direction: "Coffee",
    status: "Ушедший",
    subscriptions: [{ name: "Coffee клуб", validTill: "2025-08-01" }],
    visits: ["2025-06-10", "2025-07-02"],
    contraindications: "—",
    coachNotes: "—",
  },
];

export function getClientById(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id);
}



