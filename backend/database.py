from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData
import os

# 1. Connection String (Local Postgres)
# "hospital_db" is the DB you created in Postgres.app
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost/hospital_db")

# 2. The Engine (Connection Pool)
engine = create_async_engine(DATABASE_URL, echo=True)

# 3. Size-fits-all Session Maker
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# 4. Base Class for models
class Base(DeclarativeBase):
    pass

# 5. Dependency (To be used in API routes)
async def get_db():
    async with SessionLocal() as session:
        yield session
