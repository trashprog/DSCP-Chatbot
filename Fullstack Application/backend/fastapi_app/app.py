# run this cmd to start backend
# .\venv\Scripts\activate
# python -m uvicorn app:app --reload
# node index.js

# run this cmd to start backend
# uvicorn app:app --reload

import sys
import os

# Add the project's root directory to Python's search path
# This ensures that modules like 'image_classifier' can be found
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# --- Now the rest of your imports will work ---
import json
from fastapi import FastAPI
from image_classifier.classifier_routes import router as classifier_router
# ... rest of your code

import json
import os
import threading
import time
import pandas as pd 
from datetime import datetime
from urllib.parse import quote_plus

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# === Import Your Existing and New Routers ===
# from dashboard.forecast_routes import router as forecast_router, start_polling_thread
from chatbot.chatbot_routes import chatbot_router
# ---- NEW: Import the classifier router ----
from image_classifier.classifier_routes import router as classifier_router


# load env variables
load_dotenv()

# vector db 
import psycopg
# from llama_index.vector_stores.postgres import PGVectorStore

# imporved chitchat
# from llama_index.core.memory import ChatMemoryBuffer -> this is depreceated
from llama_index.core.memory import Memory

# pydantic models for request bodies
class QueryRequest(BaseModel):
    query: str


# chatbot route
from chatbot.chatbot_routes import chatbot_router

# plant soil moisture (HARITH)
from dashboard import soil_forecast_routes

# plant disease (HARITH)
# from dashboard import plant_disease

app = FastAPI()

# === Middleware ===
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Chatbot route ===
app.include_router(chatbot_router)

# === Plant Soil Moisture Route (HARITH) ===
app.include_router(soil_forecast_routes.router)

# === Plant Disease Route (HARITH) ===
# app.include_router(plant_disease.router)



# ---- NEW: Include the Image Classifier route ----
# We add a "prefix" so all routes in this router will start with /classify
# We add "tags" to group them nicely in the automatic API docs (/docs)
app.include_router(
    classifier_router,
    prefix="/classify",
    tags=["Image Classification"]
)


# === Optional: Root endpoint for health check ===
@app.get("/", tags=["Root"])
def read_root():
    return {"status": "ok", "message": "Welcome to the Composting API!"}


# === Potentially Deprecated or Future-use code ===
# Commenting out for clarity, but keeping it as it was in your original file

# # === Start Background Polling (Soil EC) ===
# @app.on_event("startup")
# def start_background_tasks():
#     start_polling_thread()

# from fastapi.responses import FileResponse
# @app.get("/csv-data")
# async def get_csv():
#     return FileResponse("soil_ec_data.csv", media_type="text/csv", filename="soil_ec_data.csv")

# from fastapi.staticfiles import StaticFiles
# app.mount("/", StaticFiles(directory=os.getcwd()), name="static")



