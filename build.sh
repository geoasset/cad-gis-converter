#!/usr/bin/env bash
# Build script for Render deployment
# Installs system dependencies for GDAL before Python packages

set -o errexit  # Exit on error
set -o pipefail # Exit on pipe failure
set -o nounset  # Exit on undefined variable

echo "🚀 Starting build process for CAD-GIS Converter..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update

# Install GDAL and build dependencies
echo "🗺️  Installing GDAL system libraries..."
apt-get install -y \
    gdal-bin \
    libgdal-dev \
    g++ \
    gcc \
    python3-dev

# Get GDAL version for pip installation
GDAL_VERSION=$(gdal-config --version)
echo "✅ GDAL version installed: $GDAL_VERSION"

# Upgrade pip
echo "🐍 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --no-cache-dir -r backend/requirements.txt

echo "✅ Build completed successfully!"
