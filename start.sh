#!/bin/bash

# Simple startup script for ModelWatch

echo "🚀 ModelWatch - Starting Application"
echo ""

# Step 1: Start backend
echo "[1/2] Starting backend API..."
echo ""

cd backend
source venv/bin/activate
cd api

echo "Backend API starting on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
echo ""
echo "To start the frontend, open a new terminal and run:"
echo "  cd frontend && npm run dev"
echo ""
echo "Press Ctrl+C to stop the backend"
echo ""

python main.py
