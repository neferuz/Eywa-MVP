# Инструкция по запуску бекенд-сервера

## Быстрый запуск

1. Откройте терминал и перейдите в директорию backend:
```bash
cd "/Users/notferuz/Desktop/crm eyws/backend"
```

2. Установите зависимости (если еще не установлены):
```bash
pip3 install -r requirements.txt
```

3. Запустите сервер:
```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Или используйте скрипт:
```bash
bash start_server.sh
```

## Проверка работы

После запуска откройте в браузере:
- http://localhost:8000/health - должен вернуть `{"status":"ok"}`
- http://localhost:8000/docs - документация API

## Возможные проблемы

1. **Порт 8000 занят:**
```bash
lsof -ti:8000 | xargs kill -9
```

2. **Ошибки импорта:**
   - Убедитесь, что все зависимости установлены: `pip3 install -r requirements.txt`
   - Проверьте Python версию: `python3 --version` (должна быть 3.8+)

3. **Ошибки подключения к БД:**
   - Сервер должен запускаться даже без БД (используются моки)
   - Если нужна БД, настройте `.env` файл с `DATABASE_URL`

## Запуск в фоне (для разработки)

```bash
nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

Логи будут в файле `server.log`





