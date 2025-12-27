#!/bin/bash

echo "=========================================="
echo "ModelWatch Setup Script"
echo "=========================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.9+ first."
    exit 1
fi
echo "✓ Python3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
echo "✓ npm found: $(npm --version)"

echo ""
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="

# Create virtual environment
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "✓ Backend setup complete!"

echo ""
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="

cd ../frontend

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

echo ""
echo "✓ Frontend setup complete!"

cd ..

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Collect data (run the scraper):"
echo "   cd backend/scrapers"
echo "   python orchestrator.py"
echo ""
echo "2. Start the backend API:"
echo "   cd backend/api"
echo "   python main.py"
echo "   (Runs on http://localhost:8000)"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo "   (Runs on http://localhost:3000)"
echo ""
echo "=========================================="
