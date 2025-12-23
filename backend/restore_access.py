from database import SessionLocal
from models import User
from passlib.context import CryptContext
import asyncio
from sqlalchemy import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset():
    async with SessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        user = result.scalars().first()
        if user:
            print("Found admin user. Resetting password...")
            user.hashed_password = pwd_context.hash("admin")
            user.is_active = True
            await db.commit()
            print("Password reset to 'admin'.")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    asyncio.run(reset())
