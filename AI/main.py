import asyncio
import logging
import os
from datetime import datetime

import httpx
from dotenv import load_dotenv
from telegram import Update
from telegram.constants import ChatAction
from telegram.error import Conflict
from telegram.ext import (
    ApplicationBuilder,
    ContextTypes,
    MessageHandler,
    CommandHandler,
    filters,
)


load_dotenv()

# Настройки из переменных окружения
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# OpenAI-совместимый API Timeweb c path-агентом:
# База: https://agent.timeweb.cloud/api/v1/cloud-ai/agents/{agent_access_id}/v1
TIMEWEB_AGENT_ID = os.getenv("TIMEWEB_AGENT_ID", "1af046ad-5883-4892-bfdb-1127177454ea")
# Секретный API-токен Timeweb Cloud (API-ключ из https://timeweb.cloud/my/api-keys)
TIMEWEB_API_TOKEN = os.getenv("TIMEWEB_API_TOKEN", "")

# URL бекенда для отправки заявок
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

if not TELEGRAM_BOT_TOKEN:
    raise RuntimeError(
        "Пожалуйста, задайте переменную окружения TELEGRAM_BOT_TOKEN "
        "с токеном бота Telegram."
    )

if not TIMEWEB_API_TOKEN:
    raise RuntimeError(
        "Пожалуйста, задайте переменную окружения TIMEWEB_API_TOKEN "
        "c API-ключом из раздела API-ключей Timeweb Cloud."
    )


logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# Полный системный промт Азизы
PROMPT_AZIZA = """🧩 1. ROLE — РОЛЬ АЗИЗЫ
Ты — Азиза, виртуальный администратор пространства EYWA.
Ты общаешься мягко, дружелюбно, короткими сообщениями, как реальный человек.
Ты не говоришь, что ты бот/ИИ.

Стиль общения:

1–2 предложения в абзаце

2–4 абзаца в одном сообщении

пустые строки между блоками

тёплый тон

эмодзи 🌿 🤍

обращение по имени

один вопрос за раз

без давления

без сухих справок

не перечислять много в одном абзаце

Важно: сообщения ВСЕГДА форматируются красиво, как Telegram:
коротко → абзац → пробел → следующий абзац.

🎯 2. МИССИЯ АЗИЗЫ (ТОЛЬКО PRE‑SALE ПЕРИОД)
До открытия студии Азиза:

✓ Консультирует
— форматы занятий (Reformer / Body & Mind)
— тренеров
— пространства (коворкинг, event, детская зона, кофейня)

✓ Продаёт PRE‑SALE абонементы
— объясняет условия
— собирает имя + телефон
— передаёт менеджеру

✓ Добавляет клиентов в лист ожидания
✓ Передаёт сложные вопросы менеджеру
🚫 3. ЧЕГО АЗИЗА НЕ ДЕЛАЕТ
🔸 не записывает на тренировки
🔸 не предлагает время / расписание
🔸 не показывает слоты
🔸 не собирает данные по коворкингу / event / детской зоне
🔸 не называет расписание тренеров
🔸 не придумывает услуги/цены
🔸 не обещает конкретные даты

👋 4. START MESSAGE (обязательное)
Всегда начинать общение так:

«Здравствуйте 🌿 Я Азиза, администратор EYWA.
Рада познакомиться! Я могу рассказать вам больше о нашем пространстве и условиях PRE‑SALE на абонементы.»

🧭 5. ОБЩАЯ ЛОГИКА (FLOW)
Приветствие

Узнать имя

Короткое «приятно познакомиться»

Понять запрос

Дать мягкое объяснение (короткими абзацами)

Один уточняющий вопрос

Если интерес к абонементу → PRE‑SALE

Сбор данных (имя + телефон)

Передача менеджеру

🌟 6. PRE‑SALE — ГЛАВНЫЙ БЛОК
Активируется при запросах:
«купить», «сколько стоит», «что входит», «как оплатить», «когда открытие», «какой выбрать», «можно несколько».

⭐ 6.1 Основной текст
«Спасибо за ваш интерес 🌿
Сейчас действует PRE‑SALE — можно приобрести абонементы заранее по специальной цене до открытия студии.»

⭐ 6.2 Абонементы (всегда в отдельных абзацах)
Reformer — 12 занятий / месяц
Мини‑группа до 4 человек
PRE‑SALE: 1 750 000 сум
Обычная цена: 2 500 000 сум

Body & Mind — 12 занятий / месяц
Группа до 10 человек
PRE‑SALE: 1 600 000 сум
Обычная цена: 2 000 000 сум

⭐ 6.3 Объяснение форматов (готовые фразы)
Reformer — коротко
«Reformer — это тренировки на специальном оборудовании в мини‑группе до 4 человек.
Подходит тем, кому важно больше внимания тренера и качественная техника.»

Reformer — расширенно
«Reformer — это глубокая проработка тела в мини‑группе до 4 человек.
Тренер помогает выстроить технику и заниматься мягко и безопасно.»

Body & Mind — коротко
«Body & Mind включает йогу, пилатес, стретчинг и зумбу.
Подходит для тонуса, баланса и мягкого восстановления.»

Body & Mind — расширенно
«Body & Mind — это комплексный формат: йога, пилатес, стретчинг и зумба.
Помогает снизить напряжение, мягко укрепиться и наполниться энергией.»

⭐ 6.4 FAQ (короткие блоки)
Когда открытие?
«Мы открываемся в декабре 🌿»

Когда будет расписание?
«Расписание появится к открытию.
Клиенты с PRE‑SALE выбирают время первыми.»

Почему цена ниже?
«PRE‑SALE — это минимальная цена до открытия студии.»

Можно купить несколько?
«Да, конечно 🤍 Напишите количество — я передам менеджеру.»

📲 7. СБОР ДАННЫХ (ТОЛЬКО ДЛЯ PRE‑SALE)
Когда клиент заинтересован:

«Чтобы передать заявку менеджеру, напишите, пожалуйста, ваше имя и номер телефона 🤍»

После получения:

«Спасибо 🌿 Передаю вашу заявку. Менеджер свяжется с вами в ближайшее время.»

👥 8. ТРЕНЕРЫ (информационный блок)
Евгения Ларионова — Pilates Reformer / Stretching
Нигина Нажмидинова — Pilates Mat / Stretching / Acrobatics
Ангелина Узакова — Reformer
Антонина Пенкина — Reformer
Ирина Гущина — Yoga
Гавхар Нурданова — Yoga
Севара Сафоева — Stretching
Камила Алиш — Pilates Mat / Reformer
Эльвира Ибрагимова — Zumba

❗ Азиза не называет расписание тренеров.

🟫 9. КОВОРКИНГ
Только информирование.

«Коворкинг будет доступен после открытия 🌿
В капсулах — стол, стул, зеркало, Wi‑Fi и принтер.
Стоимость: 50 000 сум/час.»

🟪 10. EVENT ZONE
«Event Zone рассчитана до 15 человек 🌿
Оснащение: проектор, экран, звук, свет.
Тарифы: 2 часа — 1 500 000 / 4 часа — 2 000 000 / доп. час — 350 000.»

🟡 11. ДЕТСКАЯ ЗОНА
«Детская зона откроется в декабре 🌿
Возраст: 3–10 лет
Стоимость: 30 000 сум/час.»

☕ 12. КОФЕЙНЯ
«Да, у нас будет формат кофе с собой 🤍
Кофейня начнёт работать после открытия студии.»

🔁 13. FALLBACK
«Хочу помочь, но немного не поняла. Подскажите, пожалуйста? 🌿»

🧩 14. ЭСКАЛАЦИЯ МЕНЕДЖЕРУ
Если номера нет:
«Чтобы уточнить точно, мне нужен ваш номер телефона 🤍 Передам менеджеру.»

Если номер есть:
«Спасибо 🌿 Передаю ваш вопрос менеджеру — он уточнит подробнее.»
🧠 ПАМЯТЬ О КЛИЕНТЕ (в рамках текущего чата)

Если клиент назвал своё имя — запомни его до конца диалога.

Повторно имя не спрашивай.

Фразу «Очень приятно» можно использовать только один раз.

Стандартное приветствие используется только в самом первом сообщении.

Если клиент возвращается позже — не начинай снова с приветствия, просто продолжай помогать.

Используй имя клиента естественно, не слишком часто (примерно раз в 3–4 сообщения).

Не задавай вопросы, на которые клиент уже отвечал.

Когда просишь номер телефона — обязательно приводи пример формата в скобках, например:
«Напишите, пожалуйста, ваш номер телефона (формат: +998 90 123 45 67)».


"""


# Простая память диалогов в оперативке (по chat_id)
chat_history: dict[int, list[dict]] = {}


def get_tashkent_datetime() -> str:
    """Получить текущую дату и время в Ташкенте (UTC+5) в читаемом формате."""
    from zoneinfo import ZoneInfo

    tashkent_tz = ZoneInfo("Asia/Tashkent")
    now = datetime.now(tashkent_tz)

    # Дни недели на русском
    weekdays = [
        "понедельник",
        "вторник",
        "среда",
        "четверг",
        "пятница",
        "суббота",
        "воскресенье",
    ]

    weekday_name = weekdays[now.weekday()]
    date_str = now.strftime("%d.%m.%Y")
    time_str = now.strftime("%H:%M")

    return f"{weekday_name}, {date_str}, {time_str} (время Ташкента, UTC+5)"


async def start(update: Update, _context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик /start: обнуляем память диалога и начинаем сначала."""
    chat_id = update.effective_chat.id
    # Полностью очищаем локальную историю для этого чата
    chat_history.pop(chat_id, None)

    # Небольшое приветствие, дальше всё ведёт агент Азиза
    text = (
        "Здравствуйте 🌿 Я Азиза, администратор EYWA. Как могу к вам обращаться?\n\n"
        "Чем могу помочь: занятия Body & Mind, коворкинг, Event Zone, детская зона или кофе с собой?"
    )
    message = update.message or update.business_message
    if message:
        await message.reply_text(text)


async def reset(update: Update, _context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик /reset: ручной сброс памяти по запросу пользователя."""
    chat_id = update.effective_chat.id
    chat_history.pop(chat_id, None)
    message = update.message or update.business_message
    if message:
        await message.reply_text(
            "Хорошо 🌿 Начнём заново. Напишите, пожалуйста, как вас зовут?"
        )


def detect_stage(user_text: str, history: list[dict]) -> str:
    """Определить стадию заявки на основе сообщения и истории"""
    text_lower = user_text.lower()

    # Ключевые слова для определения стадии
    sale_keywords = [
        "оплатил",
        "перевел",
        "перевела",
        "оплатила",
        "оплатил",
        "деньги",
        "чек",
        "договор",
    ]
    trial_keywords = [
        "запишите",
        "записать",
        "пробный",
        "пробное",
        "запись",
        "записаться",
    ]
    inquiry_keywords = [
        "сколько",
        "стоит",
        "цена",
        "стоимость",
        "график",
        "расписание",
        "есть ли",
        "можно ли",
    ]

    # Проверяем на оплату (sale)
    if any(keyword in text_lower for keyword in sale_keywords):
        return "sale"

    # Проверяем на запись (trial)
    if any(keyword in text_lower for keyword in trial_keywords):
        return "trial"

    # Проверяем на вопрос (inquiry)
    if any(keyword in text_lower for keyword in inquiry_keywords):
        return "inquiry"

    # Если в истории есть упоминание о записи, но не оплате - trial
    history_text = " ".join([msg.get("content", "").lower() for msg in history])
    if any(keyword in history_text for keyword in trial_keywords) and not any(
        keyword in history_text for keyword in sale_keywords
    ):
        return "trial"

    # По умолчанию - inquiry
    return "inquiry"


def extract_name_from_history(history: list[dict]) -> str | None:
    """Извлечь имя клиента из истории диалога"""
    for msg in history:
        content = msg.get("content", "")
        # Простая эвристика: ищем фразы типа "меня зовут", "я ...", "это ..."
        if "зовут" in content.lower() or "меня зовут" in content.lower():
            # Пытаемся извлечь имя после "зовут"
            parts = content.split("зовут")
            if len(parts) > 1:
                name = parts[1].strip().split()[0] if parts[1].strip() else None
                if name:
                    return name
    return None


async def send_application_to_backend(
    chat_id: int,
    user_text: str,
    history: list[dict],
    username: str | None = None,
) -> bool:
    """Отправить заявку в бекенд"""
    try:
        stage = detect_stage(user_text, history)

        # Извлекаем имя из истории
        name = extract_name_from_history(history)
        if not name:
            # Если имени нет, используем username или "Клиент"
            name = username or "Клиент"

        # Формируем историю чата для отправки - сохраняем ВСЮ историю
        # Используем всю историю из chat_history (не ограничиваем 10 сообщениями)
        chat_messages = []
        for i, msg in enumerate(history, 1):  # ВСЯ история, не только последние 10
            # Создаем уникальный ID на основе индекса и содержимого
            msg_id = f"{chat_id}_{i}_{hash(msg.get('content', '')) % 1000000}"
            chat_messages.append(
                {
                    "id": msg_id,
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                    "timestamp": datetime.now().strftime("%H:%M"),
                }
            )

        # Определяем бюджет (если есть в сообщении)
        budget = None
        budget_keywords = ["до", "рассматривает", "занятий", "$", "сум"]
        if any(keyword in user_text.lower() for keyword in budget_keywords):
            # Простая эвристика для извлечения бюджета
            words = user_text.split()
            for i, word in enumerate(words):
                if word.lower() in ["до", "рассматривает"] and i + 1 < len(words):
                    budget = " ".join(words[i : i + 3])
                    break

        application_data = {
            "name": name,
            "username": username or f"@{name.lower().replace(' ', '_')}",
            "phone": None,
            "platform": "telegram",
            "stage": stage,
            "message": user_text,
            "budget": budget,
            "owner": "CRM-бот",
            "chat_history": chat_messages,
            "telegram_chat_id": chat_id,
        }

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0)
        ) as client:
            # Проверяем, есть ли уже заявка для этого chat_id
            try:
                check_response = await client.get(
                    f"{BACKEND_URL}/api/applications/telegram/{chat_id}"
                )
                if check_response.status_code == 200:
                    # Обновляем существующую заявку
                    app_data = check_response.json()
                    update_data = {
                        "stage": stage,
                        "message": user_text,
                        "budget": budget,
                        "chat_history": chat_messages,
                    }
                    response = await client.patch(
                        f"{BACKEND_URL}/api/applications/{app_data['id']}",
                        json=update_data,
                    )
                else:
                    # Создаем новую заявку
                    response = await client.post(
                        f"{BACKEND_URL}/api/applications",
                        json=application_data,
                    )
            except (
                httpx.HTTPStatusError,
                httpx.ConnectError,
                httpx.ReadError,
                httpx.TimeoutException,
            ):
                # Если заявки нет или ошибка подключения, пробуем создать новую
                try:
                    response = await client.post(
                        f"{BACKEND_URL}/api/applications",
                        json=application_data,
                    )
                    response.raise_for_status()
                    logger.info(
                        f"Заявка успешно создана в бекенд: {response.status_code}"
                    )
                    return True
                except (
                    httpx.ConnectError,
                    httpx.ReadError,
                    httpx.TimeoutException,
                ) as conn_err:
                    logger.warning(
                        f"Бекенд недоступен ({BACKEND_URL}): {conn_err}. Заявка не сохранена, но бот продолжает работать."
                    )
                    return False
                except Exception as create_err:
                    logger.warning(f"Ошибка при создании заявки: {create_err}")
                    return False

            response.raise_for_status()
            logger.info(f"Заявка успешно отправлена в бекенд: {response.status_code}")
            return True
    except (httpx.ConnectError, httpx.ReadError, httpx.TimeoutException) as e:
        logger.warning(
            f"Бекенд недоступен ({BACKEND_URL}): {e}. Заявка не сохранена, но бот продолжает работать."
        )
        return False
    except Exception as e:
        logger.exception(f"Ошибка при отправке заявки в бекенд: {e}")
        return False


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Основной обработчик сообщений — проксируем в Timeweb AI агента."""
    # Обрабатываем как обычные сообщения, так и сообщения из бизнес-аккаунта
    message = update.message or update.business_message
    if message is None or not message.text:
        return

    # Для бизнес-сообщений нужен другой подход
    is_business = update.business_message is not None
    business_connection_id = None

    if is_business:
        # Для бизнес-сообщений используем business_connection_id
        if update.business_connection:
            business_connection_id = update.business_connection.id
        elif hasattr(update.business_message, "business_connection_id"):
            business_connection_id = update.business_message.business_connection_id

        # В бизнес-сообщениях chat_id - это ID пользователя, который написал
        chat_id = update.business_message.chat.id
        user = (
            update.business_message.from_user
            if hasattr(update.business_message, "from_user")
            else update.effective_user
        )
        username = user.username if user else None
        logger.info(
            f"Бизнес-сообщение от пользователя: {username}, chat_id: {chat_id}, business_connection_id: {business_connection_id}"
        )
    else:
        chat_id = update.effective_chat.id
        username = update.effective_user.username if update.effective_user else None
        logger.info(
            f"Обычное сообщение от пользователя: {username}, chat_id: {chat_id}"
        )

    user_text = message.text

    # Показываем, что Ассистент «печатает»
    try:
        if is_business:
            # Для бизнес-сообщений пробуем с business_connection_id, если доступен
            if business_connection_id:
                try:
                    await context.bot.send_chat_action(
                        chat_id=chat_id,
                        action=ChatAction.TYPING,
                        business_connection_id=business_connection_id,
                    )
                except Exception as e:
                    logger.warning(
                        f"Не удалось отправить chat_action с business_connection_id: {e}. Пробуем без него."
                    )
                    # Пробуем без business_connection_id (может работать для некоторых случаев)
                    try:
                        await context.bot.send_chat_action(
                            chat_id=chat_id, action=ChatAction.TYPING
                        )
                    except Exception as e2:
                        logger.warning(
                            f"Не удалось отправить chat_action без business_connection_id: {e2}"
                        )
            else:
                # Если business_connection_id нет, пробуем обычный способ
                try:
                    await context.bot.send_chat_action(
                        chat_id=chat_id, action=ChatAction.TYPING
                    )
                except Exception as e:
                    logger.warning(
                        f"Не удалось отправить chat_action для бизнес-сообщения: {e}"
                    )
        else:
            # Для обычных сообщений
            await context.bot.send_chat_action(
                chat_id=chat_id, action=ChatAction.TYPING
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить chat_action: {e}. Продолжаем обработку.")

    # Собираем историю сообщений для более естественного диалога
    history = chat_history.get(chat_id, [])
    history.append({"role": "user", "content": user_text})

    # Ограничим историю последними 15 сообщениями, чтобы не раздувать запрос
    history = history[-15:]

    # Получаем текущую дату и время в Ташкенте
    current_datetime = get_tashkent_datetime()

    # Формируем системный промт с актуальной информацией о дате/времени
    system_prompt_with_datetime = (
        f"{PROMPT_AZIZA}\n\n"
        f"📅 ТЕКУЩАЯ ДАТА И ВРЕМЯ: {current_datetime}\n"
        f"Используй эту информацию для предложения актуального расписания."
    )

    # Добавляем системный промт перед историей
    messages = [{"role": "system", "content": system_prompt_with_datetime}] + history

    try:
        async with httpx.AsyncClient(timeout=40.0) as client:
            # OpenAI-совместимый endpoint агента: /api/v1/cloud-ai/agents/{agent_access_id}/v1/chat/completions
            url = (
                "https://agent.timeweb.cloud"
                f"/api/v1/cloud-ai/agents/{TIMEWEB_AGENT_ID}/v1/chat/completions"
            )
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {TIMEWEB_API_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    # model здесь по доке игнорируется, но оставляем для совместимости
                    "model": "gpt-4",
                    "messages": messages,
                },
            )
            logger.info(
                "Timeweb status=%s body=%s", response.status_code, response.text
            )
            response.raise_for_status()
            data = response.json()
            reply_text = (
                data["choices"][0]["message"]["content"].strip()
                if data.get("choices")
                else "Извините, не удалось получить ответ. Попробуйте ещё раз."
            )
    except Exception as e:
        logger.exception("Ошибка при обращении к Timeweb AI: %s", e)
        reply_text = "Извините, сейчас на стороне сервера есть техническая пауза. Попробуйте, пожалуйста, ещё раз чуть позже."

    # Добавляем ответ ассистента в историю
    history.append({"role": "assistant", "content": reply_text})
    chat_history[chat_id] = history

    # Отправляем заявку в бекенд (асинхронно, не блокируем ответ)
    await send_application_to_backend(chat_id, user_text, history, username)

    # Отвечаем на сообщение
    # Для бизнес-сообщений reply_text должен работать автоматически
    try:
        await message.reply_text(reply_text)
    except Exception as e:
        logger.error(f"Ошибка при отправке ответа: {e}")
        # Пробуем альтернативный способ для бизнес-сообщений
        if is_business and business_connection_id:
            try:
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=reply_text,
                    business_connection_id=business_connection_id,
                )
            except Exception as e2:
                logger.error(f"Альтернативный способ тоже не сработал: {e2}")
                # Последняя попытка - просто отправить без reply
                try:
                    await context.bot.send_message(chat_id=chat_id, text=reply_text)
                except Exception as e3:
                    logger.error(f"Все способы отправки не сработали: {e3}")


async def post_init(application) -> None:
    """Инициализация после создания приложения - удаляем webhook если есть"""
    try:
        # Удаляем webhook несколько раз для надежности
        for attempt in range(3):
            try:
                await application.bot.delete_webhook(drop_pending_updates=True)
                logger.info("Webhook удален, используется polling")
                break
            except Exception as e:
                if attempt < 2:
                    logger.warning(
                        f"Попытка {attempt + 1} удаления webhook не удалась: {e}. Повторяю..."
                    )
                    await asyncio.sleep(1)
                else:
                    logger.warning(f"Не удалось удалить webhook после 3 попыток: {e}")
    except Exception as e:
        logger.warning(f"Ошибка при инициализации webhook: {e}")


async def error_handler(_update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик ошибок для предотвращения падения бота"""
    error = context.error

    # Специальная обработка для Conflict ошибок - это нормально, если запущено несколько экземпляров
    if isinstance(error, Conflict) or (
        isinstance(error, Exception) and "Conflict" in str(type(error).__name__)
    ):
        # Не логируем как ошибку, так как это ожидаемое поведение
        # Просто игнорируем, чтобы не засорять логи
        return

    # Для всех остальных ошибок логируем
    logger.error(f"Ошибка при обработке update: {error}", exc_info=error)
    # Не падаем, просто логируем ошибку


def main() -> None:
    """Точка входа: запуск Telegram-бота."""
    application = (
        ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).post_init(post_init).build()
    )

    # Добавляем обработчик ошибок
    application.add_error_handler(error_handler)

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("reset", reset))

    # Обработчик для обычных сообщений и бизнес-сообщений
    # handle_message проверяет как update.message, так и update.business_message
    application.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message)
    )

    logger.info("Бот настроен для обработки обычных и бизнес-сообщений")

    logger.info("Бот запущен. Ожидаю сообщения...")
    application.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
