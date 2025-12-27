#!/bin/bash

echo "=========================================="
echo "ModelWatch - Data Collection"
echo "=========================================="
echo ""

# Navigate to backend and activate venv
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run ./setup.sh first"
    exit 1
fi

source venv/bin/activate

# Run the scraper
cd scrapers
echo "Starting data collection..."
echo "This will scrape llm-stats.com leaderboard and enrich with HuggingFace data"
echo ""

python llmstats_orchestrator.py

echo ""
echo "=========================================="
echo "Data collection complete!"
echo "=========================================="
echo ""
echo "Data saved to: backend/data/models.json"
echo ""
echo "To start the API with this data:"
echo "  ./start.sh"
echo ""
