#!/bin/bash
# Start script for Render.com deployment

set -e  # Exit on error

echo "🚀 Starting TechElevate Backend..."

# Run prestart script (database initialization)
if [ -f ./prestart.sh ]; then
    echo "⚙️ Running prestart tasks..."
    bash ./prestart.sh
fi

# Start the application
echo "🌐 Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1
