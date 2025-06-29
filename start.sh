#!/bin/bash
echo "Starting CS Explorer deployment..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Create database and seed data if needed
echo "Setting up database..."
node -e "
const db = require('./database');
console.log('Database initialized successfully');
"

# Start the application
echo "Starting the application..."
node index.js
