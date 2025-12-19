from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
import datetime
import uuid

# --- 1. The Real Estate (Tenants) ---
class Tenant(Base):
    __tablename__ = "tenants"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, index=True) # "Apollo Clinic"
    domain: Mapped[str] = mapped_column(String, nullable=True) # "apollo.clinicalos.com"
    
    # "God Mode" (If true, this clinic is YOU managing others)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())
    
    users = relationship("User", back_populates="tenant")
    patients = relationship("Patient", back_populates="tenant")

# --- 2. The Staff (Users) ---
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"))
    
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    
    role: Mapped[str] = mapped_column(String, default="staff") # "admin", "doctor", "front_desk"
    
    tenant = relationship("Tenant", back_populates="users")

# --- 3. The Customer (Patient) ---
class Patient(Base):
    __tablename__ = "patients"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id")) # Data Isolation Layer!
    
    # Core Identity (Fixed)
    name: Mapped[str] = mapped_column(String, index=True)
    mobile: Mapped[str] = mapped_column(String, index=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    gender: Mapped[str] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())
    
    tenant = relationship("Tenant", back_populates="patients")
    clinical_records = relationship("ClinicalRecord", back_populates="patient")

# --- 4. The Magic Layer (Flexible Data) ---
class ClinicalRecord(Base):
    __tablename__ = "clinical_records"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"))
    tenant_id: Mapped[str] = mapped_column(ForeignKey("tenants.id"))
    
    # "What is this?" -> "vitals", "dental_map", "lab_report_cbc"
    record_type: Mapped[str] = mapped_column(String, index=True) 
    
    # "The Data" -> {"bp": "120/80"} OR {"tooth_12": "cavity"}
    # This column allows the system to store ANYTHING.
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    
    recorded_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=func.now())
    
    patient = relationship("Patient", back_populates="clinical_records")
