from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import PlainTextResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import os
import shutil
import uuid
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin, ModelView

# Import the pre-loaded global model from ml_utils
from ml_utils import load_model, predict_calories, FOOD_TYPES
from sqlalchemy.orm import Session
from datetime import timedelta

# DB imports
from database import engine, Base, get_db
import models, schemas, auth

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="EasyCal Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from dotenv import load_dotenv

load_dotenv()

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form["username"], form["password"]

        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        if username == admin_username and password == admin_password:
            request.session.update({"token": "admin_access_token"})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        return token == "admin_access_token"

authentication_backend = AdminAuth(secret_key="super-secret-admin-key")

# --- SQLAdmin Setup ---
class UserAdmin(ModelView, model=models.User):
    column_list = [models.User.id, models.User.email, models.User.name, models.User.daily_calorie_goal]
    icon = "fa-solid fa-user"

class DailyLogAdmin(ModelView, model=models.DailyLog):
    column_list = [models.DailyLog.id, models.DailyLog.user_id, models.DailyLog.date, models.DailyLog.consumed_calories]
    icon = "fa-solid fa-calendar"

admin = Admin(app, engine, authentication_backend=authentication_backend)
admin.add_view(UserAdmin)
admin.add_view(DailyLogAdmin)
# ----------------------

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Global variable to hold the model
model = None

@app.on_event("startup")
def startup_event():
    global model
    print("Loading model...")
    model = load_model()
    print("Model loaded successfully.")

@app.get("/health")
def health_check():
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")
    return {"status": "ok", "message": "Server and model are running correctly."}

@app.get("/foods")
def get_supported_foods():
    # Remove 'BG' (background) and 'coin' (calibration object) from the list
    foods = [f for f in FOOD_TYPES if f not in ['BG', 'coin']]
    return {"supported_foods": foods}

# BMR & TDEE Calculator
def calculate_bmr_and_tdee(user: schemas.UserCreate):
    # Mifflin-St Jeor Equation
    if user.gender == models.Gender.male:
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) + 5
    elif user.gender == models.Gender.female:
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) - 161
    else:
        # Average for 'other'
        bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) - 78
        
    activity_multipliers = {
        models.ActivityLevel.sedentary: 1.2,
        models.ActivityLevel.lightly_active: 1.375,
        models.ActivityLevel.moderately_active: 1.55,
        models.ActivityLevel.very_active: 1.725,
        models.ActivityLevel.extra_active: 1.9
    }
    tdee = bmr * activity_multipliers[user.activity_level]
    return bmr, tdee

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    bmr, tdee = calculate_bmr_and_tdee(user)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        age=user.age,
        gender=user.gender,
        height_cm=user.height_cm,
        weight_kg=user.weight_kg,
        activity_level=user.activity_level,
        bmr=bmr,
        daily_calorie_goal=tdee
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # form_data.username will contain the user's email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.date.today()
    if current_user.last_log_date != today:
        current_user.daily_consumed_calories = 0.0
        current_user.last_log_date = today
        db.commit()
        db.refresh(current_user)
    return current_user

import datetime

@app.post("/logs", response_model=schemas.DailyLogResponse)
def log_calories(log: schemas.DailyLogCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.date.today()
    db_log = db.query(models.DailyLog).filter(
        models.DailyLog.user_id == current_user.id,
        models.DailyLog.date == today
    ).first()

    if db_log:
        db_log.consumed_calories += log.consumed_calories
    else:
        db_log = models.DailyLog(
            user_id=current_user.id,
            date=today,
            consumed_calories=log.consumed_calories
        )
        db.add(db_log)
        
    # Keep the user model in sync for cross-platform ease
    if current_user.last_log_date != today:
        current_user.daily_consumed_calories = log.consumed_calories
        current_user.last_log_date = today
    else:
        current_user.daily_consumed_calories += log.consumed_calories
    
    db.commit()
    db.refresh(db_log)
    return db_log

from typing import List

@app.get("/logs", response_model=List[schemas.DailyLogResponse])
def get_logs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(models.DailyLog).filter(models.DailyLog.user_id == current_user.id).order_by(models.DailyLog.date).all()
    return logs

@app.post("/upload")
async def upload_image(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    """
    image1: Top image
    image2: Side image
    """
    if not image1.filename or not image2.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    if image1.content_type not in ALLOWED_CONTENT_TYPES or image2.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only JPEG and PNG images are allowed.")

    save_folder = os.path.join(os.getcwd(), 'api_test')
    os.makedirs(save_folder, exist_ok=True)
    
    unique_id = uuid.uuid4().hex
    file1_path = os.path.join(save_folder, f'top_{unique_id}.jpg')
    file2_path = os.path.join(save_folder, f'side_{unique_id}.jpg')
    
    try:
        with open(file1_path, "wb") as buffer:
            shutil.copyfileobj(image1.file, buffer)
            
        with open(file2_path, "wb") as buffer:
            shutil.copyfileobj(image2.file, buffer)
            
        # Process images using the pre-loaded global model
        prediction_result = predict_calories(model, file1_path, file2_path)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temporary files
        if os.path.exists(file1_path):
            os.remove(file1_path)
        if os.path.exists(file2_path):
            os.remove(file2_path)
        
    return prediction_result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
