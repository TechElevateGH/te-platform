#!/bin/bash
# Start the FastAPI server
# Database tables will be created automatically on startup (see app/main.py)

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
