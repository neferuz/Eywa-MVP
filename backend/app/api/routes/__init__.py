from fastapi import APIRouter

from . import health, clients, dashboard, applications, auth, audio, staff, services, trainers, marketing, coworking_places, categories, payment_services, payments, schedule_bookings, body_schedule, ai_assistant, tts


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(audio.router)
api_router.include_router(clients.router, prefix="/api", tags=["clients"])
api_router.include_router(dashboard.router)
api_router.include_router(applications.router, prefix="/api", tags=["applications"])
api_router.include_router(staff.router, prefix="/api", tags=["staff"])
api_router.include_router(services.router)
api_router.include_router(trainers.router)
api_router.include_router(marketing.router)
api_router.include_router(coworking_places.router)
api_router.include_router(categories.router)
api_router.include_router(payment_services.router)
api_router.include_router(payments.router)
api_router.include_router(schedule_bookings.router, prefix="/api", tags=["schedule"])
api_router.include_router(body_schedule.router)
api_router.include_router(ai_assistant.router)
api_router.include_router(tts.router)

