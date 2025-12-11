"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Search, Users, Activity, X, Phone, User, NotebookPen, Plus } from "lucide-react";
import FullCalendar, { type EventContentArg } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Card from "@/components/Card";

const TIME_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
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
  "22:00",
] as const;

type EventStatus = "reserved" | "paid" | "free";

type CalendarEvent = {
  id: string;
  title: string;
  time: (typeof TIME_SLOTS)[number];
  endTime?: (typeof TIME_SLOTS)[number];
  status: EventStatus;
  color: string;
  clients?: string[];
  peopleCount?: number;
  phone?: string;
  note?: string;
  coach?: string;
  capacity?: number;
};

type OverviewSlots = Record<(typeof TIME_SLOTS)[number], CalendarEvent | null>;

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const STATUS_COLORS: Record<EventStatus, string> = {
  reserved: "#F59E0B",
  paid: "#16A34A",
  free: "#10B981",
};

const STATUS_LABELS: Record<EventStatus, string> = {
  reserved: "Бронь",
  paid: "Оплачено",
  free: "Свободно",
};

const makeOverviewSlotKey = (groupKey: string, columnKey: string, time: string) =>
  `${groupKey}-${columnKey}-${time}`;

const getTimeSlotSpan = (
  startTime: (typeof TIME_SLOTS)[number],
  endTime?: (typeof TIME_SLOTS)[number],
) => {
  if (!endTime) return 1;
  const startIndex = TIME_SLOTS.indexOf(startTime);
  const endIndex = TIME_SLOTS.indexOf(endTime);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return 1;
  return endIndex - startIndex + 1;
};

const isTimeInEventRange = (
  time: (typeof TIME_SLOTS)[number],
  event: CalendarEvent | null,
) => {
  if (!event) return false;
  const startIndex = TIME_SLOTS.indexOf(event.time);
  const endIndex = event.endTime ? TIME_SLOTS.indexOf(event.endTime) : startIndex;
  const timeIndex = TIME_SLOTS.indexOf(time);
  if (startIndex === -1 || endIndex === -1 || timeIndex === -1) return false;
  return timeIndex >= startIndex && timeIndex <= endIndex;
};

const getStartOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const OVERVIEW_GROUPS = [
  {
    key: "cowork",
    label: "Коворкинг",
    columns: [
      { key: "capsule-1", label: "Капсула 1", capacityLabel: "4 места" },
      { key: "capsule-2", label: "Капсула 2", capacityLabel: "6 мест" },
      { key: "capsule-3", label: "Капсула 3", capacityLabel: "1 место" },
      { key: "capsule-4", label: "Капсула 4", capacityLabel: "1 место" },
      { key: "capsule-5", label: "Капсула 5", capacityLabel: "1 место" },
      { key: "ivent-zone", label: "ИвентЗона", capacityLabel: "20 мест" },
    ],
  },
  {
    key: "bodymind",
    label: "Body & Mind",
    columns: [
      { key: "body", label: "Body", capacityLabel: "10 мест" },
      { key: "reform", label: "Reform", capacityLabel: "4 места" },
    ],
  },
  {
    key: "kids",
    label: "Eywa Kids",
    columns: [{ key: "kids", label: "Kids", capacityLabel: "10 мест" }],
  },
] as const;

const DEFAULT_OVERVIEW_EVENTS: Record<string, CalendarEvent> = {
  [makeOverviewSlotKey("cowork", "capsule-1", "09:00")]: {
    id: "cowork-capsule-1-0900",
    title: "Алексей М.",
    time: "09:00",
    endTime: "12:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Алексей М."],
    peopleCount: 4,
    capacity: 4,
  },
  [makeOverviewSlotKey("cowork", "capsule-2", "09:00")]: {
    id: "cowork-capsule-2-0900",
    title: "Ольга С.",
    time: "09:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Ольга С."],
    peopleCount: 3,
    capacity: 6,
  },
  [makeOverviewSlotKey("cowork", "capsule-2", "10:00")]: {
    id: "cowork-capsule-2-1000",
    title: "Иван П.",
    time: "10:00",
    endTime: "14:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Иван П."],
    peopleCount: 5,
    capacity: 6,
  },
  [makeOverviewSlotKey("cowork", "capsule-3", "11:00")]: {
    id: "cowork-capsule-3-1100",
    title: "Мария R.",
    time: "11:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Мария R."],
    peopleCount: 1,
    capacity: 1,
  },
  [makeOverviewSlotKey("cowork", "capsule-4", "09:00")]: {
    id: "cowork-capsule-4-0900",
    title: "Екатерина В.",
    time: "09:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Екатерина В."],
    peopleCount: 1,
    capacity: 1,
  },
};

const INITIAL_OVERVIEW_SLOTS: Record<string, CalendarEvent | null> = (() => {
  const slots: Record<string, CalendarEvent | null> = {};
  OVERVIEW_GROUPS.forEach((group) => {
    group.columns.forEach((column) => {
      TIME_SLOTS.forEach((time) => {
        const slotKey = makeOverviewSlotKey(group.key, column.key, time);
        slots[slotKey] = DEFAULT_OVERVIEW_EVENTS[slotKey] ?? null;
      });
    });
  });
  return slots;
})();

const INITIAL_WEEK_SCHEDULE: Record<string, CalendarEvent | null> = {
  "mon-09:00": {
    id: "mon-capsule-1-0900",
    title: "Алексей М.",
    time: "09:00",
    endTime: "12:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Алексей М."],
    peopleCount: 4,
    capacity: 4,
  },
  "mon-09:00-olga": {
    id: "mon-capsule-2-0900",
    title: "Ольга С.",
    time: "09:00",
    endTime: "10:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Ольга С."],
    peopleCount: 3,
    capacity: 6,
  },
  "mon-10:00": {
    id: "mon-capsule-2-1000",
    title: "Иван П.",
    time: "10:00",
    endTime: "14:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Иван П."],
    peopleCount: 5,
    capacity: 6,
  },
  "mon-11:00": {
    id: "mon-capsule-3-1100",
    title: "Мария R.",
    time: "11:00",
    endTime: "12:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Мария R."],
    peopleCount: 1,
    capacity: 1,
  },
  "mon-09:00-ekaterina": {
    id: "mon-capsule-4-0900",
    title: "Екатерина В.",
    time: "09:00",
    endTime: "10:00",
    status: "paid",
    color: STATUS_COLORS.paid,
    clients: ["Екатерина В."],
    peopleCount: 1,
    capacity: 1,
  },
};
import { CLIENTS as MOCK_CLIENTS, type Client as MockClient } from "@/data/clients";

type StatusFilter = EventStatus | "all";
type ViewMode = "overview" | "schedule";
type SelectedSlotInfo = {
  groupKey: string;
  groupLabel: string;
  columnKey: string;
  columnLabel: string;
  time: string;
};

const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
  { value: "all", label: "Все", color: "var(--muted-foreground)" },
  { value: "paid", label: "Оплачено", color: STATUS_COLORS.paid },
  { value: "reserved", label: "Бронь", color: STATUS_COLORS.reserved },
  { value: "free", label: "Свободно", color: STATUS_COLORS.free },
];

export default function ScheduleLoadPage() {
  const [weekSchedule] = useState<Record<string, CalendarEvent | null>>(() => ({
    ...INITIAL_WEEK_SCHEDULE,
  }));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const [overviewSlotsState, setOverviewSlotsState] = useState<Record<string, CalendarEvent | null>>(
    () => ({
      ...INITIAL_OVERVIEW_SLOTS,
    }),
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotInfo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"event" | "create">("event");
  const [newBookingStatus, setNewBookingStatus] = useState<EventStatus>("reserved");
  const [newBookingClient, setNewBookingClient] = useState("");
  const [newBookingPhone, setNewBookingPhone] = useState("");
  const [newBookingNote, setNewBookingNote] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<MockClient[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [extendError, setExtendError] = useState<string | null>(null);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentTotal, setPaymentTotal] = useState("");
  const [paymentCash, setPaymentCash] = useState("");
  const [paymentCard, setPaymentCard] = useState("");
  const overviewStatusCounts = useMemo(() => {
    const counts: Record<EventStatus, number> = { reserved: 0, paid: 0, free: 0 };
    Object.values(overviewSlotsState).forEach((event) => {
      if (!event) return;
      counts[event.status] = (counts[event.status] || 0) + 1;
    });
    return counts;
  }, [overviewSlotsState]);

  const resetCreateForm = () => {
    setNewBookingStatus("reserved");
    setNewBookingClient("");
    setNewBookingPhone("");
    setNewBookingNote("");
    setClientSearchResults([]);
  };

  // При монтировании читаем сохранённый режим (Обзор / Расписание)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("scheduleViewMode");
      if (stored === "overview" || stored === "schedule") {
        setViewMode(stored as ViewMode);
      }
    } catch {
      // ignore
    }
  }, []);

  // Сохраняем выбранный режим, чтобы при обновлении страницы он сохранялся
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("scheduleViewMode", viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedEvent(null);
    setDraftEvent(null);
    setSelectedSlot(null);
    setExtendError(null);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    resetCreateForm();
  };

  const handleOpenCreateDrawer = (info: SelectedSlotInfo) => {
    setSelectedEvent(null);
    setDraftEvent(null);
    setSelectedSlot(info);
    setExtendError(null);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    resetCreateForm();
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleCreateBooking = () => {
    if (!selectedSlot) return;

    const title = newBookingClient.trim() || "Новый клиент";
    const time = selectedSlot.time as (typeof TIME_SLOTS)[number];
    const status = newBookingStatus;

    const newEvent: CalendarEvent = {
      id: `new-${Date.now()}`,
      title,
      time,
      status,
      color: STATUS_COLORS[status],
      clients: newBookingClient.trim() ? [newBookingClient.trim()] : undefined,
      peopleCount: 1,
      phone: newBookingPhone.trim() || undefined,
      note: newBookingNote.trim() || undefined,
    };

    const slotKey = makeOverviewSlotKey(selectedSlot.groupKey, selectedSlot.columnKey, selectedSlot.time);

    setOverviewSlotsState((prev) => {
      const updated = {
        ...prev,
        [slotKey]: newEvent,
      };

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Failed to save overviewSlotsState:", error);
      }

      return updated;
    });

    handleCloseDrawer();
  };

  const handleExtendEvent = () => {
    if (!draftEvent || !selectedSlot) return;

    const startIndex = TIME_SLOTS.indexOf(draftEvent.time as (typeof TIME_SLOTS)[number]);
    if (startIndex === -1) return;

    const currentEndIndex = draftEvent.endTime
      ? TIME_SLOTS.indexOf(draftEvent.endTime as (typeof TIME_SLOTS)[number])
      : startIndex;
    if (currentEndIndex === -1) return;

    const nextIndex = currentEndIndex + 1;
    if (nextIndex >= TIME_SLOTS.length) return;

    const nextTime = TIME_SLOTS[nextIndex];
    const nextKey = makeOverviewSlotKey(selectedSlot.groupKey, selectedSlot.columnKey, nextTime);

    // Если в следующем слоте уже есть событие — не продлеваем
    if (overviewSlotsState[nextKey]) {
      setExtendError("Нельзя продлить: следующий час уже занят другим бронированием.");
      return;
    }

    const updatedEvent: CalendarEvent = {
      ...draftEvent,
      endTime: nextTime,
    };

    setDraftEvent(updatedEvent);
    setExtendError(null);
  };

  const handleShortenEvent = () => {
    if (!draftEvent || !selectedSlot) return;

    const startIndex = TIME_SLOTS.indexOf(draftEvent.time as (typeof TIME_SLOTS)[number]);
    if (startIndex === -1) return;

    const currentEndIndex = draftEvent.endTime
      ? TIME_SLOTS.indexOf(draftEvent.endTime as (typeof TIME_SLOTS)[number])
      : startIndex + 1;
    if (currentEndIndex === -1) return;

    // Минимум один слот: если уже минимальная длина — не укорачиваем
    if (currentEndIndex <= startIndex + 1) {
      return;
    }

    const newEndIndex = currentEndIndex - 1;
    const newEndTime = TIME_SLOTS[newEndIndex] as (typeof TIME_SLOTS)[number];

    const updatedEvent: CalendarEvent = {
      ...draftEvent,
      endTime: newEndTime,
    };

    setDraftEvent(updatedEvent);
    setExtendError(null);
  };

  const handleSaveEventChanges = () => {
    if (!selectedEvent || !draftEvent || !selectedSlot) {
      handleCloseDrawer();
      return;
    }

    // Если время и статус не изменились — просто закрываем
    if (
      draftEvent.time === selectedEvent.time &&
      draftEvent.endTime === selectedEvent.endTime &&
      draftEvent.status === selectedEvent.status
    ) {
      handleCloseDrawer();
      return;
    }

    const startKey = makeOverviewSlotKey(
      selectedSlot.groupKey,
      selectedSlot.columnKey,
      selectedEvent.time as (typeof TIME_SLOTS)[number],
    );

    setOverviewSlotsState((prev) => {
      const updated = {
        ...prev,
        [startKey]: draftEvent,
      };

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Failed to save overviewSlotsState:", error);
      }

      return updated;
    });

    handleCloseDrawer();
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent || !selectedSlot) {
      handleCloseDrawer();
      return;
    }

    const startKey = makeOverviewSlotKey(
      selectedSlot.groupKey,
      selectedSlot.columnKey,
      selectedEvent.time as (typeof TIME_SLOTS)[number],
    );

    setOverviewSlotsState((prev) => {
      const updated = { ...prev, [startKey]: null };

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Failed to save overviewSlotsState:", error);
      }

      return updated;
    });

    handleCloseDrawer();
  };

  const handleConfirmPayment = () => {
    if (!selectedSlot || (!selectedEvent && !draftEvent)) {
      handleCloseDrawer();
      return;
    }

    const baseEvent = draftEvent ?? selectedEvent!;

    const effectiveTotal = paymentTotal || "200 000";
    const cleanTotal = effectiveTotal.replace(/\s+/g, "");
    const cleanCash = paymentCash.replace(/\s+/g, "");
    const cleanCard = paymentCard.replace(/\s+/g, "");

    let totalNum = cleanTotal ? Number(cleanTotal) : 0;
    let cashNum = cleanCash ? Number(cleanCash) : 0;
    let cardNum = cleanCard ? Number(cleanCard) : 0;

    // Если общая сумма не указана, но указаны части — считаем total как сумму частей
    if (!totalNum && (cashNum || cardNum)) {
      totalNum = cashNum + cardNum;
    }
    // Если указана только общая сумма, а части не указаны — считаем, что всё наличными
    if (totalNum && !cashNum && !cardNum) {
      cashNum = totalNum;
    }

    const totalStr = totalNum
      ? Number(totalNum).toLocaleString("ru-RU")
      : "";
    const cashStr = cashNum
      ? Number(cashNum).toLocaleString("ru-RU")
      : "";
    const cardStr = cardNum
      ? Number(cardNum).toLocaleString("ru-RU")
      : "";

    const parts: string[] = [];
    if (cashNum) parts.push(`наличные ${cashStr} сум`);
    if (cardNum) parts.push(`карта ${cardStr} сум`);
    const breakdown = parts.length ? ` (${parts.join(", ")})` : "";

    const updatedEvent: CalendarEvent = {
      ...baseEvent,
      status: "paid",
      color: STATUS_COLORS.paid,
      note:
        totalNum
          ? `${baseEvent.note ? `${baseEvent.note} · ` : ""}Оплата: ${totalStr} сум${breakdown}`
          : baseEvent.note,
    };

    const startKey = makeOverviewSlotKey(
      selectedSlot.groupKey,
      selectedSlot.columnKey,
      baseEvent.time as (typeof TIME_SLOTS)[number],
    );

    setOverviewSlotsState((prev) => {
      const updated = {
        ...prev,
        [startKey]: updatedEvent,
      };

      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
        }
      } catch (error) {
        console.error("Failed to save overviewSlotsState:", error);
      }

      return updated;
    });

    setSelectedEvent(updatedEvent);
    setDraftEvent(updatedEvent);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    handleCloseDrawer();
  };

  useEffect(() => {
    if (!showDatePicker) return;
    const handler = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("overviewSlotsState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOverviewSlotsState((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to parse saved overviewSlotsState:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    const currentApiDate = api.getDate();
    if (currentApiDate.toDateString() !== currentDate.toDateString()) {
      api.gotoDate(currentDate);
    }
  }, [currentDate]);

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

  const getDateForDayKey = useCallback(
    (dayKey: string) => {
      const index = DAY_KEYS.indexOf(dayKey as (typeof DAY_KEYS)[number]);
      const base = new Date(weekStart);
      base.setDate(base.getDate() + (index < 0 ? 0 : index));
      return base;
    },
    [weekStart],
  );

  const buildDateTime = useCallback(
    (dayKey: string, time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date(getDateForDayKey(dayKey));
      date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
      return date;
    },
    [getDateForDayKey],
  );

  const filteredWeekSchedule = useMemo(() => {
    if (statusFilter === "all" && !searchQuery) {
      return weekSchedule;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, CalendarEvent | null> = {};

    Object.entries(weekSchedule).forEach(([key, event]) => {
      if (!event) return;
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesQuery =
        !searchQuery ||
        event.title.toLowerCase().includes(query) ||
        event.coach?.toLowerCase().includes(query) ||
        event.note?.toLowerCase().includes(query);

      if (matchesStatus && matchesQuery) {
        filtered[key] = event;
      }
    });

    return filtered;
  }, [weekSchedule, statusFilter, searchQuery]);

  const calendarWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekDay = (firstDay.getDay() + 6) % 7;
    const weeks: Array<Array<number | null>> = [];
    let dayCounter = 1 - startWeekDay;

    for (let week = 0; week < 6; week++) {
      const weekDays: Array<number | null> = [];
      for (let day = 0; day < 7; day++, dayCounter++) {
        if (dayCounter < 1 || dayCounter > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(dayCounter);
        }
      }
      weeks.push(weekDays);
      if (dayCounter > daysInMonth) break;
    }
    return weeks;
  }, [currentDate]);

  const overviewColumnCount = useMemo(
    () => OVERVIEW_GROUPS.reduce((acc, group) => acc + group.columns.length, 0),
    [],
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
    [overviewColumnCount],
  );

  const overviewFiltered = useMemo(() => {
    let filtered = overviewGroupsWithState.map((group) => ({
      ...group,
      columns: group.columns.map((column) => ({
        ...column,
        slots: { ...column.slots },
      })),
    }));

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

    if (statusFilter !== "all") {
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

  const calendarEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      extendedProps: Record<string, unknown>;
    }> = [];

    Object.entries(filteredWeekSchedule).forEach(([key, event]) => {
      if (!event) return;
      const [dayKey] = key.split("-");
      const start = buildDateTime(dayKey, event.time);
      const end = event.endTime
        ? buildDateTime(dayKey, event.endTime)
        : new Date(start.getTime() + 60 * 60 * 1000);

      events.push({
        id: key,
        title: event.title,
        start: start.toISOString(),
        end: end.toISOString(),
        extendedProps: {
          status: event.status,
          coach: event.coach,
          capacity: event.capacity,
          peopleCount: event.peopleCount,
        },
      });
    });

    return events;
  }, [filteredWeekSchedule, buildDateTime]);

  const handleDateShift = (offset: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    setCurrentDate(next);
  };

  const handleMonthNavigate = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + offset);
    setCurrentDate(next);
  };

  const handleDateSelect = (day: number) => {
    const next = new Date(currentDate);
    next.setDate(day);
    setCurrentDate(next);
    setShowDatePicker(false);
  };

  const renderEventContent = useCallback((arg: EventContentArg) => {
    return <div className="h-full w-full" />;
  }, []);

  return (
    <div
      className="space-y-4 p-4 overflow-x-auto"
      style={{
        borderRadius: "30px",
        background: "var(--panel)",
        border: "1px solid var(--card-border)",
      }}
    >
      {/* Фильтры и поиск */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  statusFilter === filter.value ? "border-2" : "border"
                }`}
                style={{
                  borderColor: statusFilter === filter.value ? filter.color : "var(--card-border)",
                  background: statusFilter === filter.value ? filter.color + "15" : "var(--panel)",
                  color: statusFilter === filter.value ? filter.color : "var(--foreground)",
                }}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="Поиск по клиенту или тренеру"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 min-w-[240px] rounded-xl border pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                onClick={() => setShowDatePicker((prev) => !prev)}
              >
                <CalendarIcon className="h-4 w-4" />
                {currentDate.toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </button>
              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border p-3 shadow-lg z-50" style={{ background: "var(--panel)", borderColor: "var(--card-border)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      onClick={() => handleMonthNavigate(-1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {currentDate.toLocaleDateString("ru-RU", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      onClick={() => handleMonthNavigate(1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                    {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label) => (
                      <span key={label} className="text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {calendarWeeks.map((week, weekIndex) =>
                      week.map((day, dayIndex) =>
                        day ? (
                          <button
                            key={`${weekIndex}-${dayIndex}`}
                            type="button"
                            className={`h-9 rounded-xl transition-colors ${
                              day === currentDate.getDate() ? "font-semibold" : "hover:opacity-80"
                            }`}
                            style={{
                              background: day === currentDate.getDate() ? "var(--muted)" : "transparent",
                              color: day === currentDate.getDate() ? "var(--foreground)" : "var(--muted-foreground)",
                            }}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </button>
                        ) : (
                          <span key={`${weekIndex}-${dayIndex}`} className="h-9" />
                        ),
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Переключатель режимов */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Расписание загрузки</h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {weekStart.toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "short",
              })}{" "}
              –{" "}
              {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          </div>
          <div className="flex gap-2 rounded-xl p-1" style={{ background: "var(--muted)" }}>
            {(["overview", "schedule"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === mode ? "shadow-sm" : ""
                }`}
                style={{
                  background: viewMode === mode ? "var(--panel)" : "transparent",
                  color: "var(--foreground)",
                }}
                onClick={() => setViewMode(mode)}
              >
                {mode === "overview" ? "Обзор" : "Расписание"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Календарь */}
        {viewMode === "overview" ? (
        <Card className="overflow-hidden p-0">
          <div className="p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Обзор загрузки</h3>
          </div>
          <div className="px-4 pt-4 flex flex-wrap gap-3">
            {(["reserved", "paid", "free"] as const).map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
                style={{
                  background: STATUS_COLORS[status] + "12",
                  border: `1px solid ${STATUS_COLORS[status]}33`,
                  color: STATUS_COLORS[status],
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATUS_COLORS[status] }}
                />
                <span>{STATUS_LABELS[status]}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {overviewStatusCounts[status] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="schedule-load-overview" style={{ gridTemplateColumns: overviewTemplate, minWidth: "fit-content" }}>
              <div className="schedule-load-group-header" style={{ gridColumn: 1 }}></div>
              {overviewGroupsWithState.map((group, groupIndex) => {
                // Вычисляем начальную колонку для группы (начинается со 2-й колонки)
                let startColumn = 2;
                for (let i = 0; i < groupIndex; i++) {
                  startColumn += overviewGroupsWithState[i].columns.length;
                }
                return (
                    <div
                      key={group.key}
                    className="schedule-load-group-header"
                    style={{ gridColumn: `${startColumn} / span ${group.columns.length}` }}
                    >
                      {group.label}
                    </div>
                );
              })}
              <div className="schedule-load-column-header schedule-load-column-header--time" style={{ gridColumn: 1 }}>
                <span>Время</span>
                </div>
              {overviewGroupsWithState.flatMap((group, groupIndex) => {
                // Вычисляем начальную колонку для первой колонки группы
                let startColumn = 2;
                for (let i = 0; i < groupIndex; i++) {
                  startColumn += overviewGroupsWithState[i].columns.length;
                }
                return group.columns.map((column, columnIndex) => {
                  const isLastColumnInGroup = columnIndex === group.columns.length - 1;
                  const isLastGroup = groupIndex === overviewGroupsWithState.length - 1;
                  const hasRightBorder = !isLastColumnInGroup || !isLastGroup;
                  
                  return (
                    <div
                      key={`${group.key}-${column.key}`}
                      className={`schedule-load-column-header ${!hasRightBorder ? "schedule-load-column-header--no-right-border" : ""}`}
                      style={{ gridColumn: startColumn + columnIndex }}
                    >
                      <span>{column.label}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{column.capacityLabel}</span>
                      </div>
                  );
                });
              })}
              {TIME_SLOTS.map((time) => {
                const timeIndex = TIME_SLOTS.indexOf(time as (typeof TIME_SLOTS)[number]);
                return (
                  <Fragment key={time}>
                    <div className="schedule-load-time-cell" style={{ gridColumn: 1 }}>
                      {time}
                </div>
                    {overviewGroupsWithState.flatMap((group, groupIndex) => {
                      // Вычисляем начальную колонку для первой колонки группы
                      let startColumn = 2;
                      for (let i = 0; i < groupIndex; i++) {
                        startColumn += overviewGroupsWithState[i].columns.length;
                      }
                      return group.columns.map((column, columnIndex) => {
                        const overviewCellKey = makeOverviewSlotKey(group.key, column.key, time);
                        const slotFromFilter =
                          overviewSlotsMap[group.key]?.[column.key]?.[
                            time as (typeof TIME_SLOTS)[number]
                          ] ?? null;
                        const columnSlots = column.slots;
                        
                        // Проверяем, есть ли draftEvent для этой колонки
                        const isDraftEventForThisColumn = draftEvent && 
                          selectedSlot?.groupKey === group.key && 
                          selectedSlot?.columnKey === column.key;
                        
                        // Используем draftEvent, если он есть для этой колонки, иначе используем eventAtTime из columnSlots
                        const originalEventAtTime = columnSlots[time as (typeof TIME_SLOTS)[number]];
                        const eventAtTime = isDraftEventForThisColumn && draftEvent && draftEvent.time === time
                          ? draftEvent
                          : originalEventAtTime;
                        
                        // Создаем объединенный список событий для проверки, включая draftEvent
                        const allEvents = Object.values(columnSlots).filter(e => e !== null) as CalendarEvent[];
                        if (isDraftEventForThisColumn && draftEvent) {
                          // Заменяем оригинальное событие на draftEvent, если оно существует
                          const originalEventIndex = allEvents.findIndex(
                            e => e && e.time === draftEvent.time
                          );
                          if (originalEventIndex !== -1) {
                            allEvents[originalEventIndex] = draftEvent;
                          } else {
                            allEvents.push(draftEvent);
                          }
                        }
                        
                        // Проверяем, продолжается ли событие в этом времени
                        // Событие продолжается только если время строго между началом и концом (не включая начало и конец)
                        const continuingEvent = allEvents.find(
                          (event) => {
                            if (!event || event.time === time) return false;
                            if (!event.endTime) return false; // События без endTime не продолжаются
                            
                            const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
                            const endIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
                            
                            if (timeIndex === -1 || startIndex === -1 || endIndex === -1) return false;
                            
                            // Время должно быть строго после начала и строго до конца (не включая конец)
                            // Например, если событие 9:00-10:00:
                            // - В 9:00: timeIndex = startIndex, не продолжение (это начало)
                            // - В 10:00: timeIndex = endIndex, не продолжение (это конец)
                            // - В 11:00: timeIndex > endIndex, не продолжение (уже после конца)
                            // Продолжение только если: startIndex < timeIndex < endIndex
                            return timeIndex > startIndex && timeIndex < endIndex;
                          },
                        );
                        
                        // Проверяем, находится ли текущее время в диапазоне события, которое начинается раньше или в том же времени
                        // Если да, то это время уже занято событием через span, и не нужно рендерить пустую ячейку
                        const isTimeOccupiedByEarlierEvent = allEvents.some(
                          (event) => {
                            if (!event || !event.endTime) return false;
                            
                            const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
                            const endIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
                            
                            if (timeIndex === -1 || startIndex === -1 || endIndex === -1) return false;
                            
                            // Время занято, если оно находится в диапазоне события (включая начало и конец)
                            // Например, если событие 9:00-10:00:
                            // - В 9:00: timeIndex = startIndex, занято (это начало) - но это начало, так что не скрываем пустую ячейку
                            // - В 10:00: timeIndex = endIndex, занято (это конец) - скрываем пустую ячейку
                            // - В 11:00: timeIndex > endIndex, не занято (уже после конца)
                            // Если это начало события (timeIndex === startIndex), не скрываем пустую ячейку (она будет событием)
                            // Если это продолжение или конец (timeIndex > startIndex && timeIndex <= endIndex), скрываем пустую ячейку
                            return timeIndex > startIndex && timeIndex <= endIndex;
                          },
                        );
                        
                        const isEventStart = !!eventAtTime;
                        const isEventContinue = !!continuingEvent;
                        const passesFilters =
                          !searchQuery && statusFilter === "all" ? true : Boolean(slotFromFilter);

                        const cellColumn = startColumn + columnIndex;

                      // Если событие продолжается, но не начинается здесь, не рендерим ячейку
                        if (isEventContinue && !isEventStart) {
                          return null;
                        }

                        if (eventAtTime && isEventStart && passesFilters) {
                          const span = getTimeSlotSpan(eventAtTime.time, eventAtTime.endTime);
                          const timeRange = eventAtTime.endTime
                            ? `${eventAtTime.time}–${eventAtTime.endTime}`
                            : eventAtTime.time;
                          const peopleCount = eventAtTime.peopleCount ?? 1;
                          const clientName =
                            eventAtTime.clients && eventAtTime.clients.length > 0
                              ? eventAtTime.clients[0]
                              : eventAtTime.title;

                          return (
                            <div
                              key={overviewCellKey}
                            className="schedule-load-cell schedule-load-cell--event"
                            draggable
                            onClick={() => {
                              setSelectedSlot({
                                groupKey: group.key,
                                groupLabel: group.label,
                                columnKey: column.key,
                                columnLabel: column.label,
                                time: eventAtTime.time,
                              });
                              setSelectedEvent(eventAtTime);
                              setDraftEvent(eventAtTime);
                              setDrawerMode("event");
                              setIsDrawerOpen(true);
                            }}
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({
                                  event: eventAtTime,
                                  groupKey: group.key,
                                  columnKey: column.key,
                                  time: time,
                                }),
                              );
                              e.dataTransfer.effectAllowed = "move";
                              // Добавляем визуальную обратную связь
                              e.currentTarget.style.opacity = "0.5";
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                              style={{
                              gridColumn: cellColumn,
                              gridRow: `span ${span}`,
                              background: eventAtTime.color + "15",
                              borderColor: eventAtTime.color + "60",
                              }}
                            >
                              <div
                              className="schedule-load-event-content"
                              onDragStart={(e) => e.stopPropagation()}
                              draggable={false}
                            >
                              <div className="schedule-load-event-name">
                                {clientName}
                              </div>
                              <div className="schedule-load-event-meta">
                                <div className="schedule-load-event-meta-item">
                                  <Clock className="schedule-load-event-icon" />
                                        <span>{timeRange}</span>
                                      </div>
                                <div className="schedule-load-event-meta-item">
                                  <Users className="schedule-load-event-icon" />
                                        <span>{peopleCount} чел.</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                      // Если время занято событием, которое начинается раньше (через span), не рендерим пустую ячейку
                      if (isTimeOccupiedByEarlierEvent) {
                        return null;
                      }

                      // Проверяем, есть ли событие в этой колонке, которое занимает эту строку
                      const hasEventInColumn = allEvents.some(
                        (event) => {
                          if (!event || !event.endTime) return false;
                          const startIndex = TIME_SLOTS.indexOf(event.time as (typeof TIME_SLOTS)[number]);
                          const endIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
                          if (timeIndex === -1 || startIndex === -1 || endIndex === -1) return false;
                          // Если текущее время находится в диапазоне события (но не является началом)
                          return timeIndex > startIndex && timeIndex <= endIndex;
                        },
                      );

                      // Не принимаем drop, если ячейка находится за событием
                      const canAcceptDrop = !hasEventInColumn && !isTimeOccupiedByEarlierEvent;

                        return (
                          <div
                            key={overviewCellKey}
                            className="schedule-load-cell schedule-load-cell--empty"
                            style={{ gridColumn: cellColumn }}
                          onDragOver={(e) => {
                            if (!canAcceptDrop) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            e.currentTarget.style.background = "var(--muted)";
                          }}
                          onDragLeave={(e) => {
                            if (!canAcceptDrop) return;
                            e.currentTarget.style.background = "var(--panel)";
                          }}
                          onDrop={(e) => {
                            if (!canAcceptDrop) return;
                            e.preventDefault();
                            e.currentTarget.style.background = "var(--panel)";
                            try {
                              const data = JSON.parse(e.dataTransfer.getData("application/json"));
                              const { event, groupKey: sourceGroupKey, columnKey: sourceColumnKey, time: sourceTime } = data;
                              
                              if (!event) return;
                              
                              // Создаем ключи для старого и нового места
                              const oldKey = makeOverviewSlotKey(sourceGroupKey, sourceColumnKey, sourceTime);
                              const newKey = makeOverviewSlotKey(group.key, column.key, time);
                              
                              // Если событие перемещается в то же место, ничего не делаем
                              if (oldKey === newKey) return;
                              
                              // Проверяем, не занято ли новое место
                              const targetSlot = overviewSlotsState[newKey];
                              if (targetSlot) {
                                // Место занято, не перемещаем
                                return;
                              }
                              
                              // Обновляем событие с новым временем
                              const updatedEvent: CalendarEvent = {
                                ...event,
                                time: time as (typeof TIME_SLOTS)[number],
                                // Если было endTime, пересчитываем его относительно нового времени
                                endTime: event.endTime 
                                  ? (() => {
                                      const oldStartIndex = TIME_SLOTS.indexOf(sourceTime as (typeof TIME_SLOTS)[number]);
                                      const oldEndIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
                                      const duration = oldEndIndex - oldStartIndex;
                                      const newStartIndex = TIME_SLOTS.indexOf(time as (typeof TIME_SLOTS)[number]);
                                      const newEndIndex = newStartIndex + duration;
                                      return TIME_SLOTS[newEndIndex] as string;
                                    })()
                                  : undefined,
                              };
                              
                              // Обновляем состояние: удаляем из старого места, добавляем в новое
                              setOverviewSlotsState((prev) => {
                                const updated = { ...prev };
                                // Удаляем из старого места (и все связанные слоты, если событие растягивается)
                                if (event.endTime) {
                                  const oldStartIndex = TIME_SLOTS.indexOf(sourceTime as (typeof TIME_SLOTS)[number]);
                                  const oldEndIndex = TIME_SLOTS.indexOf(event.endTime as (typeof TIME_SLOTS)[number]);
                                  for (let i = oldStartIndex; i <= oldEndIndex; i++) {
                                    const slotKey = makeOverviewSlotKey(sourceGroupKey, sourceColumnKey, TIME_SLOTS[i] as string);
                                    if (i === oldStartIndex) {
                                      delete updated[slotKey];
                                    } else {
                                      delete updated[slotKey];
                                    }
                                  }
                                } else {
                                  delete updated[oldKey];
                                }
                                
                                // Добавляем в новое место
                                updated[newKey] = updatedEvent;
                                
                                // Если событие растягивается, заполняем промежуточные слоты
                                if (updatedEvent.endTime) {
                                  const newStartIndex = TIME_SLOTS.indexOf(time as (typeof TIME_SLOTS)[number]);
                                  const newEndIndex = TIME_SLOTS.indexOf(updatedEvent.endTime as (typeof TIME_SLOTS)[number]);
                                  for (let i = newStartIndex + 1; i <= newEndIndex; i++) {
                                    const slotKey = makeOverviewSlotKey(group.key, column.key, TIME_SLOTS[i] as string);
                                    // Промежуточные слоты остаются пустыми (они обрабатываются логикой продолжения)
                                  }
                                }
                                
                                // Сохраняем в localStorage
                                localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
                                
                                return updated;
                              });
                            } catch (err) {
                              console.error("Failed to parse drop data:", err);
                            }
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenCreateDrawer({
                              groupKey: group.key,
                              groupLabel: group.label,
                              columnKey: column.key,
                              columnLabel: column.label,
                              time,
                            });
                          }}
                        />
                      );
                    });
                  })}
                  </Fragment>
                );
              })}
              </div>
            </div>
          </Card>
        ) : (
        <Card className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
                <div>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                    Текущая неделя
                  </p>
              <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                    {weekStart.toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
                      "ru-RU",
                      { day: "2-digit", month: "short" },
                    )}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onClick={() => handleDateShift(-7)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onClick={() => handleDateShift(7)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

          <div className="schedule-load-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              height="auto"
              slotDuration="01:00:00"
              slotMinTime="09:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              expandRows
              selectable
              selectMirror
              dayMaxEvents
              eventOverlap={false}
              slotEventOverlap={false}
              nowIndicator
              events={calendarEvents}
              eventContent={renderEventContent}
              eventClassNames={() => "schedule-load-event"}
              dateClick={(info) => setCurrentDate(info.date)}
              slotLabelClassNames="schedule-load-slot-label"
              dayHeaderClassNames="schedule-load-day-header"
              firstDay={1}
              locale="ru"
              className="schedule-load-fc"
            />
          </div>
          </Card>
        )}

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(4px)" }}
            onClick={handleCloseDrawer}
          />
          <div className={`schedule-event-drawer ${isDrawerOpen ? "schedule-event-drawer--open" : ""}`}>
            <div className="schedule-event-drawer__inner">
              <div className="schedule-event-drawer__header">
                <div className="schedule-event-drawer__header-content">
                  {drawerMode === "event" && selectedEvent ? (
                    <>
                      <h2 className="schedule-event-drawer__title">
                        {selectedEvent?.clients && selectedEvent.clients.length > 0
                          ? selectedEvent.clients[0]
                          : selectedEvent?.title}
                      </h2>
                      <div className="schedule-event-drawer__badge" style={{ 
                        color: selectedEvent?.color,
                        background: selectedEvent?.status === "paid" 
                          ? STATUS_COLORS["paid"] + "20" 
                          : selectedEvent?.status === "reserved"
                          ? STATUS_COLORS["reserved"] + "20"
                          : "var(--muted)",
                        border: `1.5px solid ${selectedEvent?.color || "var(--card-border)"}`,
                      }}>
                        {selectedEvent && STATUS_LABELS[selectedEvent.status]}
        </div>
                    </>
                  ) : selectedSlot ? (
                    <>
                      <h2 className="schedule-event-drawer__title">Новая запись</h2>
                      <div className="schedule-event-drawer__badge schedule-event-drawer__badge--soft">
                        {selectedSlot.groupLabel} · {selectedSlot.columnLabel}
    </div>
                    </>
                  ) : null}
                </div>
                <button className="schedule-event-drawer__close" onClick={handleCloseDrawer} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="schedule-event-drawer__content">
                {drawerMode === "event" && selectedEvent && (
                  <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Время с кнопками */}
                    <div style={{
                      padding: "0.75rem 0.875rem",
                      borderRadius: "10px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                    }}>
                      <div style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "var(--muted-foreground)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.375rem",
                      }}>
                        Время
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                      }}>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                            {(draftEvent ?? selectedEvent).time}
                            {(draftEvent ?? selectedEvent).endTime &&
                              ` – ${(draftEvent ?? selectedEvent).endTime}`}
                        </div>
                        <div style={{
                          display: "flex",
                          gap: "0.5rem",
                        }}>
                          <button
                            type="button"
                            onClick={handleExtendEvent}
                            style={{
                              padding: "0.375rem 0.625rem",
                              borderRadius: "6px",
                              border: "1px solid var(--card-border)",
                              background: "var(--background)",
                              color: "var(--foreground)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--muted)";
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--background)";
                              e.currentTarget.style.borderColor = "var(--card-border)";
                            }}
                          >
                            Продлить на 1 час
                          </button>
                          <button
                            type="button"
                            onClick={handleShortenEvent}
                            style={{
                              padding: "0.375rem 0.625rem",
                              borderRadius: "6px",
                              border: "1px solid var(--card-border)",
                              background: "var(--background)",
                              color: "var(--foreground)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--muted)";
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--background)";
                              e.currentTarget.style.borderColor = "var(--card-border)";
                            }}
                          >
                            Сократить на 1 час
                          </button>
                      </div>
                      </div>
                      {extendError && (
                        <div style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#ef4444",
                          fontSize: "0.75rem",
                        }}>
                          {extendError}
                        </div>
                      )}
                    </div>

                    {/* Количество человек */}
                      {selectedEvent.peopleCount && (
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Количество человек
                          </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Users className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          {selectedEvent.peopleCount} чел.
                        </div>
                        </div>
                      )}

                    {/* Клиенты */}
                      {selectedEvent.clients && selectedEvent.clients.length > 0 && (
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.5rem",
                        }}>
                          Клиенты
                          </div>
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}>
                          {selectedEvent.clients.map((client, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.75rem",
                              }}
                            >
                              <div style={{
                                fontSize: "0.9375rem",
                                fontWeight: 600,
                                color: "var(--foreground)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}>
                                <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                                {client}
                              </div>
                              <button
                                type="button"
                                onClick={handleDeleteEvent}
                                style={{
                                  padding: "0.375rem 0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "#ef4444",
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "var(--background)";
                                  e.currentTarget.style.borderColor = "var(--card-border)";
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                        </div>
                      )}

                    {/* Телефон */}
                      {selectedEvent.phone && (
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Телефон
                          </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Phone className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          {selectedEvent.phone}
                        </div>
                        </div>
                      )}

                    {/* Тренер */}
                      {selectedEvent.coach && (
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Тренер
                          </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          {selectedEvent.coach}
                        </div>
                        </div>
                      )}

                    {/* Примечание */}
                      {selectedEvent.note && (
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Примечание
                          </div>
                        <div style={{
                          fontSize: "0.875rem",
                          color: "var(--foreground)",
                          lineHeight: "1.5",
                        }}>
                          {selectedEvent.note}
                        </div>
                        </div>
                      )}

                    {/* Оплата (если статус "reserved") */}
                      {selectedEvent.status === "reserved" && (
                      <div>
                          {!isPaymentMode ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (!paymentTotal) {
                                  setPaymentTotal("200 000");
                                }
                                setIsPaymentMode(true);
                              }}
                            style={{
                              width: "100%",
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              border: "1.5px solid transparent",
                              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                              color: "#fff",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            >
                              Оплатить
                            </button>
                          ) : (
                          <div style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            background: "var(--muted)",
                            border: "1px solid var(--card-border)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid var(--card-border)",
                            }}>
                              <span style={{
                                fontSize: "0.8125rem",
                                color: "var(--muted-foreground)",
                              }}>
                                Итого за услугу
                              </span>
                              <strong style={{
                                fontSize: "1rem",
                                color: "var(--foreground)",
                              }}>
                                {paymentTotal || "200 000"} сум
                              </strong>
                              </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <label style={{
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                color: "var(--foreground)",
                              }}>
                                Наличные
                              </label>
                                <input
                                  type="text"
                                  placeholder="Например, 100 000"
                                  value={paymentCash}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/[^\d]/g, "");
                                    if (!digits) {
                                      setPaymentCash("");
                                      return;
                                    }
                                    const formatted = Number(digits).toLocaleString("ru-RU").replace(/\u00A0/g, " ");
                                    setPaymentCash(formatted);
                                  }}
                                style={{
                                  width: "100%",
                                  padding: "0.625rem 0.875rem",
                                  borderRadius: "10px",
                                  border: "1.5px solid var(--card-border)",
                                  background: "var(--background)",
                                  fontSize: "0.875rem",
                                  color: "var(--foreground)",
                                  outline: "none",
                                  transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = "var(--card-border)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                />
                              </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <label style={{
                                fontSize: "0.8125rem",
                                fontWeight: 600,
                                color: "var(--foreground)",
                              }}>
                                Перевод
                              </label>
                                <input
                                  type="text"
                                  placeholder="Например, 100 000"
                                  value={paymentCard}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/[^\d]/g, "");
                                    if (!digits) {
                                      setPaymentCard("");
                                      return;
                                    }
                                    const formatted = Number(digits).toLocaleString("ru-RU").replace(/\u00A0/g, " ");
                                    setPaymentCard(formatted);
                                  }}
                                style={{
                                  width: "100%",
                                  padding: "0.625rem 0.875rem",
                                  borderRadius: "10px",
                                  border: "1.5px solid var(--card-border)",
                                  background: "var(--background)",
                                  fontSize: "0.875rem",
                                  color: "var(--foreground)",
                                  outline: "none",
                                  transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = "var(--card-border)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                />
                              </div>

                              {(paymentTotal || paymentCash || paymentCard) && (
                              <div style={{
                                padding: "0.75rem",
                                borderRadius: "8px",
                                background: "var(--background)",
                                border: "1px solid var(--card-border)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                              }}>
                                  {paymentTotal && (
                                  <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.8125rem",
                                  }}>
                                    <span style={{ color: "var(--muted-foreground)" }}>Итого за услугу</span>
                                    <strong style={{ color: "var(--foreground)" }}>{paymentTotal} сум</strong>
                                    </div>
                                  )}
                                  {paymentCash && (
                                  <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.8125rem",
                                  }}>
                                    <span style={{ color: "var(--muted-foreground)" }}>Наличные</span>
                                    <strong style={{ color: "var(--foreground)" }}>{paymentCash} сум</strong>
                                    </div>
                                  )}
                                  {paymentCard && (
                                  <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.8125rem",
                                  }}>
                                    <span style={{ color: "var(--muted-foreground)" }}>Перевод</span>
                                    <strong style={{ color: "var(--foreground)" }}>{paymentCard} сум</strong>
                                    </div>
                                  )}
                                </div>
                              )}

                            <div style={{
                              display: "flex",
                              gap: "0.625rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px solid var(--card-border)",
                            }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsPaymentMode(false);
                                    setPaymentTotal("");
                                    setPaymentCash("");
                                    setPaymentCard("");
                                  }}
                                style={{
                                  flex: 1,
                                  padding: "0.75rem 1rem",
                                  borderRadius: "10px",
                                  border: "1.5px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--foreground)",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--muted)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "var(--background)";
                                }}
                                >
                                  Отмена
                                </button>
                                <button
                                  type="button"
                                  onClick={handleConfirmPayment}
                                style={{
                                  flex: 1,
                                  padding: "0.75rem 1rem",
                                  borderRadius: "10px",
                                  border: "1.5px solid transparent",
                                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                                  color: "#fff",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                                >
                                  Подтвердить оплату
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Кнопки действий */}
                    <div style={{
                      display: "flex",
                      gap: "0.625rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--card-border)",
                    }}>
                      <button
                        type="button"
                        onClick={handleCloseDrawer}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid var(--card-border)",
                          background: "var(--background)",
                          color: "var(--foreground)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEventChanges}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid transparent",
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          color: "#fff",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                )}

                {drawerMode === "create" && selectedSlot && (
                  <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Статус записи */}
                    <div style={{
                      display: "flex",
                      gap: "0.5rem",
                      padding: "0.375rem",
                      borderRadius: "10px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                    }}>
                      {(["reserved", "paid"] as EventStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setNewBookingStatus(status)}
                          style={{
                            flex: 1,
                            padding: "0.5rem 0.875rem",
                            borderRadius: "8px",
                            border: "1.5px solid",
                            borderColor: newBookingStatus === status 
                              ? STATUS_COLORS[status] 
                              : "transparent",
                            background: newBookingStatus === status
                              ? STATUS_COLORS[status] + "20"
                              : "transparent",
                            color: newBookingStatus === status
                              ? STATUS_COLORS[status]
                              : "var(--muted-foreground)",
                            fontSize: "0.8125rem",
                            fontWeight: newBookingStatus === status ? 600 : 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (newBookingStatus !== status) {
                              e.currentTarget.style.background = "var(--background)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (newBookingStatus !== status) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>

                    {/* Информация о времени и локации */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "0.625rem",
                    }}>
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Время
                    </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          {selectedSlot.time}
                        </div>
                      </div>
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
                        background: "var(--muted)",
                        border: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.375rem",
                        }}>
                          Локация
                        </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Activity className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {selectedSlot.groupLabel} · {selectedSlot.columnLabel}
                        </div>
                      </div>
                    </div>

                    {/* Поля формы */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          Клиент
                        </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Поиск клиента или введите имя"
                          value={newBookingClient}
                          onChange={(event) => {
                            const value = event.target.value;
                            setNewBookingClient(value);
                            const term = value.trim().toLowerCase();
                            if (term.length < 2) {
                              setClientSearchResults([]);
                              return;
                            }
                            const results = MOCK_CLIENTS.filter((client) =>
                              [client.name, client.phone].some((field) =>
                                field.toLowerCase().includes(term),
                              ),
                            );
                            setClientSearchResults(results);
                          }}
                            style={{
                              width: "100%",
                              padding: "0.625rem 0.875rem",
                              borderRadius: "10px",
                              border: "1.5px solid var(--card-border)",
                              background: "var(--background)",
                              fontSize: "0.875rem",
                              color: "var(--foreground)",
                              outline: "none",
                              transition: "all 0.2s ease",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "var(--card-border)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                        />
                        {clientSearchResults.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "calc(100% + 0.5rem)",
                              left: 0,
                              right: 0,
                              background: "var(--background)",
                              border: "1.5px solid var(--card-border)",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              zIndex: 10,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}>
                            {clientSearchResults.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  setNewBookingClient(client.name);
                                  setNewBookingPhone(client.phone);
                                  setClientSearchResults([]);
                                }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.75rem 1rem",
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "background 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--muted)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}>
                                    <User className="h-4 w-4" style={{ color: "#fff" }} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: "0.875rem",
                                      fontWeight: 600,
                                      color: "var(--foreground)",
                                      marginBottom: "0.125rem",
                                    }}>
                                      {client.name}
                                    </div>
                                    <div style={{
                                      fontSize: "0.75rem",
                                      color: "var(--muted-foreground)",
                                    }}>
                                      {client.phone}
                                    </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                        <button
                          type="button"
                          onClick={() => {
                            // TODO: Открыть модальное окно добавления клиента
                          }}
                          style={{
                            marginTop: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px dashed var(--card-border)",
                            background: "transparent",
                            color: "var(--muted-foreground)",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            width: "fit-content",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                            e.currentTarget.style.color = "var(--foreground)";
                            e.currentTarget.style.background = "var(--muted)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--card-border)";
                            e.currentTarget.style.color = "var(--muted-foreground)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Добавить нового клиента
                      </button>
                    </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Phone className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          Телефон
                        </label>
                      <input
                        type="tel"
                        placeholder="+998 90 000 00 00"
                        value={newBookingPhone}
                        onChange={(event) => setNewBookingPhone(event.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "10px",
                            border: "1.5px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                            transition: "all 0.2s ease",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--card-border)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                      />
                    </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <label style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <NotebookPen className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          Комментарий
                        </label>
                      <textarea
                        rows={3}
                        placeholder="Примечание для менеджеров"
                        value={newBookingNote}
                        onChange={(event) => setNewBookingNote(event.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "10px",
                            border: "1.5px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                            transition: "all 0.2s ease",
                            resize: "vertical",
                            fontFamily: "inherit",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--card-border)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div style={{
                      display: "flex",
                      gap: "0.625rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--card-border)",
                    }}>
                      <button
                        type="button"
                        onClick={handleCloseDrawer}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid var(--card-border)",
                          background: "var(--background)",
                          color: "var(--foreground)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                          e.currentTarget.style.borderColor = "var(--card-border)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateBooking}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid transparent",
                          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                          color: "#fff",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Создать запись
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
