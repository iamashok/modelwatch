from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class Benchmark(BaseModel):
    """Individual benchmark score"""
    name: str
    score: Optional[float] = None
    category: Optional[str] = None  # reasoning, coding, agents, etc.


class ModelData(BaseModel):
    """Complete model information"""
    # Basic Info
    model_id: str  # e.g., "zai-org/GLM-4.7"
    model_name: str  # e.g., "GLM-4.7"
    organization: str  # e.g., "zai-org"

    # Metadata
    license: Optional[str] = None
    is_open_source: bool = False
    parameters: Optional[str] = None  # e.g., "358B"
    context_window: Optional[int] = None

    # HuggingFace Stats
    downloads: Optional[int] = None
    likes: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Benchmarks
    benchmarks: List[Benchmark] = Field(default_factory=list)

    # Performance Metrics
    latency_ms: Optional[float] = None
    throughput_tokens_per_sec: Optional[float] = None

    # Pricing (if available)
    input_price_per_1m: Optional[float] = None
    output_price_per_1m: Optional[float] = None

    # Additional
    description: Optional[str] = None
    arxiv_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "model_id": "zai-org/GLM-4.7",
                "model_name": "GLM-4.7",
                "organization": "zai-org",
                "license": "MIT",
                "is_open_source": True,
                "parameters": "358B",
                "context_window": 128000,
                "benchmarks": [
                    {"name": "MMLU-Pro", "score": 85.5, "category": "reasoning"},
                    {"name": "SWE-bench", "score": 73.8, "category": "coding"}
                ]
            }
        }


class LeaderboardResponse(BaseModel):
    """API response for leaderboard"""
    models: List[ModelData]
    total_count: int
    last_updated: datetime
