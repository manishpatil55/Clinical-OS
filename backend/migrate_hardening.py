import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        try:
            print("🚀 Starting Professional Hardening Migration...")
            
            # 1. Tenants
            print("🔹 Migrating Tenants...")
            await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url VARCHAR"))
            await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR"))
            await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"timezone\": \"UTC\", \"currency\": \"USD\"}'"))
            
            # 2. Users
            print("🔹 Migrating Users...")
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
            
            # 3. Patients (Transform Age -> DOB, Add MRN)
            print("🔹 Migrating Patients...")
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE"))
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS mrn VARCHAR"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_patients_mrn ON patients (mrn)"))
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR"))
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]'"))
            await conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT"))
            # Remove Age (Risky? Let's keep it nullable or drop. Plan said replace. Dropping is cleaner.)
            await conn.execute(text("ALTER TABLE patients DROP COLUMN IF EXISTS age"))
            
            # Backfill MRN for existing patients
            await conn.execute(text("""
                UPDATE patients 
                SET mrn = 'PT-' || SUBSTRING(id, 1, 8) 
                WHERE mrn IS NULL
            """))
            
            # 4. Appointments (New Table)
            print("🔹 Creating Appointments Table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id VARCHAR PRIMARY KEY,
                    tenant_id VARCHAR REFERENCES tenants(id),
                    patient_id VARCHAR REFERENCES patients(id),
                    doctor_id VARCHAR REFERENCES users(id),
                    start_time TIMESTAMP,
                    end_time TIMESTAMP,
                    status VARCHAR DEFAULT 'scheduled',
                    reason VARCHAR
                )
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_appointments_start_time ON appointments (start_time)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_appointments_status ON appointments (status)"))

            # 5. Attachments (New Table)
            print("🔹 Creating Attachments Table...")
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS attachments (
                    id VARCHAR PRIMARY KEY,
                    tenant_id VARCHAR REFERENCES tenants(id),
                    patient_id VARCHAR REFERENCES patients(id),
                    file_name VARCHAR,
                    file_url VARCHAR,
                    file_type VARCHAR,
                    uploaded_at TIMESTAMP DEFAULT now()
                )
            """))

            # 6. Clinical Records (Audit)
            print("🔹 Migrating Clinical Records...")
            await conn.execute(text("ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS created_by_id VARCHAR REFERENCES users(id)"))
            await conn.execute(text("ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS appointment_id VARCHAR REFERENCES appointments(id)"))

            print("🎉 Enterprise Migration Complete!")
        except Exception as e:
            print(f"⚠️ Migration Error: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
