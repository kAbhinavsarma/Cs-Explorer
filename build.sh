#!/bin/bash
echo "Starting CS Explorer build process..."

# Set strict error handling
set -e

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Navigate to backend directory
cd backend

# Clean install dependencies
echo "Installing dependencies..."
npm ci --production

# Rebuild native modules for the target platform
echo "Rebuilding native modules..."
npm rebuild sqlite3

echo "Build completed successfully!"
