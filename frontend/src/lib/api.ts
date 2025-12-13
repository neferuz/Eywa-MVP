const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

type ClientFilters = {
  query?: string | null;
  direction?: "Body" | "Coworking" | "Coffee" | null;
  status?: "Активный" | "Новый" | "Ушедший" | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${path}`;
    console.log(`[API] ${init?.method || 'GET'} ${url}`, init);
    
    const res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers,
    });

    console.log(`[API] Response status: ${res.status}`, res);

    if (res.status === 404) {
      throw Object.assign(new Error("Not found"), { code: 404 });
    }

    if (res.status === 401) {
      // Токен невалидный или истек
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
      throw Object.assign(new Error("Unauthorized"), { code: 401 });
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`[API] Error ${res.status}:`, body);
      throw new Error(`API error ${res.status}: ${body || res.statusText}`);
    }

    // Если ответ пустой (например, 204 No Content) — возвращаем undefined
    if (res.status === 204) {
      return undefined as T;
    }

    const text = await res.text();
    console.log(`[API] Response text:`, text);
    if (!text) {
      return undefined as T;
    }
    const data = JSON.parse(text) as T;
    console.log(`[API] Parsed data:`, data);
    return data;
  } catch (error) {
    // Обрабатываем ошибки сети
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw Object.assign(
        new Error("Не удалось подключиться к серверу. Убедитесь, что бекенд запущен на http://localhost:8000"),
        { code: "CONNECTION_ERROR", originalError: error }
      );
    }
    throw error;
  }
}

// Auth API
export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserResponse = {
  id: number;
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
};

// Staff API
export type StaffMember = {
  id: number;
  name?: string | null;
  email: string;
  role: "super_admin" | "admin" | "manager";
  access: string[];
  is_active: boolean;
};

export type StaffCreateRequest = {
  name?: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "manager";
  access: string[];
  is_active?: boolean;
};

export async function loginApi(data: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    // Если сервер вернул HTML (например, Cloudflare/NGROK страница) — не пытаемся парсить JSON
    if (!contentType.includes("application/json")) {
      const body = await res.text();
      throw new Error(body || "Неверный email или пароль");
    }
    const body = await res.json().catch(async () => ({ detail: await res.text() }));
    throw new Error((body as { detail?: string }).detail || "Неверный email или пароль");
  }

  // Защита от HTML/текстовых ответов
  if (!contentType.includes("application/json")) {
    const body = await res.text();
    throw new Error(body || "Сервер вернул не-JSON ответ");
  }

  return res.json();
}

export async function getCurrentUserApi(): Promise<UserResponse> {
  return request<UserResponse>("/api/auth/me");
}

export async function fetchStaff(): Promise<StaffMember[]> {
  return request<StaffMember[]>("/api/staff");
}

export async function createStaff(data: StaffCreateRequest): Promise<StaffMember> {
  return request<StaffMember>("/api/staff", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      is_active: data.is_active ?? true,
    }),
  });
}

export async function updateStaff(id: number, data: Partial<StaffCreateRequest>): Promise<StaffMember> {
  return request<StaffMember>(`/api/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStaff(id: number): Promise<void> {
  await request<void>(`/api/staff/${id}`, { method: "DELETE" });
}

// Trainers API
export type Trainer = {
  id: string;
  full_name: string;
  phone: string;
  directions: string[];
  schedule?: string | null;
  comment?: string | null;
};

export type TrainerCreateRequest = {
  full_name: string;
  phone: string;
  directions: string[];
  schedule?: string | null;
  comment?: string | null;
};

export async function fetchTrainers(): Promise<Trainer[]> {
  return request<Trainer[]>("/api/trainers");
}

export async function fetchTrainerById(id: string): Promise<Trainer | null> {
  try {
    return await request<Trainer>(`/api/trainers/${id}`);
  } catch (error) {
    if ((error as { code?: number }).code === 404) {
      return null;
    }
    throw error;
  }
}

export async function createTrainer(payload: TrainerCreateRequest): Promise<Trainer> {
  return request<Trainer>("/api/trainers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTrainer(id: string, payload: Partial<TrainerCreateRequest>): Promise<Trainer> {
  return request<Trainer>(`/api/trainers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTrainer(id: string): Promise<void> {
  await request<void>(`/api/trainers/${id}`, { method: "DELETE" });
}

// Clients API
export async function fetchClientsFromApi<TClient>(
  filters?: ClientFilters,
  init?: RequestInit,
): Promise<TClient[]> {
  const search = new URLSearchParams();

  if (filters?.query && filters.query.trim()) {
    search.set("query", filters.query.trim());
  }
  if (filters?.direction) {
    search.set("direction", filters.direction);
  }
  if (filters?.status) {
    search.set("status", filters.status);
  }

  const qs = search.toString() ? `?${search.toString()}` : "";
  const url = `/api/clients${qs}`;
  console.log("Fetching clients from API:", url);
  return request<TClient[]>(url, init);
}

export async function fetchClientByIdFromApi<TClient>(
  id: string,
  init?: RequestInit,
): Promise<TClient | null> {
  try {
    console.log("=== FETCHING CLIENT ===", id);
    const url = `${API_BASE_URL}/api/clients/${id}`;
    console.log("=== FETCH URL ===", url);
    const result = await request<any>(`/api/clients/${id}`, {
      method: "GET",
      ...init,
    });
    console.log("=== FETCH RESULT (raw) ===", result);
    
    // Преобразуем snake_case в camelCase для совместимости
    if (result && typeof result === 'object') {
      const transformed = {
        ...result,
        contractNumber: result.contract_number ?? result.contractNumber,
        subscriptionNumber: result.subscription_number ?? result.subscriptionNumber,
        birthDate: result.birth_date ?? result.birthDate,
        activationDate: result.activation_date ?? result.activationDate,
        coachNotes: result.coach_notes ?? result.coachNotes,
      };
      console.log("=== FETCH RESULT (transformed) ===", transformed);
      return transformed as TClient;
    }
    
    return result as TClient;
  } catch (error) {
    console.error("=== FETCH ERROR ===", error);
    if ((error as { code?: number }).code === 404) {
      return null;
    }
    throw error;
  }
}

export type ClientCreateRequest = {
  name: string;
  phone: string;
  contractNumber?: string | null;
  subscriptionNumber?: string | null;
  birthDate?: string | null;
  instagram?: string | null;
  source?: "Instagram" | "Telegram" | "Рекомендации" | "Google";
  direction?: "Body" | "Coworking" | "Coffee" | "Pilates Reformer";
  status?: "Активный" | "Новый" | "Ушедший";
  contraindications?: string | null;
  coachNotes?: string | null;
};

export type ClientUpdateRequest = Partial<ClientCreateRequest>;

export async function createClient<TClient>(payload: ClientCreateRequest): Promise<TClient> {
  return request<TClient>("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateClient<TClient>(id: string, payload: ClientUpdateRequest): Promise<TClient> {
  return request<TClient>(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function addClientVisit<TClient>(id: string, visitDate?: string): Promise<TClient> {
  const url = visitDate 
    ? `/api/clients/${id}/visits?visit_date=${encodeURIComponent(visitDate)}`
    : `/api/clients/${id}/visits`;
  return request<TClient>(url, {
    method: "POST",
  });
}

export async function removeClientVisit<TClient>(id: string, visitDate: string): Promise<TClient> {
  const url = `/api/clients/${id}/visits?visit_date=${encodeURIComponent(visitDate)}`;
  return request<TClient>(url, {
    method: "DELETE",
  });
}

export async function deleteClient(id: string): Promise<void> {
  await request<void>(`/api/clients/${id}`, { method: "DELETE" });
}

export async function fetchDashboardSummary<TSummary>(
  init?: RequestInit,
): Promise<TSummary> {
  return request<TSummary>(`/api/dashboard/summary`, init);
}

export async function fetchTodayBookings<TBooking>(
  init?: RequestInit,
): Promise<TBooking[]> {
  return request<TBooking[]>(`/api/dashboard/today-bookings`, init);
}

// Applications API
export async function fetchApplicationsFromApi<TApplication>(
  filters?: { platform?: "instagram" | "telegram"; stage?: "inquiry" | "trial" | "sale" },
  init?: RequestInit,
): Promise<TApplication[]> {
  const search = new URLSearchParams();
  if (filters?.platform) search.set("platform", filters.platform);
  if (filters?.stage) search.set("stage", filters.stage);

  const qs = search.toString() ? `?${search.toString()}` : "";
  return request<TApplication[]>(`/api/applications${qs}`, init);
}

export async function fetchApplicationByIdFromApi<TApplication>(
  id: string,
  init?: RequestInit,
): Promise<TApplication | null> {
  try {
    return await request<TApplication>(`/api/applications/${id}`, init);
  } catch (error) {
    if ((error as { code?: number }).code === 404) {
      return null;
    }
    throw error;
  }
}

// Services API
export type BodyService = {
  id: string;
  name: string;
  category: string;
  direction: "Body" | "Coworking" | "Coffee" | "Kids";
  duration_minutes: string;
  price: number;
  description?: string | null;
};

export type BodyServiceCreate = {
  name: string;
  category: string;
  direction?: "Body" | "Coworking" | "Coffee" | "Kids";
  duration_minutes: string;
  price: number;
  description?: string | null;
};

export type BodyServiceUpdate = Partial<BodyServiceCreate>;

export async function fetchBodyServices(): Promise<BodyService[]> {
  return request<BodyService[]>("/api/services");
}

export async function createBodyService(payload: BodyServiceCreate): Promise<BodyService> {
  return request<BodyService>("/api/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBodyService(id: string, payload: BodyServiceUpdate): Promise<BodyService> {
  return request<BodyService>(`/api/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteBodyService(id: string): Promise<void> {
  await request<void>(`/api/services/${id}`, { method: "DELETE" });
}

// Kids Services API (используют те же endpoints, но фильтруются по direction="Kids")
export type KidsService = BodyService;
export type KidsServiceCreate = Omit<BodyServiceCreate, "direction"> & { direction?: "Kids" };
export type KidsServiceUpdate = Partial<KidsServiceCreate>;

export async function fetchKidsServices(): Promise<KidsService[]> {
  const allServices = await request<BodyService[]>("/api/services");
  return allServices.filter(s => s.direction === "Kids");
}

export async function createKidsService(payload: KidsServiceCreate): Promise<KidsService> {
  return request<KidsService>("/api/services", {
    method: "POST",
    body: JSON.stringify({ ...payload, direction: "Kids" }),
  });
}

export async function updateKidsService(id: string, payload: KidsServiceUpdate): Promise<KidsService> {
  return request<KidsService>(`/api/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteKidsService(id: string): Promise<void> {
  await request<void>(`/api/services/${id}`, { method: "DELETE" });
}

// Marketing API
export type MarketingTrafficChannel = {
  id: string;
  name: string;
  accent: string;
  leads: number;
  inquiry: number;
  trial: number;
  sale: number;
  conversion: number;
};

export type MarketingTrafficSummary = {
  total_leads: number;
  total_sales: number;
  total_trials: number;
  conversion: number;
};

export type MarketingTrafficTrendPoint = {
  date: string;
  leads: number;
};

export type MarketingTrafficResponse = {
  summary: MarketingTrafficSummary;
  channels: MarketingTrafficChannel[];
  trend: MarketingTrafficTrendPoint[];
};

export async function fetchMarketingTraffic(init?: RequestInit): Promise<MarketingTrafficResponse> {
  return request<MarketingTrafficResponse>("/api/marketing/traffic", init);
}

// Marketing conversions
export type MarketingConversionRow = {
  id: string;
  channel: string;
  accent: string;
  leads: number;
  bookings: number;
  visits: number;
  sales: number;
  conversion: number;
};

export type MarketingConversionsResponse = {
  rows: MarketingConversionRow[];
};

export async function fetchMarketingConversions(init?: RequestInit): Promise<MarketingConversionsResponse> {
  return request<MarketingConversionsResponse>("/api/marketing/conversions", init);
}

// Coworking places API
export type CoworkingPlace = {
  id: string;
  name: string;
  description?: string | null;
  type: "capsule" | "event";
  seats: number;
  price_1h?: number | null;
  price_3h?: number | null;
  price_day?: number | null;
  price_month?: number | null;
};

export type CoworkingPlaceCreate = Omit<CoworkingPlace, "id">;
export type CoworkingPlaceUpdate = Partial<CoworkingPlaceCreate>;

export async function fetchCoworkingPlaces(): Promise<CoworkingPlace[]> {
  return request<CoworkingPlace[]>("/api/coworking/places");
}

export async function createCoworkingPlace(payload: CoworkingPlaceCreate): Promise<CoworkingPlace> {
  return request<CoworkingPlace>("/api/coworking/places", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCoworkingPlace(id: string, payload: CoworkingPlaceUpdate): Promise<CoworkingPlace> {
  return request<CoworkingPlace>(`/api/coworking/places/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCoworkingPlace(id: string): Promise<void> {
  await request<void>(`/api/coworking/places/${id}`, { method: "DELETE" });
}

// Categories API
export type ServiceCategory = {
  id: string;
  name: string;
  icon?: string | null;
  accent?: string | null;
};

export type ServiceCategoryCreate = {
  name: string;
  icon?: string | null;
  accent?: string | null;
};

export type ServiceCategoryUpdate = Partial<ServiceCategoryCreate>;

export async function fetchCategories(): Promise<ServiceCategory[]> {
  return request<ServiceCategory[]>("/api/categories");
}

export async function createCategory(payload: ServiceCategoryCreate): Promise<ServiceCategory> {
  return request<ServiceCategory>("/api/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id: string, payload: ServiceCategoryUpdate): Promise<ServiceCategory> {
  return request<ServiceCategory>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await request<void>(`/api/categories/${id}`, { method: "DELETE" });
}

// Payment Services API
export type PaymentServiceCategory = {
  id: number;
  public_id: string;
  name: string;
  description: string | null;
  accent: string;
};

export type PaymentServiceCategoryCreate = {
  name: string;
  description?: string | null;
  accent?: string;
};

export type PaymentServiceCategoryUpdate = Partial<PaymentServiceCategoryCreate>;

export type PaymentService = {
  id: number;
  public_id: string;
  category_id: number;
  name: string;
  price: number;
  price_label: string;
  billing: "perHour" | "perService" | "custom";
  hint?: string | null;
  description?: string | null;
  duration?: string | null;
  trainer?: string | null;
};

export type PaymentServiceCreate = {
  category_id: number;
  name: string;
  price: number;
  price_label: string;
  billing?: "perHour" | "perService" | "custom";
  hint?: string | null;
  description?: string | null;
  duration?: string | null;
  trainer?: string | null;
};

export type PaymentServiceUpdate = Partial<PaymentServiceCreate>;

export async function fetchPaymentServiceCategories(): Promise<PaymentServiceCategory[]> {
  return request<PaymentServiceCategory[]>("/api/payment-services/categories");
}

export async function createPaymentServiceCategory(payload: PaymentServiceCategoryCreate): Promise<PaymentServiceCategory> {
  return request<PaymentServiceCategory>("/api/payment-services/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePaymentServiceCategory(id: string, payload: PaymentServiceCategoryUpdate): Promise<PaymentServiceCategory> {
  return request<PaymentServiceCategory>(`/api/payment-services/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePaymentServiceCategory(id: string): Promise<void> {
  await request<void>(`/api/payment-services/categories/${id}`, { method: "DELETE" });
}

export async function fetchPaymentServices(): Promise<PaymentService[]> {
  return request<PaymentService[]>("/api/payment-services");
}

export async function fetchPaymentServicesByCategory(categoryId: number): Promise<PaymentService[]> {
  return request<PaymentService[]>(`/api/payment-services/categories/${categoryId}/services`);
}

export async function createPaymentService(payload: PaymentServiceCreate): Promise<PaymentService> {
  return request<PaymentService>("/api/payment-services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePaymentService(id: string, payload: PaymentServiceUpdate): Promise<PaymentService> {
  return request<PaymentService>(`/api/payment-services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePaymentService(id: string): Promise<void> {
  await request<void>(`/api/payment-services/${id}`, { method: "DELETE" });
}

// Payment types and functions
export type Payment = {
  id: number;
  public_id: string;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  service_id: string | null;
  service_name: string;
  service_category: string | null;
  total_amount: number;
  cash_amount: number;
  transfer_amount: number;
  quantity: number;
  hours: number | null;
  comment: string | null;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type PaymentCreate = {
  client_id?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  service_id?: string | null;
  service_name: string;
  service_category?: string | null;
  total_amount: number;
  cash_amount?: number;
  transfer_amount?: number;
  quantity?: number;
  hours?: number | null;
  comment?: string | null;
  status?: "pending" | "completed" | "cancelled";
};

export type PaymentUpdate = {
  client_id?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  service_category?: string | null;
  total_amount?: number;
  cash_amount?: number;
  transfer_amount?: number;
  quantity?: number;
  hours?: number | null;
  comment?: string | null;
  status?: "pending" | "completed" | "cancelled";
};

export async function fetchPayments(service_name?: string, client_id?: string): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (service_name) params.append("service_name", service_name);
  if (client_id) params.append("client_id", client_id);
  const query = params.toString();
  return request<Payment[]>(`/api/payments${query ? `?${query}` : ""}`);
}

export async function createPayment(payload: PaymentCreate): Promise<Payment> {
  return request<Payment>("/api/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePayment(payment_id: string, payload: PaymentUpdate): Promise<Payment> {
  return request<Payment>(`/api/payments/${payment_id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePayment(payment_id: string): Promise<void> {
  return request<void>(`/api/payments/${payment_id}`, {
    method: "DELETE",
  });
}

// Schedule Bookings API
export type ScheduleBookingClient = {
  client_id: string;
  client_name: string;
  client_phone?: string | null;
};

export type ScheduleBooking = {
  id?: string; // Может отсутствовать из-за алиаса в Pydantic
  public_id?: string; // Алиас для id в Pydantic схеме
  booking_date: string; // ISO date string
  booking_time: string; // HH:MM format
  category: string; // "Body Mind", "Pilates Reformer", etc.
  service_name?: string | null; // Для Body Mind
  trainer_id?: string | null;
  trainer_name?: string | null;
  clients: ScheduleBookingClient[];
  max_capacity: number;
  current_count: number;
  status: "Бронь" | "Оплачено" | "Свободно";
  notes?: string | null;
  capsule_id?: string | null;
  capsule_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ScheduleBookingCreate = {
  booking_date: string; // ISO date string
  booking_time: string; // HH:MM format
  category: string;
  service_name?: string | null;
  trainer_id?: string | null;
  trainer_name?: string | null;
  clients: ScheduleBookingClient[];
  max_capacity: number;
  current_count?: number;
  status?: "Бронь" | "Оплачено" | "Свободно";
  notes?: string | null;
  capsule_id?: string | null;
  capsule_name?: string | null;
};

export type ScheduleBookingUpdate = Partial<ScheduleBookingCreate>;

export type ScheduleBookingFilters = {
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  category?: string;
  trainer_id?: string;
  booking_status?: "Бронь" | "Оплачено" | "Свободно";
};

export async function fetchScheduleBookings(
  filters?: ScheduleBookingFilters
): Promise<ScheduleBooking[]> {
  const search = new URLSearchParams();
  if (filters?.start_date) search.set("start_date", filters.start_date);
  if (filters?.end_date) search.set("end_date", filters.end_date);
  if (filters?.category) search.set("category", filters.category);
  if (filters?.trainer_id) search.set("trainer_id", filters.trainer_id);
  if (filters?.booking_status) search.set("booking_status", filters.booking_status);

  const qs = search.toString() ? `?${search.toString()}` : "";
  return request<ScheduleBooking[]>(`/api/schedule/bookings${qs}`);
}

export async function fetchScheduleBookingById(id: string): Promise<ScheduleBooking | null> {
  try {
    return await request<ScheduleBooking>(`/api/schedule/bookings/${id}`);
  } catch (error) {
    if ((error as { code?: number }).code === 404) {
      return null;
    }
    throw error;
  }
}

export async function createScheduleBooking(
  payload: ScheduleBookingCreate
): Promise<ScheduleBooking> {
  return request<ScheduleBooking>("/api/schedule/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateScheduleBooking(
  id: string,
  payload: ScheduleBookingUpdate
): Promise<ScheduleBooking> {
  return request<ScheduleBooking>(`/api/schedule/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteScheduleBooking(id: string): Promise<void> {
  await request<void>(`/api/schedule/bookings/${id}`, { method: "DELETE" });
}

// Body Schedule Analytics API
export type OverviewStats = {
  total_slots: number;
  booked_slots: number;
  load_percentage: number;
};

export type GroupAnalytics = {
  id: string;
  name: string;
  label: string;
  total_classes: number;
  total_bookings: number;
  load: number;
  coaches: string[];
  avg_occupancy: number;
};

export type CoachLoad = {
  name: string;
  load: number;
  classes: number;
};

export type RoomLoad = {
  room: string;
  load: number;
};

export type BodyScheduleAnalytics = {
  overview: OverviewStats;
  groups: GroupAnalytics[];
  coaches: CoachLoad[];
  rooms: RoomLoad[];
};

export async function fetchBodyScheduleAnalytics(
  startDate?: string,
  endDate?: string
): Promise<BodyScheduleAnalytics> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  
  const queryString = params.toString();
  const url = `/api/body/schedule/analytics${queryString ? `?${queryString}` : ""}`;
  
  return request<BodyScheduleAnalytics>(url);
}

// AI Assistant API
export type AIAssistantMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type AIAssistantRequest = {
  message: string;
  conversation_history?: Array<{ role: string; content: string }> | null;
};

export type AIAssistantResponse = {
  message: string;
  data?: Record<string, any> | null;
};

export async function chatWithAIAssistant(
  payload: AIAssistantRequest
): Promise<AIAssistantResponse> {
  return request<AIAssistantResponse>("/api/ai-assistant/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAIAssistantStats(): Promise<Record<string, any>> {
  return request<Record<string, any>>("/api/ai-assistant/stats");
}

// TTS API (ElevenLabs)
export async function textToSpeech(text: string): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/api/tts/speak`;
  
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`TTS error ${res.status}: ${errorText || res.statusText}`);
  }

  return await res.blob();
}

export async function getElevenLabsVoices(): Promise<{
  all_voices: any[];
  russian_female_voices: any[];
  recommended: any | null;
}> {
  return request<{
    all_voices: any[];
    russian_female_voices: any[];
    recommended: any | null;
  }>("/api/tts/voices");
}

