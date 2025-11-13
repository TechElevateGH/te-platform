#!/bin/bash
# Build script for Render.com deployment

set -e  # Exit on error

echo "🔨 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip

# Install with binary packages only (no source builds)
echo "📦 Installing packages (binary only, no compilation)..."
pip install --only-binary=:all: -r requirements.txt || \
pip install -r requirements.txt

echo "✅ Build completed successfully!"
