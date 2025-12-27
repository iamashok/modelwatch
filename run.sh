#!/bin/bash

echo "=========================================="
echo "Starting ModelWatch"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if data exists
if [ ! -f "backend/data/models.json" ]; then
    echo "⚠️  No data found. Running scraper first..."
    echo "This may take a few minutes..."
    cd backend
    source venv/bin/activate
    cd scrapers
    python llmstats_orchestrator.py
    cd ../..
    echo ""
fi

# Start backend
echo "Starting backend API..."
cd backend
source venv/bin/activate
cd api
python main.py &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "ModelWatch is running!"
echo "=========================================="
echo ""
echo "📊 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
