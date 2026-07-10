from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from models import ActivityLevel, Gender

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    gender: Gender
    height_cm: float
    weight_kg: float
    activity_level: ActivityLevel

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    age: int
    gender: Gender
    height_cm: float
    weight_kg: float
    activity_level: ActivityLevel
    bmr: float
    daily_calorie_goal: float
    daily_consumed_calories: float

    class Config:
        from_attributes = True

class DailyLogBase(BaseModel):
    consumed_calories: float

class DailyLogCreate(DailyLogBase):
    pass

class DailyLogResponse(DailyLogBase):
    id: int
    user_id: int
    date: date

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
