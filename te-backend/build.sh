#!/bin/bash
# Build script for Render.com deployment

set -e  # Exit on error

echo "🔨 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Build completed successfully!"
