#!/bin/bash

cd "$(dirname "$0")"

echo "Проверка Python..."
python3 --version

echo "Проверка зависимостей..."
python3 -c "import uvicorn; print('✓ uvicorn установлен')" || {
    echo "✗ uvicorn не установлен. Установка зависимостей..."
    pip3 install -r requirements.txt
}

echo "Очистка порта 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "Запуск сервера на http://localhost:8000..."
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000




