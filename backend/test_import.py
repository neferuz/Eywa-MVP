#!/usr/bin/env python3
"""Тест импорта приложения для диагностики ошибок"""

try:
    print("Импорт app.main...")
    from app.main import app
    print("✓ app.main импортирован успешно")
    print(f"✓ Приложение создано: {app.title}")
except Exception as e:
    print(f"✗ Ошибка импорта: {e}")
    import traceback
    traceback.print_exc()




