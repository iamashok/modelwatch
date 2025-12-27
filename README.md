# ModelWatch

An open-source LLM leaderboard that displays the latest public benchmark performance for state-of-the-art open-source model versions.

**Live Data Sources**: [llm-stats.com](https://llm-stats.com) + [HuggingFace](https://huggingface.co)

![ModelWatch](https://img.shields.io/badge/Status-Production-green)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## ✨ Features

- 📊 **Benchmark Leaderboards**: Visual bar charts showing top 5 models for each benchmark (MMLU, ARC, HellaSwag, TruthfulQA)
- 📋 **Sortable Table View**: Sort by pricing (Input $/M, Output $/M), benchmarks, or model parameters
- 💰 **Pricing Data**: Compare model costs per million tokens (input and output)
- 🎨 **Clean UI**: Inspired by Vellum's leaderboard design
- 🔄 **Automated Scraping**: Uses Playwright to scrape llm-stats.com for latest models
- 🤗 **HuggingFace Integration**: Optional enrichment with HuggingFace model details
- ⚡ **Fast API**: Built with FastAPI for quick data serving
- 🎯 **Open Source Focus**: Only displays models with open-source licenses

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Chrome/Chromium (for Playwright scraper)

### Option 1: One-Command Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/iamashok/modelwatch.git
cd modelwatch

# Run setup script
./setup.sh

# Collect data
./collect-data.sh

# Start the application
./start.sh
```

Then visit: **http://localhost:3000**

### Option 2: Manual Setup

**1. Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

**2. Collect Data**

```bash
cd scrapers
python llmstats_orchestrator.py
```

This scrapes llm-stats.com leaderboard and enriches data with HuggingFace details.

**3. Start Backend API**

```bash
cd ../api
python main.py
```

API will be available at `http://localhost:8000`

**4. Frontend Setup**

```bash
cd ../../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
modelwatch/
├── backend/
│   ├── scrapers/
│   │   ├── llmstats_scraper.py       # Scrapes llm-stats.com with Playwright
│   │   ├── llmstats_orchestrator.py  # Main orchestrator
│   │   ├── huggingface_scraper.py    # HuggingFace enrichment
│   │   ├── simple_orchestrator.py    # Alternative: HF-only scraper
│   │   └── README.md
│   ├── api/
│   │   └── main.py                   # FastAPI backend server
│   ├── models/
│   │   └── schemas.py                # Pydantic data models
│   └── data/
│       └── models.json               # Scraped model data
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BenchmarkLeaderboard.tsx    # Top 5 charts per benchmark
│   │   │   ├── SortableModelsTable.tsx     # Sortable table view
│   │   │   ├── HuggingFaceModal.tsx        # Model detail popup
│   │   │   └── ...
│   │   ├── pages/
│   │   │   └── index.tsx                   # Main page
│   │   └── lib/
│   │       └── api.ts                      # API client
│   ├── package.json
│   └── tailwind.config.js
├── setup.sh              # One-command setup script
├── collect-data.sh       # Data collection script
├── start.sh              # Start backend + frontend
└── README.md            # This file
```

## 🔧 How It Works

### Data Collection Pipeline

```
llm-stats.com (Playwright Scraper)
         ↓
Extract 30 models with pricing + benchmarks
         ↓
HuggingFace API (Optional Enrichment)
         ↓
Add model details (license, downloads, etc.)
         ↓
Save to models.json
         ↓
FastAPI serves data
         ↓
Next.js displays leaderboards
```

### Data Schema

Each model includes:

```json
{
  "model_id": "THUDM/GLM-4.7",
  "model_name": "GLM-4.7",
  "organization": "THUDM",
  "parameters": "358B",
  "input_price_per_1m": 0.6,
  "output_price_per_1m": 2.2,
  "benchmarks": [
    {"name": "MMLU", "score": 85.7, "category": "knowledge"},
    {"name": "Arc-Challenge", "score": 95.7, "category": "knowledge"},
    {"name": "HellaSwag", "score": 73.8, "category": "general"},
    {"name": "TruthfulQA", "score": 42.8, "category": "knowledge"}
  ],
  "is_open_source": true,
  "hf_url": "https://huggingface.co/THUDM/GLM-4.7",
  "hf_license": "Apache 2.0",
  "hf_downloads": 125000,
  "hf_likes": 450
}
```

## 🎯 API Endpoints

Base URL: `http://localhost:8000`

- **GET** `/models` - Get all models
  - Query params: `limit`, `offset`, `sort_by`, `category`, `min_benchmarks`
  - Example: `/models?sort_by=likes&limit=20`

- **GET** `/models/{model_id}` - Get specific model details
  - Example: `/models/THUDM%2FGLM-4.7`

- **GET** `/benchmarks` - Get all benchmark types and categories

- **GET** `/stats` - Get overall statistics
  - Returns: total models, benchmark count, last update time

- **GET** `/docs` - Interactive API documentation (Swagger UI)

## 🎨 UI Features

### Charts View (Default)

- **Benchmark Leaderboards**: 6 visual bar charts showing top 5 models per benchmark
- **Color-coded Rankings**: Gold/Silver/Bronze medals for top 3 performers
- **Interactive Tooltips**: Hover to see full model names and exact scores
- **Responsive Grid**: Adapts to mobile, tablet, and desktop screens

### Table View

- **Sortable Columns**: Click any column header to sort
  - Model Name
  - Input $/M (price per million tokens)
  - Output $/M
  - MMLU, ARC, HellaSwag, TruthfulQA scores
  - Parameters (model size)
- **Color-coded Scores**: Green (≥80%), Blue (≥60%), Yellow (≥40%)
- **Click for Details**: Click any row to open HuggingFace detail modal

### HuggingFace Modal

- View complete model information
- All benchmarks with color-coded scores
- HuggingFace stats (downloads, likes, license)
- Direct link to HuggingFace model page

## ⚙️ Configuration

### Scraper Settings

Edit `backend/scrapers/llmstats_orchestrator.py`:

```python
# Enable/disable HuggingFace enrichment
models = await orchestrator.collect_all_data(enrich_with_hf=True)

# Adjust delay to avoid rate limiting
hf_scraper = HuggingFaceScraper(delay_between_requests=0.5)

# Control concurrent requests
models = await hf_scraper.scrape_models_batch(model_ids, max_concurrent=3)
```

### Alternative: HuggingFace-Only Mode

If llm-stats.com is unavailable, use the HuggingFace-only scraper:

```bash
cd backend/scrapers
python simple_orchestrator.py
```

This fetches trending models directly from HuggingFace API.

### Frontend Customization

**Colors** - Edit `frontend/tailwind.config.js`:

```javascript
colors: {
  accent: {
    blue: '#9FC9FF',
    pink: '#FC69D3',
  },
  // ... customize your colors
}
```

**Benchmarks to Display** - Edit `frontend/src/components/BenchmarkLeaderboard.tsx`:

```typescript
const mainBenchmarks = ['MMLU', 'Arc-Challenge', 'HellaSwag', 'TruthfulQA', 'Winogrande', 'GSM8K'];
```

## 🔄 Updating Data

To refresh the leaderboard with latest models:

```bash
./collect-data.sh
```

Or manually:

```bash
cd backend/scrapers
source ../venv/bin/activate
python llmstats_orchestrator.py
```

The API automatically serves updated data (refresh browser to see changes).

## 🐛 Troubleshooting

### Playwright/Chrome Issues

If scraper fails to launch browser:

```bash
# Reinstall Playwright browsers
playwright install chromium

# Or install system Chrome/Chromium
# macOS: brew install chromium
# Ubuntu: sudo apt install chromium-browser
```

### Port Already in Use

**Backend (port 8000):**

Edit `backend/api/main.py`:
```python
uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
```

**Frontend (port 3000):**

```bash
PORT=3001 npm run dev
```

### CORS Errors

Ensure:
1. Backend is running on `http://localhost:8000`
2. Frontend is on `http://localhost:3000`
3. Check CORS settings in `backend/api/main.py`

### Rate Limiting (429 Errors)

If HuggingFace scraper gets rate limited:

1. Increase delay: `delay_between_requests=1.0`
2. Reduce concurrency: `max_concurrent=2`
3. Or disable enrichment: `enrich_with_hf=False`

## 📦 Deployment

### Backend (FastAPI)

**Docker:**

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium
COPY backend/ .
CMD ["python", "api/main.py"]
```

**Railway/Render:**
- Direct Python deployment
- Set start command: `cd backend/api && python main.py`
- Add build command: `pip install -r backend/requirements.txt && playwright install chromium`

### Frontend (Next.js)

**Vercel (Recommended):**

```bash
cd frontend
vercel deploy
```

**Netlify:**

```bash
# Build command
npm run build

# Publish directory
.next
```

**Static Export:**

```bash
npm run build
# Deploy the .next folder to any static host
```

### Automated Data Updates

Set up a cron job or GitHub Action:

```yaml
# .github/workflows/update-data.yml
name: Update Model Data
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          playwright install chromium

      - name: Run scraper
        run: |
          cd backend/scrapers
          python llmstats_orchestrator.py

      - name: Commit updated data
        run: |
          git config --global user.name 'GitHub Action'
          git config --global user.email 'action@github.com'
          git add backend/data/models.json
          git commit -m 'Update model data [skip ci]' || exit 0
          git push
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Add More Benchmarks**: Edit benchmark extraction patterns
2. **Improve Scraping**: Handle edge cases, new model formats
3. **UI Enhancements**: New visualizations, filters, search
4. **Bug Fixes**: Report issues or submit fixes
5. **Documentation**: Improve setup guides, add examples

**Contribution Process:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- **Data Sources**:
  - [llm-stats.com](https://llm-stats.com) - Primary benchmark data
  - [HuggingFace](https://huggingface.co) - Model details and enrichment
- **Built With**:
  - [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
  - [Next.js](https://nextjs.org/) - Frontend framework
  - [Playwright](https://playwright.dev/) - Web scraping
  - [Recharts](https://recharts.org/) - Data visualization
  - [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/modelwatch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/modelwatch/discussions)

---

**Made with ❤️ for the open-source AI community**
