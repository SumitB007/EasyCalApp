from sqlalchemy import Column, Integer, String, Float, Enum as SQLAlchemyEnum, ForeignKey, Date
from sqlalchemy.orm import relationship
from database import Base
import enum

class ActivityLevel(str, enum.Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extra_active = "extra_active"

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Biometrics
    name = Column(String)
    age = Column(Integer)
    gender = Column(SQLAlchemyEnum(Gender))
    height_cm = Column(Float)
    weight_kg = Column(Float)
    activity_level = Column(SQLAlchemyEnum(ActivityLevel))
    
    # Computed goals
    bmr = Column(Float)
    daily_calorie_goal = Column(Float)
    
    # Sync tracking
    daily_consumed_calories = Column(Float, default=0.0)
    last_log_date = Column(Date, nullable=True)

    logs = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")

class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, index=True, nullable=False)
    consumed_calories = Column(Float, default=0.0)

    user = relationship("User", back_populates="logs")
