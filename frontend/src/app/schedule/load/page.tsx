"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Calendar, ChevronLeft, ChevronRight, Clock, Search, Users, Activity, X, Phone, User, NotebookPen, Plus, Trash2, CreditCard, CheckCircle, Pencil, TrendingUp, CheckCircle2, CalendarDays, Filter, ChevronDown } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import type { EventContentArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import { toast } from "@pheralb/toast";

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

const createEmptySlots = (): OverviewSlots =>
  TIME_SLOTS.reduce((acc, time) => {
    acc[time] = null;
    return acc;
  }, {} as OverviewSlots);

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

// Все данные загружаются из API, мок данные удалены
const INITIAL_OVERVIEW_SLOTS: Record<string, CalendarEvent | null> = (() => {
  const slots: Record<string, CalendarEvent | null> = {};
  OVERVIEW_GROUPS.forEach((group) => {
    group.columns.forEach((column) => {
      TIME_SLOTS.forEach((time) => {
        const slotKey = makeOverviewSlotKey(group.key, column.key, time);
        slots[slotKey] = null;
      });
    });
  });
  return slots;
})();

// Все данные загружаются из API, мок данные удалены
const INITIAL_WEEK_SCHEDULE: Record<string, CalendarEvent | null> = {};
import { CLIENTS as MOCK_CLIENTS, type Client as MockClient } from "@/data/clients";
import {
  fetchScheduleBookings,
  createScheduleBooking,
  updateScheduleBooking,
  deleteScheduleBooking,
  fetchClientsFromApi,
  fetchTrainers,
  fetchScheduleBookingById,
  fetchCoworkingPlaces,
  fetchKidsServices,
  createPayment,
  type ScheduleBooking as ScheduleBookingType,
  type ScheduleBookingCreate,
  type ScheduleBookingUpdate,
  type Trainer,
  type CoworkingPlace,
  type KidsService,
} from "@/lib/api";

type StatusFilter = EventStatus | "all";
type CategoryFilter = "all" | "bodymind" | "pilates";
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

const categoryFilters: { value: CategoryFilter; label: string; color: string }[] = [
  { value: "all", label: "Все", color: "var(--muted-foreground)" },
  { value: "bodymind", label: "Body Mind", color: "#6366F1" },
  { value: "pilates", label: "Pilates Reformer", color: "#10B981" },
];

export default function ScheduleLoadPage() {
  const router = useRouter();
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const todayHeaderRef = useRef<HTMLDivElement>(null);
  const [weekSchedule] = useState<Record<string, CalendarEvent | null>>(() => ({
    ...INITIAL_WEEK_SCHEDULE,
  }));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("schedule");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOverviewDatePicker, setShowOverviewDatePicker] = useState(false);
  const [dateFilterOperator, setDateFilterOperator] = useState<"is" | "is-before" | "is-after" | "is-on-or-before" | "is-on-or-after" | "is-in-between">("is");
  const [showOperatorDropdown, setShowOperatorDropdown] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const operatorDropdownRef = useRef<HTMLDivElement | null>(null);
  const overviewDatePickerRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  // Все данные теперь загружаются из API, localStorage не используется
  const [overviewSlotsState, setOverviewSlotsState] = useState<Record<string, CalendarEvent | null>>(
    INITIAL_OVERVIEW_SLOTS
  );
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draftEvent, setDraftEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlotInfo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"event" | "create" | "pilates" | "bodymind" | "create-schedule">("event");
  const [selectedPilatesTrainer, setSelectedPilatesTrainer] = useState<ScheduleTrainer | null>(null);
  const [selectedBodymindGroup, setSelectedBodymindGroup] = useState<ScheduleGroup | null>(null);
  const [showTrainerSelect, setShowTrainerSelect] = useState(false);
  const [showBodymindTrainerSelect, setShowBodymindTrainerSelect] = useState(false);
  const [trainerSearchQuery, setTrainerSearchQuery] = useState("");
  const [bodymindTrainerSearchQuery, setBodymindTrainerSearchQuery] = useState("");
  const [isEditingBodymind, setIsEditingBodymind] = useState(false);
  const [isEditingPeopleCount, setIsEditingPeopleCount] = useState(false);
  const [editingBodymindName, setEditingBodymindName] = useState("");
  const [editingBodymindTrainer, setEditingBodymindTrainer] = useState("");
  const [editingBodymindCapacity, setEditingBodymindCapacity] = useState("");
  const [editingBodymindClients, setEditingBodymindClients] = useState<MockClient[]>([]); // Клиенты при редактировании
  const [showEditingBodymindClientSelect, setShowEditingBodymindClientSelect] = useState(false);
  const [editingBodymindClientSearchQuery, setEditingBodymindClientSearchQuery] = useState("");
  const [editingBodymindClientSearchResults, setEditingBodymindClientSearchResults] = useState<MockClient[]>([]);
  const [selectedScheduleCategory, setSelectedScheduleCategory] = useState<"bodymind" | "pilates" | null>(null);
  const [selectedScheduleDayKey, setSelectedScheduleDayKey] = useState<string>("");
  const [selectedScheduleTime, setSelectedScheduleTime] = useState<string>("");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>(""); // Конкретная дата выбранного дня
  const [newBodymindName, setNewBodymindName] = useState("");
  const [newBodymindTrainer, setNewBodymindTrainer] = useState("");
  const [newBodymindCapacity, setNewBodymindCapacity] = useState("10"); // Только максимальная вместимость (число)
  const [newBodymindClients, setNewBodymindClients] = useState<MockClient[]>([]); // Список выбранных клиентов
  const [showNewBodymindClientSelect, setShowNewBodymindClientSelect] = useState(false);
  const [newBodymindClientSearchQuery, setNewBodymindClientSearchQuery] = useState("");
  const [newBodymindClientSearchResults, setNewBodymindClientSearchResults] = useState<MockClient[]>([]);
  const [showNewBodymindTrainerSelect, setShowNewBodymindTrainerSelect] = useState(false);
  const [newBodymindTrainerSearchQuery, setNewBodymindTrainerSearchQuery] = useState("");
  const [newPilatesTrainer, setNewPilatesTrainer] = useState("");
  const [showNewPilatesTrainerSelect, setShowNewPilatesTrainerSelect] = useState(false);
  const [newPilatesTrainerSearchQuery, setNewPilatesTrainerSearchQuery] = useState("");
  const [newBookingStatus, setNewBookingStatus] = useState<EventStatus>("reserved");
  const [newBookingClient, setNewBookingClient] = useState("");
  const [newBookingPhone, setNewBookingPhone] = useState("");
  const [newBookingNote, setNewBookingNote] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<MockClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<MockClient | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [extendError, setExtendError] = useState<string | null>(null);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentTotal, setPaymentTotal] = useState("");
  const [paymentCash, setPaymentCash] = useState("");
  const [paymentCard, setPaymentCard] = useState("");
  const [isCashSelected, setIsCashSelected] = useState(false);
  const [isCardSelected, setIsCardSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalJustOpened, setDeleteModalJustOpened] = useState(false);
  // Услуги для коворкинга и Kids
  const [coworkingPlaces, setCoworkingPlaces] = useState<CoworkingPlace[]>([]);
  const [kidsServices, setKidsServices] = useState<KidsService[]>([]);
  const [selectedCoworkingPlace, setSelectedCoworkingPlace] = useState<CoworkingPlace | null>(null);
  const [selectedKidsService, setSelectedKidsService] = useState<KidsService | null>(null);
  const [selectedServicePrice, setSelectedServicePrice] = useState<number | null>(null);
  // Отдельное состояние для данных удаления Pilates (не зависит от drawer)
  const [pilatesDeleteData, setPilatesDeleteData] = useState<{
    bookingId: string;
    trainer: string;
    time: string;
    dayKey: string;
    date: string;
  } | null>(null);
  
  // Состояние для расписания (Body Mind и Pilates Reformer)
  type ScheduleGroup = { name: string; trainer: string; capacity: string; time: string; dayKey: string; date: string; category: "bodymind"; bookingId?: string };
  type ScheduleTrainer = { trainer: string; time: string; dayKey: string; date: string; category: "pilates"; bookingId?: string };
  
  // Функция для получения даты по dayKey и weekStart
  const getDateStringForDayKey = (dayKey: string, weekStartDate: Date): string => {
    const dayIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(dayKey);
    if (dayIndex === -1) return "";
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayIndex);
    // Используем локальную дату без конвертации в UTC, чтобы избежать проблем с часовыми поясами
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Все данные загружаются из API, мок данные удалены
  const getInitialScheduleGroups = (weekStartDate: Date): ScheduleGroup[] => {
    return [];
  };

  const getInitialScheduleTrainers = (weekStartDate: Date): ScheduleTrainer[] => {
    return [];
  };

  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>(() => getInitialScheduleGroups(getStartOfWeek(new Date())));
  const [scheduleTrainers, setScheduleTrainers] = useState<ScheduleTrainer[]>(() => getInitialScheduleTrainers(getStartOfWeek(new Date())));

  // Список всех доступных тренеров Pilates Reformer (загружается из API)
  const [availableTrainers, setAvailableTrainers] = useState<Array<{ name: string; phone: string; id?: string }>>([]);

  // Загрузка тренеров из API
  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const trainers = await fetchTrainers();
        const trainersList = trainers.map((trainer: Trainer) => ({
          name: trainer.full_name,
          phone: trainer.phone,
          id: trainer.id,
        }));
        setAvailableTrainers(trainersList);
      } catch (error) {
        console.error("Failed to load trainers:", error);
        // Оставляем мок данные при ошибке
      }
    };
    loadTrainers();
  }, []);
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
    setSelectedClient(null);
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

  // Вспомогательная функция для получения ID из booking (поддержка public_id из-за алиаса в Pydantic)
  const getBookingId = (booking: ScheduleBookingType): string => {
    const id = booking.id || (booking as any).public_id;
    if (!id) {
      console.error("Booking ID is missing:", booking);
      throw new Error("Booking ID is required but missing");
    }
    return id;
  };

  // Функция для загрузки записей из API (вынесена для переиспользования)
  const loadBookingsFromApi = useCallback(async (forOverview: boolean = false) => {
    setIsLoadingBookings(true);
      try {
        let startDate: string;
        let endDate: string;
        
        if (forOverview) {
          // Для обзора загружаем только сегодняшнюю дату
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          endDate = startDate;
        } else {
          // Для расписания загружаем всю неделю
        const weekStart = getStartOfWeek(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
          startDate = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          endDate = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
        }
        
        const bookings = await fetchScheduleBookings({
          start_date: startDate,
          end_date: endDate,
        });
        
        // Преобразуем записи из API в CalendarEvent
        const newSlots: Record<string, CalendarEvent | null> = {};
        
        // Инициализируем все слоты как null
        OVERVIEW_GROUPS.forEach((group) => {
          group.columns.forEach((column) => {
            TIME_SLOTS.forEach((time) => {
              const slotKey = makeOverviewSlotKey(group.key, column.key, time);
              newSlots[slotKey] = null;
            });
          });
        });
        
        bookings.forEach((booking) => {
          // Определяем категорию и колонку на основе данных записи
          let groupKey = "cowork";
          let columnKey = "capsule-1";
          
          if (booking.category === "Body Mind") {
            groupKey = "bodymind";
            columnKey = "body";
          } else if (booking.category === "Pilates Reformer") {
            groupKey = "bodymind";
            columnKey = "reform";
          } else if (booking.category === "Коворкинг") {
            groupKey = "cowork";
            // Определяем колонку на основе capsule_name или capsule_id
            if (booking.capsule_name) {
              const capsuleMap: Record<string, string> = {
                "Капсула 1": "capsule-1",
                "Капсула 2": "capsule-2",
                "Капсула 3": "capsule-3",
                "Капсула 4": "capsule-4",
                "Капсула 5": "capsule-5",
                "ИвентЗона": "ivent-zone",
              };
              columnKey = capsuleMap[booking.capsule_name] || booking.capsule_id || "capsule-1";
            } else if (booking.capsule_id) {
              columnKey = booking.capsule_id;
            }
          } else if (booking.category === "Eywa Kids") {
            groupKey = "kids";
            columnKey = "kids";
          }
          
          const slotKey = makeOverviewSlotKey(
            groupKey,
            columnKey,
            booking.booking_time as (typeof TIME_SLOTS)[number]
          );
          
          const statusMap: Record<string, EventStatus> = {
            "Бронь": "reserved",
            "Оплачено": "paid",
            "Свободно": "free",
          };
          
          const event: CalendarEvent = {
            id: getBookingId(booking),
            title: booking.clients.length > 0 
              ? booking.clients.map(c => c.client_name).join(", ")
              : booking.service_name || "Свободно",
            time: booking.booking_time as (typeof TIME_SLOTS)[number],
            status: statusMap[booking.status] || "free",
            color: STATUS_COLORS[statusMap[booking.status] || "free"],
            clients: booking.clients.map(c => c.client_name),
            peopleCount: booking.current_count,
            capacity: booking.max_capacity,
            phone: booking.clients[0]?.client_phone || undefined,
            note: booking.notes || undefined,
            coach: booking.trainer_name || undefined,
          };
          
          newSlots[slotKey] = event;
        });
        
        // Обновляем состояние: для обзора полностью заменяем данные, для расписания - частично
        if (forOverview) {
          // Для обзора полностью заменяем данные из API
        setOverviewSlotsState(newSlots);
        } else {
          // Для расписания обновляем только те слоты, для которых API вернул данные
          setOverviewSlotsState((prev) => {
            const updated = { ...prev };
            Object.keys(newSlots).forEach((key) => {
              if (newSlots[key] !== null) {
                updated[key] = newSlots[key];
              }
            });
            return updated;
          });
        }
        
        // Обновляем scheduleTrainers и scheduleGroups с данными из API
        const pilatesBookings = bookings.filter(b => b.category === "Pilates Reformer");
        const bodymindBookings = bookings.filter(b => b.category === "Body Mind");
        
        // Обновляем scheduleTrainers для Pilates Reformer
        const updatedTrainers: ScheduleTrainer[] = pilatesBookings.map(booking => {
          // Нормализуем дату (убираем время, если есть)
          const normalizedDate = booking.booking_date.split('T')[0];
          // Парсим дату в формате YYYY-MM-DD, используя UTC, чтобы избежать проблем с часовыми поясами
          const [year, month, day] = normalizedDate.split('-').map(Number);
          const bookingDate = new Date(Date.UTC(year, month - 1, day)); // month - 1, так как месяцы в JS начинаются с 0
          const dayIndex = bookingDate.getUTCDay(); // Используем getUTCDay() для UTC
          // Преобразуем getUTCDay() (0=воскресенье) в наш формат (monday=0)
          const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
          const dayKey = dayNames[(dayIndex + 6) % 7]; // Сдвигаем так, чтобы понедельник был первым
          
          const trainerData = {
            trainer: booking.trainer_name || "",
            time: booking.booking_time,
            dayKey: dayKey,
            date: normalizedDate, // Используем нормализованную дату
            category: "pilates" as const,
            bookingId: getBookingId(booking),
          };
          
          return trainerData;
        });
        setScheduleTrainers(updatedTrainers);
        
        // Обновляем scheduleGroups для Body Mind
        const updatedGroups: ScheduleGroup[] = bodymindBookings.map(booking => {
          // Парсим дату в формате YYYY-MM-DD, используя UTC, чтобы избежать проблем с часовыми поясами
          const normalizedDate = booking.booking_date.split('T')[0];
          const [year, month, day] = normalizedDate.split('-').map(Number);
          const bookingDate = new Date(Date.UTC(year, month - 1, day)); // month - 1, так как месяцы в JS начинаются с 0
          const dayIndex = bookingDate.getUTCDay(); // Используем getUTCDay() для UTC
          const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
          const dayKey = dayNames[(dayIndex + 6) % 7];
          
          const serviceName = booking.service_name || "";
          if (!serviceName) {
            console.warn("Body Mind booking without service_name:", booking);
          }
          
          return {
            name: serviceName,
            trainer: booking.trainer_name || "",
            capacity: `${booking.current_count}/${booking.max_capacity}`,
            time: booking.booking_time,
            dayKey: dayKey,
            date: booking.booking_date,
            category: "bodymind",
            bookingId: getBookingId(booking),
          };
        });
        setScheduleGroups(updatedGroups);
      } catch (error) {
        console.error("Failed to load bookings:", error);
        toast.error({ text: "Не удалось загрузить записи из базы данных" });
    } finally {
      setIsLoadingBookings(false);
      }
  }, [currentDate]);

  // Загрузка записей из API при изменении даты или режима просмотра
  useEffect(() => {
    loadBookingsFromApi(viewMode === "overview");
  }, [loadBookingsFromApi, viewMode]);

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedEvent(null);
    setDraftEvent(null);
    setIsEditingPeopleCount(false);
    setSelectedSlot(null);
    setSelectedPilatesTrainer(null);
    setSelectedBodymindGroup(null);
    setSelectedScheduleCategory(null);
    setSelectedScheduleDayKey("");
    setSelectedScheduleTime("");
    setSelectedScheduleDate("");
    setExtendError(null);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    setIsCashSelected(false);
    setIsCardSelected(false);
    setShowTrainerSelect(false);
    setTrainerSearchQuery("");
    setEditingBodymindName("");
    setEditingBodymindTrainer("");
    setEditingBodymindCapacity("");
    setNewBodymindName("");
    setNewBodymindTrainer("");
    setNewBodymindCapacity("");
    setNewPilatesTrainer("");
    setShowNewPilatesTrainerSelect(false);
    setNewPilatesTrainerSearchQuery("");
    resetCreateForm();
  };

  const handleOpenCreateDrawer = async (info: SelectedSlotInfo) => {
    setSelectedEvent(null);
    setDraftEvent(null);
    setSelectedSlot(info);
    setExtendError(null);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    setIsCashSelected(false);
    setIsCardSelected(false);
    resetCreateForm();
    setSelectedCoworkingPlace(null);
    setSelectedKidsService(null);
    setSelectedServicePrice(null);
    
    // Загружаем услуги в зависимости от категории
    try {
      if (info.groupKey === "cowork") {
        const places = await fetchCoworkingPlaces();
        setCoworkingPlaces(places);
        // Находим место по columnKey
        const place = places.find(p => {
          const nameMap: Record<string, string> = {
            "capsule-1": "Капсула 1",
            "capsule-2": "Капсула 2",
            "capsule-3": "Капсула 3",
            "capsule-4": "Капсула 4",
            "capsule-5": "Капсула 5",
            "ivent-zone": "ИвентЗона",
          };
          return p.name === nameMap[info.columnKey] || p.name === info.columnLabel;
        });
        if (place) {
          setSelectedCoworkingPlace(place);
          // По умолчанию используем цену за 1 час
          if (place.price_1h) {
            setSelectedServicePrice(place.price_1h);
            setPaymentTotal(place.price_1h.toLocaleString("ru-RU").replace(/,/g, " "));
          }
        }
      } else if (info.groupKey === "kids") {
        const services = await fetchKidsServices();
        setKidsServices(services);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
    }
    
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot) return;

    // Проверяем, что клиент выбран или введен
    if (!selectedClient && !newBookingClient.trim()) {
      toast.error({ text: "Выберите или введите имя клиента" });
      return;
    }

    // Проверяем, что для Kids выбрана услуга
    if (selectedSlot.groupKey === "kids" && !selectedKidsService) {
      toast.error({ text: "Выберите услугу" });
      return;
    }

    const title = selectedClient ? selectedClient.name : (newBookingClient.trim() || "Новый клиент");
    const time = selectedSlot.time as (typeof TIME_SLOTS)[number];
    const status = newBookingStatus;

    // Определяем категорию на основе выбранного слота
    let category = "Body Mind";
    if (selectedSlot.groupKey === "cowork") {
      category = "Коворкинг";
    } else if (selectedSlot.groupKey === "kids") {
      category = "Eywa Kids";
    } else if (selectedSlot.columnKey === "reform") {
      category = "Pilates Reformer";
    }

    // Определяем дату записи: для обзора используем сегодняшнюю дату
    let bookingDate: string;
    if (viewMode === "overview") {
      // Для обзора всегда используем сегодняшнюю дату
      const today = new Date();
      bookingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    } else {
      // Для расписания используем selectedDate или текущую дату
      bookingDate = selectedDate || (() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      })();
    }
    
    // Проверка: нельзя создавать записи на прошедшие даты
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDateObj = new Date(bookingDate);
    bookingDateObj.setHours(0, 0, 0, 0);
    
    if (bookingDateObj < today) {
      toast.error({ text: "Нельзя создавать записи на прошедшие даты. Выберите сегодняшнюю или будущую дату." });
      return;
    }

    // Подготавливаем данные для API
    const statusMap: Record<EventStatus, "Бронь" | "Оплачено" | "Свободно"> = {
      reserved: "Бронь",
      paid: "Оплачено",
      free: "Свободно",
    };

    // Определяем тренера для Pilates Reformer
    let trainerId: string | null = null;
    let trainerName: string | null = null;
    if (category === "Pilates Reformer" && selectedPilatesTrainer) {
      trainerName = selectedPilatesTrainer.trainer;
      // Находим ID тренера из списка
      const trainer = availableTrainers.find(t => t.name === trainerName);
      trainerId = trainer?.id || null;
    } else if (category === "Body Mind" && selectedBodymindGroup) {
      trainerName = selectedBodymindGroup.trainer;
      // Находим ID тренера из списка
      const trainer = availableTrainers.find(t => t.name === trainerName);
      trainerId = trainer?.id || null;
    }

    const bookingData: ScheduleBookingCreate = {
      booking_date: bookingDate,
      booking_time: time,
      category: category,
      service_name: category === "Body Mind" ? title : (category === "Eywa Kids" && selectedKidsService ? selectedKidsService.name : null),
      trainer_id: trainerId,
      trainer_name: trainerName,
      clients: selectedClient 
        ? [{
            client_id: selectedClient.id,
            client_name: selectedClient.name,
            client_phone: selectedClient.phone || null,
          }]
        : newBookingClient.trim()
        ? [{
            client_id: "",
            client_name: newBookingClient.trim(),
            client_phone: newBookingPhone.trim() || null,
          }]
        : [],
      max_capacity: 1,
      status: statusMap[status],
      notes: newBookingNote.trim() || null,
      capsule_id: selectedSlot.groupKey === "cowork" ? selectedSlot.columnKey : null,
      capsule_name: selectedSlot.groupKey === "cowork" ? selectedSlot.columnLabel : null,
    };

    try {
      // Создаем запись через API
      const createdBooking = await createScheduleBooking(bookingData);

      // Преобразуем ответ API в CalendarEvent
      const statusMapReverse: Record<string, EventStatus> = {
        "Бронь": "reserved",
        "Оплачено": "paid",
        "Свободно": "free",
      };

    const newEvent: CalendarEvent = {
        id: getBookingId(createdBooking),
        title: createdBooking.clients.length > 0
          ? createdBooking.clients.map(c => c.client_name).join(", ")
          : createdBooking.service_name || "Свободно",
        time: createdBooking.booking_time as (typeof TIME_SLOTS)[number],
        status: statusMapReverse[createdBooking.status] || "free",
        color: STATUS_COLORS[statusMapReverse[createdBooking.status] || "free"],
        clients: createdBooking.clients.map(c => c.client_name),
        peopleCount: createdBooking.current_count,
        capacity: createdBooking.max_capacity,
        phone: createdBooking.clients[0]?.client_phone || undefined,
        note: createdBooking.notes || undefined,
        coach: createdBooking.trainer_name || undefined,
    };

      toast.success({ text: "Запись успешно создана" });
    handleCloseDrawer();
      
      // Перезагружаем записи из API (для обзора загружаем только сегодня)
      await loadBookingsFromApi(viewMode === "overview");
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast.error({ text: "Не удалось создать запись" });
    }
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

    // Проверяем, что в следующем слоте нет другого события
    const nextSlotEvent = overviewSlotsState[nextKey];
    if (nextSlotEvent && nextSlotEvent.id !== draftEvent.id) {
      setExtendError("Нельзя продлить: следующий час уже занят другим бронированием.");
      return;
    }

    // Также проверяем, что следующая ячейка не находится в диапазоне другого события
    // Проверяем все события в этой колонке
    for (const checkTime of TIME_SLOTS) {
      if (checkTime === nextTime) continue; // Пропускаем следующее время
      const checkKey = makeOverviewSlotKey(selectedSlot.groupKey, selectedSlot.columnKey, checkTime);
      const checkEvent = overviewSlotsState[checkKey];
      // Если это другое событие (не наше) и следующее время находится в его диапазоне
      if (checkEvent && checkEvent.id !== draftEvent.id && checkEvent.time === checkTime && isTimeInEventRange(nextTime, checkEvent)) {
        setExtendError("Нельзя продлить: следующий час уже занят другим бронированием.");
        return;
      }
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
    
    // Обновляем цену для коворкинга при изменении длительности
    if (selectedSlot?.groupKey === "cowork" && selectedCoworkingPlace) {
      const hours = getTimeSlotSpan(updatedEvent.time, updatedEvent.endTime);
      let newPrice: number | null = null;
      
      if (hours === 1 && selectedCoworkingPlace.price_1h) {
        newPrice = selectedCoworkingPlace.price_1h;
      } else if (hours === 3 && selectedCoworkingPlace.price_3h) {
        newPrice = selectedCoworkingPlace.price_3h;
      } else if (hours >= 8 && selectedCoworkingPlace.price_day) {
        newPrice = selectedCoworkingPlace.price_day;
      } else if (selectedCoworkingPlace.price_1h) {
        // Если нет специальной цены, умножаем цену за час
        newPrice = selectedCoworkingPlace.price_1h * hours;
      }
      
      if (newPrice) {
        setSelectedServicePrice(newPrice);
        setPaymentTotal(newPrice.toLocaleString("ru-RU").replace(/,/g, " "));
      }
    }
  };

  const handleSaveEventChanges = async () => {
    if (!selectedEvent || !draftEvent || !selectedSlot) {
      handleCloseDrawer();
      return;
    }

    // Если время, статус и количество человек не изменились — просто закрываем
    if (
      draftEvent.time === selectedEvent.time &&
      draftEvent.endTime === selectedEvent.endTime &&
      draftEvent.status === selectedEvent.status &&
      draftEvent.peopleCount === selectedEvent.peopleCount
    ) {
      handleCloseDrawer();
      return;
    }

    // Всегда обновляем через API, если есть ID записи
    if (selectedEvent.id) {
      try {
        const statusMap: Record<EventStatus, "Бронь" | "Оплачено" | "Свободно"> = {
          reserved: "Бронь",
          paid: "Оплачено",
          free: "Свободно",
        };

        // Определяем категорию на основе выбранного слота
        let category = "Body Mind";
        if (selectedSlot.groupKey === "cowork") {
          category = "Коворкинг";
        } else if (selectedSlot.groupKey === "kids") {
          category = "Eywa Kids";
        } else if (selectedSlot.columnKey === "reform") {
          category = "Pilates Reformer";
        }

        const bookingDate = selectedDate || new Date().toISOString().split('T')[0];

        const updateData: ScheduleBookingUpdate = {
          booking_date: bookingDate,
          booking_time: draftEvent.time,
          category: category,
          service_name: category === "Body Mind" ? draftEvent.title : null,
          status: statusMap[draftEvent.status],
          max_capacity: draftEvent.capacity || 1,
          current_count: draftEvent.peopleCount || 0,
          notes: draftEvent.note || null,
          clients: draftEvent.clients?.map(name => ({
            client_id: "",
            client_name: name,
            client_phone: draftEvent.phone || null,
          })) || [],
        };

        const updatedBooking = await updateScheduleBooking(selectedEvent.id, updateData);

        // Преобразуем ответ API в CalendarEvent
        const statusMapReverse: Record<string, EventStatus> = {
          "Бронь": "reserved",
          "Оплачено": "paid",
          "Свободно": "free",
        };

        const updatedEvent: CalendarEvent = {
          id: getBookingId(updatedBooking),
          title: updatedBooking.clients.length > 0
            ? updatedBooking.clients.map(c => c.client_name).join(", ")
            : updatedBooking.service_name || "Свободно",
          time: updatedBooking.booking_time as (typeof TIME_SLOTS)[number],
          endTime: draftEvent.endTime, // Сохраняем endTime из draftEvent
          status: statusMapReverse[updatedBooking.status] || "free",
          color: STATUS_COLORS[statusMapReverse[updatedBooking.status] || "free"],
          clients: updatedBooking.clients.map(c => c.client_name),
          peopleCount: updatedBooking.current_count,
          capacity: updatedBooking.max_capacity,
          phone: updatedBooking.clients[0]?.client_phone || undefined,
          note: updatedBooking.notes || undefined,
          coach: updatedBooking.trainer_name || undefined,
        };

    const startKey = makeOverviewSlotKey(
      selectedSlot.groupKey,
      selectedSlot.columnKey,
      selectedEvent.time as (typeof TIME_SLOTS)[number],
    );

        // Не обновляем локальное состояние - данные будут перезагружены из API

        toast.success({ text: "Запись успешно обновлена" });
        handleCloseDrawer();
        
        // Перезагружаем записи из API (для обзора загружаем только сегодня)
        await loadBookingsFromApi(viewMode === "overview");
      } catch (error) {
        console.error("Failed to update booking:", error);
        toast.error({ text: "Не удалось обновить запись" });
      }
    } else {
      // Если нет ID - создаем новую запись через API
      try {
        const statusMap: Record<EventStatus, "Бронь" | "Оплачено" | "Свободно"> = {
          reserved: "Бронь",
          paid: "Оплачено",
          free: "Свободно",
        };

        let category = "Body Mind";
        if (selectedSlot.groupKey === "cowork") {
          category = "Коворкинг";
        } else if (selectedSlot.columnKey === "reform") {
          category = "Pilates Reformer";
        }

        const bookingDate = selectedDate || new Date().toISOString().split('T')[0];

        const bookingData: ScheduleBookingCreate = {
          booking_date: bookingDate,
          booking_time: draftEvent.time,
          category: category,
          service_name: category === "Body Mind" ? draftEvent.title : null,
          trainer_id: null,
          trainer_name: draftEvent.coach || null,
          clients: draftEvent.clients?.map(name => ({
            client_id: "",
            client_name: name,
            client_phone: draftEvent.phone || null,
          })) || [],
          max_capacity: draftEvent.capacity || 1,
          current_count: draftEvent.peopleCount || 0,
          status: statusMap[draftEvent.status],
          notes: draftEvent.note || null,
          capsule_id: selectedSlot.columnKey.startsWith("capsule-") ? selectedSlot.columnKey : null,
          capsule_name: selectedSlot.columnLabel || null,
        };

        await createScheduleBooking(bookingData);
        toast.success({ text: "Запись успешно создана" });
        handleCloseDrawer();
        
        // Перезагружаем записи из API
        const weekStart = getStartOfWeek(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startDate = weekStart.toISOString().split('T')[0];
        const endDate = weekEnd.toISOString().split('T')[0];
        
        const bookings = await fetchScheduleBookings({ start_date: startDate, end_date: endDate });
        const newSlots: Record<string, CalendarEvent | null> = {};
        
        OVERVIEW_GROUPS.forEach((group) => {
          group.columns.forEach((column) => {
            TIME_SLOTS.forEach((time) => {
              const slotKey = makeOverviewSlotKey(group.key, column.key, time);
              newSlots[slotKey] = null;
            });
          });
        });
        
        bookings.forEach((booking) => {
          let groupKey = "cowork";
          let columnKey = "capsule-1";
            
          if (booking.category === "Body Mind") {
            groupKey = "bodymind";
            columnKey = "body";
          } else if (booking.category === "Pilates Reformer") {
            groupKey = "bodymind";
            columnKey = "reform";
            } else if (booking.category === "Коворкинг") {
              groupKey = "cowork";
              // Определяем колонку на основе capsule_name или capsule_id
              if (booking.capsule_name) {
                const capsuleMap: Record<string, string> = {
                  "Капсула 1": "capsule-1",
                  "Капсула 2": "capsule-2",
                  "Капсула 3": "capsule-3",
                  "Капсула 4": "capsule-4",
                  "Капсула 5": "capsule-5",
                  "ИвентЗона": "ivent-zone",
                };
                columnKey = capsuleMap[booking.capsule_name] || booking.capsule_id || "capsule-1";
              } else if (booking.capsule_id) {
                columnKey = booking.capsule_id;
              }
            } else if (booking.category === "Eywa Kids") {
              groupKey = "kids";
              columnKey = "kids";
          }
          const slotKey = makeOverviewSlotKey(
            groupKey,
            columnKey,
            booking.booking_time as (typeof TIME_SLOTS)[number]
          );
          const statusMapReverse: Record<string, EventStatus> = {
            "Бронь": "reserved",
            "Оплачено": "paid",
            "Свободно": "free",
          };
          const event: CalendarEvent = {
            id: getBookingId(booking),
            title: booking.clients.length > 0 
              ? booking.clients.map(c => c.client_name).join(", ")
              : booking.service_name || "Свободно",
            time: booking.booking_time as (typeof TIME_SLOTS)[number],
            status: statusMapReverse[booking.status] || "free",
            color: STATUS_COLORS[statusMapReverse[booking.status] || "free"],
            clients: booking.clients.map(c => c.client_name),
            peopleCount: booking.current_count,
            capacity: booking.max_capacity,
            phone: booking.clients[0]?.client_phone || undefined,
            note: booking.notes || undefined,
            coach: booking.trainer_name || undefined,
          };
          newSlots[slotKey] = event;
        });
        
        setOverviewSlotsState(newSlots);
      } catch (error) {
        console.error("Failed to create booking:", error);
        toast.error({ text: "Не удалось создать запись" });
      }
    }
  };

  const handleDeleteEvent = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent || !selectedSlot) {
      setShowDeleteModal(false);
      handleCloseDrawer();
      return;
    }

    // Всегда удаляем через API, если есть ID
    if (selectedEvent.id) {
      try {
        await deleteScheduleBooking(selectedEvent.id);
        
        toast.success({ text: "Запись успешно удалена" });
        setShowDeleteModal(false);
        handleCloseDrawer();
        
        // Перезагружаем записи из API (для обзора загружаем только сегодня)
        await loadBookingsFromApi(viewMode === "overview");
      } catch (error) {
        console.error("Failed to delete booking:", error);
        toast.error({ text: "Не удалось удалить запись" });
        setShowDeleteModal(false);
      }
    } else {
      // Если нет ID - просто закрываем модальное окно
      setShowDeleteModal(false);
      handleCloseDrawer();
    }
  };

  const handleConfirmPayment = async () => {
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

    if (totalNum <= 0) {
      toast.error({ text: "Укажите сумму оплаты" });
      return;
    }

    try {
      // Определяем клиента
      const clientName = baseEvent.clients?.[0] || baseEvent.title || "Не указан";
      const clientPhone = baseEvent.phone || null;
      
      // Определяем услугу
      let serviceId: string | null = null;
      let serviceName: string | null = null;
      let serviceCategory: string | null = null;
      let paymentHours: number | null = null;
      
      if (selectedSlot.groupKey === "kids") {
        // Для Kids пытаемся использовать selectedKidsService, если есть
        if (selectedKidsService) {
          serviceId = selectedKidsService.id;
          serviceName = selectedKidsService.name;
          serviceCategory = "Kids";
        } else {
          // Если selectedKidsService не установлен, используем данные из selectedSlot
          serviceName = selectedSlot.columnLabel || "Eywa Kids";
          serviceCategory = "Kids";
          // Пытаемся загрузить услуги и найти нужную
          try {
            const services = await fetchKidsServices();
            const service = services.find(s => s.name === selectedSlot.columnLabel) || services[0];
            if (service) {
              serviceId = service.id;
              serviceName = service.name;
            }
          } catch (error) {
            console.error("Failed to load kids services:", error);
          }
        }
      } else if (selectedSlot.groupKey === "cowork") {
        // Для коворкинга вычисляем часы
        paymentHours = baseEvent.endTime 
          ? getTimeSlotSpan(baseEvent.time, baseEvent.endTime)
          : 1;
        
        // Пытаемся использовать selectedCoworkingPlace, если есть
        if (selectedCoworkingPlace) {
          serviceId = selectedCoworkingPlace.id;
          serviceName = `${selectedCoworkingPlace.name} (${paymentHours} ${paymentHours === 1 ? "час" : paymentHours < 5 ? "часа" : "часов"})`;
          serviceCategory = "Коворкинг";
        } else {
          // Если selectedCoworkingPlace не установлен, используем данные из selectedSlot
          const placeName = selectedSlot.columnLabel || "Коворкинг";
          serviceName = `${placeName} (${paymentHours} ${paymentHours === 1 ? "час" : paymentHours < 5 ? "часа" : "часов"})`;
          serviceCategory = "Коворкинг";
          // Пытаемся загрузить места и найти нужное
          try {
            const places = await fetchCoworkingPlaces();
            const nameMap: Record<string, string> = {
              "capsule-1": "Капсула 1",
              "capsule-2": "Капсула 2",
              "capsule-3": "Капсула 3",
              "capsule-4": "Капсула 4",
              "capsule-5": "Капсула 5",
              "ivent-zone": "ИвентЗона",
            };
            const place = places.find(p => 
              p.name === nameMap[selectedSlot.columnKey] || 
              p.name === selectedSlot.columnLabel
            );
            if (place) {
              serviceId = place.id;
            }
          } catch (error) {
            console.error("Failed to load coworking places:", error);
          }
        }
      }

      // Создаем оплату через API
      await createPayment({
        client_id: selectedClient?.id || null,
        client_name: clientName,
        client_phone: clientPhone || null,
        service_id: serviceId || null,
        service_name: serviceName || "Услуга",
        service_category: serviceCategory || null,
        total_amount: totalNum,
        cash_amount: cashNum,
        transfer_amount: cardNum,
        quantity: 1,
        hours: paymentHours,
        comment: baseEvent.note || null,
        status: "completed",
      });

      // Обновляем статус записи через API
      if (baseEvent.id) {
        try {
          await updateScheduleBooking(baseEvent.id, {
            status: "Оплачено",
          });
        } catch (error) {
          console.error("Failed to update booking status:", error);
        }
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

      return updated;
    });

    setSelectedEvent(updatedEvent);
    setDraftEvent(updatedEvent);
    setIsPaymentMode(false);
    setPaymentTotal("");
    setPaymentCash("");
    setPaymentCard("");
    setIsCashSelected(false);
    setIsCardSelected(false);
      
      toast.success({ text: "Оплата успешно создана" });
      
      // Перезагружаем записи из API (для обзора загружаем только сегодня)
      await loadBookingsFromApi(viewMode === "overview");
      
    handleCloseDrawer();
    } catch (error) {
      console.error("Failed to create payment:", error);
      toast.error({ text: "Не удалось создать оплату" });
    }
  };

  // Логирование состояния модального окна удаления для Pilates
  useEffect(() => {
    if (drawerMode === "pilates") {
    }
  }, [showDeleteModal, drawerMode]);

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

  // Обработчик закрытия календаря в режиме обзора при клике вне его
  useEffect(() => {
    if (!showOverviewDatePicker) return;
    const handler = (event: MouseEvent) => {
      if (
        overviewDatePickerRef.current &&
        !overviewDatePickerRef.current.contains(event.target as Node)
      ) {
        setShowOverviewDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOverviewDatePicker]);

  // Удаляем этот useEffect, так как логика загрузки из localStorage теперь в useState
  // useEffect(() => {
  //   // Логика загрузки из localStorage перенесена в useState
  // }, []);

  useEffect(() => {
    if (!calendarRef.current) return;
    const api = calendarRef.current.getApi();
    const currentApiDate = api.getDate();
    if (currentApiDate.toDateString() !== currentDate.toDateString()) {
      // Используем setTimeout, чтобы избежать вызова flushSync во время рендеринга
      setTimeout(() => {
      api.gotoDate(currentDate);
      }, 0);
    }
  }, [currentDate]);

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

  // Автоматическая прокрутка к сегодняшнему дню при загрузке
  useEffect(() => {
    if (viewMode === "schedule" && todayHeaderRef.current && scheduleContainerRef.current) {
      // Небольшая задержка, чтобы DOM успел отрендериться
      setTimeout(() => {
        todayHeaderRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 100);
    }
  }, [viewMode, weekStart]);

  // Фильтруем данные по текущей неделе
  const filteredScheduleGroups = useMemo(() => {
    const weekStartString = weekStart.toISOString().split('T')[0].substring(0, 10); // YYYY-MM-DD
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndString = weekEnd.toISOString().split('T')[0].substring(0, 10);
    
    return scheduleGroups.filter(group => {
      const groupDate = group.date;
      return groupDate >= weekStartString && groupDate <= weekEndString;
    });
  }, [scheduleGroups, weekStart]);

  const filteredScheduleTrainers = useMemo(() => {
    const weekStartString = weekStart.toISOString().split('T')[0].substring(0, 10); // YYYY-MM-DD
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndString = weekEnd.toISOString().split('T')[0].substring(0, 10);
    
    return scheduleTrainers.filter(trainer => {
      const trainerDate = trainer.date;
      return trainerDate >= weekStartString && trainerDate <= weekEndString;
    });
  }, [scheduleTrainers, weekStart]);

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
    const weeks: Array<Array<{ day: number; date: Date } | null>> = [];
    let dayCounter = 1 - startWeekDay;

    for (let week = 0; week < 6; week++) {
      const weekDays: Array<{ day: number; date: Date } | null> = [];
      for (let day = 0; day < 7; day++, dayCounter++) {
        if (dayCounter < 1 || dayCounter > daysInMonth) {
          weekDays.push(null);
        } else {
          const date = new Date(year, month, dayCounter);
          weekDays.push({ day: dayCounter, date });
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
        const slots = {} as OverviewSlots;
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
            if (event) {
            const matches =
              event.title.toLowerCase().includes(query) ||
              event.clients?.some((client) => client.toLowerCase().includes(query)) ||
              (event.coach && event.coach.toLowerCase().includes(query));
            if (matches) {
              acc[time as (typeof TIME_SLOTS)[number]] = event;
              }
            }
            return acc;
          }, createEmptySlots());
          return { ...column, slots: filteredSlots };
        }),
      }));
    }

    if (statusFilter !== "all") {
      filtered = filtered.map((group) => ({
        ...group,
        columns: group.columns.map((column) => {
          const filteredSlots = Object.entries(column.slots).reduce<OverviewSlots>((acc, [time, event]) => {
            if (event && event.status === statusFilter) {
              acc[time as (typeof TIME_SLOTS)[number]] = event;
            }
            return acc;
          }, createEmptySlots());
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

  // Swipe handlers для навигации по неделям
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);
  const swipeThreshold = 50; // Минимальное расстояние для свайпа

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Предотвращаем скролл страницы во время свайпа
    if (swipeStartX.current !== null && swipeStartY.current !== null) {
      const deltaX = Math.abs(e.touches[0].clientX - swipeStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - swipeStartY.current);
      
      // Если горизонтальное движение больше вертикального, предотвращаем скролл
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - swipeStartX.current;
    const deltaY = Math.abs(endY - swipeStartY.current);

    // Проверяем, что это горизонтальный свайп (не вертикальный скролл)
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0) {
        // Свайп вправо - предыдущая неделя
        handleDateShift(-7);
      } else {
        // Свайп влево - следующая неделя
        handleDateShift(7);
      }
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
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
    setShowOverviewDatePicker(false);
  };

  const renderEventContent = useCallback((arg: EventContentArg) => {
    // Safely extract text from event
    let displayText = "";
    try {
      if (arg.event?.title) {
        displayText = String(arg.event.title);
      } else if (arg.text) {
        // arg.text can be string, HTMLElement, or object
        if (typeof arg.text === "string") {
          displayText = arg.text;
        } else if (arg.text instanceof HTMLElement) {
          displayText = arg.text.textContent || arg.text.innerText || "";
        } else {
          displayText = String(arg.text);
        }
      }
    } catch (e) {
      console.warn("Error extracting text from event:", e);
      displayText = "";
    }
    
    return (
      <div className="h-full w-full flex items-center justify-center p-1">
        <span className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>
          {displayText}
        </span>
      </div>
    );
  }, []);

  // Статистика для KPI карточек
  const stats = useMemo(() => {
    const allEvents = Object.values(overviewSlotsState).filter(Boolean) as CalendarEvent[];
    const total = allEvents.length;
    const paid = allEvents.filter((e) => e.status === "paid").length;
    const reserved = allEvents.filter((e) => e.status === "reserved").length;
    const free = allEvents.filter((e) => e.status === "free").length;
    
    return {
      total,
      paid,
      reserved,
      free,
      conversionRate: total > 0 ? ((paid / total) * 100).toFixed(1) : "0",
    };
  }, [overviewSlotsState]);

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
                  <CalendarDays className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#6366F1" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Всего бронирований</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.total}</p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Активные записи</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#10B981" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Оплачено</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.paid}</p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>{stats.conversionRate}% конверсия</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                  <Clock className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#F59E0B" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Бронь</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.reserved}</p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Ожидают оплаты</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
                  <Activity className="h-4 w-4 md:h-5 md:w-5" style={{ color: "#10B981" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate" style={{ color: "var(--muted-foreground)" }}>Свободно</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{stats.free}</p>
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span style={{ color: "var(--muted-foreground)" }}>Доступные слоты</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {viewMode === "overview" ? (
              // Фильтры статусов для режима "Обзор"
              statusFilters.map((filter) => (
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
              ))
            ) : (
              // Фильтры категорий для режима "Расписание"
              categoryFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    categoryFilter === filter.value ? "border-2" : "border"
                  }`}
                style={{
                    borderColor: categoryFilter === filter.value ? filter.color : "var(--card-border)",
                    background: categoryFilter === filter.value 
                      ? filter.value === "bodymind" 
                        ? "rgba(99, 102, 241, 0.1)" 
                        : filter.value === "pilates"
                        ? "rgba(16, 185, 129, 0.1)"
                        : "var(--muted)"
                      : "var(--panel)",
                    color: categoryFilter === filter.value ? filter.color : "var(--foreground)",
                  }}
                  onClick={() => setCategoryFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))
            )}
            </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter Button */}
            <div className="relative" ref={datePickerRef}>
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--card-border)",
                  color: "var(--foreground)",
                }}
                onClick={() => {
                  setShowDatePicker((prev) => !prev);
                  setShowOverviewDatePicker(false);
                }}
              >
                <Filter className="h-4 w-4" />
                <span>
                  Дата: {startDate ? startDate.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                  year: "numeric",
                  }) : "Выберите дату"}
                  {endDate && ` - ${endDate.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`}
                </span>
              </button>
              
              {showDatePicker && (
                <div 
                  className="absolute right-0 mt-2 w-[600px] rounded-xl border shadow-lg z-50"
                  style={{ 
                    background: "#FFFFFF", 
                    borderColor: "var(--card-border)",
                    animation: "fadeInSlideDown 0.2s ease-out",
                  }}
                >
                  {/* Header with buttons */}
                  <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
                    <div className="flex items-center gap-2">
                    <button
                      type="button"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                        style={{
                          background: "var(--panel)",
                          borderColor: "var(--card-border)",
                          color: "var(--foreground)",
                        }}
                        onClick={() => {
                          if (startDate) {
                            setCurrentDate(startDate);
                          }
                        }}
                      >
                        Дата начала
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      
                      <div className="relative" ref={operatorDropdownRef}>
                        <button
                          type="button"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                          style={{
                            background: "var(--panel)",
                            borderColor: "var(--card-border)",
                            color: "var(--foreground)",
                          }}
                          onClick={() => setShowOperatorDropdown(!showOperatorDropdown)}
                        >
                          {dateFilterOperator === "is" && "Равно"}
                          {dateFilterOperator === "is-before" && "До"}
                          {dateFilterOperator === "is-after" && "После"}
                          {dateFilterOperator === "is-on-or-before" && "Равно или до"}
                          {dateFilterOperator === "is-on-or-after" && "Равно или после"}
                          {dateFilterOperator === "is-in-between" && "Между"}
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {showOperatorDropdown && (
                          <div 
                            className="absolute left-0 mt-1 w-48 rounded-lg border shadow-lg z-10"
                            style={{ 
                              background: "#FFFFFF", 
                              borderColor: "var(--card-border)",
                              animation: "fadeInSlideDown 0.15s ease-out",
                            }}
                          >
                            {[
                              { value: "is", label: "Равно" },
                              { value: "is-before", label: "До" },
                              { value: "is-after", label: "После" },
                              { value: "is-on-or-before", label: "Равно или до" },
                              { value: "is-on-or-after", label: "Равно или после" },
                              { value: "is-in-between", label: "Между" },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                style={{
                                  color: dateFilterOperator === option.value ? "var(--foreground)" : "var(--muted-foreground)",
                                  background: dateFilterOperator === option.value ? "var(--muted)" : "transparent",
                                }}
                                onClick={() => {
                                  setDateFilterOperator(option.value as any);
                                  setShowOperatorDropdown(false);
                                }}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                      onClick={() => {
                        setStartDate(null);
                        setEndDate(null);
                        setShowDatePicker(false);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                  
                  {/* Calendar and dropdown side by side */}
                  <div className="flex">
                    {/* Calendar */}
                    <div className="flex-1 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
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
                          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                      onClick={() => handleMonthNavigate(1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                      <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>
                        {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((label) => (
                      <span key={label} className="text-center">
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {calendarWeeks.map((week, weekIndex) =>
                      week.map((dayData, dayIndex) => {
                        if (!dayData) {
                          return <span key={`${weekIndex}-${dayIndex}`} className="h-9" />;
                        }
                        const { day, date } = dayData;
                            const isActive = startDate && date.toDateString() === startDate.toDateString();
                            const isEndDate = endDate && date.toDateString() === endDate.toDateString();
                            const isInRange = startDate && endDate && date >= startDate && date <= endDate;
                            
                        return (
                          <button
                            key={`${weekIndex}-${dayIndex}`}
                            type="button"
                                className={`h-9 rounded transition-colors ${
                                  isActive || isEndDate ? "font-semibold" : "hover:opacity-80"
                            }`}
                            style={{
                                  background: isActive || isEndDate ? "#000000" : isInRange ? "rgba(0, 0, 0, 0.1)" : "transparent",
                                  color: isActive || isEndDate ? "#FFFFFF" : "var(--muted-foreground)",
                            }}
                                onClick={() => {
                                  if (dateFilterOperator === "is-in-between") {
                                    if (!startDate || (startDate && endDate)) {
                                      setStartDate(date);
                                      setEndDate(null);
                                    } else {
                                      if (date > startDate) {
                                        setEndDate(date);
                                      } else {
                                        setEndDate(startDate);
                                        setStartDate(date);
                                      }
                                    }
                                  } else {
                                    setStartDate(date);
                                    setEndDate(null);
                                  }
                                  setCurrentDate(date);
                                }}
                          >
                            {day}
                          </button>
                        );
                      }),
                    )}
                      </div>
                    </div>
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
          <div className="flex items-center gap-2">
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
        </div>
      </Card>

      {/* Календарь */}
        {viewMode === "overview" ? (
          <div className="space-y-4">
            {/* Заголовок с сегодняшней датой */}
            <Card>
              <div
                className="flex items-center justify-between gap-4"
                style={{ touchAction: "pan-y" }}
              >
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                    Обзор дня
                  </p>
                  <h3 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                    {currentDate.toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
          </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onClick={() => {
                      const prevDay = new Date(currentDate);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setCurrentDate(prevDay);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:opacity-80"
                    style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                    onClick={() => {
                      const nextDay = new Date(currentDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setCurrentDate(nextDay);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="relative" ref={overviewDatePickerRef}>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
                      style={{ borderColor: "var(--card-border)", color: "var(--foreground)" }}
                              onClick={() => {
                        setCurrentDate(new Date());
                        setShowOverviewDatePicker(true);
                        setShowDatePicker(false); // Закрываем верхний календарь если открыт
                      }}
                    >
                      Сегодня
                    </button>
                    {showOverviewDatePicker && (
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
                            week.map((dayData, dayIndex) => {
                              if (!dayData) {
                                return <span key={`${weekIndex}-${dayIndex}`} className="h-9" />;
                              }
                              const { day, date } = dayData;
                              const isActive = date.toDateString() === currentDate.toDateString();
                        return (
                                <button
                                  key={`${weekIndex}-${dayIndex}`}
                                  type="button"
                                  className={`h-9 rounded-xl transition-colors ${
                                    isActive ? "font-semibold" : "hover:opacity-80"
                                  }`}
                                style={{
                                    background: isActive ? "var(--muted)" : "transparent",
                                    color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                                  }}
                                  onClick={() => handleDateSelect(day)}
                                >
                                  {day}
                                </button>
                              );
                            }),
                                            )}
                                    </div>
                                      </div>
              )}
            </div>
              </div>
          </div>
            </Card>

            {/* Таблица обзора в стиле расписания */}
          <div className="p-4 overflow-x-auto">
            {(() => {
              // Получаем dayKey для сегодняшнего дня в формате, который используется в данных ("monday", "tuesday", etc.)
              const getDayKeyFromDate = (date: Date): string => {
                const dayOfWeek = date.getDay();
                // Преобразуем день недели в полное название дня (как в данных)
                const dayMap: Record<number, string> = {
                  0: "sunday",    // Воскресенье
                  1: "monday",    // Понедельник
                  2: "tuesday",   // Вторник
                  3: "wednesday", // Среда
                  4: "thursday",  // Четверг
                  5: "friday",    // Пятница
                  6: "saturday",  // Суббота
                };
                return dayMap[dayOfWeek] || "monday";
              };

              const formatDate = (date: Date) => {
                const day = date.getDate();
                const month = date.toLocaleDateString("ru-RU", { month: "long" });
                return `${day} ${month}`;
              };

              // Получаем dayKey для текущей даты
              const todayDayKey = getDayKeyFromDate(currentDate);
              
              // Маппинг dayKey на русские названия дней (полные названия, как в данных)
              const dayKeyToLabel: Record<string, string> = {
                monday: "Понедельник",
                tuesday: "Вторник",
                wednesday: "Среда",
                thursday: "Четверг",
                friday: "Пятница",
                saturday: "Суббота",
                sunday: "Воскресенье",
              };

              // Структура данных для одного дня (сегодня)
              const overviewDays = [
                { key: todayDayKey, label: dayKeyToLabel[todayDayKey] || "Сегодня", date: new Date(currentDate) },
              ] as const;

              // Колонки: коворкинг, Body Mind по дням, Pilates Reformer по дням, Kids
              const coworkColumns = OVERVIEW_GROUPS.find(g => g.key === "cowork")?.columns || [];
              const kidsColumns = OVERVIEW_GROUPS.find(g => g.key === "kids")?.columns || [];
              
              // Body Mind и Pilates Reformer по дням недели
              const bodymindColumns = overviewDays.map(day => ({
                key: `${day.key}-bodymind`,
                label: "Body Mind",
                dayKey: day.key,
                category: "bodymind" as const,
                type: "schedule" as const,
              }));
              
              const pilatesColumns = overviewDays.map(day => ({
                key: `${day.key}-pilates`,
                label: "Pilates Reformer",
                dayKey: day.key,
                category: "pilates" as const,
                type: "schedule" as const,
              }));

              const overviewColumns = [
                // Коворкинг
                ...coworkColumns.map(col => ({
                  key: col.key,
                  label: col.label,
                  capacityLabel: col.capacityLabel,
                  type: "cowork" as const,
                })),
                // Body Mind по дням
                ...bodymindColumns,
                // Pilates Reformer по дням
                ...pilatesColumns,
                // Kids
                ...kidsColumns.map(col => ({
                  key: col.key,
                  label: col.label,
                  capacityLabel: col.capacityLabel,
                  type: "kids" as const,
                })),
              ];

              // Создаем template для grid: 1 колонка для времени + колонки для всех групп
              const overviewTemplate = `80px repeat(${overviewColumns.length}, 200px)`;

              // Вычисляем начальные колонки для групп
              const coworkStartColumn = 2;
              const bodymindStartColumn = coworkStartColumn + coworkColumns.length;
              const pilatesStartColumn = bodymindStartColumn + bodymindColumns.length;
              const kidsStartColumn = pilatesStartColumn + pilatesColumns.length;

              return (
                <div 
                  className="schedule-load-overview" 
                  style={{ 
                    gridTemplateColumns: overviewTemplate, 
                    minWidth: "fit-content",
                    animation: "fadeInSlideDown 0.3s ease-out",
                  }}
                >
                  {/* Пустая ячейка в первом ряду */}
                  <div className="schedule-load-group-header" style={{ gridColumn: 1 }}></div>
                  
                  {/* Заголовок группы Коворкинг */}
                  {coworkColumns.length > 0 && (
                    <div
                    className="schedule-load-group-header"
                      style={{ gridColumn: `${coworkStartColumn} / span ${coworkColumns.length}` }}
                    >
                      Коворкинг
                    </div>
                  )}

                  {/* Заголовок группы Body Mind */}
                  {bodymindColumns.length > 0 && (
                    <div
                      className="schedule-load-group-header"
                      style={{ gridColumn: `${bodymindStartColumn} / span ${bodymindColumns.length}` }}
                    >
                      Body & Mind
                    </div>
                  )}

                  {/* Заголовок группы Pilates Reformer */}
                  {pilatesColumns.length > 0 && (
                    <div
                      className="schedule-load-group-header"
                      style={{ gridColumn: `${pilatesStartColumn} / span ${pilatesColumns.length}` }}
                    >
                      Pilates Reformer
                    </div>
                  )}

                  {/* Заголовок группы Kids */}
                  {kidsColumns.length > 0 && (
                    <div
                      className="schedule-load-group-header"
                      style={{ gridColumn: `${kidsStartColumn} / span ${kidsColumns.length}` }}
                    >
                      Eywa Kids
                    </div>
                  )}

                  {/* Заголовок времени */}
              <div className="schedule-load-column-header schedule-load-column-header--time" style={{ gridColumn: 1 }}>
                <span>Время</span>
                </div>

                  {/* Заголовки колонок */}
                  {overviewColumns.map((column, columnIndex) => {
                    const isLastColumn = columnIndex === overviewColumns.length - 1;
                    const isSchedule = column.type === "schedule";
                    const isBodymind = isSchedule && column.category === "bodymind";
                    const isPilates = isSchedule && column.category === "pilates";
                    const isCowork = column.type === "cowork";
                    const isKids = column.type === "kids";
                  
                  return (
                    <div
                        key={column.key}
                        className={`schedule-load-column-header ${isLastColumn ? "schedule-load-column-header--no-right-border" : ""}`}
                        style={{
                          gridColumn: 2 + columnIndex,
                          background: isBodymind ? "rgba(99, 102, 241, 0.06)" : isPilates ? "rgba(16, 185, 129, 0.06)" : undefined,
                          color: "var(--foreground)",
                        }}
                      >
                        {isSchedule && "dayKey" in column ? (
                      <span>{column.label}</span>
                        ) : (
                          <>
                            <span>{column.label}</span>
                            {"capacityLabel" in column && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{column.capacityLabel}</span>
                            )}
                          </>
                        )}
                      </div>
                  );
              })}

                  {/* Ячейки времени и данных */}
              {TIME_SLOTS.map((time) => {
                return (
                  <Fragment key={time}>
                    <div className="schedule-load-time-cell" style={{ gridColumn: 1 }}>
                      {time}
                </div>
                    {overviewColumns.map((column, columnIndex) => {
                        const cellColumn = 2 + columnIndex;
                        const isSchedule = column.type === "schedule";
                        const isBodymind = isSchedule && column.category === "bodymind";
                        const isPilates = isSchedule && column.category === "pilates";
                        const isCowork = column.type === "cowork";
                        const isKids = column.type === "kids";
                        
                        // Для расписания - получаем данные
                        // Используем дату для соответствующего дня недели
                        let scheduleData: ScheduleGroup | ScheduleTrainer | null = null;
                        if (isSchedule && "dayKey" in column) {
                          const dayKey = column.dayKey;
                          // Получаем дату для соответствующего дня недели в формате YYYY-MM-DD
                          const dateForDay = getDateStringForDayKey(dayKey, weekStart);
                          
                          if (isBodymind) {
                            // Ищем напрямую в scheduleGroups по dayKey, time, категории и дате
                            scheduleData = scheduleGroups.find(
                              g => g.dayKey === dayKey && 
                                   g.time === time && 
                                   g.category === "bodymind" &&
                                   g.date === dateForDay
                            ) || null;
                          } else if (isPilates) {
                            // Ищем напрямую в scheduleTrainers по dayKey, time, категории и дате
                            // Нормализуем дату для сравнения (убираем возможные различия в формате)
                            const normalizedDateForDay = dateForDay.trim();
                            
                            // Отладочная информация - выводим только для первой ячейки, чтобы не засорять консоль
                            if (time === TIME_SLOTS[0] && columnIndex === 0) {
                              const allPilates = scheduleTrainers.filter(t => t.category === "pilates");
                            }
                            
                            scheduleData = scheduleTrainers.find(
                              t => {
                                const normalizedTrainerDate = (t.date || "").trim();
                                const matches = t.dayKey === dayKey && 
                                   t.time === time && 
                                   t.category === "pilates" &&
                                   normalizedTrainerDate === normalizedDateForDay;
                                return matches;
                              }
                            ) || null;
                            
                          }
                        }
                        
                        // Для коворкинга и Kids - получаем данные из overviewSlotsState
                        let coworkEvent: CalendarEvent | null = null;
                        let isInEventRange = false;
                        if (isCowork || isKids) {
                          const overviewCellKey = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, time);
                          coworkEvent = overviewSlotsState[overviewCellKey] || null;
                          
                          // Проверяем, не находимся ли мы внутри диапазона другого события
                          if (!coworkEvent) {
                            // Проверяем все временные слоты в этой колонке, чтобы найти событие, которое включает текущее время
                            for (const checkTime of TIME_SLOTS) {
                              if (checkTime === time) continue; // Пропускаем текущее время
                              const checkKey = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, checkTime);
                              const checkEvent = overviewSlotsState[checkKey];
                              // Проверяем только события, которые начинаются в checkTime (начало события)
                              if (checkEvent && checkEvent.time === checkTime && isTimeInEventRange(time, checkEvent)) {
                                isInEventRange = true;
                                break;
                              }
                            }
                          }
                        }
                        
                        // Проверяем фильтры для коворкинга и Kids
                        // В "Обзоре" показываем события, если они есть
                        let passesFilters = true;
                        if (isCowork || isKids) {
                          if (!coworkEvent) {
                            passesFilters = false;
                          } else {
                            // Проверяем поиск
                            if (searchQuery) {
                              const query = searchQuery.toLowerCase();
                              const matchesSearch = 
                                coworkEvent.clients?.some(c => c.toLowerCase().includes(query)) ||
                                coworkEvent.title.toLowerCase().includes(query);
                              if (!matchesSearch) {
                                passesFilters = false;
                              }
                            }
                            // Проверяем фильтр статуса
                            if (statusFilter !== "all" && statusFilter !== coworkEvent.status) {
                              passesFilters = false;
                            }
                          }
                        }
                        
                        // Для расписания - отображаем данные из scheduleData
                        if (scheduleData && isSchedule && passesFilters) {
                          const bodymindColor = "#6366F1";
                          const pilatesColor = "#10B981";
                          const eventColor = isBodymind ? bodymindColor : pilatesColor;
                          const dayKey = "dayKey" in column ? column.dayKey : "mon";
                          
                          return (
                            <div
                              key={`${column.key}-${time}`}
                              className="schedule-load-cell schedule-load-cell--event"
                              draggable={isBodymind}
                              onClick={() => {
                                if (isBodymind) {
                                  const group = scheduleData as ScheduleGroup;
                                  setSelectedBodymindGroup(group);
                                  setIsEditingBodymind(false);
                                  setDrawerMode("bodymind");
                                  setIsDrawerOpen(true);
                                } else {
                                  const trainerData = scheduleData as ScheduleTrainer;
                                  setSelectedPilatesTrainer(trainerData);
                                  setDrawerMode("pilates");
                                  setIsDrawerOpen(true);
                                }
                              }}
                              onDragStart={isBodymind ? (e) => {
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify({
                                    type: "bodymind",
                                    data: scheduleData,
                                    dayKey: dayKey,
                                    time: time,
                                  }),
                                );
                                e.dataTransfer.effectAllowed = "move";
                                e.currentTarget.style.opacity = "0.5";
                              } : undefined}
                              onDragEnd={isBodymind ? (e) => {
                                e.currentTarget.style.opacity = "1";
                              } : undefined}
                              style={{
                                gridColumn: cellColumn,
                                background: "var(--panel)",
                                borderLeft: `4px solid ${eventColor}`,
                                borderTop: "1px solid var(--card-border)",
                                borderBottom: "1px solid var(--card-border)",
                                borderRight: "1px solid var(--card-border)",
                                cursor: isBodymind ? "move" : "pointer",
                                borderRadius: "8px",
                                margin: "2px 4px",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <div className="schedule-load-event-content" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100%", justifyContent: "space-between", gap: "0.375rem", padding: "0.5rem" }}>
                                <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "0.375rem", overflow: "hidden", minHeight: 0 }}>
                                  {isBodymind ? (
                                    <>
                                      <div className="schedule-load-event-name" style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "var(--foreground)", margin: 0, flexShrink: 0 }}>
                                        {(scheduleData as ScheduleGroup).name}
                                      </div>
                                      <div className="schedule-load-event-meta" style={{ margin: 0, gap: "0.5rem", fontSize: "0.625rem", display: "flex", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                                        <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--foreground)", flexShrink: 0 }}>
                                          <Clock className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }} />
                                          <span style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>{time}</span>
                                        </div>
                                        <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--foreground)", flexShrink: 0 }}>
                                          <User className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }} />
                                          <span style={{ color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px" }}>{(scheduleData as ScheduleGroup).trainer}</span>
                                        </div>
                                        <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--foreground)", flexShrink: 0 }}>
                                          <Users className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }} />
                                          <span style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>{(scheduleData as ScheduleGroup).capacity}</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="schedule-load-event-name" style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: "1.3", color: "var(--foreground)", margin: 0, flexShrink: 0 }}>
                                        {(scheduleData as ScheduleTrainer).trainer}
                                      </div>
                                      <div className="schedule-load-event-meta" style={{ margin: 0, gap: "0.5rem", fontSize: "0.625rem", display: "flex", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                                        <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--foreground)", flexShrink: 0 }}>
                                          <Clock className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem", color: "var(--muted-foreground)", flexShrink: 0 }} />
                                          <span style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>{time}</span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div style={{ 
                                  fontSize: "0.5625rem", 
                                  color: eventColor, 
                                  fontWeight: 600, 
                                  marginTop: "auto", 
                                  paddingTop: "0.375rem",
                                  textTransform: "uppercase",
                                  flexShrink: 0,
                                  lineHeight: "1.2",
                                  whiteSpace: "nowrap",
                                  letterSpacing: "0.05em"
                                }}>
                                  {isBodymind ? "Body Mind" : "Pilates Reformer"}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Для коворкинга и Kids - отображаем события
                        // Рендерим карточку только в первой ячейке события
                        if ((isCowork || isKids) && coworkEvent && passesFilters && time === coworkEvent.time) {
                          const span = getTimeSlotSpan(coworkEvent.time, coworkEvent.endTime);
                          const timeRange = coworkEvent.endTime
                            ? `${coworkEvent.time}–${coworkEvent.endTime}`
                            : coworkEvent.time;
                          const clientName =
                            coworkEvent.clients && coworkEvent.clients.length > 0
                              ? coworkEvent.clients[0]
                              : coworkEvent.title;

                          // Вычисляем количество часов
                          const calculateHours = (startTime: string, endTime?: string): number => {
                            if (!endTime) return 1; // Если нет endTime, считаем 1 час
                            
                            const [startHours, startMinutes] = startTime.split(':').map(Number);
                            const [endHours, endMinutes] = endTime.split(':').map(Number);
                            
                            const startTotalMinutes = startHours * 60 + startMinutes;
                            const endTotalMinutes = endHours * 60 + endMinutes;
                            
                            const diffMinutes = endTotalMinutes - startTotalMinutes;
                            const hours = diffMinutes / 60;
                            
                            return Math.round(hours * 10) / 10; // Округляем до 1 знака после запятой
                          };

                          const hoursCount = calculateHours(coworkEvent.time, coworkEvent.endTime);

                          return (
                            <div
                              key={`${column.key}-${time}`}
                            draggable
                            onClick={async () => {
                              const slotInfo: SelectedSlotInfo = {
                                  groupKey: isCowork ? "cowork" : "kids",
                                  groupLabel: isCowork ? "Коворкинг" : "Eywa Kids",
                                columnKey: column.key,
                                columnLabel: column.label,
                                  time: coworkEvent.time,
                              };
                              setSelectedSlot(slotInfo);
                                setSelectedEvent(coworkEvent);
                                setDraftEvent(coworkEvent);
                              
                              // Загружаем данные об услуге для правильного отображения при оплате
                              try {
                                if (isCowork) {
                                  const places = await fetchCoworkingPlaces();
                                  const nameMap: Record<string, string> = {
                                    "capsule-1": "Капсула 1",
                                    "capsule-2": "Капсула 2",
                                    "capsule-3": "Капсула 3",
                                    "capsule-4": "Капсула 4",
                                    "capsule-5": "Капсула 5",
                                    "ivent-zone": "ИвентЗона",
                                  };
                                  const place = places.find(p => 
                                    p.name === nameMap[column.key] || 
                                    p.name === column.label
                                  );
                                  if (place) {
                                    setSelectedCoworkingPlace(place);
                                    // Устанавливаем цену на основе длительности
                                    const hours = coworkEvent.endTime 
                                      ? getTimeSlotSpan(coworkEvent.time, coworkEvent.endTime)
                                      : 1;
                                    if (hours === 1 && place.price_1h) {
                                      setSelectedServicePrice(place.price_1h);
                                      setPaymentTotal(place.price_1h.toLocaleString("ru-RU").replace(/,/g, " "));
                                    } else if (hours === 3 && place.price_3h) {
                                      setSelectedServicePrice(place.price_3h);
                                      setPaymentTotal(place.price_3h.toLocaleString("ru-RU").replace(/,/g, " "));
                                    } else if (hours >= 8 && place.price_day) {
                                      setSelectedServicePrice(place.price_day);
                                      setPaymentTotal(place.price_day.toLocaleString("ru-RU").replace(/,/g, " "));
                                    } else if (place.price_1h) {
                                      setSelectedServicePrice(place.price_1h * hours);
                                      setPaymentTotal((place.price_1h * hours).toLocaleString("ru-RU").replace(/,/g, " "));
                                    }
                                  }
                                } else if (isKids) {
                                  const services = await fetchKidsServices();
                                  const service = services.find(s => s.name === column.label) || services[0];
                                  if (service) {
                                    setSelectedKidsService(service);
                                    setSelectedServicePrice(service.price);
                                    setPaymentTotal(service.price.toLocaleString("ru-RU").replace(/,/g, " "));
                                  }
                                }
                              } catch (error) {
                                console.error("Failed to load service data:", error);
                              }
                              
                              setDrawerMode("event");
                              setIsDrawerOpen(true);
                            }}
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({
                                    event: coworkEvent,
                                    groupKey: isCowork ? "cowork" : "kids",
                                  columnKey: column.key,
                                  time: time,
                                }),
                              );
                              e.dataTransfer.effectAllowed = "move";
                              e.currentTarget.style.opacity = "0.5";
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                              style={{
                              gridColumn: cellColumn,
                                gridRow: span > 1 ? `span ${span}` : undefined,
                                background: "var(--panel)",
                                borderLeft: `4px solid ${coworkEvent.color}`,
                                borderTop: "1px solid var(--card-border)",
                                borderBottom: "1px solid var(--card-border)",
                                borderRight: "1px solid var(--card-border)",
                                cursor: "move",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                                padding: "0.5rem 0.625rem",
                                borderRadius: "8px",
                                height: span > 1 ? "100%" : "auto",
                                margin: span > 1 ? "2px 4px" : "2px",
                                position: "relative",
                                zIndex: span > 1 ? 10 : 1,
                                boxSizing: "border-box",
                                userSelect: "none",
                                overflow: "hidden",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                              }}
                            >
                              <div className="schedule-load-event-content" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100%", justifyContent: "space-between", gap: "0.375rem", width: "100%" }}>
                                <div style={{ flex: "0 1 auto", display: "flex", flexDirection: "column", gap: "0.375rem", overflow: "hidden" }}>
                                  <div className="schedule-load-event-name" style={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "var(--foreground)" }}>
                                {clientName}
                              </div>
                                  <div className="schedule-load-event-meta" style={{ marginTop: "0", gap: "0.5rem", fontSize: "0.6875rem", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                                <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--muted-foreground)" }}>
                                      <Clock className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem" }} />
                                        <span>{timeRange}</span>
                                      </div>
                                    {coworkEvent.clients && coworkEvent.clients.length > 0 && (
                                      <div className="schedule-load-event-meta-item" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <Users className="schedule-load-event-icon" style={{ width: "0.75rem", height: "0.75rem", color: "var(--muted-foreground)" }} />
                                        <span style={{ color: "var(--muted-foreground)" }}>{coworkEvent.clients.length}</span>
                                    </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Пустая ячейка (не рендерим, если мы внутри диапазона события)
                        if (isInEventRange) {
                        return null;
                      }

                        return (
                          <div
                            key={`${column.key}-${time}`}
                            className="schedule-load-cell schedule-load-cell--empty"
                            style={{ 
                              gridColumn: cellColumn,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              if (isSchedule) {
                                // Для расписания - открываем модал создания
                                if (isBodymind || isPilates) {
                                  const dayKey = "dayKey" in column ? column.dayKey : "mon";
                                  // Вычисляем конкретную дату для выбранного дня
                                  const dayIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(dayKey);
                                  const selectedDate = dayIndex >= 0 
                                    ? getDateStringForDayKey(dayKey, weekStart)
                                    : "";
                                  
                                  setSelectedScheduleCategory(isBodymind ? "bodymind" : "pilates");
                                  setSelectedScheduleDayKey(dayKey);
                                  setSelectedScheduleDate(selectedDate); // Сохраняем конкретную дату
                                  setSelectedScheduleTime(time);
                                  setDrawerMode("create-schedule");
                                  setIsDrawerOpen(true);
                                }
                              } else if (isCowork || isKids) {
                                // Для коворкинга и Kids - открываем модал создания
                                handleOpenCreateDrawer({
                                  groupKey: isCowork ? "cowork" : "kids",
                                  groupLabel: isCowork ? "Коворкинг" : "Eywa Kids",
                                  columnKey: column.key,
                                  columnLabel: column.label,
                                  time,
                                });
                              }
                            }}
                          onDragOver={(e) => {
                            e.preventDefault();
                              e.stopPropagation();
                              const hasData = e.dataTransfer.types.includes("application/json");
                              if (hasData) {
                            e.dataTransfer.dropEffect = "move";
                            e.currentTarget.style.background = "var(--muted)";
                              } else {
                                e.dataTransfer.dropEffect = "none";
                              }
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.background = "var(--panel)";
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                              e.stopPropagation();
                            e.currentTarget.style.background = "var(--panel)";
                              
                              try {
                                const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
                                
                                if (dragData.event) {
                                  // Перемещение события коворкинга/Kids
                                  const oldKey = makeOverviewSlotKey(dragData.groupKey, dragData.columnKey, dragData.time);
                                  const newKey = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, time);
                                  
                                  if (oldKey !== newKey) {
                                    // Вычисляем новый диапазон события
                                    let newEndTime: (typeof TIME_SLOTS)[number] | undefined = undefined;
                                    if (dragData.event.endTime) {
                                      const oldStartIndex = TIME_SLOTS.indexOf(dragData.event.time);
                                      const oldEndIndex = TIME_SLOTS.indexOf(dragData.event.endTime);
                                      const duration = oldEndIndex - oldStartIndex;
                                      const newStartIndex = TIME_SLOTS.indexOf(time);
                                      const newEndIndex = newStartIndex + duration;
                                      if (newEndIndex >= 0 && newEndIndex < TIME_SLOTS.length) {
                                        newEndTime = TIME_SLOTS[newEndIndex];
                                      }
                                    }
                                    
                                    // Проверяем, не занят ли новый диапазон другим событием
                                    const newStartIndex = TIME_SLOTS.indexOf(time);
                                    const newEndIndex = newEndTime ? TIME_SLOTS.indexOf(newEndTime) : newStartIndex;
                                    let hasConflict = false;
                                    let conflictingEvent: CalendarEvent | null = null;
                                    
                                    for (let i = newStartIndex; i <= newEndIndex; i++) {
                                      const checkTime = TIME_SLOTS[i];
                                      const checkKey = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, checkTime);
                                      const existingEvent = overviewSlotsState[checkKey];
                                      
                                      // Если в ячейке есть событие и это не наше событие
                                      if (existingEvent && existingEvent.id !== dragData.event.id) {
                                        hasConflict = true;
                                        conflictingEvent = existingEvent;
                                        break;
                                      }
                                      
                                      // Также проверяем, не начинается ли другое событие раньше и не заканчивается ли в этом диапазоне
                                      for (const checkTime2 of TIME_SLOTS) {
                                        if (checkTime2 === checkTime) continue;
                                        const checkKey2 = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, checkTime2);
                                        const checkEvent2 = overviewSlotsState[checkKey2];
                                        if (checkEvent2 && checkEvent2.id !== dragData.event.id && checkEvent2.time === checkTime2) {
                                          if (isTimeInEventRange(checkTime, checkEvent2)) {
                                            hasConflict = true;
                                            conflictingEvent = checkEvent2;
                                            break;
                                          }
                                        }
                                      }
                                      if (hasConflict) break;
                                    }
                                    
                                    if (hasConflict && conflictingEvent) {
                                      // Показываем предупреждение
                                      const eventName = conflictingEvent.clients && conflictingEvent.clients.length > 0
                                        ? conflictingEvent.clients[0]
                                        : conflictingEvent.title;
                                      toast.warning({
                                        text: `Нельзя поставить бронь: в этом времени уже есть бронь "${eventName}". Сократите текущую бронь, чтобы освободить место.`,
                                      });
                                return;
                              }
                              
                                    // Обновляем время события на новое время
                              const updatedEvent: CalendarEvent = {
                                      ...dragData.event,
                                time: time as (typeof TIME_SLOTS)[number],
                                    };
                                    
                                    // Если есть endTime, пересчитываем его относительно нового времени
                                    if (newEndTime) {
                                      updatedEvent.endTime = newEndTime;
                                    } else if (dragData.event.endTime) {
                                      // Если новый endTime выходит за пределы, убираем его
                                      delete updatedEvent.endTime;
                                    }
                                    
                                    // Обновляем бэкенд через API
                                    if (dragData.event.id) {
                                      try {
                                        // Определяем новую дату (для обзора всегда сегодня)
                                        const today = new Date();
                                        const bookingDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                        
                                        // Определяем новую капсулу (если изменилась)
                                        let newCapsuleId: string | null = null;
                                        let newCapsuleName: string | null = null;
                                        if (isCowork && column.key !== dragData.columnKey) {
                                          // Находим капсулу по новому columnKey
                                          const places = coworkingPlaces.length > 0 ? coworkingPlaces : await fetchCoworkingPlaces();
                                          const nameMap: Record<string, string> = {
                                            "capsule-1": "Капсула 1",
                                            "capsule-2": "Капсула 2",
                                            "capsule-3": "Капсула 3",
                                            "capsule-4": "Капсула 4",
                                            "capsule-5": "Капсула 5",
                                            "ivent-zone": "ИвентЗона",
                                          };
                                          const place = places.find(p => p.name === nameMap[column.key] || p.name === column.label);
                                          if (place) {
                                            newCapsuleId = place.id;
                                            newCapsuleName = place.name;
                                          }
                                        }
                                        
                                        // Обновляем запись через API
                                        await updateScheduleBooking(dragData.event.id, {
                                          booking_date: bookingDate,
                                          booking_time: time,
                                          capsule_id: newCapsuleId || undefined,
                                          capsule_name: newCapsuleName || undefined,
                                        });
                                        
                                        // Перезагружаем данные из API
                                        await loadBookingsFromApi(true);
                                      } catch (error) {
                                        console.error("Failed to update booking via API:", error);
                                        toast.error({ text: "Не удалось обновить запись в базе данных" });
                                        return; // Не обновляем локальное состояние, если API не обновился
                                      }
                                    }
                                    
                              setOverviewSlotsState((prev) => {
                                const updated = { ...prev };
                                      
                                      // Очищаем все старые ячейки в диапазоне
                                      if (dragData.event.endTime) {
                                        const oldStartIndex = TIME_SLOTS.indexOf(dragData.event.time);
                                        const oldEndIndex = TIME_SLOTS.indexOf(dragData.event.endTime);
                                  for (let i = oldStartIndex; i <= oldEndIndex; i++) {
                                          const oldRangeKey = makeOverviewSlotKey(dragData.groupKey, dragData.columnKey, TIME_SLOTS[i]);
                                          updated[oldRangeKey] = null;
                                  }
                                } else {
                                        updated[oldKey] = null;
                                }
                                
                                      // Сохраняем событие в новой ячейке
                                updated[newKey] = updatedEvent;
                                
                                      // Очищаем все ячейки в новом диапазоне (если есть endTime)
                                if (updatedEvent.endTime) {
                                        const newStartIndex = TIME_SLOTS.indexOf(time);
                                        const newEndIndex = TIME_SLOTS.indexOf(updatedEvent.endTime);
                                  for (let i = newStartIndex + 1; i <= newEndIndex; i++) {
                                          const newRangeKey = makeOverviewSlotKey(isCowork ? "cowork" : "kids", column.key, TIME_SLOTS[i]);
                                          updated[newRangeKey] = null;
                                  }
                                }
                                
                                      try {
                                        if (typeof window !== "undefined") {
                                localStorage.setItem("overviewSlotsState", JSON.stringify(updated));
                                        }
                                      } catch (error) {
                                        console.error("Failed to save overviewSlotsState:", error);
                                      }
                                return updated;
                              });
                                  }
                                } else if (dragData.type === "bodymind" && isBodymind) {
                                  // Перемещение группы Body Mind
                                  const dayKey = "dayKey" in column ? column.dayKey : "mon";
                                  
                                  // Проверяем, не занято ли место
                                  const isOccupied = scheduleGroups.some(g => 
                                      g.dayKey === dayKey && 
                                      g.time === time && 
                                      !(g.name === dragData.data.name && g.trainer === dragData.data.trainer && g.dayKey === dragData.dayKey && g.time === dragData.time)
                                    );
                                  
                                  if (isOccupied) {
                                    toast.warning({ text: "Это время уже занято другой группой" });
                                    return;
                                  }
                                  
                                  // Находим bookingId из dragData.data
                                  const groupData = dragData.data as ScheduleGroup;
                                  if (groupData.bookingId) {
                                    try {
                                      // Определяем новую дату на основе dayKey и weekStart
                                      const newDateString = getDateStringForDayKey(dayKey, weekStart);
                                      
                                      // Обновляем запись через API
                                      await updateScheduleBooking(groupData.bookingId, {
                                        booking_date: newDateString,
                                        booking_time: time,
                                      });
                                      
                                      // Перезагружаем данные из API
                                      await loadBookingsFromApi(false);
                                    } catch (error) {
                                      console.error("Failed to update Body Mind booking via API:", error);
                                      toast.error({ text: "Не удалось обновить запись в базе данных" });
                                      return;
                                    }
                                  }
                                  
                                  setScheduleGroups(prev => 
                                    prev.map(g => 
                                      (g.name === dragData.data.name && g.trainer === dragData.data.trainer && g.dayKey === dragData.dayKey && g.time === dragData.time)
                                        ? { ...g, dayKey: dayKey, time: time }
                                        : g
                                    )
                                    );
                                } else if (dragData.type === "pilates" && isPilates) {
                                  // Перемещение тренера Pilates
                                  const dayKey = "dayKey" in column ? column.dayKey : "mon";
                                  setScheduleTrainers(prev => {
                                    const isOccupied = prev.some(t => 
                                      t.dayKey === dayKey && 
                                      t.time === time && 
                                      !(t.trainer === dragData.data.trainer && t.dayKey === dragData.dayKey && t.time === dragData.time)
                                    );
                                    if (isOccupied) return prev;
                                    
                                    return prev.map(t => 
                                      (t.trainer === dragData.data.trainer && t.dayKey === dragData.dayKey && t.time === dragData.time)
                                        ? { ...t, dayKey: dayKey, time: time }
                                        : t
                                    );
                                  });
                                }
                              } catch (error) {
                                console.error("Error parsing drag data:", error);
                              }
                          }}
                        />
                      );
                  })}
                  </Fragment>
                );
              })}
                </div>
              );
            })()}
          </div>
                          </div>
        ) : (
        <Card className="space-y-4">
          <div 
            className="mb-4 flex items-center justify-between"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
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

          {/* Таблица расписания с категориями Body Mind и Pilates Reformer */}
          <div className="p-4 overflow-x-auto" ref={scheduleContainerRef}>
            {(() => {
              // Вычисляем даты для дней недели
              const getDateForDayIndex = (dayIndex: number) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + dayIndex);
                return date;
              };

              const formatDate = (date: Date) => {
                const day = date.getDate();
                const month = date.toLocaleDateString("ru-RU", { month: "long" });
                return `${day} ${month}`;
              };

              // Структура данных для дней недели с датами
              const scheduleDays = [
                { key: "monday", label: "Понедельник", date: getDateForDayIndex(0) },
                { key: "tuesday", label: "Вторник", date: getDateForDayIndex(1) },
                { key: "wednesday", label: "Среда", date: getDateForDayIndex(2) },
                { key: "thursday", label: "Четверг", date: getDateForDayIndex(3) },
                { key: "friday", label: "Пятница", date: getDateForDayIndex(4) },
                { key: "saturday", label: "Суббота", date: getDateForDayIndex(5) },
                { key: "sunday", label: "Воскресенье", date: getDateForDayIndex(6) },
              ] as const;

              const scheduleColumns = scheduleDays.flatMap((day) => [
                { key: `${day.key}-bodymind`, label: "Body Mind", dayKey: day.key, category: "bodymind" as const },
                { key: `${day.key}-pilates`, label: "Pilates Reformer", dayKey: day.key, category: "pilates" as const },
              ]);

              // Функция для обработки перемещения группы
              const handleGroupMove = (group: ScheduleGroup, newDayKey: string, newTime: string) => {
                setScheduleGroups(prev => {
                  // Проверяем, не занято ли новое место
                  const isOccupied = prev.some(g => 
                    g.dayKey === newDayKey && 
                    g.time === newTime && 
                    !(g.name === group.name && g.trainer === group.trainer && g.dayKey === group.dayKey && g.time === group.time)
                  );
                  if (isOccupied) return prev;
                  
                  return prev.map(g => 
                    (g.name === group.name && g.trainer === group.trainer && g.dayKey === group.dayKey && g.time === group.time)
                      ? { ...g, dayKey: newDayKey, time: newTime }
                      : g
                  );
                });
              };

              // Функция для обработки перемещения тренера
              const handleTrainerMove = (trainer: ScheduleTrainer, newDayKey: string, newTime: string) => {
                setScheduleTrainers(prev => {
                  // Проверяем, не занято ли новое место
                  const isOccupied = prev.some(t => 
                    t.dayKey === newDayKey && 
                    t.time === newTime && 
                    !(t.trainer === trainer.trainer && t.dayKey === trainer.dayKey && t.time === trainer.time)
                  );
                  if (isOccupied) return prev;
                  
                  return prev.map(t => 
                    (t.trainer === trainer.trainer && t.dayKey === trainer.dayKey && t.time === trainer.time)
                      ? { ...t, dayKey: newDayKey, time: newTime }
                      : t
                  );
                });
              };

              // Создаем template для grid: 1 колонка для времени + по 2 колонки на каждый день
              const scheduleTemplate = `80px repeat(${scheduleColumns.length}, 200px)`;

              return (
                <div className="schedule-load-overview" style={{ gridTemplateColumns: scheduleTemplate, minWidth: "fit-content" }}>
                  {/* Пустая ячейка в первом ряду */}
                  <div className="schedule-load-group-header" style={{ gridColumn: 1 }}></div>
                  
                  {/* Заголовки дней недели */}
                  {scheduleDays.map((day, dayIndex) => {
                    const startColumn = 2 + dayIndex * 2;
                    // Проверяем, является ли этот день сегодняшним
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);
                    const isToday = dayDate.getTime() === today.getTime();
                    
                    return (
                      <div
                        key={day.key}
                        ref={isToday ? todayHeaderRef : null}
                        className="schedule-load-group-header"
                        style={{ 
                          gridColumn: `${startColumn} / span 2`,
                          background: isToday ? "rgba(99, 102, 241, 0.1)" : "transparent",
                          borderTop: isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "none",
                          borderLeft: isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "none",
                          borderRight: dayIndex < scheduleDays.length - 1 
                            ? (isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--card-border)") 
                            : (isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "none"),
                          borderBottom: isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid var(--card-border)",
                          borderRadius: isToday ? "8px" : "0",
                          fontWeight: isToday ? 700 : 600,
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                          <span style={{ color: isToday ? "rgba(99, 102, 241, 1)" : "var(--foreground)" }}>
                            {day.label}
                            {isToday && " (Сегодня)"}
                          </span>
                          <span style={{ 
                            fontSize: "0.625rem", 
                            opacity: isToday ? 1 : 0.7, 
                            fontWeight: isToday ? 600 : 400,
                            color: isToday ? "rgba(99, 102, 241, 0.8)" : "var(--muted-foreground)",
                          }}>
                            {formatDate(day.date)}
                          </span>
          </div>
                      </div>
                    );
                  })}

                  {/* Заголовок времени */}
                  <div className="schedule-load-column-header schedule-load-column-header--time" style={{ gridColumn: 1 }}>
                    <span>Время</span>
                  </div>

                  {/* Заголовки категорий */}
                  {scheduleColumns.map((column, columnIndex) => {
                    const isLastColumn = columnIndex === scheduleColumns.length - 1;
                    const isBodymind = column.category === "bodymind";
                    const dayKey = column.dayKey;
                    // Проверяем, является ли этот день сегодняшним
                    const dayInfo = scheduleDays.find(d => d.key === dayKey);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayDate = dayInfo ? new Date(dayInfo.date) : null;
                    if (dayDate) dayDate.setHours(0, 0, 0, 0);
                    const isToday = dayDate && dayDate.getTime() === today.getTime();
                    
                    return (
                      <div
                        key={column.key}
                        className={`schedule-load-column-header ${isLastColumn ? "schedule-load-column-header--no-right-border" : ""}`}
                        style={{
                          gridColumn: 2 + columnIndex,
                          background: isToday 
                            ? (isBodymind ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)")
                            : (isBodymind ? "rgba(99, 102, 241, 0.06)" : "rgba(16, 185, 129, 0.06)"),
                          color: "var(--foreground)",
                          borderTop: isToday ? "2px solid rgba(99, 102, 241, 0.5)" : "none",
                        }}
                      >
                        <span>{column.label}</span>
                      </div>
                    );
                  })}

                  {/* Ячейки времени и расписания */}
                  {TIME_SLOTS.map((time) => {
                    return (
                      <Fragment key={time}>
                        <div className="schedule-load-time-cell" style={{ gridColumn: 1 }}>
                          {time}
                        </div>
                        {scheduleColumns.map((column, columnIndex) => {
                          const cellColumn = 2 + columnIndex;
                          const isBodymind = column.category === "bodymind";
                          const dayKey = column.dayKey;
                          
                          // Проверяем, является ли этот день сегодняшним
                          const dayInfo = scheduleDays.find(d => d.key === dayKey);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dayDate = dayInfo ? new Date(dayInfo.date) : null;
                          if (dayDate) dayDate.setHours(0, 0, 0, 0);
                          const isToday = dayDate && dayDate.getTime() === today.getTime();
                          
                          // Получаем данные для этой ячейки
                          let cellData: ScheduleGroup | ScheduleTrainer | null = null;
                          if (isBodymind) {
                            const found = filteredScheduleGroups.find(g => g.dayKey === dayKey && g.time === time);
                            // Фильтруем по категории, если выбрана
                            if (found && (categoryFilter === "all" || categoryFilter === "bodymind")) {
                              cellData = found;
                            } else {
                              cellData = null;
                            }
                          } else {
                            const found = filteredScheduleTrainers.find(t => t.dayKey === dayKey && t.time === time);
                            // Фильтруем по категории, если выбрана
                            if (found && (categoryFilter === "all" || categoryFilter === "pilates")) {
                              cellData = found;
                            } else {
                              cellData = null;
                            }
                          }

                          // Если есть данные, показываем блок события
                          if (cellData) {
                            const bodymindColor = "#6366F1"; // Фиолетовый для Body Mind
                            const pilatesColor = "#10B981"; // Зеленый для Pilates Reformer
                            const eventColor = isBodymind ? bodymindColor : pilatesColor;
                            
                            return (
                              <div
                                key={`${column.key}-${time}`}
                                className="schedule-load-cell schedule-load-cell--event"
                                draggable
                                onClick={() => {
                                  if (isBodymind) {
                                    const group = cellData as ScheduleGroup;
                                    setSelectedBodymindGroup(group);
                                    setEditingBodymindName(group.name);
                                    setEditingBodymindTrainer(group.trainer);
                                    setEditingBodymindCapacity(group.capacity);
                                    setIsEditingBodymind(false);
                                    setDrawerMode("bodymind");
                                    setIsDrawerOpen(true);
                                    
                                    // Загружаем клиентов из API при открытии drawer
                                    if (group.bookingId) {
                                      fetchScheduleBookingById(group.bookingId)
                                        .then(booking => {
                                          if (booking) {
                                            const clients: MockClient[] = booking.clients.map(c => ({
                                              id: c.client_id,
                                              name: c.client_name,
                                              phone: c.client_phone || "",
                                            } as MockClient));
                                            setEditingBodymindClients(clients);
                                          }
                                        })
                                        .catch(error => {
                                          console.error("Failed to load booking details:", error);
                                        });
                                    }
                                  } else {
                                    setSelectedPilatesTrainer(cellData as ScheduleTrainer);
                                    setDrawerMode("pilates");
                                    setIsDrawerOpen(true);
                                  }
                                }}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      type: isBodymind ? "bodymind" : "pilates",
                                      data: cellData,
                                      dayKey: dayKey,
                                      time: time,
                                    }),
                                  );
                                  e.dataTransfer.effectAllowed = "move";
                                  e.currentTarget.style.opacity = "0.5";
                                }}
                                onDragEnd={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                }}
                                style={{
                                  gridColumn: cellColumn,
                                  background: eventColor + "15",
                                  border: `1px solid ${eventColor}60`,
                                  cursor: "move",
                                  outline: isToday ? "2px solid rgba(99, 102, 241, 0.8)" : "none",
                                  outlineOffset: isToday ? "-1px" : "0",
                                }}
                              >
                                <div className="schedule-load-event-content" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "100%", justifyContent: "space-between", gap: "0.25rem" }}>
                                  <div style={{ flex: "0 1 auto", display: "flex", flexDirection: "column", gap: "0.25rem", overflow: "hidden" }}>
                                    {isBodymind ? (
                                      <>
                                        <div className="schedule-load-event-name" style={{ fontSize: "0.75rem", lineHeight: "1.2", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: "1.5rem" }}>
                                          {(cellData as ScheduleGroup).name || "Без названия"}
                                        </div>
                                        <div className="schedule-load-event-meta" style={{ marginTop: "0", gap: "0.5rem", fontSize: "0.625rem" }}>
                                          <div className="schedule-load-event-meta-item">
                                            <Clock className="schedule-load-event-icon" style={{ width: "0.6875rem", height: "0.6875rem" }} />
                                            <span>{time}</span>
                                          </div>
                                          <div className="schedule-load-event-meta-item">
                                            <User className="schedule-load-event-icon" style={{ width: "0.6875rem", height: "0.6875rem" }} />
                                            <span>{(cellData as ScheduleGroup).trainer}</span>
                                          </div>
                                          <div className="schedule-load-event-meta-item">
                                            <Users className="schedule-load-event-icon" style={{ width: "0.6875rem", height: "0.6875rem" }} />
                                            <span>{(cellData as ScheduleGroup).capacity}</span>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="schedule-load-event-name" style={{ fontSize: "0.75rem", lineHeight: "1.2" }}>
                                          {(cellData as ScheduleTrainer).trainer}
                                        </div>
                                        <div className="schedule-load-event-meta" style={{ marginTop: "0", gap: "0.5rem", fontSize: "0.625rem" }}>
                                          <div className="schedule-load-event-meta-item">
                                            <Clock className="schedule-load-event-icon" style={{ width: "0.6875rem", height: "0.6875rem" }} />
                                            <span>{time}</span>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div style={{ 
                                    fontSize: "0.5625rem", 
                                    color: eventColor, 
                                    fontWeight: 600, 
                                    marginTop: "auto", 
                                    paddingTop: "0.25rem",
                                    textTransform: "uppercase",
                                    flexShrink: 0,
                                    lineHeight: "1.1",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {isBodymind ? "Body Mind" : "Pilates Reformer"}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          // Пустая ячейка с поддержкой drop
                          return (
                            <div
                              key={`${column.key}-${time}`}
                              className="schedule-load-cell schedule-load-cell--empty"
                              style={{
                                gridColumn: cellColumn,
                                cursor: "pointer",
                                background: isToday ? "rgba(99, 102, 241, 0.05)" : "transparent",
                                outline: isToday ? "1px solid rgba(99, 102, 241, 0.3)" : "none",
                                outlineOffset: isToday ? "-1px" : "0",
                              }}
                              onClick={() => {
                                // Находим конкретную дату для выбранного дня
                                const selectedDay = scheduleDays.find(d => d.key === dayKey);
                                // Используем локальную дату без конвертации в UTC, чтобы избежать проблем с часовыми поясами
                                const selectedDate = selectedDay 
                                  ? `${selectedDay.date.getFullYear()}-${String(selectedDay.date.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.date.getDate()).padStart(2, '0')}`
                                  : "";
                                
                                
                                setSelectedScheduleCategory(isBodymind ? "bodymind" : "pilates");
                                setSelectedScheduleDayKey(dayKey);
                                setSelectedScheduleDate(selectedDate); // Сохраняем конкретную дату
                                setSelectedScheduleTime(time);
                                setDrawerMode("create-schedule");
                                setIsDrawerOpen(true);
                                setNewBodymindName("");
                                setNewBodymindTrainer("");
                                setNewBodymindCapacity("");
                                setNewPilatesTrainer("");
                                setShowNewPilatesTrainerSelect(false);
                                setNewPilatesTrainerSearchQuery("");
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Проверяем тип через dataTransfer.types
                                const hasData = e.dataTransfer.types.includes("application/json");
                                if (hasData) {
                                  e.dataTransfer.dropEffect = "move";
                                  e.currentTarget.style.background = "var(--muted)";
                                } else {
                                  e.dataTransfer.dropEffect = "none";
                                }
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.style.background = "var(--panel)";
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.style.background = "var(--panel)";
                                
                                try {
                                  const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
                                  
                                  // Проверяем, что категория совпадает
                                  if (dragData.type === "bodymind" && isBodymind) {
                                    handleGroupMove(dragData.data as ScheduleGroup, dayKey, time);
                                  } else if (dragData.type === "pilates" && !isBodymind) {
                                    handleTrainerMove(dragData.data as ScheduleTrainer, dayKey, time);
                                  } else {
                                    // Категории не совпадают - показываем предупреждение
                                    const sourceCategory = dragData.type === "bodymind" ? "Body Mind" : "Pilates Reformer";
                                    const targetCategory = isBodymind ? "Body Mind" : "Pilates Reformer";
                                    toast.warning({
                                      text: `Нельзя переместить карточку "${sourceCategory}" в категорию "${targetCategory}". Карточки можно перемещать только в пределах своей категории.`,
                                    });
                                  }
                                } catch (error) {
                                  console.error("Error parsing drag data:", error);
                                }
                              }}
                            >
                              {/* Данные будут подтягиваться из API */}
                            </div>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </Card>
        )}

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ 
              background: "rgba(0, 0, 0, 0.3)", 
              backdropFilter: "blur(4px)",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              minHeight: "100vh",
            }}
            onClick={(e) => {
              // Не закрываем drawer, если открыто модальное окно удаления
              if (showDeleteModal && drawerMode === "pilates") {
                e.stopPropagation();
                return;
              }
              handleCloseDrawer();
            }}
          />
          <div className={`schedule-event-drawer ${isDrawerOpen ? "schedule-event-drawer--open" : ""}`}>
            <div className="schedule-event-drawer__inner">
              <div className="schedule-event-drawer__header">
                <div className="schedule-event-drawer__header-content">
                  {drawerMode === "event" && selectedEvent ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      gap: "16px",
                    }}>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      flex: 1,
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#868e96",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        fontFamily: "'Manrope', sans-serif",
                      }}>
                        Запись
                      </div>
                      <h2 className="schedule-event-drawer__title" style={{ margin: 0 }}>
                        {selectedEvent?.clients && selectedEvent.clients.length > 0
                          ? selectedEvent.clients[0]
                          : selectedEvent?.title}
                      </h2>
                      </div>
                      <div className="schedule-event-drawer__badge" style={{ 
                        color: selectedEvent?.status === "paid" 
                          ? "#10b981" 
                          : selectedEvent?.status === "reserved"
                          ? "#f59e0b"
                          : "#495057",
                        background: selectedEvent?.status === "paid" 
                          ? "rgba(16, 185, 129, 0.1)" 
                          : selectedEvent?.status === "reserved"
                          ? "rgba(245, 158, 11, 0.1)"
                          : "rgba(0, 0, 0, 0.04)",
                        border: selectedEvent?.status === "paid" 
                          ? "1px solid rgba(16, 185, 129, 0.3)" 
                          : selectedEvent?.status === "reserved"
                          ? "1px solid rgba(245, 158, 11, 0.3)"
                          : "1px solid rgba(0, 0, 0, 0.12)",
                        flexShrink: 0,
                      }}>
                        {selectedEvent && STATUS_LABELS[selectedEvent.status]}
                      </div>
                    </div>
                  ) : drawerMode === "pilates" && selectedPilatesTrainer ? (
                    <>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ 
                          fontSize: "0.6875rem", 
                          fontWeight: 600, 
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {showTrainerSelect ? "Редактирование" : "Просмотр"}
                        </div>
                        <h2 className="schedule-event-drawer__title">{selectedPilatesTrainer.trainer}</h2>
                      </div>
                      <div className="schedule-event-drawer__badge" style={{ 
                        color: "var(--foreground)",
                        background: "rgba(16, 185, 129, 0.06)",
                        border: "1.5px solid rgba(16, 185, 129, 0.2)",
                      }}>
                        Pilates Reformer
        </div>
                    </>
                  ) : drawerMode === "bodymind" && selectedBodymindGroup ? (
                    <>
                      <button 
                        className="schedule-event-drawer__close" 
                        onClick={handleCloseDrawer} 
                        aria-label="Закрыть"
                        style={{
                          position: "absolute",
                          left: "1.5rem",
                          top: "1.5rem",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "none",
                          background: "transparent",
                          color: "var(--foreground)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, marginLeft: "3rem" }}>
                        <h2 className="schedule-event-drawer__title" style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
                          {selectedBodymindGroup.name}
                        </h2>
                      <div className="schedule-event-drawer__badge" style={{ 
                        color: "var(--foreground)",
                        background: "rgba(99, 102, 241, 0.06)",
                        border: "1.5px solid rgba(99, 102, 241, 0.2)",
                          alignSelf: "flex-start",
                      }}>
                        Body Mind
        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingBodymind(!isEditingBodymind)}
                        style={{
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid var(--card-border)",
                          background: isEditingBodymind ? "var(--muted)" : "var(--background)",
                          color: "var(--foreground)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          if (!isEditingBodymind) {
                            e.currentTarget.style.background = "var(--muted)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isEditingBodymind) {
                            e.currentTarget.style.background = "var(--background)";
                          }
                        }}
                      >
                        {isEditingBodymind ? "Отменить" : "Редактировать"}
                      </button>
                    </>
                  ) : drawerMode === "create-schedule" ? (
                    <>
                      <h2 className="schedule-event-drawer__title">Новая запись</h2>
                      {selectedScheduleCategory && (
                        <div className="schedule-event-drawer__badge schedule-event-drawer__badge--soft">
                          {selectedScheduleCategory === "bodymind" ? "Body Mind" : "Pilates Reformer"}
                        </div>
                      )}
                    </>
                  ) : selectedSlot ? (
                    <>
                      <h2 className="schedule-event-drawer__title">Новая запись</h2>
                      <div className="schedule-event-drawer__badge schedule-event-drawer__badge--soft">
                        {selectedSlot.groupKey === "kids" && selectedKidsService
                          ? `${selectedSlot.groupLabel} · ${selectedKidsService.name}`
                          : `${selectedSlot.groupLabel} · ${selectedSlot.columnLabel}`}
    </div>
                    </>
                  ) : null}
                </div>
                {drawerMode !== "bodymind" && (
                <button className="schedule-event-drawer__close" onClick={handleCloseDrawer} aria-label="Закрыть">
                  <X className="h-4 w-4" />
                </button>
                )}
              </div>

              <div className="schedule-event-drawer__content">
                {drawerMode === "event" && selectedEvent && (
                  <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Основная информация - Время и Количество человек в одной секции */}
                    <div style={{
                      padding: "1rem",
                      background: "var(--muted)",
                      borderRadius: "12px",
                      border: "1px solid var(--card-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}>
                      {/* Время */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}>
                        <div style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                        textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontFamily: "'Manrope', sans-serif",
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
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "var(--foreground)",
                            fontFamily: "'Manrope', sans-serif",
                          }}>
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
                                padding: "0.5rem 0.75rem",
                                borderRadius: "8px",
                                border: "1px solid var(--card-border)",
                                background: "var(--background)",
                                color: "var(--foreground)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontFamily: "'Manrope', sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--muted)";
                                e.currentTarget.style.borderColor = "var(--foreground)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--background)";
                                e.currentTarget.style.borderColor = "var(--card-border)";
                            }}
                          >
                              <Plus className="h-3.5 w-3.5" />
                              <span>+1ч</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleShortenEvent}
                            style={{
                                padding: "0.5rem 0.75rem",
                                borderRadius: "8px",
                                border: "1px solid var(--card-border)",
                                background: "var(--background)",
                                color: "var(--foreground)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontFamily: "'Manrope', sans-serif",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--muted)";
                                e.currentTarget.style.borderColor = "var(--foreground)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--background)";
                                e.currentTarget.style.borderColor = "var(--card-border)";
                            }}
                          >
                              <X className="h-3.5 w-3.5" />
                              <span>-1ч</span>
                          </button>
                      </div>
                      </div>
                      {extendError && (
                        <div style={{
                            marginTop: "4px",
                            padding: "8px 12px",
                          borderRadius: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#ef4444",
                            fontSize: "12px",
                            fontFamily: "'Manrope', sans-serif",
                        }}>
                          {extendError}
                        </div>
                      )}
                    </div>

                    {/* Количество человек */}
                      {selectedEvent.peopleCount !== undefined && (
                      <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid var(--card-border)",
                      }}>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}>
                            <div style={{
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontFamily: "'Manrope', sans-serif",
                        }}>
                          Количество человек
                          </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.75rem",
                            }}>
                              <div style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--foreground)",
                                fontFamily: "'Manrope', sans-serif",
                              }}>
                                {(draftEvent?.peopleCount ?? selectedEvent.peopleCount) || 1} чел.
                              </div>
                              <div style={{
                                display: "flex",
                                gap: "0.5rem",
                              }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = draftEvent?.peopleCount ?? selectedEvent.peopleCount ?? 1;
                                    const newValue = Math.max(1, current - 1);
                                    setDraftEvent(prev => prev 
                                      ? { ...prev, peopleCount: newValue } 
                                      : { ...selectedEvent, peopleCount: newValue } as CalendarEvent);
                                  }}
                                  style={{
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--card-border)",
                                    background: "var(--background)",
                                    color: "var(--foreground)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--muted)";
                                    e.currentTarget.style.borderColor = "var(--foreground)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "var(--background)";
                                    e.currentTarget.style.borderColor = "var(--card-border)";
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>-1</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = draftEvent?.peopleCount ?? selectedEvent.peopleCount ?? 1;
                                    const newValue = current + 1;
                                    setDraftEvent(prev => prev 
                                      ? { ...prev, peopleCount: newValue } 
                                      : { ...selectedEvent, peopleCount: newValue } as CalendarEvent);
                                  }}
                                  style={{
                                    padding: "0.5rem 0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--card-border)",
                                    background: "var(--background)",
                                    color: "var(--foreground)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    fontFamily: "'Manrope', sans-serif",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--muted)";
                                    e.currentTarget.style.borderColor = "var(--foreground)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "var(--background)";
                                    e.currentTarget.style.borderColor = "var(--card-border)";
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>+1</span>
                                </button>
                              </div>
                            </div>
                        </div>
                        </div>
                      )}
                    </div>

                    {/* Клиенты и контакты */}
                    {(selectedEvent.clients && selectedEvent.clients.length > 0) || selectedEvent.phone ? (
                      <div style={{
                        padding: "1rem",
                        background: "var(--muted)",
                        borderRadius: "12px",
                        border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                      }}>
                    {/* Клиенты */}
                      {selectedEvent.clients && selectedEvent.clients.length > 0 && (
                      <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.625rem",
                      }}>
                        <div style={{
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontFamily: "'Manrope', sans-serif",
                        }}>
                          Клиенты
                          </div>
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                              gap: "0.5rem",
                            }}>
                              {selectedEvent.clients.map((client, index) => {
                                // Используем телефон из события, если он есть
                                const clientPhone = selectedEvent?.phone;
                                
                                return (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                      gap: "0.75rem",
                                      padding: "0.625rem 0.875rem",
                                      borderRadius: "10px",
                                      background: "var(--background)",
                                      border: "1px solid var(--card-border)",
                                    }}
                                  >
                                    <div 
                                style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.25rem",
                                        flex: 1,
                                        fontFamily: "'Manrope', sans-serif",
                                      }}
                                    >
                                      <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        color: "var(--foreground)",
                                      }}>
                                        <User className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                                        {client}
                            </div>
                                      {clientPhone && (
                                        <div style={{
                                          fontSize: "0.8125rem",
                                          fontWeight: 400,
                                          color: "var(--muted-foreground)",
                                          marginLeft: "1.5rem",
                                          lineHeight: "1.4",
                                        }}>
                                          {clientPhone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                        </div>
                      )}

                        {/* Телефон (если нет в клиентах) */}
                        {selectedEvent.phone && (!selectedEvent.clients || selectedEvent.clients.length === 0) && (
                      <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                      }}>
                        <div style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#868e96",
                          textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              fontFamily: "'Manrope', sans-serif",
                        }}>
                          Телефон
                          </div>
                        <div style={{
                              fontSize: "14px",
                          fontWeight: 600,
                              color: "#0a0a0a",
                              fontFamily: "'Manrope', sans-serif",
                              padding: "10px 14px",
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: "1px solid rgba(0, 0, 0, 0.08)",
                            }}>
                          {selectedEvent.phone}
                        </div>
                        </div>
                      )}
                      </div>
                    ) : null}

                    {/* Дополнительная информация - Примечание */}
                    {selectedEvent.note && (
                      <div style={{
                        padding: "1rem",
                        background: "var(--muted)",
                        borderRadius: "12px",
                        border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.625rem",
                      }}>
                      <div style={{
                              fontSize: "0.8125rem",
                          fontWeight: 600,
                              color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontFamily: "'Manrope', sans-serif",
                        }}>
                          Примечание
                          </div>
                        <div style={{
                              fontSize: "0.875rem",
                              fontWeight: 400,
                              color: "var(--foreground)",
                              lineHeight: "1.6",
                              fontFamily: "'Manrope', sans-serif",
                              padding: "0.625rem 0.875rem",
                              background: "var(--background)",
                              borderRadius: "10px",
                              border: "1px solid var(--card-border)",
                        }}>
                          {selectedEvent.note}
                        </div>
                        </div>
                      )}

                    {/* Оплата (если статус "reserved") */}
                      {selectedEvent.status === "reserved" && isPaymentMode && (
                      <div style={{
                        padding: "1rem",
                        background: "var(--muted)",
                        borderRadius: "12px",
                        border: "1px solid var(--card-border)",
                      }}>
                          <div style={{
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: "var(--muted-foreground)",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontFamily: "'Manrope', sans-serif",
                              marginBottom: "0.75rem",
                            }}>
                              Метод оплаты
                            </div>

                            <div style={{
                            padding: "0.75rem",
                            borderRadius: "10px",
                            border: "1px solid var(--card-border)",
                            marginBottom: "1rem",
                            background: "var(--background)",
                          }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {/* Наличные */}
                                <div
                                  style={{
                            display: "flex",
                            flexDirection: "column",
                                    gap: "0.75rem",
                                    padding: "0.875rem",
                                    borderRadius: "10px",
                                    border: isCashSelected ? "1px solid var(--foreground)" : "1px solid var(--card-border)",
                                    background: isCashSelected ? "var(--muted)" : "var(--background)",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <label
                                      style={{
                              display: "flex",
                              alignItems: "center",
                                        gap: "0.625rem",
                                        cursor: "pointer",
                                        minWidth: "100px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isCashSelected}
                                        onChange={(e) => {
                                          setIsCashSelected(e.target.checked);
                                          if (!e.target.checked) {
                                            setPaymentCash("");
                                          }
                                        }}
                                        style={{ 
                                          margin: 0, 
                                          cursor: "pointer", 
                                          accentColor: "#FAAB1C",
                                          width: "18px",
                                          height: "18px",
                                        }}
                                      />
                              <span style={{
                                        fontSize: "0.875rem", 
                                        fontWeight: isCashSelected ? 600 : 500, 
                                        color: "var(--foreground)",
                                        userSelect: "none",
                                        fontFamily: "'Manrope', sans-serif",
                              }}>
                                Наличные
                                      </span>
                              </label>
                                    {isCashSelected && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const total = Number((paymentTotal || "200 000").replace(/\s+/g, ""));
                                          setPaymentCash(total.toLocaleString("ru-RU").replace(/\u00A0/g, " "));
                                          setPaymentCard("");
                                          setIsCardSelected(false);
                                        }}
                                        style={{
                                          marginLeft: "auto",
                                          padding: "0.5rem 0.875rem",
                                          borderRadius: "10px",
                                          border: "1px solid var(--card-border)",
                                          background: Number(paymentCash.replace(/\s+/g, "")) === Number((paymentTotal || "200 000").replace(/\s+/g, "")) ? "var(--foreground)" : "var(--background)",
                                          color: Number(paymentCash.replace(/\s+/g, "")) === Number((paymentTotal || "200 000").replace(/\s+/g, "")) ? "#ffffff" : "var(--foreground)",
                                          fontSize: "0.8125rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          whiteSpace: "nowrap",
                                          fontFamily: "'Manrope', sans-serif",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (Number(paymentCash.replace(/\s+/g, "")) !== Number((paymentTotal || "200 000").replace(/\s+/g, ""))) {
                                            e.currentTarget.style.background = "var(--muted)";
                                            e.currentTarget.style.borderColor = "var(--foreground)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (Number(paymentCash.replace(/\s+/g, "")) !== Number((paymentTotal || "200 000").replace(/\s+/g, ""))) {
                                            e.currentTarget.style.background = "var(--background)";
                                            e.currentTarget.style.borderColor = "var(--card-border)";
                                          }
                                        }}
                                      >
                                        Вся сумма
                                      </button>
                                    )}
                                  </div>
                                  {isCashSelected && (
                                <input
                                  type="text"
                                  value={paymentCash}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        if (value) {
                                          const num = Number(value);
                                          setPaymentCash(num.toLocaleString("ru-RU").replace(/\u00A0/g, " "));
                                        } else {
                                          setPaymentCash("");
                                        }
                                      }}
                                      placeholder="0"
                                style={{
                                  padding: "0.625rem 0.875rem",
                                          borderRadius: "8px",
                                        border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  fontSize: "0.875rem",
                                  color: "var(--foreground)",
                                        fontFamily: "'Manrope', sans-serif",
                                      }}
                                    />
                                  )}
                              </div>
                                {/* Карта */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.75rem",
                                    padding: "0.875rem",
                                    borderRadius: "10px",
                                    border: isCardSelected ? "1px solid var(--foreground)" : "1px solid var(--card-border)",
                                    background: isCardSelected ? "var(--muted)" : "var(--background)",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <label
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.625rem",
                                        cursor: "pointer",
                                        minWidth: "100px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isCardSelected}
                                        onChange={(e) => {
                                          setIsCardSelected(e.target.checked);
                                          if (!e.target.checked) {
                                            setPaymentCard("");
                                          }
                                        }}
                                        style={{ 
                                          margin: 0, 
                                          cursor: "pointer", 
                                          accentColor: "#FAAB1C",
                                          width: "18px",
                                          height: "18px",
                                        }}
                                      />
                                      <span style={{ 
                                        fontSize: "0.875rem", 
                                        fontWeight: isCardSelected ? 600 : 500, 
                                        color: "var(--foreground)",
                                        userSelect: "none",
                                        fontFamily: "'Manrope', sans-serif",
                              }}>
                                Карта
                                      </span>
                              </label>
                                    {isCardSelected && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const total = Number((paymentTotal || "200 000").replace(/\s+/g, ""));
                                          setPaymentCard(total.toLocaleString("ru-RU").replace(/\u00A0/g, " "));
                                          setPaymentCash("");
                                          setIsCashSelected(false);
                                        }}
                                        style={{
                                          marginLeft: "auto",
                                          padding: "0.5rem 0.875rem",
                                          borderRadius: "10px",
                                          border: "1px solid var(--card-border)",
                                          background: Number(paymentCard.replace(/\s+/g, "")) === Number((paymentTotal || "200 000").replace(/\s+/g, "")) ? "var(--foreground)" : "var(--background)",
                                          color: Number(paymentCard.replace(/\s+/g, "")) === Number((paymentTotal || "200 000").replace(/\s+/g, "")) ? "#ffffff" : "var(--foreground)",
                                          fontSize: "0.8125rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          transition: "all 0.2s ease",
                                          whiteSpace: "nowrap",
                                          fontFamily: "'Manrope', sans-serif",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (Number(paymentCard.replace(/\s+/g, "")) !== Number((paymentTotal || "200 000").replace(/\s+/g, ""))) {
                                            e.currentTarget.style.background = "var(--muted)";
                                            e.currentTarget.style.borderColor = "var(--foreground)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (Number(paymentCard.replace(/\s+/g, "")) !== Number((paymentTotal || "200 000").replace(/\s+/g, ""))) {
                                            e.currentTarget.style.background = "var(--background)";
                                            e.currentTarget.style.borderColor = "var(--card-border)";
                                          }
                                        }}
                                      >
                                        Вся сумма
                                      </button>
                                    )}
                                  </div>
                                  {isCardSelected && (
                                <input
                                  type="text"
                                  value={paymentCard}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        if (value) {
                                          const num = Number(value);
                                          setPaymentCard(num.toLocaleString("ru-RU").replace(/\u00A0/g, " "));
                                        } else {
                                          setPaymentCard("");
                                        }
                                      }}
                                      placeholder="0"
                                style={{
                                        padding: "0.625rem 0.875rem",
                                        borderRadius: "8px",
                                        border: "1px solid var(--card-border)",
                                        background: "var(--background)",
                                        fontSize: "0.875rem",
                                        color: "var(--foreground)",
                                          fontFamily: "'Manrope', sans-serif",
                                }}
                                    />
                                  )}
                                </div>
                              </div>
                              </div>

                            {/* Итоговая сумма и остаток */}
                              <div style={{
                              padding: "0.875rem",
                                borderRadius: "10px",
                              background: "var(--background)",
                              border: "1px solid var(--card-border)",
                              marginBottom: "1rem",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.625rem",
                              fontSize: "0.875rem",
                              fontFamily: "'Manrope', sans-serif",
                            }}>
                              {/* К оплате */}
                                  <div style={{
                                    display: "flex",
                                alignItems: "center",
                                    justifyContent: "space-between",
                                paddingBottom: "0.625rem",
                                borderBottom: "1px solid var(--card-border)",
                              }}>
                                <span style={{ color: "var(--muted-foreground)" }}>К оплате:</span>
                                <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>
                                  {paymentTotal || "200 000"} сум
                                </strong>
                              </div>
                              
                              {/* Оплачено наличными */}
                              {isCashSelected && paymentCash && Number(paymentCash.replace(/\s+/g, "")) > 0 && (
                                <div style={{
                                  display: "flex",
                                    alignItems: "center", 
                                  justifyContent: "space-between",
                                }}>
                                  <span style={{ color: "var(--muted-foreground)" }}>Наличными:</span>
                                  <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>
                                    {paymentCash} сум
                                  </strong>
                                    </div>
                              )}
                              
                              {/* Оплачено картой */}
                              {isCardSelected && paymentCard && Number(paymentCard.replace(/\s+/g, "")) > 0 && (
                                  <div style={{
                                    display: "flex",
                                  alignItems: "center",
                                    justifyContent: "space-between",
                                }}>
                                  <span style={{ color: "var(--muted-foreground)" }}>Картой:</span>
                                  <strong style={{ color: "var(--foreground)", fontWeight: 600 }}>
                                    {paymentCard} сум
                                  </strong>
                                    </div>
                              )}
                              
                              {/* Остаток к оплате */}
                              {(() => {
                                const total = Number((paymentTotal || "200 000").replace(/\s+/g, ""));
                                const cash = Number((paymentCash || "0").replace(/\s+/g, ""));
                                const card = Number((paymentCard || "0").replace(/\s+/g, ""));
                                const paid = cash + card;
                                const remainder = total - paid;
                                
                                if (remainder > 0) {
                                  return (
                                  <div style={{
                                    display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      paddingTop: "0.625rem",
                                      borderTop: "1px solid var(--card-border)",
                                    }}>
                                      <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Остаток:</span>
                                      <strong style={{ 
                                        color: "#ef4444", 
                                        fontWeight: 700,
                                        fontSize: "0.9375rem",
                                      }}>
                                        {remainder.toLocaleString("ru-RU").replace(/\u00A0/g, " ")} сум
                                      </strong>
                                    </div>
                                  );
                                } else if (remainder === 0 && paid > 0) {
                                  return (
                                  <div style={{
                                    display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      paddingTop: "0.625rem",
                                      borderTop: "1px solid var(--card-border)",
                                    }}>
                                      <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Остаток:</span>
                                      <strong style={{ 
                                        color: "#16a34a", 
                                        fontWeight: 700,
                                        fontSize: "0.9375rem",
                                      }}>
                                        0 сум
                                      </strong>
                                </div>
                                  );
                                }
                                return null;
                              })()}
                                </div>

                            {/* Кнопки оплаты */}
                            <div style={{
                              display: "flex",
                              gap: "0.5rem",
                            }}>
                                <button
                                  type="button"
                                onClick={() => setIsPaymentMode(false)}
                                style={{
                                  flex: 1,
                                  padding: "0.75rem 1.25rem",
                                  borderRadius: "10px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--muted-foreground)",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontFamily: "'Manrope', sans-serif",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--muted)";
                                  e.currentTarget.style.borderColor = "var(--foreground)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "var(--background)";
                                  e.currentTarget.style.borderColor = "var(--card-border)";
                                }}
                                >
                                  Отмена
                                </button>
                                <button
                                  type="button"
                                  onClick={handleConfirmPayment}
                                style={{
                                  flex: 1,
                                  padding: "0.75rem 1.25rem",
                                  borderRadius: "10px",
                                  border: "1px solid transparent",
                                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  color: "#ffffff",
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontFamily: "'Manrope', sans-serif",
                                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.35)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.25)";
                                }}
                                >
                                  Подтвердить оплату
                                </button>
                              </div>
                        </div>
                      )}

                    {/* Кнопки действий */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                      paddingTop: "1.25rem",
                      marginTop: "0.25rem",
                      borderTop: "1px solid var(--card-border)",
                    }}>
                      {/* Оплатить (если статус "reserved") */}
                      {selectedEvent.status === "reserved" && !isPaymentMode && (
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
                            padding: "0.75rem 1.25rem",
                            borderRadius: "10px",
                            border: "1px solid transparent",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontFamily: "'Manrope', sans-serif",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.25)";
                          }}
                        >
                          Оплатить
                        </button>
                      )}

                      {/* Основные действия */}
                      <div style={{
                        display: "flex",
                        gap: "0.625rem",
                      }}>
                        {(() => {
                          const hasChanges = draftEvent && selectedEvent && (
                            draftEvent.time !== selectedEvent.time ||
                            draftEvent.endTime !== selectedEvent.endTime ||
                            draftEvent.status !== selectedEvent.status ||
                            draftEvent.peopleCount !== selectedEvent.peopleCount
                          );
                          return (
                      <button
                        type="button"
                              onClick={handleSaveEventChanges}
                        style={{
                          flex: 1,
                                padding: "0.75rem 1.25rem",
                          borderRadius: "10px",
                                border: "1px solid var(--card-border)",
                                background: hasChanges ? "var(--foreground)" : "var(--muted)",
                                color: hasChanges ? "#ffffff" : "var(--muted-foreground)",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                cursor: hasChanges ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                                fontFamily: "'Manrope', sans-serif",
                                opacity: hasChanges ? 1 : 0.6,
                              }}
                              disabled={!hasChanges}
                        onMouseEnter={(e) => {
                                if (hasChanges) {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                                }
                        }}
                        onMouseLeave={(e) => {
                                if (hasChanges) {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }
                              }}
                            >
                              {hasChanges ? "Сохранить изменения" : "Нет изменений"}
                      </button>
                          );
                        })()}
                      <button
                        type="button"
                          onClick={handleDeleteEvent}
                        style={{
                            padding: "0.75rem 1.25rem",
                          borderRadius: "10px",
                            border: "1px solid var(--card-border)",
                            background: "var(--background)",
                            color: "var(--foreground)",
                            fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.375rem",
                            fontFamily: "'Manrope', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--foreground)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--background)";
                            e.currentTarget.style.borderColor = "var(--card-border)";
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </button>
                      </div>
                      {/* Вторичное действие */}
                      <button
                        type="button"
                        onClick={handleCloseDrawer}
                        style={{
                          width: "100%",
                          padding: "0.625rem 1.25rem",
                          borderRadius: "10px",
                          border: "1px solid var(--card-border)",
                          background: "var(--background)",
                          color: "var(--muted-foreground)",
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontFamily: "'Manrope', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--muted)";
                          e.currentTarget.style.borderColor = "var(--foreground)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "var(--background)";
                          e.currentTarget.style.borderColor = "var(--card-border)";
                        }}
                      >
                        Отмена
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

                    {/* Информация о дате, времени и локации */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                    }}>
                      {/* Дата и время */}
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
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
                          Дата и время
                    </div>
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.375rem",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                            <span>
                              {(() => {
                                const today = new Date();
                                const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
                                const dayName = dayNames[today.getDay()];
                                const formattedDate = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                                return `${dayName}, ${formattedDate}`;
                              })()}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                            <span>{selectedSlot.time}</span>
                        </div>
                      </div>
                      </div>
                      {/* Локация */}
                      <div style={{
                        padding: "0.75rem 0.875rem",
                        borderRadius: "10px",
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
                        {selectedSlot.groupKey === "kids" && selectedKidsService
                          ? `${selectedSlot.groupLabel} · ${selectedKidsService.name}`
                          : `${selectedSlot.groupLabel} · ${selectedSlot.columnLabel}`}
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
                      
                      {/* Выбранный клиент */}
                      {selectedClient ? (
                        <div 
                          onClick={() => {
                            if (selectedClient.id) {
                              router.push(`/body/clients/${selectedClient.id}`);
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--card-border)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--background)";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--card-border)";
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
                              {selectedClient.name}
                            </div>
                            <div style={{
                              fontSize: "0.75rem",
                              color: "var(--muted-foreground)",
                            }}>
                              {selectedClient.phone}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Останавливаем всплытие события
                              setSelectedClient(null);
                              setNewBookingClient("");
                              setNewBookingPhone("");
                              setClientSearchResults([]);
                            }}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "6px",
                              border: "none",
                              background: "var(--background)",
                              color: "var(--muted-foreground)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                              e.currentTarget.style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--background)";
                              e.currentTarget.style.color = "var(--muted-foreground)";
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          placeholder="Поиск клиента или введите имя"
                          value={newBookingClient}
                          onChange={async (event) => {
                            const value = event.target.value;
                            setNewBookingClient(value);
                            const term = value.trim();
                            
                            // Убираем минимальную длину - поиск работает даже с 1 символом
                            if (term.length === 0) {
                              setClientSearchResults([]);
                              return;
                            }
                            
                            try {
                              console.log("Searching clients:", {
                                query: term,
                                groupKey: selectedSlot?.groupKey,
                              });
                              
                              // Для коворкинга сначала пробуем с direction="Coworking", но если не найдено - ищем без фильтра по direction
                              let results: MockClient[] = [];
                              
                              if (selectedSlot?.groupKey === "cowork") {
                                // Сначала ищем с фильтром Coworking и статусом Активный
                                results = await fetchClientsFromApi<MockClient>({
                                  query: term,
                                  direction: "Coworking",
                                  status: "Активный",
                                });
                                
                                // Если не найдено, пробуем без фильтра по статусу (но все еще с direction="Coworking")
                                if (results.length === 0) {
                                  results = await fetchClientsFromApi<MockClient>({
                                    query: term,
                                    direction: "Coworking",
                                    status: null,
                                  });
                                }
                                
                                // Если все еще не найдено, пробуем искать среди всех клиентов (без фильтра по direction)
                                // Это нужно, так как клиенты могут быть созданы с direction="Body", но использоваться для коворкинга
                                if (results.length === 0) {
                                  results = await fetchClientsFromApi<MockClient>({
                                    query: term,
                                    direction: null,
                                    status: null,
                                  });
                                }
                              } else if (selectedSlot?.groupKey === "kids") {
                                // Для Kids используем Body
                                results = await fetchClientsFromApi<MockClient>({
                                  query: term,
                                direction: "Body",
                                status: "Активный",
                              });
                                
                                if (results.length === 0) {
                                  results = await fetchClientsFromApi<MockClient>({
                                    query: term,
                                    direction: "Body",
                                    status: null,
                                  });
                                }
                              } else {
                                // Для остальных используем Body
                                results = await fetchClientsFromApi<MockClient>({
                                  query: term,
                                  direction: "Body",
                                  status: "Активный",
                                });
                                
                                if (results.length === 0) {
                                  results = await fetchClientsFromApi<MockClient>({
                                    query: term,
                                    direction: "Body",
                                    status: null,
                                  });
                                }
                              }
                              
                              console.log("Clients search results:", {
                                count: results.length,
                                results: results.map(r => ({ 
                                  id: r.id, 
                                  name: r.name, 
                                  phone: r.phone,
                                  direction: (r as any).direction,
                                  status: (r as any).status,
                                })),
                              });
                              
                              setClientSearchResults(results.slice(0, 10)); // Ограничиваем до 10 результатов
                            } catch (error) {
                              console.error("Failed to search clients:", error);
                              toast.error({ text: "Не удалось загрузить клиентов из базы данных" });
                              setClientSearchResults([]);
                            }
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
                              // Не скрываем результаты сразу при blur - даем время для клика на результат
                              setTimeout(() => {
                                // Проверяем, не кликнули ли мы на результат
                                const activeElement = document.activeElement;
                                if (!activeElement || !activeElement.closest('[data-client-search-results]')) {
                                  setClientSearchResults([]);
                                }
                              }, 200);
                              e.currentTarget.style.borderColor = "var(--card-border)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                        />
                        {clientSearchResults.length > 0 && (
                          <div 
                            data-client-search-results
                            onMouseDown={(e) => {
                              // Предотвращаем blur при клике на результаты
                              e.preventDefault();
                            }}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 0.5rem)",
                              left: 0,
                              right: 0,
                              background: "var(--background)",
                              border: "1.5px solid var(--card-border)",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}>
                            {clientSearchResults.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Предотвращаем blur события
                                  }}
                                onClick={() => {
                                    setSelectedClient(client);
                                  setNewBookingClient(client.name);
                                  setNewBookingPhone(client.phone);
                                    setClientSearchResults([]); // Скрываем список после выбора
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
                      )}
                      
                      {/* Кнопка "Добавить нового клиента" - видна только когда клиент НЕ выбран */}
                      {!selectedClient && (
                        <button
                          type="button"
                          onClick={() => {
                            // Открываем страницу клиентов в новом окне с параметром для открытия модального окна
                            const url = `/body/clients?addClient=true&direction=${selectedSlot?.groupKey === "cowork" ? "Coworking" : selectedSlot?.groupKey === "kids" ? "Body" : "Body"}`;
                            window.open(url, '_blank');
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
                      )}
                    </div>

                      {/* Выбор услуги для Kids */}
                      {selectedSlot?.groupKey === "kids" && kidsServices.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <label style={{
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}>
                            <Activity className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                            Услуга
                          </label>
                          <select
                            value={selectedKidsService?.id || ""}
                            onChange={(e) => {
                              const service = kidsServices.find(s => s.id === e.target.value);
                              setSelectedKidsService(service || null);
                              if (service) {
                                setSelectedServicePrice(service.price);
                                setPaymentTotal(service.price.toLocaleString("ru-RU").replace(/,/g, " "));
                              } else {
                                setSelectedServicePrice(null);
                                setPaymentTotal("");
                              }
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
                              cursor: "pointer",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = "var(--card-border)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <option value="">Выберите услугу</option>
                            {kidsServices.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name} - {service.price.toLocaleString("ru-RU")} сум
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

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

                {/* Drawer для Pilates Reformer */}
                {drawerMode === "pilates" && selectedPilatesTrainer && (
                  <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Время */}
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
                        {selectedPilatesTrainer.time}
                      </div>
                    </div>

                    {/* Тренер */}
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
                      {!showTrainerSelect ? (
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                          {selectedPilatesTrainer.trainer}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ position: "relative" }}>
                      <input
                              type="text"
                              placeholder="Поиск тренера"
                              value={trainerSearchQuery}
                              onChange={(e) => setTrainerSearchQuery(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                            borderRadius: "10px",
                            border: "1.5px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                              }}
                            />
                            {availableTrainers
                              .filter(t => t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()))
                              .map((trainer) => (
                                <div
                                  key={trainer.name}
                                  onClick={async () => {
                                    const newTrainerName = trainer.name;
                                    const trainerObj = availableTrainers.find(t => t.name === newTrainerName);
                                    
                                    // Если есть ID записи из базы данных, обновляем через API
                                    if (selectedPilatesTrainer.bookingId) {
                                      try {
                                        
                                        const updateData: ScheduleBookingUpdate = {
                                          trainer_id: trainerObj?.id || null,
                                          trainer_name: newTrainerName,
                                        };
                                        
                                        await updateScheduleBooking(selectedPilatesTrainer.bookingId, updateData);
                                        
                                        // Обновляем локальное состояние
                                    setScheduleTrainers(prev => prev.map(t =>
                                      t === selectedPilatesTrainer
                                            ? { ...t, trainer: newTrainerName }
                                        : t
                                    ));
                                        setSelectedPilatesTrainer({ ...selectedPilatesTrainer, trainer: newTrainerName });
                                        
                                        toast.success({ text: "Тренер успешно изменен" });
                                        
                                        // Перезагружаем записи из API
                                        await loadBookingsFromApi(viewMode === "overview");
                                        
                                        // Обновляем selectedPilatesTrainer после перезагрузки
                                        const updatedTrainers = scheduleTrainers;
                                            if (selectedPilatesTrainer && selectedPilatesTrainer.bookingId) {
                                          // Найдем обновленную запись после перезагрузки
                                          setTimeout(() => {
                                            const updated = scheduleTrainers.find(t => t.bookingId === selectedPilatesTrainer.bookingId);
                                              if (updated) {
                                                setSelectedPilatesTrainer(updated);
                                              }
                                          }, 100);
                                            }
                                      } catch (error) {
                                        console.error("Failed to update trainer:", error);
                                        toast.error({ text: "Не удалось изменить тренера" });
                                        return;
                                      }
                                    } else {
                                      // Локальная запись - обновляем только локально
                                      setScheduleTrainers(prev => prev.map(t =>
                                        t === selectedPilatesTrainer
                                          ? { ...t, trainer: newTrainerName }
                                          : t
                                      ));
                                      setSelectedPilatesTrainer({ ...selectedPilatesTrainer, trainer: newTrainerName });
                                    }
                                    
                                    setShowTrainerSelect(false);
                                    setTrainerSearchQuery("");
                                  }}
                                  style={{
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--card-border)",
                                    background: "var(--panel)",
                                    cursor: "pointer",
                                    marginTop: "0.5rem",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{trainer.name}</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                      {trainer.phone}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          
                          if (selectedPilatesTrainer?.bookingId) {
                            // Сохраняем данные для удаления в отдельном состоянии
                            setPilatesDeleteData({
                              bookingId: selectedPilatesTrainer.bookingId,
                              trainer: selectedPilatesTrainer.trainer,
                              time: selectedPilatesTrainer.time,
                              dayKey: selectedPilatesTrainer.dayKey,
                              date: selectedPilatesTrainer.date,
                            });
                            
                            // Открываем модальное окно с небольшой задержкой, чтобы клик не попал на overlay
                            setTimeout(() => {
                              setDeleteModalJustOpened(true);
                          setShowDeleteModal(true);
                              // Сбрасываем флаг защиты через 500ms
                              setTimeout(() => {
                                setDeleteModalJustOpened(false);
                              }, 500);
                            }, 100);
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          borderRadius: "10px",
                          border: "1.5px solid var(--card-border)",
                          background: "var(--background)",
                          color: "#ef4444",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                            transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
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
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTrainerSelect(!showTrainerSelect);
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
                        {showTrainerSelect ? "Отмена" : "Поменять тренера"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Drawer для Body Mind */}
                {drawerMode === "bodymind" && selectedBodymindGroup && (
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Ключевые атрибуты вертикально расположенные */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}>
                      {/* Название */}
                      <div style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}>
                      <div style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        color: "var(--muted-foreground)",
                      }}>
                        Название
                      </div>
                      {!isEditingBodymind ? (
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}>
                          {selectedBodymindGroup.name}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={editingBodymindName}
                          onChange={(e) => setEditingBodymindName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                              borderRadius: "8px",
                              border: "1px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
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
                      )}
                    </div>

                    {/* Тренер */}
                    <div style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}>
                      <div style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        color: "var(--muted-foreground)",
                      }}>
                        Тренер
                      </div>
                      {!isEditingBodymind ? (
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}>
                          {selectedBodymindGroup.trainer}
                        </div>
                      ) : !showBodymindTrainerSelect ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                          <div style={{
                            fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}>
                            {editingBodymindTrainer}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowBodymindTrainerSelect(true)}
                            style={{
                                padding: "0.5rem 0.875rem",
                              borderRadius: "8px",
                              border: "1px solid var(--card-border)",
                              background: "var(--background)",
                              color: "var(--foreground)",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--muted)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--background)";
                            }}
                          >
                              Изменить
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              placeholder="Поиск тренера"
                              value={bodymindTrainerSearchQuery}
                              onChange={(e) => setBodymindTrainerSearchQuery(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
                              }}
                            />
                            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                              {availableTrainers
                                .filter(t => t.name.toLowerCase().includes(bodymindTrainerSearchQuery.toLowerCase()))
                                .map((trainer) => (
                                  <div
                                    key={trainer.name}
                                    onClick={() => {
                                      setEditingBodymindTrainer(trainer.name);
                                      setShowBodymindTrainerSelect(false);
                                      setBodymindTrainerSearchQuery("");
                                    }}
                                    style={{
                                      padding: "0.75rem",
                                      borderRadius: "8px",
                                      border: "1px solid var(--card-border)",
                                      background: "var(--panel)",
                                      cursor: "pointer",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{trainer.name}</div>
                                      <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                        {trainer.phone}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Вместимость */}
                    <div style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}>
                      <div style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        color: "var(--muted-foreground)",
                      }}>
                        Вместимость
                      </div>
                      {!isEditingBodymind ? (
                        <div style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--foreground)",
                        }}>
                          {selectedBodymindGroup.capacity}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                              {editingBodymindClients.length} / Макс:
                          </div>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={editingBodymindCapacity.split('/')[1] || editingBodymindCapacity || "10"}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 100)) {
                                setEditingBodymindCapacity(value);
                              }
                            }}
                            placeholder="10"
                          style={{
                            width: "100%",
                            padding: "0.625rem 0.875rem",
                                borderRadius: "8px",
                                border: "1px solid var(--card-border)",
                            background: "var(--background)",
                            fontSize: "0.875rem",
                            color: "var(--foreground)",
                            outline: "none",
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
                      )}
                    </div>

                    {/* Дата и время */}
                    <div style={{
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                      background: "var(--muted)",
                      border: "1px solid var(--card-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}>
                      <div style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        color: "var(--muted-foreground)",
                      }}>
                        Дата и время
                      </div>
                      <div style={{
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--foreground)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.375rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                          <span>
                            {(() => {
                              const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
                              const dayIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(selectedBodymindGroup.dayKey);
                              const dayName = dayIndex !== -1 ? dayNames[dayIndex] : selectedBodymindGroup.dayKey;
                              const date = new Date(selectedBodymindGroup.date);
                              const formattedDate = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                              return `${dayName}, ${formattedDate}`;
                            })()}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                          <span>{selectedBodymindGroup.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Клиенты */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <span style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                          }}>
                            Клиенты
                          </span>
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            background: "var(--muted)",
                            padding: "0.125rem 0.5rem",
                            borderRadius: "12px",
                            minWidth: "20px",
                            textAlign: "center",
                          }}>
                          {editingBodymindClients.length}/{editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || 0}
                        </span>
                        </div>
                        {isEditingBodymind && (
                          <button
                            type="button"
                            onClick={() => {
                              const maxCap = parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0");
                              if (editingBodymindClients.length >= maxCap) {
                                toast.error({ text: `Достигнута максимальная вместимость: ${maxCap} человек` });
                                return;
                              }
                              setShowEditingBodymindClientSelect(true);
                            }}
                            disabled={editingBodymindClients.length >= parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0")}
                            style={{
                              padding: "0.375rem 0.75rem",
                              borderRadius: "6px",
                              border: "none",
                              background: editingBodymindClients.length >= parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0") ? "var(--muted)" : "var(--background)",
                              color: editingBodymindClients.length >= parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0") ? "var(--muted-foreground)" : "var(--foreground)",
                              fontSize: "0.8125rem",
                              fontWeight: 500,
                              cursor: editingBodymindClients.length >= parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0") ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                            }}
                            onMouseEnter={(e) => {
                              if (editingBodymindClients.length < parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0")) {
                                e.currentTarget.style.background = "var(--muted)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (editingBodymindClients.length < parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0")) {
                                e.currentTarget.style.background = "var(--background)";
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Добавить клиента
                          </button>
                        )}
                      </div>
                      {!isEditingBodymind ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {editingBodymindClients.length > 0 ? (
                            editingBodymindClients.map((client) => (
                              <div
                                key={client.id}
                                style={{
                                  padding: "0.875rem 1rem",
                                  borderRadius: "8px",
                                  background: "var(--panel)",
                                  border: "1px solid var(--card-border)",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--foreground)" }}>{client.name}</div>
                                  <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>{client.phone}</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{
                              padding: "1.5rem",
                              borderRadius: "8px",
                              background: "var(--panel)",
                              border: "1px solid var(--card-border)",
                              textAlign: "center",
                              fontSize: "0.875rem",
                              color: "var(--muted-foreground)",
                            }}>
                              Клиенты не добавлены
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {editingBodymindClients.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {editingBodymindClients.map((client) => (
                                <div
                                  key={client.id}
                                  style={{
                                    padding: "0.875rem 1rem",
                                    borderRadius: "8px",
                                    background: "var(--panel)",
                                    border: "1px solid var(--card-border)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--foreground)" }}>{client.name}</div>
                                    <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>{client.phone}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBodymindClients(prev => prev.filter(c => c.id !== client.id));
                                    }}
                                    style={{
                                      padding: "0.375rem 0.625rem",
                                      borderRadius: "6px",
                                      border: "none",
                                      background: "transparent",
                                      color: "#ef4444",
                                      fontSize: "0.8125rem",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "transparent";
                                    }}
                                  >
                                    Удалить
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {showEditingBodymindClientSelect && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  placeholder="Поиск клиента"
                                  value={editingBodymindClientSearchQuery}
                                  onChange={async (e) => {
                                    const value = e.target.value;
                                    setEditingBodymindClientSearchQuery(value);
                                    if (value.trim().length > 0) {
                                      try {
                                        const results = await fetchClientsFromApi<MockClient>({
                                          query: value.trim(),
                                          direction: "Body",
                                        });
                                        setEditingBodymindClientSearchResults(results);
                                      } catch (error) {
                                        console.error("Failed to search clients:", error);
                                        setEditingBodymindClientSearchResults([]);
                                      }
                                    } else {
                                      setEditingBodymindClientSearchResults([]);
                                    }
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
                                  }}
                                />
                                {editingBodymindClientSearchResults.length > 0 && (
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    marginTop: "0.5rem",
                                    borderRadius: "10px",
                                    border: "1px solid var(--card-border)",
                                    background: "var(--panel)",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    zIndex: 50,
                                  }}>
                                    {editingBodymindClientSearchResults
                                      .filter(c => !editingBodymindClients.some(selected => selected.id === c.id))
                                      .map((client) => (
                                        <div
                                          key={client.id}
                                          onClick={() => {
                                            const maxCap = parseInt(editingBodymindCapacity || selectedBodymindGroup.capacity.split('/')[1] || "0");
                                            if (editingBodymindClients.length >= maxCap) {
                                              toast.error({ text: `Достигнута максимальная вместимость: ${maxCap} человек` });
                                              return;
                                            }
                                            setEditingBodymindClients(prev => [...prev, client]);
                                            setEditingBodymindClientSearchQuery("");
                                            setEditingBodymindClientSearchResults([]);
                                            setShowEditingBodymindClientSelect(false);
                                          }}
                                          style={{
                                            padding: "0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid var(--card-border)",
                                            background: "var(--panel)",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{client.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                              {client.phone}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowEditingBodymindClientSelect(false);
                                  setEditingBodymindClientSearchQuery("");
                                  setEditingBodymindClientSearchResults([]);
                                }}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--foreground)",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Отмена
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действий */}
                    <div style={{
                      display: "flex",
                      gap: "0.75rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid var(--card-border)",
                      marginTop: "0.5rem",
                    }}>
                      {!isEditingBodymind ? (
                        <>
                      <button
                        type="button"
                            onClick={() => {
                              setShowDeleteModal(true);
                            }}
                            style={{
                              flex: 1,
                              padding: "0.75rem 1rem",
                              borderRadius: "8px",
                              border: "1px solid var(--card-border)",
                              background: "var(--background)",
                              color: "#ef4444",
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
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
                            <Trash2 className="h-4 w-4" />
                            Удалить
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setIsEditingBodymind(true);
                              setEditingBodymindName(selectedBodymindGroup.name);
                              setEditingBodymindTrainer(selectedBodymindGroup.trainer);
                              // Извлекаем максимальную вместимость из строки "текущее/максимум"
                              const maxCapacity = selectedBodymindGroup.capacity.split('/')[1] || selectedBodymindGroup.capacity || "10";
                              setEditingBodymindCapacity(maxCapacity);
                              
                              // Загружаем полные данные записи из API, включая клиентов
                              if (selectedBodymindGroup.bookingId) {
                                try {
                                  const booking = await fetchScheduleBookingById(selectedBodymindGroup.bookingId);
                                  if (booking) {
                                    // Преобразуем клиентов из API в формат MockClient
                                    const clients: MockClient[] = booking.clients.map(c => ({
                                      id: c.client_id,
                                      name: c.client_name,
                                      phone: c.client_phone || "",
                                    } as MockClient));
                                    setEditingBodymindClients(clients);
                                  }
                                } catch (error) {
                                  console.error("Failed to load booking details:", error);
                                }
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: "0.75rem 1rem",
                              borderRadius: "8px",
                              border: "1px solid transparent",
                              background: "var(--foreground)",
                              color: "var(--background)",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "0.9";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "1";
                            }}
                          >
                            Редактировать
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingBodymind(false);
                              setEditingBodymindName(selectedBodymindGroup.name);
                              setEditingBodymindTrainer(selectedBodymindGroup.trainer);
                              setEditingBodymindCapacity(selectedBodymindGroup.capacity);
                              setShowBodymindTrainerSelect(false);
                              setBodymindTrainerSearchQuery("");
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
                            onClick={async () => {
                              if (selectedBodymindGroup && selectedBodymindGroup.bookingId) {
                                try {
                                  // Находим ID тренера
                                  const trainer = availableTrainers.find(t => t.name === editingBodymindTrainer);
                                  
                                  // Преобразуем клиентов в формат для API
                                  const clientsForApi = editingBodymindClients.map(client => ({
                                    client_id: client.id,
                                    client_name: client.name,
                                    client_phone: client.phone || null,
                                  }));
                                  
                                  // Парсим вместимость (теперь это просто число)
                                  const maxCap = parseInt(editingBodymindCapacity) || 10;
                                  
                                  // Проверка вместимости
                                  if (clientsForApi.length > maxCap) {
                                    toast.error({ text: `Превышена вместимость: добавлено ${clientsForApi.length} клиентов, максимум ${maxCap}` });
                                    return;
                                  }
                                  
                                  const updateData: ScheduleBookingUpdate = {
                                    service_name: editingBodymindName,
                                    trainer_id: trainer?.id || null,
                                    trainer_name: editingBodymindTrainer,
                                    clients: clientsForApi,
                                    max_capacity: maxCap,
                                  };
                                  
                                  await updateScheduleBooking(selectedBodymindGroup.bookingId, updateData);
                                  
                                  // Обновляем локальное состояние
                                  const newCapacity = `${clientsForApi.length}/${maxCap}`;
                                setScheduleGroups(prev => prev.map(g => 
                                  g === selectedBodymindGroup
                                    ? { 
                                        ...g, 
                                        name: editingBodymindName,
                                        trainer: editingBodymindTrainer,
                                          capacity: newCapacity,
                                      }
                                    : g
                                ));
                                setSelectedBodymindGroup({ 
                                  ...selectedBodymindGroup, 
                                  name: editingBodymindName,
                                  trainer: editingBodymindTrainer,
                                    capacity: newCapacity,
                                });
                                  
                                  // Перезагружаем данные из API
                                  await loadBookingsFromApi(viewMode === "overview");
                                  
                                setIsEditingBodymind(false);
                                setShowBodymindTrainerSelect(false);
                                setBodymindTrainerSearchQuery("");
                                  setShowEditingBodymindClientSelect(false);
                                  setEditingBodymindClientSearchQuery("");
                                  
                                  toast.success({ text: "Запись успешно обновлена" });
                                } catch (error) {
                                  console.error("Failed to update BodyMind booking:", error);
                                  toast.error({ text: `Не удалось обновить запись: ${error instanceof Error ? error.message : "Неизвестная ошибка"}` });
                                }
                              }
                            }}
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
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Drawer для создания новой записи в расписании */}
                {drawerMode === "create-schedule" && (
                  <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Выбор категории */}
                    {!selectedScheduleCategory ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "0.5rem",
                        }}>
                          Выберите категорию
              </div>
                        <button
                          type="button"
                          onClick={() => setSelectedScheduleCategory("bodymind")}
                          style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1.5px solid var(--card-border)",
                            color: "var(--foreground)",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--card-border)";
                          }}
                        >
                          Body Mind
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedScheduleCategory("pilates")}
                          style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1.5px solid var(--card-border)",
                            color: "var(--foreground)",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--card-border)";
                          }}
                        >
                          Pilates Reformer
                        </button>
            </div>
                    ) : selectedScheduleCategory === "bodymind" ? (
                      <>
                        {/* Название группы */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                            Название
                          </div>
                          <input
                            type="text"
                            value={newBodymindName}
                            onChange={(e) => setNewBodymindName(e.target.value)}
                            placeholder="Например: Йога для начинающих"
                            style={{
                              width: "100%",
                              padding: "0.625rem 0.875rem",
                              borderRadius: "10px",
                              border: "1.5px solid var(--card-border)",
                              background: "var(--background)",
                              fontSize: "0.875rem",
                              color: "var(--foreground)",
                              outline: "none",
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

                        {/* Тренер */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                          {!showNewBodymindTrainerSelect ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {newBodymindTrainer ? (
                                <div style={{
                                  fontSize: "0.9375rem",
                                  fontWeight: 600,
                                  color: "var(--foreground)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}>
                                  <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                                  {newBodymindTrainer}
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: "0.875rem",
                                  color: "var(--muted-foreground)",
                                }}>
                                  Тренер не выбран
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowNewBodymindTrainerSelect(true)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--foreground)",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  alignSelf: "flex-start",
                                }}
                              >
                                {newBodymindTrainer ? "Изменить тренера" : "Выбрать тренера"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div style={{ position: "relative" }}>
                          <input
                            type="text"
                                  placeholder="Поиск тренера"
                                  value={newBodymindTrainerSearchQuery}
                                  onChange={(e) => setNewBodymindTrainerSearchQuery(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.625rem 0.875rem",
                              borderRadius: "10px",
                              border: "1.5px solid var(--card-border)",
                              background: "var(--background)",
                              fontSize: "0.875rem",
                              color: "var(--foreground)",
                              outline: "none",
                            }}
                                />
                                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                                  {availableTrainers
                                    .filter(t => t.name.toLowerCase().includes(newBodymindTrainerSearchQuery.toLowerCase()))
                                    .map((trainer) => (
                                      <div
                                        key={trainer.name}
                                        onClick={() => {
                                          setNewBodymindTrainer(trainer.name);
                                          setShowNewBodymindTrainerSelect(false);
                                          setNewBodymindTrainerSearchQuery("");
                                        }}
                                        style={{
                                          padding: "0.75rem",
                                          borderRadius: "8px",
                                          border: "1px solid var(--card-border)",
                                          background: "var(--panel)",
                                          cursor: "pointer",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{trainer.name}</div>
                                          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                            {trainer.phone}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Вместимость */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                            Вместимость (максимум человек)
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={newBodymindCapacity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 100)) {
                                setNewBodymindCapacity(value);
                              }
                            }}
                            placeholder="10"
                            style={{
                              width: "100%",
                              padding: "0.625rem 0.875rem",
                              borderRadius: "10px",
                              border: "1.5px solid var(--card-border)",
                              background: "var(--background)",
                              fontSize: "0.875rem",
                              color: "var(--foreground)",
                              outline: "none",
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

                        {/* Клиенты */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
                          border: "1px solid var(--card-border)",
                        }}>
                          <div style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "var(--muted-foreground)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: "0.375rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                            <span>Клиенты</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                              {newBodymindClients.length}/{newBodymindCapacity || 0}
                            </span>
                          </div>
                          {!showNewBodymindClientSelect ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {newBodymindClients.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                                  {newBodymindClients.map((client) => (
                                    <div
                                      key={client.id}
                                      style={{
                                        padding: "0.5rem 0.75rem",
                                        borderRadius: "8px",
                                        background: "var(--muted)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{client.name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{client.phone}</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setNewBodymindClients(prev => prev.filter(c => c.id !== client.id));
                                        }}
                                        style={{
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "6px",
                                          border: "none",
                                          background: "var(--background)",
                                          color: "#ef4444",
                                          fontSize: "0.75rem",
                                          cursor: "pointer",
                                        }}
                                      >
                                        Удалить
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: "0.875rem",
                                  color: "var(--muted-foreground)",
                                }}>
                                  Клиенты не выбраны
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const maxCap = parseInt(newBodymindCapacity) || 0;
                                  if (newBodymindClients.length >= maxCap) {
                                    toast.error({ text: `Достигнута максимальная вместимость: ${maxCap} человек` });
                                    return;
                                  }
                                  setShowNewBodymindClientSelect(true);
                                }}
                                disabled={newBodymindClients.length >= (parseInt(newBodymindCapacity) || 0)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                                  background: newBodymindClients.length >= (parseInt(newBodymindCapacity) || 0) ? "var(--muted)" : "var(--background)",
                                  color: newBodymindClients.length >= (parseInt(newBodymindCapacity) || 0) ? "var(--muted-foreground)" : "var(--foreground)",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  cursor: newBodymindClients.length >= (parseInt(newBodymindCapacity) || 0) ? "not-allowed" : "pointer",
                                  transition: "all 0.2s ease",
                                  alignSelf: "flex-start",
                                }}
                              >
                                {newBodymindClients.length >= (parseInt(newBodymindCapacity) || 0) ? "Вместимость заполнена" : "Добавить клиента"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  placeholder="Поиск клиента"
                                  value={newBodymindClientSearchQuery}
                                  onChange={async (e) => {
                                    const value = e.target.value;
                                    setNewBodymindClientSearchQuery(value);
                                    if (value.trim().length > 0) {
                                      try {
                                        const results = await fetchClientsFromApi<MockClient>({
                                          query: value.trim(),
                                          direction: "Body",
                                        });
                                        setNewBodymindClientSearchResults(results);
                                      } catch (error) {
                                        console.error("Failed to search clients:", error);
                                        setNewBodymindClientSearchResults([]);
                                      }
                                    } else {
                                      setNewBodymindClientSearchResults([]);
                                    }
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
                                  }}
                                />
                                {newBodymindClientSearchResults.length > 0 && (
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    marginTop: "0.5rem",
                                    borderRadius: "10px",
                                    border: "1px solid var(--card-border)",
                                    background: "var(--panel)",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    zIndex: 50,
                                  }}>
                                    {newBodymindClientSearchResults
                                      .filter(c => !newBodymindClients.some(selected => selected.id === c.id))
                                      .map((client) => (
                                        <div
                                          key={client.id}
                                          onClick={() => {
                                            const maxCap = parseInt(newBodymindCapacity) || 0;
                                            if (newBodymindClients.length >= maxCap) {
                                              toast.error({ text: `Достигнута максимальная вместимость: ${maxCap} человек` });
                                              return;
                                            }
                                            setNewBodymindClients(prev => [...prev, client]);
                                            setNewBodymindClientSearchQuery("");
                                            setNewBodymindClientSearchResults([]);
                                            setShowNewBodymindClientSelect(false);
                                          }}
                                          style={{
                                            padding: "0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid var(--card-border)",
                                            background: "var(--panel)",
                                            cursor: "pointer",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{client.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                              {client.phone}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewBodymindClientSelect(false);
                                  setNewBodymindClientSearchQuery("");
                                  setNewBodymindClientSearchResults([]);
                                }}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--foreground)",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Отмена
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Время */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                            {selectedScheduleTime}
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
                            onClick={() => {
                              setSelectedScheduleCategory(null);
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
                            Назад
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (newBodymindName && newBodymindTrainer && newBodymindCapacity && selectedScheduleDayKey && selectedScheduleTime) {
                                try {
                                  // Используем сохраненную конкретную дату, если она есть, иначе вычисляем из dayKey
                                  const bookingDate = selectedScheduleDate || getDateStringForDayKey(selectedScheduleDayKey, weekStart);
                                  
                                  // Проверка: нельзя создавать записи на прошедшие даты
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const bookingDateObj = new Date(bookingDate);
                                  bookingDateObj.setHours(0, 0, 0, 0);
                                  
                                  if (bookingDateObj < today) {
                                    toast.error({ text: "Нельзя создавать записи на прошедшие даты. Выберите сегодняшнюю или будущую дату." });
                                    return;
                                  }
                                  
                                  // Находим ID тренера
                                  const trainer = availableTrainers.find(t => t.name === newBodymindTrainer);
                                  
                                  // Преобразуем клиентов в формат для API
                                  const clientsForApi = newBodymindClients.map(client => ({
                                    client_id: client.id,
                                    client_name: client.name,
                                    client_phone: client.phone || null,
                                  }));
                                  
                                  const maxCap = parseInt(newBodymindCapacity) || 10;
                                  
                                  // Проверка вместимости
                                  if (clientsForApi.length > maxCap) {
                                    toast.error({ text: `Превышена вместимость: добавлено ${clientsForApi.length} клиентов, максимум ${maxCap}` });
                                    return;
                                  }
                                  
                                  const bookingData: ScheduleBookingCreate = {
                                    booking_date: bookingDate,
                                    booking_time: selectedScheduleTime,
                                    category: "Body Mind",
                                    service_name: newBodymindName,
                                    trainer_id: trainer?.id || null,
                                    trainer_name: newBodymindTrainer,
                                    clients: clientsForApi,
                                    max_capacity: maxCap,
                                    status: "Свободно",
                                    notes: null,
                                  };
                                  
                                  // Создаем запись через API
                                  const createdBooking = await createScheduleBooking(bookingData);
                                  
                                  // Перезагружаем данные из API, чтобы убедиться, что все синхронизировано
                                  await loadBookingsFromApi(viewMode === "overview");
                                  
                                  toast.success({ text: "Запись успешно создана" });
                                handleCloseDrawer();
                                } catch (error) {
                                  console.error("Failed to create booking:", error);
                                  toast.error({ text: "Не удалось создать запись" });
                                }
                              }
                            }}
                            disabled={!newBodymindName || !newBodymindTrainer || !newBodymindCapacity}
                            style={{
                              flex: 1,
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              border: "1.5px solid transparent",
                              background: (!newBodymindName || !newBodymindTrainer || !newBodymindCapacity)
                                ? "var(--muted)"
                                : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                              color: (!newBodymindName || !newBodymindTrainer || !newBodymindCapacity)
                                ? "var(--muted-foreground)"
                                : "#fff",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              cursor: (!newBodymindName || !newBodymindTrainer || !newBodymindCapacity) ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (newBodymindName && newBodymindTrainer && newBodymindCapacity) {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            Создать
                          </button>
          </div>
        </>
                    ) : (
                      <>
                        {/* Тренер для Pilates Reformer */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                          {!showNewPilatesTrainerSelect ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {newPilatesTrainer ? (
                                <div style={{
                                  fontSize: "0.9375rem",
                                  fontWeight: 600,
                                  color: "var(--foreground)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}>
                                  <User className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                                  {newPilatesTrainer}
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: "0.875rem",
                                  color: "var(--muted-foreground)",
                                }}>
                                  Тренер не выбран
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowNewPilatesTrainerSelect(true)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "8px",
                                  border: "1px solid var(--card-border)",
                                  background: "var(--background)",
                                  color: "var(--foreground)",
                                  fontSize: "0.8125rem",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  alignSelf: "flex-start",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--muted)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "var(--background)";
                                }}
                              >
                                {newPilatesTrainer ? "Изменить тренера" : "Выбрать тренера"}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  placeholder="Поиск тренера"
                                  value={newPilatesTrainerSearchQuery}
                                  onChange={(e) => setNewPilatesTrainerSearchQuery(e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "0.625rem 0.875rem",
                                    borderRadius: "10px",
                                    border: "1.5px solid var(--card-border)",
                                    background: "var(--background)",
                                    fontSize: "0.875rem",
                                    color: "var(--foreground)",
                                    outline: "none",
                                  }}
                                  onFocus={(e) => {
                                    e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.6)";
                                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.style.borderColor = "var(--card-border)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                />
                                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "200px", overflowY: "auto" }}>
                                  {availableTrainers
                                    .filter(t => t.name.toLowerCase().includes(newPilatesTrainerSearchQuery.toLowerCase()))
                                    .map((trainer) => (
                                      <div
                                        key={trainer.name}
                                        onClick={() => {
                                          setNewPilatesTrainer(trainer.name);
                                          setShowNewPilatesTrainerSelect(false);
                                          setNewPilatesTrainerSearchQuery("");
                                        }}
                                        style={{
                                          padding: "0.75rem",
                                          borderRadius: "8px",
                                          border: "1px solid var(--card-border)",
                                          background: "var(--panel)",
                                          cursor: "pointer",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "var(--muted)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "var(--panel)";
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{trainer.name}</div>
                                          <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                                            {trainer.phone}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Дата и время */}
                        <div style={{
                          padding: "0.75rem 0.875rem",
                          borderRadius: "10px",
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
                            Дата и время
                          </div>
                          <div style={{
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: "var(--foreground)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.375rem",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Calendar className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                              <span>
                                {(() => {
                                  const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
                                  const dayIndex = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(selectedScheduleDayKey);
                                  const dayName = dayIndex !== -1 ? dayNames[dayIndex] : selectedScheduleDayKey;
                                  const bookingDate = selectedScheduleDate || getDateStringForDayKey(selectedScheduleDayKey, weekStart);
                                  const date = new Date(bookingDate);
                                  const formattedDate = date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
                                  return `${dayName}, ${formattedDate}`;
                                })()}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                              <span>{selectedScheduleTime}</span>
                            </div>
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
                            onClick={() => {
                              setSelectedScheduleCategory(null);
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
                            Назад
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (newPilatesTrainer && selectedScheduleDayKey && selectedScheduleTime) {
                                try {
                                  // Используем сохраненную конкретную дату, если она есть, иначе вычисляем из dayKey
                                  const bookingDate = selectedScheduleDate || getDateStringForDayKey(selectedScheduleDayKey, weekStart);
                                  
                                  // Проверка: нельзя создавать записи на прошедшие даты
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const bookingDateObj = new Date(bookingDate);
                                  bookingDateObj.setHours(0, 0, 0, 0);
                                  
                                  if (bookingDateObj < today) {
                                    toast.error({ text: "Нельзя создавать записи на прошедшие даты. Выберите сегодняшнюю или будущую дату." });
                                    return;
                                  }
                                  
                                  
                                  // Находим ID тренера
                                  const trainer = availableTrainers.find(t => t.name === newPilatesTrainer);
                                  
                                  const bookingData: ScheduleBookingCreate = {
                                    booking_date: bookingDate,
                                    booking_time: selectedScheduleTime,
                                    category: "Pilates Reformer",
                                    service_name: null,
                                    trainer_id: trainer?.id || null,
                                    trainer_name: newPilatesTrainer,
                                    clients: [],
                                    max_capacity: 1,
                                    status: "Свободно",
                                    notes: null,
                                  };
                                  
                                  // Создаем запись через API
                                  
                                  const createdBooking = await createScheduleBooking(bookingData);
                                  
                                  // Небольшая задержка перед перезагрузкой, чтобы сервер успел обработать запрос
                                  await new Promise(resolve => setTimeout(resolve, 500));
                                  
                                  // Перезагружаем данные из API, чтобы убедиться, что все синхронизировано
                                  await loadBookingsFromApi(viewMode === "overview");
                                  
                                  toast.success({ text: "Запись успешно создана" });
                                handleCloseDrawer();
                                } catch (error) {
                                  console.error("Failed to create booking:", error);
                                  toast.error({ text: "Не удалось создать запись" });
                                }
                              }
                            }}
                            disabled={!newPilatesTrainer}
                            style={{
                              flex: 1,
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              border: "1.5px solid transparent",
                              background: !newPilatesTrainer
                                ? "var(--muted)"
                                : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                              color: !newPilatesTrainer
                                ? "var(--muted-foreground)"
                                : "#fff",
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              cursor: !newPilatesTrainer ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (newPilatesTrainer) {
                                e.currentTarget.style.transform = "translateY(-1px)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            Создать
                          </button>
          </div>
        </>
      )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно подтверждения удаления для Body Mind */}
      <Modal
        open={showDeleteModal && drawerMode === "bodymind"}
        onClose={() => setShowDeleteModal(false)}
        title="Подтвердите удаление"
      >
        <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
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
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={async () => {
              if (selectedBodymindGroup && selectedBodymindGroup.bookingId) {
                try {
                  await deleteScheduleBooking(selectedBodymindGroup.bookingId);
                  
                  // Удаляем из локального состояния
                setScheduleGroups(prev => prev.filter(g => 
                  !(g.dayKey === selectedBodymindGroup.dayKey && 
                    g.time === selectedBodymindGroup.time && 
                    g.name === selectedBodymindGroup.name &&
                    g.date === selectedBodymindGroup.date)
                ));
                  
                  // Перезагружаем данные из API (для обзора загружаем только сегодня)
                  await loadBookingsFromApi(viewMode === "overview");
                  console.log("✓ Data reloaded from API after deletion");
                  
                  toast.success({ text: "Запись успешно удалена" });
                setShowDeleteModal(false);
                handleCloseDrawer();
                } catch (error) {
                  console.error("Failed to delete BodyMind booking:", error);
                  toast.error({ text: `Не удалось удалить запись: ${error instanceof Error ? error.message : "Неизвестная ошибка"}` });
                }
              } else if (selectedBodymindGroup) {
                // Если нет bookingId - просто удаляем из интерфейса
                const group = selectedBodymindGroup;
                setScheduleGroups(prev => prev.filter(g => 
                  !(g.dayKey === group.dayKey && 
                    g.time === group.time && 
                    g.name === group.name &&
                    g.date === group.date)
                ));
                setShowDeleteModal(false);
                handleCloseDrawer();
                toast.success({ text: "Запись удалена из интерфейса" });
              }
            }}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1.5px solid transparent",
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Удалить
          </button>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления для Pilates Reformer */}
      <Modal
        open={showDeleteModal && !!pilatesDeleteData}
        onClose={() => {
          // Не закрываем модальное окно, если оно только что открылось
          if (deleteModalJustOpened) {
            return;
          }
          setShowDeleteModal(false);
          setPilatesDeleteData(null);
        }}
        title="Подтвердите удаление"
      >
        <div style={{ padding: "1rem 0" }}>
          <p style={{ 
            marginBottom: "1.5rem", 
            color: "var(--foreground)",
            fontSize: "0.875rem",
            lineHeight: "1.5"
          }}>
            Вы уверены, что хотите удалить запись? Это действие нельзя отменить.
          </p>
          <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteModal(false);
                setPilatesDeleteData(null);
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
          >
            Отмена
          </button>
          <button
            type="button"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                if (!pilatesDeleteData) {
                  toast.error({ text: "Ошибка: данные для удаления не найдены" });
                  return;
                }
                
                try {
                  // Удаляем запись через API
                  await deleteScheduleBooking(pilatesDeleteData.bookingId);
                  
                  // Сразу удаляем из локального состояния
                  setScheduleTrainers(prev => 
                    prev.filter(t => t.bookingId !== pilatesDeleteData.bookingId)
                  );
                  
                  // Перезагружаем данные из API
                  await loadBookingsFromApi();
                  console.log("✓ Data reloaded from API after deletion");
                  
                  toast.success({ text: "Запись успешно удалена" });
                setShowDeleteModal(false);
                  setPilatesDeleteData(null);
                handleCloseDrawer();
                } catch (error) {
                  console.error("Failed to delete Pilates booking:", error);
                  toast.error({ text: `Не удалось удалить запись: ${error instanceof Error ? error.message : "Неизвестная ошибка"}` });
              }
            }}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: "1.5px solid transparent",
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Удалить
          </button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно подтверждения удаления (только для обычных записей, не для Pilates/BodyMind) */}
      <Modal
        open={showDeleteModal && !pilatesDeleteData && drawerMode !== "bodymind"}
        onClose={() => setShowDeleteModal(false)}
        title="Подтверждение удаления"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <p style={{ 
              fontSize: "0.9375rem", 
              color: "var(--foreground)",
              lineHeight: "1.6",
            }}>
              Вы уверены, что хотите удалить запись <strong>{selectedEvent?.clients && selectedEvent.clients.length > 0 ? selectedEvent.clients[0] : selectedEvent?.title}</strong>?
            </p>
            <p style={{ 
              fontSize: "0.8125rem", 
              color: "var(--muted-foreground)",
              marginTop: "0.5rem",
            }}>
              Это действие нельзя отменить.
            </p>
          </div>
          
          <div style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: "0.75rem 1.5rem",
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
              onClick={handleConfirmDelete}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                border: "1.5px solid transparent",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

