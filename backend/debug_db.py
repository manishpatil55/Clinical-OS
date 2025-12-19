import asyncio
from sqlalchemy import select
from database import SessionLocal
from models import Tenant, User

async def debug_data():
    async with SessionLocal() as db:
        print("\n--- TENANTS ---")
        result = await db.execute(select(Tenant))
        tenants = result.scalars().all()
        for t in tenants:
            print(f"Tenant: {t.name} (ID: {t.id}) - Domain: {t.domain}")

        print("\n--- USERS ---")
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.username} (Role: {u.role}) -> TenantID: {u.tenant_id}")

if __name__ == "__main__":
    asyncio.run(debug_data())
