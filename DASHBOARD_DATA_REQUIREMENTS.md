# Требования к данным для главного дашборда (`/`)

## Обзор
Главный дашборд отображает ключевые метрики и аналитику по всем направлениям бизнеса. Сейчас данные берутся из таблиц `dashboard_kpi`, `dashboard_load`, `dashboard_highlights`, но должны быть рассчитаны из реальных данных.

---

## 1. KPI карточки (4 карточки)

### 1.1. Выручка
- **Источник**: таблица `payments`
- **Расчет**: сумма `total_amount` за текущий период (месяц)
- **Сравнение**: сравнение с предыдущим периодом (прошлый месяц)
- **Формула изменения**: `((текущий_период - прошлый_период) / прошлый_период) * 100`
- **SQL логика**:
  ```sql
  -- Текущий месяц
  SELECT SUM(total_amount) as current_revenue
  FROM payments
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    AND status = 'completed';
  
  -- Прошлый месяц
  SELECT SUM(total_amount) as previous_revenue
  FROM payments
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND status = 'completed';
  ```
- **Формат отображения**: "2 450 000 ₽" (с пробелами для тысяч)
- **Тренд**: "up" если текущий > прошлый, иначе "down"

### 1.2. Расходы
- **Источник**: ⚠️ **Нужно создать таблицу `expenses`** или использовать существующую
- **Расчет**: сумма расходов за текущий период (месяц)
- **Сравнение**: сравнение с предыдущим периодом
- **SQL логика** (предполагаемая):
  ```sql
  SELECT SUM(amount) as current_expenses
  FROM expenses
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  ```
- **Формат отображения**: "1 120 000 ₽"
- **Тренд**: "down" если текущий < прошлый (хорошо), иначе "up"

### 1.3. Кол-во новых клиентов
- **Источник**: таблица `clients`
- **Расчет**: количество клиентов, созданных за текущий период (месяц)
- **Сравнение**: сравнение с предыдущим периодом
- **SQL логика**:
  ```sql
  -- Текущий месяц
  SELECT COUNT(*) as current_clients
  FROM clients
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
  
  -- Прошлый месяц
  SELECT COUNT(*) as previous_clients
  FROM clients
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  ```
- **Формат отображения**: "128" (без единиц измерения)
- **Тренд**: "up" если текущий > прошлый, иначе "down"

### 1.4. Кол-во записей на сегодня
- **Источник**: таблица `schedule_bookings`
- **Расчет**: количество записей на сегодняшний день
- **Сравнение**: сравнение с тем же днем недели на прошлой неделе (или вчера)
- **SQL логика**:
  ```sql
  -- Сегодня
  SELECT COUNT(*) as today_bookings
  FROM schedule_bookings
  WHERE booking_date = CURRENT_DATE;
  
  -- Прошлая неделя (тот же день недели)
  SELECT COUNT(*) as previous_bookings
  FROM schedule_bookings
  WHERE booking_date = CURRENT_DATE - INTERVAL '7 days';
  ```
- **Формат отображения**: "57" (без единиц измерения)
- **Тренд**: "up" если сегодня > прошлая неделя, иначе "down"

---

## 2. Загрузка по направлениям (4 карточки)

### 2.1. BODY
- **Источник**: таблица `schedule_bookings`
- **Расчет**: процент загрузки слотов за текущую неделю
- **Формула**: `(занятые слоты / всего слотов) * 100`
- **Занятые слоты**: записи со статусом `"Бронь"` или `"Оплачено"`
- **SQL логика**:
  ```sql
  WITH week_range AS (
    SELECT 
      DATE_TRUNC('week', CURRENT_DATE)::date as start_week,
      (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date as end_week
  )
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено')) as booked,
    COUNT(*) as total,
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено'))::float / 
       NULLIF(COUNT(*), 0)) * 100
    ) as load_percentage
  FROM schedule_bookings, week_range
  WHERE booking_date BETWEEN start_week AND end_week
    AND category IN ('Body Mind', 'Pilates Reformer');
  ```
- **Детали**: 
  - Количество залов: `SELECT COUNT(DISTINCT capsule_name) FROM schedule_bookings WHERE category IN ('Body Mind', 'Pilates Reformer') AND capsule_name IS NOT NULL`
  - Количество тренеров: `SELECT COUNT(DISTINCT trainer_name) FROM schedule_bookings WHERE category IN ('Body Mind', 'Pilates Reformer') AND trainer_name IS NOT NULL`
- **Формат отображения**: "78%" и "3 зала · 15 тренеров"

### 2.2. COWORKING
- **Источник**: таблица `schedule_bookings`
- **Расчет**: процент загрузки коворкинг-мест за текущую неделю
- **SQL логика**:
  ```sql
  WITH week_range AS (
    SELECT 
      DATE_TRUNC('week', CURRENT_DATE)::date as start_week,
      (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date as end_week
  )
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено')) as booked,
    COUNT(*) as total,
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено'))::float / 
       NULLIF(COUNT(*), 0)) * 100
    ) as load_percentage
  FROM schedule_bookings, week_range
  WHERE booking_date BETWEEN start_week AND end_week
    AND category = 'Коворкинг';
  ```
- **Детали**: 
  - Занятые места: `SUM(current_count)` для записей со статусом "Бронь" или "Оплачено"
  - Всего мест: сумма `max_capacity` всех записей или фиксированное количество мест
- **Формат отображения**: "71%" и "21/30 мест"

### 2.3. COFFEE
- **Источник**: таблица `payments` (услуги с `direction = 'Coffee'`)
- **Расчет**: можно использовать средний чек или количество транзакций
- **SQL логика** (средний чек):
  ```sql
  SELECT 
    COUNT(*) as transactions,
    AVG(total_amount) as avg_check
  FROM payments
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    AND service_category = 'Coffee'
    AND status = 'completed';
  ```
- **Альтернатива**: процент загрузки (если есть расписание для Coffee)
- **Формат отображения**: "64%" и "Avg чек 480 ₽"

### 2.4. KIDS
- **Источник**: таблица `schedule_bookings`
- **Расчет**: процент загрузки детских занятий за текущую неделю
- **SQL логика**:
  ```sql
  WITH week_range AS (
    SELECT 
      DATE_TRUNC('week', CURRENT_DATE)::date as start_week,
      (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date as end_week
  )
  SELECT 
    COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено')) as booked,
    COUNT(*) as total,
    ROUND(
      (COUNT(*) FILTER (WHERE status IN ('Бронь', 'Оплачено'))::float / 
       NULLIF(COUNT(*), 0)) * 100
    ) as load_percentage
  FROM schedule_bookings, week_range
  WHERE booking_date BETWEEN start_week AND end_week
    AND category = 'Eywa Kids';
  ```
- **Детали**: информация о группах (возрастные группы)
- **Формат отображения**: "58%" и "Группы 6-10 лет"

---

## 3. AI Highlights (3 карточки)

### 3.1. Источник данных
- **Вариант 1**: AI-генерируемый контент (требует интеграции с AI)
- **Вариант 2**: Статический контент из таблицы `dashboard_highlights`
- **Вариант 3**: Рассчитываемые инсайты на основе данных

### 3.2. Примеры инсайтов

#### Body: удержание +6%
- **Расчет**: сравнение количества активных абонементов с прошлым периодом
- **Источник**: таблица `clients` с `status = 'Активный'` и `direction = 'Body'`
- **SQL логика**:
  ```sql
  -- Текущий период
  SELECT COUNT(*) as active_subscriptions
  FROM clients
  WHERE direction = 'Body' 
    AND status = 'Активный'
    AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE);
  ```

#### Coffee: чек ↓3.2%
- **Расчет**: сравнение среднего чека с прошлым периодом
- **Источник**: таблица `payments` с `service_category = 'Coffee'`

#### Coworking: 2 отказа
- **Источник**: таблица `applications` или комментарии клиентов
- **Расчет**: количество отказов/жалоб за период

---

## 4. Период расчета

### По умолчанию
- **KPI**: текущий месяц vs прошлый месяц
- **Загрузка**: текущая неделя (понедельник - воскресенье)
- **Highlights**: текущий месяц

### Опционально
- Можно добавить фильтр по периоду через DateRangePicker
- Передача параметров `start_date` и `end_date` в API

---

## 5. API Endpoint

### Текущий endpoint
```
GET /api/dashboard/summary
```

### Предлагаемая структура ответа
```typescript
interface DashboardSummary {
  kpi: Array<{
    label: string;
    value: string;
    unit?: string | null;
    change: string;        // "+12.5%" или "-2.7%"
    trend: "up" | "down";
    icon: string;
    color: string;
  }>;
  load: Array<{
    label: string;         // "BODY", "COWORKING", "COFFEE", "KIDS"
    value: number;        // процент загрузки
    detail: string;       // "3 зала · 15 тренеров"
    color: string;
  }>;
  highlights: Array<{
    title: string;
    detail: string;
    tone: string;         // "positive", "warning", "neutral"
  }>;
}
```

---

## 6. Реализация

### 6.1. Обновить репозиторий `DashboardRepository`

Нужно добавить методы для расчета реальных данных:

```python
async def calculate_revenue(self, start_date: date, end_date: date) -> tuple[int, int]:
    """Рассчитать выручку за период и предыдущий период."""
    # Текущий период
    current = await self._sum_payments(start_date, end_date)
    # Предыдущий период (такой же по длительности)
    period_days = (end_date - start_date).days + 1
    prev_start = start_date - timedelta(days=period_days)
    prev_end = start_date - timedelta(days=1)
    previous = await self._sum_payments(prev_start, prev_end)
    return current, previous

async def calculate_new_clients(self, start_date: date, end_date: date) -> tuple[int, int]:
    """Рассчитать новых клиентов за период."""
    # Аналогично
    pass

async def calculate_today_bookings(self) -> tuple[int, int]:
    """Рассчитать записи на сегодня vs прошлая неделя."""
    today = date.today()
    last_week = today - timedelta(days=7)
    # ...
    pass

async def calculate_load(self, category: str, start_date: date, end_date: date) -> int:
    """Рассчитать загрузку для категории."""
    # ...
    pass
```

### 6.2. Обновить метод `fetch_summary`

Вместо чтения из таблиц `dashboard_kpi`, `dashboard_load`, `dashboard_highlights`, нужно:
1. Рассчитать все KPI из реальных данных
2. Рассчитать загрузку для каждого направления
3. Сгенерировать или получить highlights

---

## 7. Заметки

1. **Расходы**: Нужно решить, откуда брать данные о расходах. Возможно, нужна отдельная таблица `expenses`.

2. **COFFEE**: Нужно уточнить, как считать загрузку для Coffee. Возможно, это не загрузка слотов, а метрика по транзакциям/чеку.

3. **Период сравнения**: Для KPI используется сравнение с предыдущим периодом. Нужно четко определить:
   - Для месячных метрик: текущий месяц vs прошлый месяц
   - Для дневных метрик: сегодня vs тот же день недели на прошлой неделе

4. **Форматирование чисел**: 
   - Выручка/расходы: форматировать с пробелами для тысяч (2 450 000)
   - Проценты: округлять до целых (78%)

5. **AI Highlights**: Можно оставить статическими или реализовать простую логику генерации на основе данных.

---

## 8. Пример SQL запроса для полного расчета

```sql
-- Выручка за текущий месяц
WITH current_month_revenue AS (
  SELECT SUM(total_amount) as revenue
  FROM payments
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    AND status = 'completed'
),
previous_month_revenue AS (
  SELECT SUM(total_amount) as revenue
  FROM payments
  WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND status = 'completed'
)
SELECT 
  cm.revenue as current,
  pm.revenue as previous,
  ROUND(((cm.revenue - pm.revenue)::float / NULLIF(pm.revenue, 0)) * 100, 1) as change_percent
FROM current_month_revenue cm, previous_month_revenue pm;
```

