import asyncio
from database import engine, Base
from models import TenantSettings, Prescription, Invoice

async def migrate():
    print("🚀 Starting Commercial Layer Migration...")
    
    async with engine.begin() as conn:
        print("Creating tables: tenant_settings, prescriptions, invoices...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("✅ Migration Complete! Commercial Layer is Ready.")

if __name__ == "__main__":
    asyncio.run(migrate())
