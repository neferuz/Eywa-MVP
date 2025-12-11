"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent as ReactDragEvent, JSX } from "react";
import Card from "@/components/Card";
import { CLIENTS } from "@/data/clients";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Activity,
  Users,
  Baby,
  X,
  UserPlus,
  Pencil,
  CalendarClock,
  Ban,
  Maximize2,
  Minimize2,
  Clock,
  User,
  Phone,
  CreditCard,
  Move,
  MapPin,
  MessageSquare,
  CheckCircle,
  Circle,
  XCircle,
  GripVertical,
} from "lucide-react";

const TIME_SLOTS = [
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
] as const;

type EventStatus = "paid" | "reserved" | "free";

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  endTime?: string; // Время окончания для растягивания
  status: EventStatus;
  color: string;
  clients?: string[];
  coach?: string;
  note?: string;
  peopleCount?: number; // Количество человек
  capacity?: number; // Вместимость
  phone?: string; // Телефон клиента
};

type OverviewSlots = Partial<
  Record<(typeof TIME_SLOTS)[number], CalendarEvent | null>
>;

type OverviewColumn = {
  key: string;
  label: string;
  capacityLabel: string;
  slots: OverviewSlots;
};

type OverviewGroup = {
  key: string;
  label: string;
  columns: OverviewColumn[];
};

const STATUS_COLORS: Record<EventStatus, string> = {
  paid: "#22C55E", // Яркий зеленый
  reserved: "#F97316", // Яркий оранжевый
  free: "#94A3B8",
};

const OVERVIEW_GROUPS: OverviewGroup[] = [
  {
    key: "coworking",
    label: "Коворкинг",
    columns: [
      {
        key: "capsule-1",
        label: "Капсула 1",
        capacityLabel: "4 места",
        slots: {
          "9:00": {
            id: "capsule-1-0900",
            title: "EYWA Sales",
            time: "9:00",
            endTime: "12:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Алексей М."],
            peopleCount: 4,
            phone: "+998 90 123 45 67",
            note: "Нужен кабель для проектора",
          },
          "16:00": {
            id: "capsule-1-1600",
            title: "UX Research",
            time: "16:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Дмитрий К."],
            peopleCount: 2,
            phone: "+998 90 234 56 78",
          },
        },
      },
      {
        key: "capsule-2",
        label: "Капсула 2",
        capacityLabel: "6 мест",
        slots: {
          "9:00": {
            id: "capsule-2-0900",
            title: "EYWA Marketing",
            time: "9:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Ольга С."],
            peopleCount: 3,
            phone: "+998 90 345 67 89",
            note: "Годовой договор",
          },
          "10:00": {
            id: "capsule-2-1000",
            title: "Design Sprint",
            time: "10:00",
            endTime: "14:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Иван П."],
            peopleCount: 5,
            phone: "+998 90 456 78 90",
            note: "Продлили до 14:00",
          },
          "18:00": {
            id: "capsule-2-1800",
            title: "Фриланс-зона",
            time: "18:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Сергей В."],
            peopleCount: 1,
            phone: "+998 90 567 89 01",
          },
        },
      },
      {
        key: "capsule-3",
        label: "Капсула 3",
        capacityLabel: "1 место",
        slots: {
          "11:00": {
            id: "capsule-3-1100",
            title: "Hot Desk",
            time: "11:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Мария R."],
            peopleCount: 1,
            note: "Абонемент Flex",
          },
          "19:00": {
            id: "capsule-3-1900",
            title: "Hot Desk",
            time: "19:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Илья Б."],
            peopleCount: 1,
          },
        },
      },
      {
        key: "capsule-4",
        label: "Капсула 4",
        capacityLabel: "1 место",
        slots: {
          "9:00": {
            id: "capsule-4-0900",
            title: "Hot Desk",
            time: "9:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Екатерина В."],
            peopleCount: 1,
          },
          "15:00": {
            id: "capsule-4-1500",
            title: "Hot Desk",
            time: "15:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["ИП Соколова"],
            peopleCount: 1,
          },
        },
      },
      {
        key: "capsule-5",
        label: "Капсула 5",
        capacityLabel: "1 место",
        slots: {
          "10:00": {
            id: "capsule-5-1000",
            title: "Hot Desk",
            time: "10:00",
            endTime: "13:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Станислав Г."],
            peopleCount: 1,
          },
          "17:00": {
            id: "capsule-5-1700",
            title: "Интервью с кандидатом",
            time: "17:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Анна Рекрутер"],
            peopleCount: 2,
            phone: "+998 90 666 77 88",
          },
        },
      },
      {
        key: "capsule-6",
        label: "ИвентЗона",
        capacityLabel: "20 мест",
        slots: {
          "9:00": {
            id: "capsule-6-0900",
            title: "Резиденты EYWA",
            time: "9:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Азиз Д."],
            peopleCount: 3,
            phone: "+998 90 123 45 67",
            note: "Мониторим каждые 2 часа",
          },
          "13:00": {
            id: "capsule-6-1300",
            title: "Резиденты EYWA",
            time: "13:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Мария П."],
            peopleCount: 2,
            phone: "+998 90 234 56 78",
          },
          "18:00": {
            id: "capsule-6-1800",
            title: "Open Space",
            time: "18:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Анна К."],
            peopleCount: 4,
            phone: "+998 90 345 67 89",
          },
        },
      },
    ],
  },
  {
    key: "body",
    label: "Body & Mind",
    columns: [
      {
        key: "body-main",
        label: "BODY",
        capacityLabel: "10 мест",
        slots: {
          "9:00": {
            id: "body-0900",
            title: "Stretching",
            time: "9:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["София М.", "Елена К.", "Анна В.", "Мария С.", "Ольга Н.", "Татьяна П.", "Ирина Л.", "Наталья Д."],
            coach: "Евгения П.",
            peopleCount: 8,
            phone: "+998 90 111 22 33",
          },
          "17:00": {
            id: "body-1700",
            title: "Pilates",
            time: "17:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Виктория Р.", "Екатерина Т.", "Анастасия Ф.", "Дарья Ш.", "Юлия Б.", "Светлана Г."],
            coach: "Евгения П.",
            peopleCount: 6,
            phone: "+998 90 222 33 44",
          },
        },
      },
      {
        key: "body-reform",
        label: "REFORM",
        capacityLabel: "4 места",
        slots: {
          "9:00": {
            id: "reform-0900",
            title: "Reformer",
            time: "9:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Анжелика", "Антонина"],
            coach: "Анжелика К.",
          },
          "19:00": {
            id: "reform-1900",
            title: "Reformer",
            time: "19:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Анна К.", "Елена М.", "Мария П."],
            coach: "Анжелика К.",
            peopleCount: 3,
            phone: "+998 90 333 44 55",
          },
        },
      },
    ],
  },
  {
    key: "kids",
    label: "EYWA Kids",
    columns: [
      {
        key: "kids-main",
        label: "Kids",
        capacityLabel: "10 мест",
        slots: {
          "11:00": {
            id: "kids-1100",
            title: "Kids Lab",
            time: "11:00",
            status: "reserved",
            color: STATUS_COLORS.reserved,
            clients: ["Алиса К.", "Милана Р.", "Полина С.", "Варвара Т.", "Арина Ф.", "София Ш.", "Анна Б."],
            note: "Ожидаем оплату двух мест",
            peopleCount: 7,
            phone: "+998 90 444 55 66",
          },
          "16:00": {
            id: "kids-1600",
            title: "Creative Time",
            time: "16:00",
            status: "paid",
            color: STATUS_COLORS.paid,
            clients: ["Максим В.", "Артем Д.", "Иван Ж.", "Дмитрий З.", "Александр И."],
            note: "Полная оплата",
            peopleCount: 5,
            phone: "+998 90 555 66 77",
          },
        },
      },
    ],
  },
];

const makeOverviewSlotKey = (groupKey: string, columnKey: string, time: string) =>
  `${groupKey}__${columnKey}__${time}`;

const INITIAL_OVERVIEW_SLOTS: Record<string, CalendarEvent | null> = (() => {
  const map: Record<string, CalendarEvent | null> = {};
  OVERVIEW_GROUPS.forEach((group) => {
    group.columns.forEach((column) => {
      TIME_SLOTS.forEach((time) => {
        const slotEvent = column.slots?.[time as (typeof TIME_SLOTS)[number]] ?? null;
        const key = makeOverviewSlotKey(group.key, column.key, time);
        map[key] = slotEvent ?? null;
      });
    });
  });
  return map;
})();

// Функция для осветления цвета (для фона)
const lightenColor = (color: string, amount: number = 0.4): string => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${newR}, ${newG}, ${newB})`;
};

// Функция для затемнения цвета (для обводки)
const darkenColor = (color: string, amount: number = 0.2): string => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const newR = Math.max(0, Math.round(r * (1 - amount)));
  const newG = Math.max(0, Math.round(g * (1 - amount)));
  const newB = Math.max(0, Math.round(b * (1 - amount)));
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const getTextColor = (color: string): string => {
  // Для светлых цветов используем темный текст, для темных - светлый
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // YIQ equation для определения яркости
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.98)';
};

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgba(')) {
    const values = color
      .replace('rgba(', '')
      .replace(')', '')
      .split(',')
      .map((v) => v.trim());
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
  }
  if (color.startsWith('rgb(')) {
    const values = color
      .replace('rgb(', '')
      .replace(')', '')
      .split(',')
      .map((v) => parseInt(v.trim(), 10));
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
  }
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

// Функция для вычисления количества временных слотов между началом и концом
const getTimeSlotSpan = (startTime: string, endTime?: string): number => {
  if (!endTime) return 1;
  const startIndex = TIME_SLOTS.indexOf(startTime as (typeof TIME_SLOTS)[number]);
  const endIndex = TIME_SLOTS.indexOf(endTime as (typeof TIME_SLOTS)[number]);
  if (startIndex === -1 || endIndex === -1) return 1;
  return Math.max(1, endIndex - startIndex + 1);
};

// Функция для проверки, находится ли время в диапазоне события
const isTimeInEventRange = (time: string, event: CalendarEvent): boolean => {
  if (!event.endTime) return time === event.time;
  const timeIndex = TIME_SLOTS.indexOf(time as (typeof TIME_SLOTS)[number]);
  const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
  const endIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
  if (timeIndex === -1 || startIndex === -1 || endIndex === -1) return false;
  return timeIndex >= startIndex && timeIndex <= endIndex;
};

// Функция для проверки, перекрываются ли два события
const doEventsOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
  const start1 = TIME_SLOTS.indexOf(event1.time as (typeof TIME_SLOTS)[number]);
  const end1 = event1.endTime 
    ? TIME_SLOTS.indexOf(event1.endTime as (typeof TIME_SLOTS)[number])
    : start1;
  const start2 = TIME_SLOTS.indexOf(event2.time as (typeof TIME_SLOTS)[number]);
  const end2 = event2.endTime 
    ? TIME_SLOTS.indexOf(event2.endTime as (typeof TIME_SLOTS)[number])
    : start2;
  
  if (start1 === -1 || end1 === -1 || start2 === -1 || end2 === -1) return false;
  
  // Проверяем пересечение: начало одного события внутри диапазона другого
  return (start2 >= start1 && start2 <= end1) || (start1 >= start2 && start1 <= end2);
};

const getClassCode = (title: string): string => {
  const normalized = title.trim().toUpperCase();
  if (normalized.startsWith("STRETCH")) return "Stretching";
  if (normalized.startsWith("PIL")) return "PILATES";
  if (normalized.startsWith("REF")) return "REFORMER";
  if (normalized.startsWith("YOG")) return "YOGA";
  return title.trim();
};

type WeekTrack = "body" | "reform";

type WeekDay = {
  key: string;
  label: string;
  fullLabel: string;
  dateLabel: string;
  tracks: { key: WeekTrack; label: string }[];
};

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const TASHKENT_TIMEZONE = "Asia/Tashkent";

const getTodayInTashkent = (): Date => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TASHKENT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(new Date()).split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
};

const getStartOfWeek = (date: Date): Date => {
  const start = new Date(date);
  const day = (start.getUTCDay() + 6) % 7; // Monday = 0
  start.setUTCDate(start.getUTCDate() - day);
  return start;
};

const formatDateDisplay = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  timeZone: TASHKENT_TIMEZONE,
});

const TODAY_TASHKENT = getTodayInTashkent();
const START_DATE = getStartOfWeek(TODAY_TASHKENT);
const CURRENT_DAY_KEY = DAY_KEYS[(TODAY_TASHKENT.getUTCDay() + 6) % 7];

const WEEK_DAYS: WeekDay[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(START_DATE);
  date.setUTCDate(START_DATE.getUTCDate() + index);
  const ruWeekday = date.toLocaleDateString("ru-RU", {
    weekday: "long",
    timeZone: TASHKENT_TIMEZONE,
  });
  const capitalizedWeekday = ruWeekday.charAt(0).toUpperCase() + ruWeekday.slice(1);

  return {
    key: DAY_KEYS[index],
    label: DAY_LABELS[index],
    fullLabel: capitalizedWeekday,
    dateLabel: formatDateDisplay.format(date),
    tracks: [
      { key: "body", label: "BODY" },
      { key: "reform", label: "REFORM" },
    ],
  };
});

// Цвета для типов занятий
const CLASS_COLORS: Record<string, string> = {
  "Stretching": "#79A7D3", // Голубой
  "PILATES": "#C7B7A3", // Коричневый
  "REFORMER": "#C86B58", // Красно-коричневый
  "YOGA": "#4E8A64", // Зеленый
};

const INITIAL_WEEK_SCHEDULE: Record<string, CalendarEvent | null> = {
  // Понедельник (BODY / REFORM)
  "monday-body-9:00": {
    id: "mon-body-9",
    title: "Stretching",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 9,
  },
  "monday-body-10:00": {
    id: "mon-body-10",
    title: "Stretching",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 8,
  },
  "monday-body-11:00": {
    id: "mon-body-11",
    title: "PILATES",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 7,
  },
  "monday-body-12:00": {
    id: "mon-body-12",
    title: "PILATES",
    time: "12:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 6,
  },
  "monday-body-19:00": {
    id: "mon-body-19",
    title: "YOGA",
    time: "19:00",
    status: "paid",
    color: CLASS_COLORS["YOGA"],
    coach: "Гавхар",
    capacity: 16,
    peopleCount: 12,
  },
  "monday-reform-17:00": {
    id: "mon-reform-17",
    title: "REFORMER",
    time: "17:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Камилла",
    capacity: 8,
    peopleCount: 6,
  },

  // Вторник (REFORM)
  "tuesday-reform-8:00": {
    id: "tue-reform-8",
    title: "REFORMER",
    time: "8:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "tuesday-reform-9:00": {
    id: "tue-reform-9",
    title: "REFORMER",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 7,
  },
  "tuesday-reform-10:00": {
    id: "tue-reform-10",
    title: "REFORMER",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "tuesday-reform-11:00": {
    id: "tue-reform-11",
    title: "REFORMER",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 5,
  },
  "tuesday-reform-13:00": {
    id: "tue-reform-13",
    title: "REFORMER",
    time: "13:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 6,
  },
  "tuesday-reform-17:00": {
    id: "tue-reform-17",
    title: "REFORMER",
    time: "17:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Антонина",
    capacity: 8,
    peopleCount: 7,
  },
  "tuesday-reform-18:00": {
    id: "tue-reform-18",
    title: "REFORMER",
    time: "18:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Антонина",
    capacity: 8,
    peopleCount: 6,
  },
  "tuesday-reform-19:00": {
    id: "tue-reform-19",
    title: "REFORMER",
    time: "19:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 5,
  },

  // Среда (BODY)
  "wednesday-body-9:00": {
    id: "wed-body-9",
    title: "Stretching",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 8,
  },
  "wednesday-body-10:00": {
    id: "wed-body-10",
    title: "Stretching",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 7,
  },
  "wednesday-body-11:00": {
    id: "wed-body-11",
    title: "PILATES",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 8,
  },
  "wednesday-body-12:00": {
    id: "wed-body-12",
    title: "PILATES",
    time: "12:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 6,
  },

  // Четверг (REFORM)
  "thursday-reform-8:00": {
    id: "thu-reform-8",
    title: "REFORMER",
    time: "8:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "thursday-reform-9:00": {
    id: "thu-reform-9",
    title: "REFORMER",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "thursday-reform-10:00": {
    id: "thu-reform-10",
    title: "REFORMER",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 5,
  },
  "thursday-reform-11:00": {
    id: "thu-reform-11",
    title: "REFORMER",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 6,
  },
  "thursday-reform-17:00": {
    id: "thu-reform-17",
    title: "REFORMER",
    time: "17:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Камилла",
    capacity: 8,
    peopleCount: 7,
  },

  // Пятница (BODY)
  "friday-body-9:00": {
    id: "fri-body-9",
    title: "Stretching",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 9,
  },
  "friday-body-10:00": {
    id: "fri-body-10",
    title: "Stretching",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["Stretching"],
    coach: "Севара",
    capacity: 12,
    peopleCount: 8,
  },
  "friday-body-11:00": {
    id: "fri-body-11",
    title: "PILATES",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 7,
  },
  "friday-body-12:00": {
    id: "fri-body-12",
    title: "PILATES",
    time: "12:00",
    status: "paid",
    color: CLASS_COLORS["PILATES"],
    coach: "Нигина",
    capacity: 10,
    peopleCount: 6,
  },
  "friday-body-19:00": {
    id: "fri-body-19",
    title: "YOGA",
    time: "19:00",
    status: "paid",
    color: CLASS_COLORS["YOGA"],
    coach: "Гавхар",
    capacity: 16,
    peopleCount: 12,
  },

  // Суббота (REFORM)
  "saturday-reform-8:00": {
    id: "sat-reform-8",
    title: "REFORMER",
    time: "8:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "saturday-reform-9:00": {
    id: "sat-reform-9",
    title: "REFORMER",
    time: "9:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 6,
  },
  "saturday-reform-10:00": {
    id: "sat-reform-10",
    title: "REFORMER",
    time: "10:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Ангелина",
    capacity: 8,
    peopleCount: 5,
  },
  "saturday-reform-11:00": {
    id: "sat-reform-11",
    title: "REFORMER",
    time: "11:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 6,
  },
  "saturday-reform-17:00": {
    id: "sat-reform-17",
    title: "REFORMER",
    time: "17:00",
    status: "paid",
    color: CLASS_COLORS["REFORMER"],
    coach: "Евгения",
    capacity: 8,
    peopleCount: 7,
  },
};

type SelectedEvent = CalendarEvent & {
  origin: "overview" | "schedule" | "create";
  groupLabel?: string;
  columnLabel?: string;
  capacityLabel?: string;
  dayLabel?: string;
  timeLabel: string;
};

type CreateFormData = {
  startTime: string;
  endTime: string;
  clientName: string;
  phone: string;
  peopleCount: string;
  paymentMethod: "card" | "cash" | "transfer" | "";
  comment: string;
  clientSearch: string;
  selectedClientId: string;
};

export default function LoadPage() {
  const [activeView, setActiveView] = useState<"overview" | "schedule">("overview");
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    startTime: "",
    endTime: "",
    clientName: "",
    phone: "",
    peopleCount: "",
    paymentMethod: "",
    comment: "",
    clientSearch: "",
    selectedClientId: "",
  });

  const [clientSearchResults, setClientSearchResults] = useState<typeof CLIENTS>([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EventStatus | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekSchedule, setWeekSchedule] = useState<Record<string, CalendarEvent | null>>(
    () => ({ ...INITIAL_WEEK_SCHEDULE })
  );
  const [dragMeta, setDragMeta] = useState<{ key: string } | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [overviewSlotsState, setOverviewSlotsState] = useState<Record<string, CalendarEvent | null>>(
    () => ({ ...INITIAL_OVERVIEW_SLOTS })
  );
  const [overviewDragMeta, setOverviewDragMeta] = useState<{ key: string } | null>(null);
  const [isDraggingOverviewCard, setIsDraggingOverviewCard] = useState(false);

  const parseCellKey = (cellKey: string) => {
    const [dayKey, trackKey, time] = cellKey.split("-");
    return { dayKey, trackKey, time };
  };

  const parseOverviewSlotKey = (slotKey: string) => {
    const [groupKey, columnKey, time] = slotKey.split("__");
    return { groupKey, columnKey, time };
  };

  const handleCardDragStart = (
    event: ReactDragEvent<HTMLButtonElement>,
    cellKey: string
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", cellKey);
    setDragMeta({ key: cellKey });
    setIsDraggingCard(true);
  };

  const handleCardDragEnd = () => {
    setDragMeta(null);
    setIsDraggingCard(false);
  };

  const handleCellDragOver = (event: ReactDragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const dropCardOnCell = (targetKey: string) => {
    if (!dragMeta) return;
    if (dragMeta.key === targetKey) {
      setDragMeta(null);
      setIsDraggingCard(false);
      return;
    }

    setWeekSchedule((prev) => {
      const draggedEvent = prev[dragMeta.key];
      if (!draggedEvent) {
        return prev;
      }

      if (prev[targetKey]) {
        return prev;
      }

      const { time: targetTime } = parseCellKey(targetKey);
      const targetIndex = TIME_SLOTS.indexOf(targetTime as (typeof TIME_SLOTS)[number]);
      if (targetIndex === -1) {
        return prev;
      }

      const durationSlots = getTimeSlotSpan(draggedEvent.time, draggedEvent.endTime);
      if (targetIndex + durationSlots - 1 >= TIME_SLOTS.length) {
        return prev;
      }

      const next = { ...prev };
      const newEndTime =
        draggedEvent.endTime && durationSlots > 1
          ? TIME_SLOTS[targetIndex + durationSlots - 1]
          : draggedEvent.endTime;

      next[dragMeta.key] = null;
      next[targetKey] = {
        ...draggedEvent,
        time: targetTime,
        endTime: newEndTime,
      };

      return next;
    });

    setDragMeta(null);
    setIsDraggingCard(false);
  };

  const handleCellDrop = (
    event: ReactDragEvent<HTMLElement>,
    targetKey: string
  ) => {
    event.preventDefault();
    dropCardOnCell(targetKey);
  };

  const handleOverviewCardDragStart = (
    event: ReactDragEvent<HTMLButtonElement>,
    slotKey: string
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", slotKey);
    setOverviewDragMeta({ key: slotKey });
    setIsDraggingOverviewCard(true);
  };

  const handleOverviewCardDragEnd = () => {
    setOverviewDragMeta(null);
    setIsDraggingOverviewCard(false);
  };

  const dropOverviewCardOnCell = (targetKey: string) => {
    if (!overviewDragMeta) return;
    if (overviewDragMeta.key === targetKey) {
      setOverviewDragMeta(null);
      setIsDraggingOverviewCard(false);
      return;
    }

    setOverviewSlotsState((prev) => {
      const draggedEvent = prev[overviewDragMeta.key];
      if (!draggedEvent) {
        return prev;
      }

      if (prev[targetKey]) {
        return prev;
      }

      const { time: targetTime } = parseOverviewSlotKey(targetKey);
      const targetIndex = TIME_SLOTS.indexOf(targetTime as (typeof TIME_SLOTS)[number]);
      if (targetIndex === -1) {
        return prev;
      }

      const durationSlots = getTimeSlotSpan(draggedEvent.time, draggedEvent.endTime);
      const targetEndIndex = targetIndex + durationSlots - 1;
      if (targetEndIndex >= TIME_SLOTS.length) {
        return prev;
      }

      const { groupKey, columnKey } = parseOverviewSlotKey(targetKey);
      if (
        hasOverviewConflict(
          overviewDragMeta.key,
          groupKey,
          columnKey,
          targetIndex,
          targetEndIndex,
          prev
        )
      ) {
        return prev;
      }

      const next = { ...prev };
      const newEndTime =
        durationSlots === 1
          ? undefined
          : TIME_SLOTS[targetEndIndex];

      next[overviewDragMeta.key] = null;
      next[targetKey] = {
        ...draggedEvent,
        time: targetTime,
        endTime: newEndTime,
      };

      return next;
    });

    setOverviewDragMeta(null);
    setIsDraggingOverviewCard(false);
  };

  const handleOverviewCellDragOver = (event: ReactDragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleOverviewCellDrop = (
    event: ReactDragEvent<HTMLElement>,
    targetKey: string
  ) => {
    event.preventDefault();
    dropOverviewCardOnCell(targetKey);
  };

  const overviewColumnCount = useMemo(
    () => OVERVIEW_GROUPS.reduce((acc, group) => acc + group.columns.length, 0),
    []
  );

  const overviewGroupsWithState = useMemo(() => {
    return OVERVIEW_GROUPS.map((group) => ({
      ...group,
      columns: group.columns.map((column) => {
        const slots: OverviewSlots = {};
        TIME_SLOTS.forEach((time) => {
          const key = makeOverviewSlotKey(group.key, column.key, time);
          slots[time as (typeof TIME_SLOTS)[number]] = overviewSlotsState[key] ?? null;
        });
        return { ...column, slots };
      }),
    }));
  }, [overviewSlotsState]);

  const overviewTemplate = useMemo(
    () => `70px repeat(${overviewColumnCount}, minmax(110px, 1fr))`,
    [overviewColumnCount]
  );

  const overviewFiltered = useMemo(() => {
    let filtered = overviewGroupsWithState.map((group) => ({
      ...group,
      columns: group.columns.map((column) => ({
        ...column,
        slots: { ...column.slots },
      })),
    }));
    
    // Фильтр по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.map((group) => ({
        ...group,
        columns: group.columns.map((column) => {
          const filteredSlots = Object.entries(column.slots).reduce<OverviewSlots>((acc, [time, event]) => {
            if (!event) return acc;
            const matches =
              event.title.toLowerCase().includes(query) ||
              event.clients?.some((client) => client.toLowerCase().includes(query)) ||
              (event.coach && event.coach.toLowerCase().includes(query));
            if (matches) {
              acc[time as (typeof TIME_SLOTS)[number]] = event;
            }
            return acc;
          }, {});
          return { ...column, slots: filteredSlots };
        }),
      }));
    }
    
    // Фильтр по статусу
    if (statusFilter) {
      filtered = filtered.map((group) => ({
        ...group,
        columns: group.columns.map((column) => {
          const filteredSlots = Object.entries(column.slots).reduce<OverviewSlots>((acc, [time, event]) => {
            if (!event) return acc;
            if (event.status === statusFilter) {
              acc[time as (typeof TIME_SLOTS)[number]] = event;
            }
            return acc;
          }, {});
          return { ...column, slots: filteredSlots };
        }),
      }));
    }
    
    return filtered;
  }, [overviewGroupsWithState, searchQuery, statusFilter]);

  const overviewSlotsMap = useMemo(() => {
    const map: Record<string, Record<string, OverviewSlots>> = {};
    overviewFiltered.forEach((group) => {
      map[group.key] = {};
      group.columns.forEach((column) => {
        map[group.key][column.key] = column.slots;
      });
    });
    return map;
  }, [overviewFiltered]);

  const filteredWeekSchedule = useMemo(() => {
    if (!searchQuery) return weekSchedule;
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, CalendarEvent | null> = {};
    Object.entries(weekSchedule).forEach(([key, event]) => {
      if (!event) return;
      const matches =
        event.title.toLowerCase().includes(query) ||
        event.coach?.toLowerCase().includes(query) ||
        event.note?.toLowerCase().includes(query);
      if (matches) filtered[key] = event;
    });
    return filtered;
  }, [searchQuery, weekSchedule]);

  const weekColumnCount = useMemo(
    () => WEEK_DAYS.reduce((acc, day) => acc + day.tracks.length, 0),
    []
  );

  const weekTemplate = useMemo(
     () => `60px repeat(${weekColumnCount}, minmax(170px, 1fr))`,
     [weekColumnCount]
   );

  const drawerActions = useMemo(() => {
    if (!selectedEvent) return [] as Array<{ key: string; label: string; tone?: "danger"; icon: JSX.Element }>;
    if (selectedEvent.origin === "create") {
      return [
        {
          key: "create",
          label: "Создать запись",
          icon: <Plus className="h-4 w-4" />,
        },
        {
          key: "add-client",
          label: "Добавить клиента",
          icon: <UserPlus className="h-4 w-4" />,
        },
      ];
    }

    const actions: Array<{ key: string; label: string; tone?: "danger"; icon: JSX.Element }> = [];

    if (selectedEvent.origin === "overview") {
      actions.push({
        key: "add-client",
        label: "Добавить клиента",
        icon: <UserPlus className="h-4 w-4" />,
      });
    }

    actions.push({
      key: "edit",
      label: selectedEvent.origin === "schedule" ? "Изменить занятие" : "Изменить запись",
      icon: <Pencil className="h-4 w-4" />,
    });

    actions.push({
      key: "confirm-payment",
      label: "Подтвердить оплату",
      icon: <CreditCard className="h-4 w-4" />,
    });

    actions.push({
      key: "call",
      label: "Позвонить клиенту",
      icon: <Phone className="h-4 w-4" />,
    });

    actions.push({
      key: "move",
      label: "Перенести",
      icon: <Move className="h-4 w-4" />,
    });

    if (selectedEvent.status === "paid") {
      actions.push({
        key: "cancel-paid",
        label: "Отменить оплату",
        icon: <Ban className="h-4 w-4" />,
        tone: "danger",
      });
    } else if (selectedEvent.status === "reserved") {
      actions.push({
        key: "cancel-reserved",
        label: "Отменить бронь",
        icon: <Ban className="h-4 w-4" />,
        tone: "danger",
      });
    }

    return actions;
  }, [selectedEvent]);

  const hasOverviewConflict = (
    skipKey: string,
    groupKey: string,
    columnKey: string,
    startIndex: number,
    endIndex: number,
    slots: Record<string, CalendarEvent | null>
  ) => {
    return Object.entries(slots).some(([key, event]) => {
      if (!event || key === skipKey) return false;
      const meta = parseOverviewSlotKey(key);
      if (meta.groupKey !== groupKey || meta.columnKey !== columnKey) return false;
      const otherStartIndex = TIME_SLOTS.indexOf(
        meta.time as (typeof TIME_SLOTS)[number]
      );
      const otherEndIndex = event.endTime
        ? TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number])
        : otherStartIndex;
      if (otherStartIndex === -1 || otherEndIndex === -1) return false;
      return !(otherEndIndex < startIndex || otherStartIndex > endIndex);
    });
  };

  const canApplyOverviewSpan = (
    slotKey: string,
    targetSpan: number,
    slotsState: Record<string, CalendarEvent | null> = overviewSlotsState
  ) => {
    const normalizedSpan = Math.max(1, targetSpan);
    const event = slotsState[slotKey];
    if (!event) return false;
    const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
    if (startIndex === -1) return false;
    const endIndex = startIndex + normalizedSpan - 1;
    if (endIndex >= TIME_SLOTS.length) return false;
    const { groupKey, columnKey } = parseOverviewSlotKey(slotKey);
    return !hasOverviewConflict(slotKey, groupKey, columnKey, startIndex, endIndex, slotsState);
  };

  const setOverviewEventSpan = (slotKey: string, targetSpan: number) => {
    const normalizedSpan = Math.max(1, targetSpan);
    setOverviewSlotsState((prev) => {
      const event = prev[slotKey];
      if (!event) return prev;
      const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
      if (startIndex === -1) return prev;
      const endIndex = startIndex + normalizedSpan - 1;
      if (endIndex >= TIME_SLOTS.length) return prev;
      if (!canApplyOverviewSpan(slotKey, normalizedSpan, prev)) return prev;
      const currentSpan = getTimeSlotSpan(event.time, event.endTime);
      if (currentSpan === normalizedSpan) return prev;
      const next = { ...prev };
      next[slotKey] = {
        ...event,
        endTime: normalizedSpan === 1 ? undefined : TIME_SLOTS[endIndex],
      };
      return next;
    });
  };

  const adjustOverviewEventDuration = (slotKey: string, delta: 1 | -1) => {
    setOverviewSlotsState((prev) => {
      const event = prev[slotKey];
      if (!event) return prev;

      const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
      if (startIndex === -1) return prev;

      const currentSpan = getTimeSlotSpan(event.time, event.endTime);
      const newSpan = currentSpan + delta;
      if (newSpan < 1) return prev;

      const newEndIndex = startIndex + newSpan - 1;
      if (newEndIndex >= TIME_SLOTS.length) return prev;

      const { groupKey, columnKey } = parseOverviewSlotKey(slotKey);
      if (
        hasOverviewConflict(
          slotKey,
          groupKey,
          columnKey,
          startIndex,
          newEndIndex,
          prev
        )
      ) {
        return prev;
      }

      const next = { ...prev };
      next[slotKey] = {
        ...event,
        endTime: newSpan === 1 ? undefined : TIME_SLOTS[newEndIndex],
      };
      return next;
    });
  };

  const canAdjustOverviewEventDuration = (slotKey: string, delta: 1 | -1) => {
    const event = overviewSlotsState[slotKey];
    if (!event) return false;
    const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
    if (startIndex === -1) return false;
    const currentSpan = getTimeSlotSpan(event.time, event.endTime);
    const newSpan = currentSpan + delta;
    if (newSpan < 1) return false;
    const newEndIndex = startIndex + newSpan - 1;
    if (newEndIndex >= TIME_SLOTS.length) return false;
    const { groupKey, columnKey } = parseOverviewSlotKey(slotKey);
    return !hasOverviewConflict(
      slotKey,
      groupKey,
      columnKey,
      startIndex,
      newEndIndex,
      overviewSlotsState
    );
  };

  return (
    <div className={`calendar-container ${isFullscreen ? "is-fullscreen" : ""}`}>
      {!isFullscreen && (
      <div className="calendar-header">
        <div className="calendar-header__left">
          <h1 className="calendar-title">Загрузка центра</h1>
          <div className="calendar-filters">
            <button
              type="button"
              className={`calendar-filter ${activeView === "overview" ? "is-active" : ""}`}
              onClick={() => setActiveView("overview")}
            >
              Общий обзор
            </button>
            <button
              type="button"
              className={`calendar-filter ${activeView === "schedule" ? "is-active" : ""}`}
              onClick={() => setActiveView("schedule")}
            >
              Расписание Body & Mind
            </button>
            <div className="calendar-legend">
              <button
                type="button"
                className={`calendar-legend__item ${statusFilter === "paid" ? "is-active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === "paid" ? null : "paid")}
              >
                <span className="calendar-legend__dot" style={{ background: STATUS_COLORS.paid }}></span>
                <span className="calendar-legend__label">Оплачено</span>
              </button>
              <button
                type="button"
                className={`calendar-legend__item ${statusFilter === "reserved" ? "is-active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === "reserved" ? null : "reserved")}
              >
                <span className="calendar-legend__dot" style={{ background: STATUS_COLORS.reserved }}></span>
                <span className="calendar-legend__label">Бронь</span>
              </button>
          </div>
          </div>
          </div>
        <div className="calendar-header__right">
          <div className="calendar-search">
            <Search className="calendar-search__icon" />
            <input
              type="text"
              placeholder="Поиск по клиенту или занятию"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="calendar-search__input"
            />
            <span className="calendar-search__shortcut">⌘K</span>
      </div>
        </div>
      </div>
      )}

      <div className={`calendar-nav ${isFullscreen ? "is-fullscreen" : ""}`}>
        <div className="calendar-nav__left">
          {isFullscreen && (
            <div className="calendar-filters calendar-filters--inline">
              <button
                type="button"
                className={`calendar-filter ${activeView === "overview" ? "is-active" : ""}`}
                onClick={() => setActiveView("overview")}
              >
                Общий обзор
              </button>
              <button
                type="button"
                className={`calendar-filter ${activeView === "schedule" ? "is-active" : ""}`}
                onClick={() => setActiveView("schedule")}
              >
                Расписание Body & Mind
              </button>
              <div className="calendar-legend">
                <button
                  type="button"
                  className={`calendar-legend__item ${statusFilter === "paid" ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === "paid" ? null : "paid")}
                >
                  <span className="calendar-legend__dot" style={{ background: STATUS_COLORS.paid }}></span>
                  <span className="calendar-legend__label">Оплачено</span>
                </button>
                <button
                  type="button"
                  className={`calendar-legend__item ${statusFilter === "reserved" ? "is-active" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === "reserved" ? null : "reserved")}
                >
                  <span className="calendar-legend__dot" style={{ background: STATUS_COLORS.reserved }}></span>
                  <span className="calendar-legend__label">Бронь</span>
                </button>
          </div>
          </div>
          )}
          {!isFullscreen && (
            <>
              <button 
                type="button" 
                className="calendar-nav__btn"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setCurrentDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                type="button" 
                className="calendar-nav__btn calendar-nav__btn--today"
                onClick={() => setCurrentDate(new Date())}
              >
                Сегодня
              </button>
              <button 
                type="button" 
                className="calendar-nav__btn"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setCurrentDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="calendar-nav__date">
                <div className="calendar-nav__date-main">
                  <span className="calendar-nav__date-month">
                    {currentDate.toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase()}
                  </span>
                  <span className="calendar-nav__date-day">{currentDate.getDate()}</span>
          </div>
                <div className="calendar-nav__date-info">
                  <div>
                    {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                  </div>
              </div>
            </>
          )}
        </div>
        <div className="calendar-nav__right">
          {isFullscreen && (
            <div className="calendar-search">
              <Search className="calendar-search__icon" />
              <input
                type="text"
                placeholder="Поиск по клиенту или занятию"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="calendar-search__input"
              />
              <span className="calendar-search__shortcut">⌘K</span>
            </div>
          )}
          <button
            type="button"
            className="calendar-fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Свернуть" : "Развернуть"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          </div>
      </div>

      <div className={`calendar-wrapper ${isFullscreen ? "is-fullscreen" : ""}`}>
        <Card className="calendar-card">
        {activeView === "overview" ? (
          <div className="calendar-grid-overview">
            <div className="calendar-grid__header">
              <div className="calendar-grid__header-row" style={{ gridTemplateColumns: overviewTemplate }}>
                <div className="calendar-grid__time-col">Время</div>
                {overviewGroupsWithState.map((group) => (
                  <div
                    key={group.key}
                    className="calendar-grid__group"
                    style={{ gridColumn: `span ${group.columns.length}` }}
                  >
                    {group.label}
          </div>
                ))}
                    </div>
              <div className="calendar-grid__header-row" style={{ gridTemplateColumns: overviewTemplate }}>
                <div className="calendar-grid__time-col calendar-grid__time-col--spacer" />
                {overviewGroupsWithState.flatMap((group) =>
                  group.columns.map((column) => (
                    <div key={column.key} className="calendar-grid__column-header">
                      <span className="calendar-grid__column-title">{column.label}</span>
                      <span className="calendar-grid__column-capacity">{column.capacityLabel}</span>
                  </div>
                  ))
                )}
              </div>
            </div>
            <div className="calendar-grid__body">
              {TIME_SLOTS.map((time, timeIndex) => (
                <div key={time} className="calendar-grid__row" style={{ gridTemplateColumns: overviewTemplate }}>
                  <div className="calendar-grid__time-cell">{time}</div>
                  {overviewGroupsWithState.flatMap((group, groupIndex) =>
                    group.columns.map((column, columnIndex) => {
                      const slotFromFilter = overviewSlotsMap[group.key]?.[column.key]?.[time];
                      const isLastColumnInGroup = columnIndex === group.columns.length - 1;
                      const isLastGroup = groupIndex === overviewGroupsWithState.length - 1;
                      const needsSeparator = isLastColumnInGroup && !isLastGroup;
                      const overviewCellKey = makeOverviewSlotKey(group.key, column.key, time);
 
                      // Находим событие, которое начинается в этом времени
                      const eventAtTime = Object.values(column.slots).find(
                        (event) => event && event.time === time
                      ) as CalendarEvent | undefined;
                      
                      // Проверяем, продолжается ли какое-то событие в этом времени (но не начинается здесь)
                      const continuingEvent = Object.values(column.slots).find(
                        (event) => event && event.time !== time && isTimeInEventRange(time, event)
                      ) as CalendarEvent | undefined;

                      const isEventStart = eventAtTime !== null;
                      const isEventContinue = continuingEvent !== null;

                      // Если событие продолжается, но не начинается здесь, рендерим пустую ячейку
                      if (isEventContinue && !isEventStart) {
              return (
                          <div 
                            key={overviewCellKey}
                            className={`calendar-grid__cell calendar-grid__cell--event-continue ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                            onDragOver={handleOverviewCellDragOver}
                            onDrop={(dragEvent) => handleOverviewCellDrop(dragEvent, overviewCellKey)}
                          />
                        );
                      }

                      // Проверяем, не перекрывается ли событие с другими событиями в колонке
                      if (eventAtTime && isEventStart) {
                        // Находим все события в колонке, которые могут перекрываться
                        const allEvents = Object.values(column.slots).filter(e => e && e !== eventAtTime) as CalendarEvent[];
                        const hasOverlap = allEvents.some(otherEvent => doEventsOverlap(eventAtTime, otherEvent));
                        
                        // Если событие перекрывается с другим, не показываем его
                        if (hasOverlap) {
                          return (
                            <div 
                              key={overviewCellKey}
                              className={`calendar-grid__cell ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                            >
                              <button
                                type="button"
                                className="calendar-empty-button"
                                onClick={() => {
                                  setCreateFormData({
                                    startTime: time,
                                    endTime: "",
                                    clientName: "",
                                    phone: "",
                                    peopleCount: "",
                                    paymentMethod: "",
                                    comment: "",
                                    clientSearch: "",
                                    selectedClientId: "",
                                  });
                                  setShowClientSearch(false);
                                  setClientSearchResults([]);
                                  setSelectedEvent({
                                    id: `${column.key}-${time}-new`,
                                    title: "Новая запись",
                                    time,
                                    status: "free",
                                    color: STATUS_COLORS.free,
                                    origin: "create",
                                    groupLabel: group.label,
                                    columnLabel: column.label,
                                    capacityLabel: column.capacityLabel,
                                    timeLabel: time,
                                  });
                      }}
                    />
                  </div>
              );
                        }
                      }

                      if (eventAtTime && isEventStart) {
                        // Проверяем фильтр
                        const shouldShow = !searchQuery || slotFromFilter;
                        if (!shouldShow) {
                          return (
                            <div 
                              key={overviewCellKey}
                              className={`calendar-grid__cell ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                            >
                              <button
                                type="button"
                                className="calendar-empty-button"
                                onClick={() => {
                                  setCreateFormData({
                                    startTime: time,
                                    endTime: "",
                                    clientName: "",
                                    phone: "",
                                    peopleCount: "",
                                    paymentMethod: "",
                                    comment: "",
                                    clientSearch: "",
                                    selectedClientId: "",
                                  });
                                  setShowClientSearch(false);
                                  setClientSearchResults([]);
                                  setSelectedEvent({
                                    id: `${column.key}-${time}-new`,
                                    title: "Новая запись",
                                    time,
                                    status: "free",
                                    color: STATUS_COLORS.free,
                                    origin: "create",
                                    groupLabel: group.label,
                                    columnLabel: column.label,
                                    capacityLabel: column.capacityLabel,
                                    timeLabel: time,
                                  });
                                }}
                              />
                </div>
              );
                        }
                        
                        const originalSlot = eventAtTime;
                        const span = getTimeSlotSpan(originalSlot.time, originalSlot.endTime);
                        // Используем имя клиента, если есть, иначе название
                        const clientName = originalSlot.clients && originalSlot.clients.length > 0 
                          ? originalSlot.clients[0] 
                          : originalSlot.title;
                        const timeRange = originalSlot.endTime 
                          ? `${originalSlot.time}–${originalSlot.endTime}`
                          : originalSlot.time;
                        const peopleCount = originalSlot.peopleCount || 1;
                        const isReserved = originalSlot.status === "reserved";
                        const isSmall = span === 1;
                        const canShrink = canAdjustOverviewEventDuration(overviewCellKey, -1);
                        const canExtend = canAdjustOverviewEventDuration(overviewCellKey, 1);
                        
                        return (
                          <div 
                            key={overviewCellKey}
                            className={`calendar-grid__cell calendar-grid__cell--event-start ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                      style={{ 
                                height: span > 1 ? `${span * 86}px` : '86px',
                                minHeight: span > 1 ? `${span * 86}px` : '86px',
                              }}
                            onDragOver={handleOverviewCellDragOver}
                            onDrop={(dragEvent) => handleOverviewCellDrop(dragEvent, overviewCellKey)}
                          >
                            <button
                              type="button"
                              draggable
                              onDragStart={(dragEvent) => handleOverviewCardDragStart(dragEvent, overviewCellKey)}
                              onDragEnd={handleOverviewCardDragEnd}
                              onDragOver={handleOverviewCellDragOver}
                              onDrop={(dragEvent) => handleOverviewCellDrop(dragEvent, overviewCellKey)}
                              className={`calendar-event calendar-event--overview calendar-event--${originalSlot.status} ${isReserved ? "calendar-event--reserved-large" : ""} ${isSmall ? "calendar-event--small" : ""}`}
                     style={{ 
                                background: lightenColor(originalSlot.color, 0.6),
                                borderColor: darkenColor(originalSlot.color, 0.1),
                                borderWidth: '1px',
                                color: getTextColor(originalSlot.color),
                                height: '100%',
                                minHeight: span > 1 ? `${span * 86}px` : '86px',
                              }}
                              onClick={() => {
                                if (isDraggingOverviewCard) return;
                                setSelectedEvent({
                                  ...originalSlot,
                                  origin: "overview",
                                  groupLabel: group.label,
                                  columnLabel: column.label,
                                  capacityLabel: column.capacityLabel,
                                  timeLabel: time,
                                });
                              }}
                            >
                              <div className="calendar-event__overview-content">
                                <div className="calendar-event__overview-controls">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="calendar-event__overview-control"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!canShrink) return;
                                      adjustOverviewEventDuration(overviewCellKey, -1);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (!canShrink) return;
                                        adjustOverviewEventDuration(overviewCellKey, -1);
                                      }
                                    }}
                                    aria-label="Уменьшить длительность"
                                    aria-disabled={!canShrink}
                                  >
                                    <Minus className="calendar-event__overview-control-icon" />
          </div>
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="calendar-event__overview-control"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      if (!canExtend) return;
                                      adjustOverviewEventDuration(overviewCellKey, 1);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (!canExtend) return;
                                        adjustOverviewEventDuration(overviewCellKey, 1);
                                      }
                                    }}
                                    aria-label="Увеличить длительность"
                                    aria-disabled={!canExtend}
                                  >
                                    <Plus className="calendar-event__overview-control-icon" />
                                  </div>
                                </div>
                                <div className="calendar-event__overview-body">
                                  <div className="calendar-event__overview-name">{clientName}</div>
                                  
                                  {!originalSlot.endTime || originalSlot.endTime === originalSlot.time || span === 1 ? (
                                    <div className="calendar-event__overview-footer calendar-event__overview-footer--inline">
                                      <div className="calendar-event__overview-meta">
                                        <Clock className="calendar-event__overview-icon-small" />
                                        <span>{timeRange}</span>
              </div>
                                      <div className="calendar-event__overview-meta">
                                        <Users className="calendar-event__overview-icon-small" />
                                        <span>{peopleCount} чел.</span>
              </div>
            </div>
                                  ) : (
                                    <div className="calendar-event__overview-footer calendar-event__overview-footer--stacked">
                                      <div className="calendar-event__overview-meta">
                                        <Clock className="calendar-event__overview-icon-small" />
                                        <span>{timeRange}</span>
          </div>
                                      <div className="calendar-event__overview-meta">
                                        <Users className="calendar-event__overview-icon-small" />
                                        <span>{peopleCount} чел.</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                </div>
              );
                      }

                      // Если нет события, показываем пустую ячейку с возможностью создания
                      if (!eventAtTime && !isEventContinue) {
              return (
                <div
                            key={overviewCellKey}
                            className={`calendar-grid__cell ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                          >
                            <button
                              type="button"
                              className="calendar-empty-button"
                              onClick={() => {
                                setCreateFormData({
                                  startTime: time,
                                  endTime: "",
                                  clientName: "",
                                  phone: "",
                                  peopleCount: "",
                                  paymentMethod: "",
                                  comment: "",
                                  clientSearch: "",
                                  selectedClientId: "",
                                });
                                setShowClientSearch(false);
                                setClientSearchResults([]);
                                setSelectedEvent({
                                  id: `${column.key}-${time}-new`,
                                  title: "Новая запись",
                                  time,
                                  status: "free",
                                  color: STATUS_COLORS.free,
                                  origin: "create",
                                  groupLabel: group.label,
                                  columnLabel: column.label,
                                  capacityLabel: column.capacityLabel,
                                  timeLabel: time,
                                });
                      }}
                    />
          </div>
                        );
                      }

                      // Финальный return для пустых ячеек
                      return (
                        <div 
                          key={overviewCellKey}
                          className={`calendar-grid__cell ${needsSeparator ? 'calendar-grid__cell--group-separator' : ''}`}
                        >
                          <button
                            type="button"
                            className="calendar-empty-button"
                            onClick={() => {
                              setCreateFormData({
                                startTime: time,
                                endTime: "",
                                clientName: "",
                                phone: "",
                                peopleCount: "",
                                paymentMethod: "",
                                comment: "",
                                clientSearch: "",
                                selectedClientId: "",
                              });
                              setShowClientSearch(false);
                              setClientSearchResults([]);
                              setSelectedEvent({
                                id: `${column.key}-${time}-new`,
                                title: "Новая запись",
                                time,
                                status: "free",
                                color: STATUS_COLORS.free,
                                origin: "create",
                                groupLabel: group.label,
                                columnLabel: column.label,
                                capacityLabel: column.capacityLabel,
                                timeLabel: time,
                              });
                            }}
                          />
                </div>
              );
                    })
                  )}
          </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="schedule-table-wrapper">
            <table className="schedule-tablev2">
              <thead>
                <tr>
                  <th className="schedule-tablev2__time-head" rowSpan={2}>
                    <span className="schedule-tablev2__time-label">Время</span>
                    <span className="schedule-tablev2__time-zone">UTC+5 · Ташкент</span>
                  </th>
                  {WEEK_DAYS.map((day, dayIndex) => (
                    <th
                      key={day.key}
                      className={`schedule-tablev2__day-head ${day.key === CURRENT_DAY_KEY ? "is-today" : ""} ${
                        dayIndex % 2 === 0 ? "schedule-tablev2__day-head--alt" : ""
                      }`}
                      colSpan={day.tracks.length}
                    >
                      <div className="schedule-tablev2__day-title">{day.fullLabel}</div>
                      <div className="schedule-tablev2__day-date">{day.dateLabel}</div>
                    </th>
                  ))}
                </tr>
                <tr>
                  {WEEK_DAYS.flatMap((day, dayIndex) =>
                    day.tracks.map((track) => (
                      <th
                        key={`${day.key}-${track.key}`}
                        className={`schedule-tablev2__track-head ${
                          dayIndex % 2 === 0 ? "schedule-tablev2__track-head--alt" : ""
                        }`}
                      >
                        {track.label}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time) => (
                  <tr key={time}>
                    <th className="schedule-tablev2__time-cell">{time}</th>
                    {WEEK_DAYS.flatMap((day, dayIndex) =>
                      day.tracks.map((track) => {
                        const cellKey = `${day.key}-${track.key}-${time}`;
                        const event = filteredWeekSchedule[cellKey];
                        const altClass = dayIndex % 2 === 0 ? "schedule-tablev2__cell--alt" : "";
                        const slotAltClass = dayIndex % 2 === 0 ? "schedule-tablev2__slot--alt" : "";
 
                        if (!event) {
              return (
                            <td
                              key={cellKey}
                              className={`schedule-tablev2__cell ${altClass}`}
                              onDragOver={handleCellDragOver}
                              onDrop={(dragEvent) => handleCellDrop(dragEvent, cellKey)}
                            >
                              <button
                                type="button"
                                className={`schedule-tablev2__slot schedule-tablev2__slot--empty ${slotAltClass}`}
                                onDragOver={handleCellDragOver}
                                onDrop={(dragEvent) => handleCellDrop(dragEvent, cellKey)}
                                onClick={() => {
                                  setCreateFormData({
                                    startTime: time,
                                    endTime: "",
                                    clientName: "",
                                    phone: "",
                                    peopleCount: "",
                                    paymentMethod: "",
                                    comment: "",
                                    clientSearch: "",
                                    selectedClientId: "",
                                  });
                                  setShowClientSearch(false);
                                  setClientSearchResults([]);
                                  setSelectedEvent({
                                    id: `${day.key}-${track.key}-${time}-new`,
                                    title: "Новая запись",
                                    time,
                                    status: "free",
                                    color: STATUS_COLORS.free,
                                    origin: "create",
                                    groupLabel: "Body & Mind",
                                    columnLabel: track.label,
                                    timeLabel: time,
                                    dayLabel: day.fullLabel,
                                  });
                                }}
                              >
                                Свободно
                              </button>
                            </td>
                          );
                        }

                        const timeLabel = event.endTime
                          ? `${event.time}–${event.endTime}`
                          : event.time;
                        const capacityText = `${event.peopleCount ?? 0}/${event.capacity ?? "–"}`;
                        const cardSurface = lightenColor(event.color, 0.8);
                        const cardBorder = darkenColor(event.color, 0.15);
                        const cardText = getTextColor(event.color);

                        return (
                          <td
                            key={cellKey}
                            className={`schedule-tablev2__cell ${altClass}`}
                            onDragOver={handleCellDragOver}
                            onDrop={(dragEvent) => handleCellDrop(dragEvent, cellKey)}
                          >
                            <button
                              type="button"
                              draggable
                              onDragStart={(dragEvent) => handleCardDragStart(dragEvent, cellKey)}
                              onDragEnd={handleCardDragEnd}
                              onDragOver={handleCellDragOver}
                              onDrop={(dragEvent) => handleCellDrop(dragEvent, cellKey)}
                              className={`schedule-tablev2__slot schedule-tablev2__slot--${event.status} ${slotAltClass}`}
                  style={{ 
                                background: cardSurface,
                                borderColor: cardBorder,
                                color: cardText,
                              }}
                              onClick={() => {
                                if (isDraggingCard) return;
                                setSelectedEvent({
                                  ...event,
                                  origin: "schedule",
                                  groupLabel: "Body & Mind",
                                  columnLabel: track.label,
                                  timeLabel: time,
                                  dayLabel: day.fullLabel,
                                });
                              }}
                            >
                              <span className="schedule-tablev2__slot-title">{event.title}</span>
                              <span className="schedule-tablev2__slot-meta">
                                <span>
                                  <Clock className="schedule-tablev2__slot-icon" />
                                  {timeLabel}
                                </span>
                                <span>
                                  <User className="schedule-tablev2__slot-icon" />
                                  {event.coach || "—"}
                                </span>
                                <span>
                                  <Users className="schedule-tablev2__slot-icon" />
                                  {capacityText}
                                </span>
                              </span>
                            </button>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </Card>
      </div>
    </div>
  );
}
