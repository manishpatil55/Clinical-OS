from database import Base
from sqlalchemy import Column, String, Boolean, ForeignKey, Integer, DateTime, Date, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True)
    domain = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_super_admin = Column(Boolean, default=False)
    
    # Settings (One-to-One)
    settings = relationship("TenantSettings", back_populates="tenant", uselist=False)

class TenantSettings(Base):
    __tablename__ = "tenant_settings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    
    clinic_name = Column(String) # For display on PDF
    logo_url = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    tenant = relationship("Tenant", back_populates="settings")

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    username = Column(String, index=True)
    hashed_password = Column(String)
    roles = Column(JSONB, default=["staff"]) # ["admin", "doctor", "nurse"]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    mrn = Column(String, index=True) # Medical Record Number
    name = Column(String, index=True)
    dob = Column(Date, nullable=True)
    gender = Column(String)
    mobile = Column(String)
    blood_group = Column(String, nullable=True)
    allergies = Column(JSONB, default=[]) 
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    clinical_records = relationship("ClinicalRecord", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    attachments = relationship("Attachment", back_populates="patient")

class ClinicalRecord(Base):
    __tablename__ = "clinical_records"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    date = Column(DateTime, default=datetime.utcnow)
    type = Column(String) # e.g. "Vitals", "History", "Lab"
    data = Column(JSONB)
    
    patient = relationship("Patient", back_populates="clinical_records")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    doctor_id = Column(String, ForeignKey("users.id")) # Assign to Doc
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String, default="scheduled") # scheduled, confirmed, completed, cancelled
    reason = Column(String, nullable=True)
    
    patient = relationship("Patient", back_populates="appointments")
    prescription = relationship("Prescription", back_populates="appointment", uselist=False)
    invoice = relationship("Invoice", back_populates="appointment", uselist=False)

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    file_name = Column(String)
    file_url = Column(String)
    file_type = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="attachments")

# --- COMMERCIAL LAYER MODELS ---

class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    appointment_id = Column(String, ForeignKey("appointments.id"))
    doctor_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Core Data
    medications = Column(JSONB) # List of { drug: "Amox", dose: "500mg", freq: "BD", duration: "5d" }
    notes = Column(Text, nullable=True) # Advice
    
    appointment = relationship("Appointment", back_populates="prescription")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    appointment_id = Column(String, ForeignKey("appointments.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Financials
    total_amount = Column(Float)
    status = Column(String, default="unpaid") # unpaid, paid, cancelled
    line_items = Column(JSONB) # List of { description: "Consultation", amount: 500 }
    
    appointment = relationship("Appointment", back_populates="invoice")

import uuid
