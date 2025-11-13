#!/bin/bash
# Build script for Render.com deployment

set -e  # Exit on error

echo "🔨 Starting build process..."

# Navigate to backend directory
cd te-backend

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build completed successfully!"
