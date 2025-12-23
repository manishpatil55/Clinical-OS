from database import SessionLocal
from models import User, Tenant
import asyncio
from sqlalchemy import select

async def promote_tenant():
    async with SessionLocal() as db:
        # Find user 'admin'
        res = await db.execute(select(User).where(User.username == "admin"))
        user = res.scalars().first()
        
        if not user:
            print("User 'admin' not found.")
            return

        # Find their tenant
        tenant_res = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
        tenant = tenant_res.scalars().first()
        
        if tenant:
            print(f"Found tenant '{tenant.name}' (ID: {tenant.id}). Promoting to Super Admin...")
            tenant.is_super_admin = True
            await db.commit()
            print("Success! Tenant is now Super Admin.")
        else:
            print("Tenant not found!")

if __name__ == "__main__":
    asyncio.run(promote_tenant())
