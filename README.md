# EasyCal (Backend & Frontend)

EasyCal is an AI-powered calorie tracking application that helps users effortlessly estimate their calorie intake by analyzing food images. This repository contains the source code for the EasyCal backend API and the web frontend.

*(Note: The Android app repository is separate and not included in this project.)*

## 🌟 Features
- **AI Food Recognition:** Uses a pre-trained Mask R-CNN machine learning model to detect food items in images and predict their calorie content based on volume.
- **Calorie & BMR Calculator:** Automatically calculates your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) based on your physical attributes and activity level.
- **User Authentication:** Secure registration and login system using OAuth2 and JWT.
- **Daily Food Logging:** Keep a daily record of your consumed calories and track progress.
- **Admin Dashboard:** Built-in SQLAdmin panel for managing users and calorie logs.
- **Interactive Dashboard:** A sleek, modern React frontend with charts (`recharts`) and animations (`framer-motion`) to visualize your calorie data.

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite with SQLAlchemy ORM
- **Machine Learning:** Mask R-CNN (Keras/TensorFlow) for image segmentation and calorie estimation
- **Admin Panel:** SQLAdmin

### Frontend
- **Framework:** React (Vite)
- **Styling & Animations:** Framer Motion, standard CSS
- **Data Visualization:** Recharts
- **Routing:** React Router DOM

## 🚀 Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install the dependencies. Ensure you have the required ML libraries (TensorFlow, Keras, OpenCV, etc.) and FastAPI setup:
   ```bash
   pip install -r requirements.txt
   ```
   *(Make sure you have the `mask_rcnn_food.h5` weights file in the backend directory).*
4. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
5. The API will be available at `http://localhost:8000`. You can access the interactive API documentation at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. The web app will be accessible at `http://localhost:5173` (or the port specified by Vite).
