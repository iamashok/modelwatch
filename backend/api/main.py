from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from pathlib import Path
import json
from datetime import datetime
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from models.schemas import ModelData, LeaderboardResponse, Benchmark

app = FastAPI(
    title="ModelWatch API",
    description="API for open-source LLM leaderboard data",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data file path
DATA_FILE = Path(__file__).parent.parent / "data" / "models.json"


def load_data() -> dict:
    """Load model data from JSON file"""
    if not DATA_FILE.exists():
        return {"models": [], "total_count": 0, "last_updated": None}

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "ModelWatch API",
        "version": "1.0.0",
        "endpoints": {
            "/models": "Get all models",
            "/models/{model_id}": "Get specific model",
            "/benchmarks": "Get all benchmark types",
            "/stats": "Get statistics"
        }
    }


@app.get("/models", response_model=LeaderboardResponse)
async def get_models(
    limit: Optional[int] = Query(None, description="Limit number of results"),
    offset: int = Query(0, description="Offset for pagination"),
    sort_by: Optional[str] = Query("model_name", description="Sort by field"),
    category: Optional[str] = Query(None, description="Filter by benchmark category"),
    min_benchmarks: Optional[int] = Query(None, description="Minimum number of benchmarks"),
):
    """
    Get all models with optional filtering and sorting

    - **limit**: Maximum number of models to return
    - **offset**: Number of models to skip (for pagination)
    - **sort_by**: Field to sort by (model_name, downloads, likes, etc.)
    - **category**: Filter models that have benchmarks in this category
    - **min_benchmarks**: Only return models with at least this many benchmarks
    """
    data = load_data()
    models = data.get('models', [])

    # Convert to ModelData objects
    model_objects = []
    for m in models:
        try:
            # Convert benchmarks
            benchmarks = [
                Benchmark(**b) for b in m.get('benchmarks', [])
            ]

            # Create model object
            model_obj = ModelData(
                model_id=m.get('model_id', ''),
                model_name=m.get('model_name', ''),
                organization=m.get('organization', ''),
                license=m.get('license'),
                is_open_source=m.get('is_open_source', False),
                parameters=m.get('parameters'),
                context_window=m.get('context_window'),
                downloads=m.get('downloads'),
                likes=m.get('likes'),
                benchmarks=benchmarks,
                input_price_per_1m=m.get('input_price_per_1m'),
                output_price_per_1m=m.get('output_price_per_1m'),
                description=m.get('description'),
                arxiv_id=m.get('arxiv_id')
            )
            model_objects.append(model_obj)
        except Exception as e:
            print(f"Error parsing model {m.get('model_id')}: {e}")
            continue

    # Apply filters
    if category:
        model_objects = [
            m for m in model_objects
            if any(b.category == category for b in m.benchmarks)
        ]

    if min_benchmarks is not None:
        model_objects = [
            m for m in model_objects
            if len(m.benchmarks) >= min_benchmarks
        ]

    # Sort
    if sort_by == "downloads":
        model_objects.sort(key=lambda x: x.downloads or 0, reverse=True)
    elif sort_by == "likes":
        model_objects.sort(key=lambda x: x.likes or 0, reverse=True)
    elif sort_by == "benchmarks":
        model_objects.sort(key=lambda x: len(x.benchmarks), reverse=True)
    else:
        model_objects.sort(key=lambda x: x.model_name)

    # Apply pagination
    total = len(model_objects)
    if limit:
        model_objects = model_objects[offset:offset + limit]
    else:
        model_objects = model_objects[offset:]

    # Parse last_updated
    last_updated_str = data.get('last_updated')
    try:
        last_updated = datetime.fromisoformat(last_updated_str) if last_updated_str else datetime.utcnow()
    except:
        last_updated = datetime.utcnow()

    return LeaderboardResponse(
        models=model_objects,
        total_count=total,
        last_updated=last_updated
    )


@app.get("/models/{model_id:path}")
async def get_model(model_id: str):
    """Get detailed information about a specific model"""
    data = load_data()
    models = data.get('models', [])

    for m in models:
        if m.get('model_id') == model_id:
            return m

    raise HTTPException(status_code=404, detail=f"Model {model_id} not found")


@app.get("/benchmarks")
async def get_benchmarks():
    """Get all unique benchmark types and categories"""
    data = load_data()
    models = data.get('models', [])

    benchmarks = {}
    categories = set()

    for model in models:
        for bench in model.get('benchmarks', []):
            name = bench.get('name')
            category = bench.get('category', 'general')

            if name not in benchmarks:
                benchmarks[name] = {
                    'name': name,
                    'category': category,
                    'count': 0,
                    'avg_score': 0,
                    'scores': []
                }

            benchmarks[name]['count'] += 1
            score = bench.get('score')
            if score is not None:
                benchmarks[name]['scores'].append(score)

            categories.add(category)

    # Calculate averages
    for bench in benchmarks.values():
        if bench['scores']:
            bench['avg_score'] = sum(bench['scores']) / len(bench['scores'])
        del bench['scores']  # Remove raw scores from response

    return {
        'benchmarks': list(benchmarks.values()),
        'categories': sorted(list(categories)),
        'total_benchmarks': len(benchmarks)
    }


@app.get("/stats")
async def get_stats():
    """Get overall statistics about the leaderboard"""
    data = load_data()
    models = data.get('models', [])

    total_models = len(models)
    total_benchmarks = sum(len(m.get('benchmarks', [])) for m in models)

    licenses = {}
    for m in models:
        license_name = m.get('license', 'Unknown')
        licenses[license_name] = licenses.get(license_name, 0) + 1

    return {
        'total_models': total_models,
        'total_benchmark_scores': total_benchmarks,
        'last_updated': data.get('last_updated'),
        'licenses': licenses,
        'models_with_benchmarks': sum(1 for m in models if m.get('benchmarks')),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
