import asyncio
from database import get_db, engine
from sqlalchemy import select
from models import Tenant, User

async def debug():
    async with engine.begin() as conn:
        from database import SessionLocal
        async with SessionLocal() as db:
            print("--- TENANTS ---")
            res = await db.execute(select(Tenant))
            tenants = res.scalars().all()
            for t in tenants:
                print(f"Tenant: {t.name} (ID: {t.id})")
                
            print("\n--- USERS ---")
            res = await db.execute(select(User))
            users = res.scalars().all()
            for u in users:
                print(f"User: {u.username} (Tenant: {u.tenant_id}, Roles: {u.roles})")
                if u.username == "apollo_admin":
                    from main import create_access_token
                    token = create_access_token(data={"sub": u.username})
                    print(f"\nGeneratred Token for apollo_admin: {token}")

if __name__ == "__main__":
    asyncio.run(debug())
