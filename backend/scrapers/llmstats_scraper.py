import asyncio
import json
import re
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeoutError


class LLMStatsScraper:
    """Scraper for llm-stats.com Open LLM Leaderboard"""

    def __init__(self, headless: bool = True):
        self.url = "https://llm-stats.com/leaderboards/open-llm-leaderboard"
        self.headless = headless
        self._cache = {}

    async def scrape_leaderboard(self) -> List[Dict]:
        """
        Scrape the Open LLM Leaderboard from llm-stats.com

        Returns:
            List of model data dictionaries with benchmarks
        """
        print(f"\nScraping Open LLM Leaderboard from {self.url}...")

        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=self.headless)
            page = await browser.new_page()

            try:
                # Navigate to leaderboard
                print("Loading page...")
                await page.goto(self.url, wait_until="networkidle", timeout=60000)

                # Wait for the table to load
                print("Waiting for leaderboard table...")
                await page.wait_for_selector("table, [role='table'], .leaderboard", timeout=30000)

                # Give extra time for JavaScript to fully render
                await asyncio.sleep(3)

                # Extract data from the page
                models = await self._extract_models(page)

                print(f"✓ Successfully scraped {len(models)} models from llm-stats.com")
                return models

            except PlaywrightTimeoutError as e:
                print(f"Timeout waiting for page to load: {e}")
                return []
            except Exception as e:
                print(f"Error scraping llm-stats.com: {e}")
                import traceback
                traceback.print_exc()
                return []
            finally:
                await browser.close()

    async def _extract_models(self, page: Page) -> List[Dict]:
        """Extract model data from the leaderboard page"""

        # Try to extract data from the rendered page
        # This will depend on the actual HTML structure
        models = []

        try:
            # Get all table rows (adjust selector based on actual structure)
            rows = await page.query_selector_all("table tbody tr, [role='row']")

            if not rows:
                # Try alternative selectors
                rows = await page.query_selector_all("tr.model-row, .leaderboard-item, [data-model]")

            print(f"Found {len(rows)} rows to process")

            for row in rows:
                try:
                    model_data = await self._extract_model_from_row(row, page)
                    if model_data:
                        models.append(model_data)
                except Exception as e:
                    print(f"Error extracting model from row: {e}")
                    continue

        except Exception as e:
            print(f"Error finding table rows: {e}")

            # Fallback: Try to find data in JavaScript variables or JSON
            try:
                # Look for embedded JSON data in script tags
                script_content = await page.content()
                models = self._extract_from_page_source(script_content)
            except Exception as e2:
                print(f"Fallback extraction also failed: {e2}")

        return models

    async def _extract_model_from_row(self, row, page: Page) -> Optional[Dict]:
        """Extract model information from a table row"""

        try:
            # Get text content from the row
            text_content = await row.inner_text()

            # Debug: print first few rows
            if not hasattr(self, '_debug_count'):
                self._debug_count = 0

            if self._debug_count < 3:
                print(f"\nDEBUG Row {self._debug_count + 1}: {text_content[:200]}")
                self._debug_count += 1

            # Extract all cell values first
            cells = await row.query_selector_all("td, [role='cell']")
            if not cells:
                return None

            cell_values = []
            for cell in cells:
                text = await cell.inner_text()
                # Clean up whitespace and filter empty cells
                cleaned = text.strip().replace('\n', ' ').replace('\t', ' ')
                # Remove extra spaces
                cleaned = ' '.join(cleaned.split())
                if cleaned:  # Only add non-empty cells
                    cell_values.append(cleaned)

            if self._debug_count < 3:
                print(f"Cells: {cell_values}")

            if len(cell_values) < 2:
                return None

            # Find model name - skip flags/emojis and look for actual model name
            model_name = None
            model_name_index = 0
            for i, cell in enumerate(cell_values):
                # Skip single character cells (flags) and pricing (contains $)
                if len(cell) > 2 and '$' not in cell and not cell.isdigit():
                    # Check if it looks like a model name
                    if any(c.isalnum() for c in cell):
                        model_name = cell.replace('NEW', '').strip()
                        model_name_index = i
                        break

            if not model_name or len(model_name) < 2:
                return None

            # Skip header rows
            if any(x in model_name.lower() for x in ['rank', 'model', 'position', 'name']):
                return None

            # Extract pricing (next 2 cells after model name)
            input_price = None
            output_price = None
            pricing_start_idx = model_name_index + 1

            if pricing_start_idx < len(cell_values):
                price1 = cell_values[pricing_start_idx]
                if '$' in price1:
                    input_price = self._extract_price(price1)

            if pricing_start_idx + 1 < len(cell_values):
                price2 = cell_values[pricing_start_idx + 1]
                if '$' in price2:
                    output_price = self._extract_price(price2)

            # Parse benchmarks from remaining cells
            benchmarks = self._parse_benchmarks_from_cells(cell_values)

            # Extract model ID (organization/model-name format)
            model_id = self._extract_model_id(model_name)

            # Extract parameters if available
            parameters = self._extract_parameters_from_cells(cell_values)

            return {
                "model_id": model_id,
                "model_name": model_name,
                "organization": model_id.split("/")[0] if "/" in model_id else "unknown",
                "benchmarks": benchmarks,
                "source": "llm-stats.com",
                "is_open_source": True,  # This page filters for open source
                "input_price_per_1m": input_price,
                "output_price_per_1m": output_price,
                "parameters": parameters,
            }

        except Exception as e:
            print(f"Error in _extract_model_from_row: {e}")
            return None

    def _parse_benchmarks_from_cells(self, cells: List[str]) -> List[Dict]:
        """Parse benchmark scores from table cells"""
        benchmarks = []

        # Based on the observed data, benchmarks appear as percentages
        # The columns seem to be: Flag, Model, Price1, Price2, Score1%, Score2%, Score3%, Score4%, etc.

        # Common benchmark names for llm-stats.com
        # These are estimates based on common leaderboards - you may need to scrape headers to get exact names
        benchmark_names = [
            "MMLU", "Arc-Challenge", "HellaSwag", "TruthfulQA", "Winogrande", "GSM8K",
            "GPQA", "AIME", "MATH", "HumanEval"
        ]

        # Extract all percentage scores
        score_index = 0
        for cell in cells:
            # Look for percentage values
            if '%' in cell:
                score = self._extract_score(cell)
                if score is not None:
                    # Assign benchmark name
                    if score_index < len(benchmark_names):
                        benchmark_name = benchmark_names[score_index]
                    else:
                        benchmark_name = f"Benchmark_{score_index + 1}"

                    benchmarks.append({
                        "name": benchmark_name,
                        "score": score,
                        "category": self._categorize_benchmark(benchmark_name)
                    })
                    score_index += 1

        return benchmarks

    def _extract_score(self, text: str) -> Optional[float]:
        """Extract numeric score from text"""
        # Remove any non-numeric characters except dots and minus
        numbers = re.findall(r'-?\d+\.?\d*', text)
        if numbers:
            try:
                return float(numbers[0])
            except ValueError:
                return None
        return None

    def _extract_price(self, text: str) -> Optional[float]:
        """Extract price from text like '$0.60'"""
        numbers = re.findall(r'\$?(\d+\.?\d*)', text)
        if numbers:
            try:
                return float(numbers[0])
            except ValueError:
                return None
        return None

    def _extract_parameters_from_cells(self, cells: List[str]) -> Optional[str]:
        """Extract model parameters from cells"""
        # Look for cells with 'B' suffix indicating billions of parameters
        for cell in cells:
            # Check for pattern like "358" which might be parameters
            if cell.isdigit():
                num = int(cell)
                # Likely parameters if it's a reasonable number
                if 1 <= num <= 1000:
                    return f"{num}B"
        return None

    def _extract_model_id(self, model_name: str) -> str:
        """Extract or construct model ID matching HuggingFace format"""
        # If it already has org/name format, use it
        if "/" in model_name:
            return model_name

        # Otherwise, try to identify organization from common patterns
        name_lower = model_name.lower()

        # Comprehensive org mapping for HuggingFace
        org_mapping = {
            # Chinese models
            "glm": "THUDM",  # GLM-4.7 -> THUDM/glm-4-9b-chat
            "kimi": "MoonshotAI",  # Kimi -> MoonshotAI
            "mimo": "AIDC-AI",  # MiMo -> AIDC-AI
            "qwen": "Qwen",
            "yi": "01-ai",
            "deepseek": "deepseek-ai",

            # Western models
            "llama": "meta-llama",
            "mistral": "mistralai",
            "mixtral": "mistralai",
            "gemma": "google",
            "gemini": "google",
            "phi": "microsoft",
            "gpt": "openai",
            "claude": "anthropic",

            # Other orgs
            "nemotron": "nvidia",
            "hermes": "NousResearch",
            "nous": "NousResearch",
            "solar": "upstage",
            "commandr": "CohereForAI",
            "aya": "CohereForAI",
        }

        for pattern, org in org_mapping.items():
            if pattern in name_lower:
                return f"{org}/{model_name}"

        # Default: use model name as both org and model
        return f"unknown/{model_name}"

    def _categorize_benchmark(self, name: str) -> str:
        """Categorize benchmark by type"""
        name_lower = name.lower()

        if any(x in name_lower for x in ["code", "human", "swe", "live"]):
            return "coding"
        elif any(x in name_lower for x in ["math", "gsm", "aime", "gpqa"]):
            return "reasoning"
        elif any(x in name_lower for x in ["mmlu", "arc", "truthful", "winogrande"]):
            return "knowledge"
        else:
            return "general"

    def _extract_from_page_source(self, html: str) -> List[Dict]:
        """Extract data from page source as fallback"""
        models = []

        # Try to find JSON data in script tags
        json_pattern = r'(?:data|models|leaderboard)\s*[=:]\s*(\[{.*?}\])'
        matches = re.findall(json_pattern, html, re.DOTALL)

        for match in matches:
            try:
                data = json.loads(match)
                if isinstance(data, list) and len(data) > 0:
                    # Process the JSON data
                    for item in data:
                        if isinstance(item, dict) and 'model' in item or 'name' in item:
                            models.append(self._normalize_json_model(item))
            except json.JSONDecodeError:
                continue

        return models

    def _normalize_json_model(self, item: Dict) -> Dict:
        """Normalize model data from JSON"""
        model_name = item.get('model') or item.get('name') or item.get('modelId', '')

        return {
            "model_id": self._extract_model_id(model_name),
            "model_name": model_name,
            "organization": model_name.split("/")[0] if "/" in model_name else "unknown",
            "benchmarks": [],  # Will be populated from item data
            "source": "llm-stats.com",
            "is_open_source": True,
        }


async def main():
    """Test the scraper"""
    scraper = LLMStatsScraper(headless=False)  # Set to True for production
    models = await scraper.scrape_leaderboard()

    print(f"\n{'='*60}")
    print(f"Scraped {len(models)} models")
    print(f"{'='*60}\n")

    if models:
        print("Sample model:")
        print(json.dumps(models[0], indent=2))


if __name__ == "__main__":
    asyncio.run(main())
