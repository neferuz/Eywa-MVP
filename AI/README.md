## EYWA Aziza Telegram Bot

Телеграм‑бот «Азиза» для студии EYWA.  
Бот принимает сообщения от пользователя и пересылает их в AI‑агента Timeweb Cloud (GPT‑5), который уже настроен вашим системным промптом.

### 1. Установка

Откройте терминал в папке проекта:

```bash
cd "/Users/notferuz/Desktop/Bot for eywa"
python3 -m venv .venv
source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

### 2. Переменные окружения

Создайте файл `.env` рядом с `main.py` и вставьте туда ваши значения:

```env
TELEGRAM_BOT_TOKEN=8261741369:AAEYU-mYx_ZJsuCotkWPnsJYkz_MtJHn-M8
TIMEWEB_AGENT_URL=https://agent.timeweb.cloud/api/v1/cloud-ai/agents/1af046ad-5883-4892-bfdb-1127177454ea/v1
TIMEWEB_ACCESS_ID=1af046ad-5883-4892-bfdb-1127177454ea
```

При необходимости вы можете поменять токен бота или данные агента — просто измените значения переменных.

### 3. Запуск бота

Из активированного виртуального окружения выполните:

```bash
cd "/Users/notferuz/Desktop/Bot for eywa"
source .venv/bin/activate  # если ещё не активировано
python main.py
```

После запуска в консоли появится сообщение `Бот запущен. Ожидаю сообщения...`.  
Теперь можете открыть Telegram, найти вашего бота и написать любое сообщение — ответ будет приходить от настроенного агента Азиза из Timeweb Cloud.


