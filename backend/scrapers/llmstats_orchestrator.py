import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict
from llmstats_scraper import LLMStatsScraper
from huggingface_scraper import HuggingFaceScraper


class LLMStatsOrchestrator:
    """Orchestrator using llm-stats.com as primary data source with optional HuggingFace enrichment"""

    def __init__(self, output_file: str = "../data/models.json"):
        self.output_file = Path(__file__).parent / output_file
        self.llmstats_scraper = LLMStatsScraper(headless=True)
        self.hf_scraper = HuggingFaceScraper(delay_between_requests=0.5)

    async def collect_all_data(self, enrich_with_hf: bool = True) -> List[Dict]:
        """
        Collect model data from llm-stats.com and optionally enrich with HuggingFace

        Args:
            enrich_with_hf: Whether to fetch additional data from HuggingFace

        Returns:
            List of model data dictionaries
        """
        print("=" * 60)
        print("Starting data collection from llm-stats.com...")
        print("=" * 60)

        # Step 1: Scrape llm-stats.com leaderboard
        print("\n[1/2] Scraping llm-stats.com leaderboard...")
        models = await self.llmstats_scraper.scrape_leaderboard()

        if not models:
            print("⚠️  No models found from llm-stats.com")
            return []

        print(f"✓ Scraped {len(models)} models from llm-stats.com")

        # Step 2: Optionally enrich with HuggingFace data
        if enrich_with_hf:
            print(f"\n[2/2] Enriching with HuggingFace data...")
            print("This will add detailed model information and additional benchmarks")
            models = await self._enrich_with_huggingface(models)

        # Save data
        self._save_data(models)

        return models

    async def _enrich_with_huggingface(self, models: List[Dict]) -> List[Dict]:
        """Enrich model data with HuggingFace information"""

        # Extract model IDs
        model_ids = [m['model_id'] for m in models if m.get('model_id')]

        print(f"Attempting to enrich {len(model_ids)} models with HuggingFace data...")

        # Fetch HuggingFace data
        hf_models = await self.hf_scraper.scrape_models_batch(model_ids, max_concurrent=3)

        # Create a mapping of model_id to HuggingFace data
        hf_data_map = {m['model_id']: m for m in hf_models if m.get('model_id')}

        # Enrich models with HuggingFace data
        enriched_models = []
        hf_enriched_count = 0

        for model in models:
            model_id = model.get('model_id', '')

            # Check if we have HuggingFace data for this model
            if model_id in hf_data_map:
                hf_data = hf_data_map[model_id]

                # Merge data, preserving llm-stats.com benchmarks as primary
                # and adding HuggingFace data as secondary
                merged_model = {
                    **model,
                    'hf_license': hf_data.get('license'),
                    'hf_parameters': hf_data.get('parameters'),
                    'hf_context_window': hf_data.get('context_window'),
                    'hf_downloads': hf_data.get('downloads'),
                    'hf_likes': hf_data.get('likes'),
                    'hf_created_at': hf_data.get('created_at'),
                    'hf_last_modified': hf_data.get('last_modified'),
                    'hf_url': f"https://huggingface.co/{model_id}",
                }

                # Add HuggingFace benchmarks as additional data (not replacing llm-stats benchmarks)
                if hf_data.get('benchmarks'):
                    merged_model['hf_benchmarks'] = hf_data['benchmarks']

                enriched_models.append(merged_model)
                hf_enriched_count += 1
            else:
                # Keep original model data, add HuggingFace URL anyway
                model['hf_url'] = f"https://huggingface.co/{model_id}"
                enriched_models.append(model)

        print(f"✓ Successfully enriched {hf_enriched_count}/{len(models)} models with HuggingFace data")

        return enriched_models

    def _save_data(self, models: List[Dict]):
        """Save collected data to JSON file"""

        # Calculate statistics
        total_benchmarks = sum(len(m.get('benchmarks', [])) for m in models)
        hf_enriched = sum(1 for m in models if m.get('hf_license') or m.get('hf_benchmarks'))

        output_data = {
            'models': models,
            'total_count': len(models),
            'last_updated': datetime.now().isoformat(),
            'metadata': {
                'primary_source': 'llm-stats.com',
                'secondary_source': 'HuggingFace',
                'hf_enriched_count': hf_enriched,
                'total_benchmarks': total_benchmarks,
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
        print(f"  HuggingFace enriched: {hf_enriched}")
        print(f"  Total benchmarks: {total_benchmarks}")
        print(f"  File size: {self.output_file.stat().st_size / 1024:.2f} KB")

    def load_data(self) -> Dict:
        """Load previously collected data"""
        if not self.output_file.exists():
            return {'models': [], 'total_count': 0}

        with open(self.output_file, 'r', encoding='utf-8') as f:
            return json.load(f)


async def main():
    """Main execution function"""
    orchestrator = LLMStatsOrchestrator()

    print("\n🚀 ModelWatch Data Collection (llm-stats.com + HuggingFace)")
    print("Collecting latest open-source LLM leaderboard data...\ n")

    try:
        # Collect data with HuggingFace enrichment
        models = await orchestrator.collect_all_data(enrich_with_hf=True)

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

            hf_enriched = sum(1 for m in models if m.get('hf_license') or m.get('hf_benchmarks'))
            print(f"  HuggingFace enriched: {hf_enriched}")

            # Show top models by benchmark count
            models_sorted = sorted(
                models,
                key=lambda x: len(x.get('benchmarks', [])),
                reverse=True
            )

            if models_sorted:
                print("\n📝 Top 5 models by benchmark count:")
                for model in models_sorted[:5]:
                    print(f"  - {model['model_name']}")
                    print(f"    Organization: {model.get('organization', 'N/A')}")
                    print(f"    Benchmarks: {len(model.get('benchmarks', []))}")
                    if model.get('hf_license'):
                        print(f"    License: {model.get('hf_license')}")

    except Exception as e:
        print(f"\n❌ Error during collection: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
