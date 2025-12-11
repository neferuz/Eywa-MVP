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

    const res = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers,
    });

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
      throw new Error(`API error ${res.status}: ${body || res.statusText}`);
    }

    // Если ответ пустой (например, 204 No Content) — возвращаем undefined
    if (res.status === 204) {
      return undefined as T;
    }

    const text = await res.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
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

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Неверный email или пароль");
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

export async function deleteTrainer(id: string): Promise<void> {
  await request<void>(`/api/trainers/${id}`, { method: "DELETE" });
}

// Clients API
export async function fetchClientsFromApi<TClient>(
  filters?: ClientFilters,
  init?: RequestInit,
): Promise<TClient[]> {
  const search = new URLSearchParams();

  if (filters?.query) search.set("query", filters.query);
  if (filters?.direction) search.set("direction", filters.direction);
  if (filters?.status) search.set("status", filters.status);

  const qs = search.toString() ? `?${search.toString()}` : "";
  return request<TClient[]>(`/api/clients${qs}`, init);
}

export async function fetchClientByIdFromApi<TClient>(
  id: string,
  init?: RequestInit,
): Promise<TClient | null> {
  try {
    return await request<TClient>(`/api/clients/${id}`, init);
  } catch (error) {
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
  direction?: "Body" | "Coworking" | "Coffee";
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

