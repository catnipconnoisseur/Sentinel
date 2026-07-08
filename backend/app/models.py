"""
SQLAlchemy ORM models for the FactoryMind database.

Maps directly to the Microsoft Predictive Maintenance dataset:
- Machine      → PdM_machines.csv
- Telemetry    → PdM_telemetry.csv
- Error        → PdM_errors.csv
- Maintenance  → PdM_maint.csv
- Failure      → PdM_failures.csv
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Machine(Base):
    __tablename__ = "machines"

    machine_id = Column(Integer, primary_key=True, index=True)
    model = Column(String, nullable=False)       # "model1", "model2", "model3", "model4"
    age = Column(Integer, nullable=False)         # Age in years

    # Relationships
    telemetry = relationship("Telemetry", back_populates="machine", lazy="dynamic")
    errors = relationship("Error", back_populates="machine", lazy="dynamic")
    maintenance = relationship("Maintenance", back_populates="machine", lazy="dynamic")
    failures = relationship("Failure", back_populates="machine", lazy="dynamic")

    def __repr__(self):
        return f"<Machine {self.machine_id} model={self.model}>"


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime, nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.machine_id"), nullable=False, index=True)
    volt = Column(Float)
    rotate = Column(Float)
    pressure = Column(Float)
    vibration = Column(Float)

    machine = relationship("Machine", back_populates="telemetry")


class Error(Base):
    __tablename__ = "errors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime, nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.machine_id"), nullable=False, index=True)
    error_id = Column(String, nullable=False)  # "error1" through "error5"

    machine = relationship("Machine", back_populates="errors")


class Maintenance(Base):
    __tablename__ = "maintenance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime, nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.machine_id"), nullable=False, index=True)
    comp = Column(String, nullable=False)  # "comp1" through "comp4" — which component was replaced

    machine = relationship("Machine", back_populates="maintenance")


class Failure(Base):
    __tablename__ = "failures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime, nullable=False, index=True)
    machine_id = Column(Integer, ForeignKey("machines.machine_id"), nullable=False, index=True)
    failure = Column(String, nullable=False)  # "comp1" through "comp4" — which component failed

    machine = relationship("Machine", back_populates="failures")
