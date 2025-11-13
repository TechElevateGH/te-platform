#!/bin/bash
# Start the FastAPI server
# Database tables will be created automatically on startup (see app/main.py)

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
