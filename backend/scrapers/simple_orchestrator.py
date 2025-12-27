import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict
import httpx
from huggingface_scraper import HuggingFaceScraper


class SimpleOrchestrator:
    """Simple orchestrator using only HuggingFace"""

    def __init__(self, output_file: str = "../data/models.json"):
        self.output_file = Path(__file__).parent / output_file
        self.hf_scraper = HuggingFaceScraper(delay_between_requests=0.5)
        self.hf_api_url = "https://huggingface.co/api/models"

    async def fetch_models_from_hf_api(self, limit: int = 100) -> List[str]:
        """
        Fetch model IDs from HuggingFace API

        Args:
            limit: Number of models to fetch

        Returns:
            List of model IDs
        """
        print("\n[1/2] Fetching models from HuggingFace API...")

        params = {
            'filter': 'text-generation',  # Only text generation models
            'sort': 'trending',  # Sort by trending (or 'downloads', 'likes')
            'limit': limit,
            'full': 'true'
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.hf_api_url, params=params)
                response.raise_for_status()
                models_data = response.json()

                # Extract model IDs and filter for open-source
                model_ids = []
                for model in models_data:
                    model_id = model.get('id') or model.get('modelId')
                    if not model_id:
                        continue

                    # Filter for likely open-source models
                    # Check if model has an open license or is from known open orgs
                    is_likely_open = self._is_likely_open_source(model)

                    if is_likely_open:
                        model_ids.append(model_id)

                print(f"✓ Found {len(model_ids)} trending open-source models from HuggingFace API")
                return model_ids[:limit]

        except Exception as e:
            print(f"Error fetching from HuggingFace API: {e}")
            # Fallback to curated list
            return self._get_fallback_models()

    def _is_likely_open_source(self, model_data: Dict) -> bool:
        """Check if a model is likely open source"""
        # Check license
        license_info = model_data.get('cardData', {}).get('license', '')
        open_licenses = [
            'apache', 'mit', 'llama', 'openrail', 'cc-by', 'bsd',
            'bigscience', 'deepseek', 'gemma', 'qwen'
        ]
        if license_info and any(lic in license_info.lower() for lic in open_licenses):
            return True

        # Check organization
        model_id = model_data.get('id', '')
        open_orgs = [
            'meta-llama', 'deepseek-ai', 'Qwen', 'mistralai', 'google',
            'microsoft', 'nvidia', 'allenai', '01-ai', 'tencent',
            'NousResearch', 'upstage', 'teknium', 'zai-org'
        ]
        if any(org in model_id for org in open_orgs):
            return True

        return False

    def _get_fallback_models(self) -> List[str]:
        """Curated list of popular open-source models"""
        return [
            # Meta Llama
            "meta-llama/Llama-3.3-70B-Instruct",
            "meta-llama/Llama-3.1-8B-Instruct",
            "meta-llama/Meta-Llama-3-70B-Instruct",

            # DeepSeek
            "deepseek-ai/DeepSeek-V3",
            "deepseek-ai/DeepSeek-V2.5",
            "deepseek-ai/deepseek-coder-33b-instruct",

            # Qwen
            "Qwen/Qwen2.5-72B-Instruct",
            "Qwen/Qwen2.5-32B-Instruct",
            "Qwen/Qwen2.5-7B-Instruct",
            "Qwen/Qwen2.5-Coder-32B-Instruct",

            # Mistral
            "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "mistralai/Mistral-7B-Instruct-v0.3",
            "mistralai/Mixtral-8x22B-Instruct-v0.1",

            # Google
            "google/gemma-2-27b-it",
            "google/gemma-2-9b-it",
            "google/gemma-2-2b-it",

            # Microsoft
            "microsoft/Phi-3.5-mini-instruct",
            "microsoft/Phi-3-medium-4k-instruct",

            # NVIDIA
            "nvidia/Llama-3.1-Nemotron-70B-Instruct",
            "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",

            # Others
            "01-ai/Yi-34B-Chat",
            "NousResearch/Hermes-3-Llama-3.1-70B",
            "upstage/SOLAR-10.7B-Instruct-v1.0",
            "zai-org/GLM-4.7",
        ]

    async def collect_all_data(self, max_models: int = 50) -> List[Dict]:
        """
        Collect model data from HuggingFace

        Args:
            max_models: Maximum number of models to collect

        Returns:
            List of model data dictionaries
        """
        print("=" * 60)
        print("Starting data collection from HuggingFace...")
        print("=" * 60)

        # Fetch model IDs
        model_ids = await self.fetch_models_from_hf_api(limit=max_models * 2)

        # Limit to requested number
        model_ids = model_ids[:max_models]

        # Scrape detailed data for each model
        print(f"\n[2/2] Scraping detailed data for {len(model_ids)} models...")
        print("This may take a few minutes...")

        models = await self.hf_scraper.scrape_models_batch(model_ids, max_concurrent=3)

        # Filter for models with actual data
        valid_models = [m for m in models if m.get('model_id')]
        print(f"✓ Successfully scraped {len(valid_models)} models")

        # Count models with benchmarks
        with_benchmarks = sum(1 for m in valid_models if m.get('benchmarks'))
        print(f"✓ {with_benchmarks} models have benchmark data")

        # Save data
        self._save_data(valid_models)

        return valid_models

    def _save_data(self, models: List[Dict]):
        """Save collected data to JSON file"""
        output_data = {
            'models': models,
            'total_count': len(models),
            'last_updated': datetime.now().isoformat(),
            'metadata': {
                'source': 'HuggingFace',
                'open_source_only': True
            }
        }

        # Ensure output directory exists
        self.output_file.parent.mkdir(parents=True, exist_ok=True)

        # Save to JSON
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"\n✓ Data saved to {self.output_file}")
        print(f"  Total models: {len(models)}")
        print(f"  File size: {self.output_file.stat().st_size / 1024:.2f} KB")

    def load_data(self) -> Dict:
        """Load previously collected data"""
        if not self.output_file.exists():
            return {'models': [], 'total_count': 0}

        with open(self.output_file, 'r', encoding='utf-8') as f:
            return json.load(f)


async def main():
    """Main execution function"""
    orchestrator = SimpleOrchestrator()

    print("\n🚀 ModelWatch Data Collection (HuggingFace Only)")
    print("Collecting latest open-source LLM data...\n")

    try:
        models = await orchestrator.collect_all_data(max_models=50)

        print("\n" + "=" * 60)
        print("COLLECTION COMPLETE!")
        print("=" * 60)

        # Show summary statistics
        print("\n📊 Summary:")
        print(f"  Total models: {len(models)}")

        if models:
            with_benchmarks = sum(1 for m in models if m.get('benchmarks'))
            print(f"  Models with benchmarks: {with_benchmarks}")

            total_benchmarks = sum(len(m.get('benchmarks', [])) for m in models)
            print(f"  Total benchmark scores: {total_benchmarks}")

            # Show top models by benchmark count
            models_sorted = sorted(
                [m for m in models if m.get('benchmarks')],
                key=lambda x: len(x.get('benchmarks', [])),
                reverse=True
            )

            if models_sorted:
                print("\n📝 Top models by benchmark count:")
                for model in models_sorted[:5]:
                    print(f"  - {model['model_id']}")
                    print(f"    Benchmarks: {len(model.get('benchmarks', []))}")
                    print(f"    License: {model.get('license', 'N/A')}")

    except Exception as e:
        print(f"\n❌ Error during collection: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
