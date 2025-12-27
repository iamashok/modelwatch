import asyncio
import re
from typing import Dict, List, Optional
import httpx
from bs4 import BeautifulSoup
import json
from datetime import datetime


class HuggingFaceScraper:
    """Scraper for HuggingFace model pages"""

    def __init__(self, delay_between_requests: float = 0.5):
        self.base_url = "https://huggingface.co"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        self.delay = delay_between_requests  # Delay between requests to avoid rate limiting
        self._cache = {}  # Cache to avoid refetching same models

    async def scrape_model(self, model_id: str) -> Optional[Dict]:
        """
        Scrape detailed information from a HuggingFace model page

        Args:
            model_id: HuggingFace model ID (e.g., "zai-org/GLM-4.7")

        Returns:
            Dictionary containing model information
        """
        # Check cache first
        if model_id in self._cache:
            return self._cache[model_id]

        url = f"{self.base_url}/{model_id}"

        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                # Add delay to avoid rate limiting
                await asyncio.sleep(self.delay)

                print(f"Fetching {url}")
                response = await client.get(url, headers=self.headers)

                if response.status_code == 404:
                    # Cache 404s to avoid retrying
                    self._cache[model_id] = None
                    return None

                if response.status_code == 429:
                    print(f"Rate limited on {model_id}, waiting...")
                    await asyncio.sleep(2)
                    return None

                response.raise_for_status()
                result = self._parse_model_page(response.text, model_id)

                # Cache successful results
                self._cache[model_id] = result
                return result

        except httpx.HTTPError as e:
            if '429' in str(e):
                print(f"Rate limited on {model_id}")
            else:
                print(f"HTTP error fetching {model_id}: {e}")
            return None
        except Exception as e:
            print(f"Error fetching {model_id}: {e}")
            return None

    def _parse_model_page(self, html: str, model_id: str) -> Dict:
        """Parse HuggingFace model page HTML"""
        soup = BeautifulSoup(html, 'html.parser')

        model_data = {
            'model_id': model_id,
            'model_name': model_id.split('/')[-1],
            'organization': model_id.split('/')[0] if '/' in model_id else '',
            'is_open_source': False,
            'benchmarks': []
        }

        # Extract license
        license_info = self._extract_license(soup)
        if license_info:
            model_data['license'] = license_info
            model_data['is_open_source'] = self._is_open_source_license(license_info)

        # Extract model card metadata
        metadata = self._extract_metadata(soup)
        model_data.update(metadata)

        # Extract benchmarks from tables
        benchmarks = self._extract_benchmarks(soup)
        model_data['benchmarks'] = benchmarks

        # Extract model description
        description = self._extract_description(soup)
        if description:
            model_data['description'] = description

        # Extract stats (downloads, likes)
        stats = self._extract_stats(soup)
        model_data.update(stats)

        # Extract parameters/size
        params = self._extract_parameters(soup, html)
        if params:
            model_data['parameters'] = params

        # Extract arxiv ID
        arxiv_id = self._extract_arxiv(soup, html)
        if arxiv_id:
            model_data['arxiv_id'] = arxiv_id

        return model_data

    def _extract_license(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract license information"""
        # Look for license tag or metadata
        license_element = soup.find('a', href=re.compile(r'/license'))
        if license_element:
            return license_element.text.strip()

        # Check meta tags
        meta_license = soup.find('meta', attrs={'name': 'license'})
        if meta_license:
            return meta_license.get('content', '').strip()

        # Look in model card YAML
        yaml_match = re.search(r'license:\s*([^\n]+)', soup.text)
        if yaml_match:
            return yaml_match.group(1).strip()

        return None

    def _is_open_source_license(self, license_name: str) -> bool:
        """Check if license is open source"""
        open_source_licenses = [
            'mit', 'apache', 'apache-2.0', 'gpl', 'bsd', 'cc-by',
            'llama', 'openrail', 'bigscience', 'deepseek'
        ]
        license_lower = license_name.lower()
        return any(oss in license_lower for oss in open_source_licenses)

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict:
        """Extract model card metadata"""
        metadata = {}

        # Look for key-value pairs in the page
        # Context length
        context_match = re.search(r'context[_ ](?:window|length)[:\s]*([0-9,]+)', soup.text, re.IGNORECASE)
        if context_match:
            context_str = context_match.group(1).replace(',', '')
            try:
                metadata['context_window'] = int(context_str)
            except ValueError:
                pass

        return metadata

    def _extract_benchmarks(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract benchmark scores from tables"""
        benchmarks = []

        # Look for tables with benchmark data
        tables = soup.find_all('table')

        for table in tables:
            rows = table.find_all('tr')

            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    benchmark_name = cells[0].text.strip()
                    score_text = cells[1].text.strip()

                    # Try to extract numeric score
                    score_match = re.search(r'(\d+\.?\d*)', score_text)
                    if score_match:
                        try:
                            score = float(score_match.group(1))

                            # Categorize benchmark
                            category = self._categorize_benchmark(benchmark_name)

                            benchmarks.append({
                                'name': benchmark_name,
                                'score': score,
                                'category': category
                            })
                        except ValueError:
                            pass

        # Also look for benchmark mentions in text
        text_benchmarks = self._extract_benchmarks_from_text(soup.text)
        benchmarks.extend(text_benchmarks)

        # Remove duplicates
        seen = set()
        unique_benchmarks = []
        for b in benchmarks:
            key = (b['name'], b['score'])
            if key not in seen:
                seen.add(key)
                unique_benchmarks.append(b)

        return unique_benchmarks

    def _extract_benchmarks_from_text(self, text: str) -> List[Dict]:
        """Extract benchmark scores from text content"""
        benchmarks = []

        # Common benchmark patterns
        patterns = [
            r'(MMLU[- ]Pro)[:\s]+([0-9.]+)%?',
            r'(GPQA[- ]Diamond)[:\s]+([0-9.]+)%?',
            r'(SWE[- ]bench)[:\s]+([0-9.]+)%?',
            r'(HumanEval)[:\s]+([0-9.]+)%?',
            r'(AIME[- ]\d+)[:\s]+([0-9.]+)%?',
            r'(LiveCodeBench)[:\s]+([0-9.]+)%?',
            r'(GSM8K)[:\s]+([0-9.]+)%?',
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                name = match.group(1).strip()
                try:
                    score = float(match.group(2))
                    category = self._categorize_benchmark(name)
                    benchmarks.append({
                        'name': name,
                        'score': score,
                        'category': category
                    })
                except ValueError:
                    pass

        return benchmarks

    def _categorize_benchmark(self, name: str) -> str:
        """Categorize benchmark by type"""
        name_lower = name.lower()

        if any(x in name_lower for x in ['code', 'swe', 'humaneval', 'livecode']):
            return 'coding'
        elif any(x in name_lower for x in ['math', 'gsm', 'aime', 'hmmt']):
            return 'reasoning'
        elif any(x in name_lower for x in ['agent', 'tool', 'browse']):
            return 'agents'
        elif any(x in name_lower for x in ['mmlu', 'gpqa', 'reasoning']):
            return 'reasoning'
        else:
            return 'general'

    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract model description"""
        # Look for description in meta tags
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            return meta_desc.get('content', '').strip()

        # Look for first paragraph in model card
        paragraphs = soup.find_all('p')
        for p in paragraphs[:3]:
            text = p.text.strip()
            if len(text) > 50:
                return text[:500]

        return None

    def _extract_stats(self, soup: BeautifulSoup) -> Dict:
        """Extract download and like stats"""
        stats = {}

        # Look for downloads
        downloads_match = re.search(r'([0-9,]+)\s*downloads?', soup.text, re.IGNORECASE)
        if downloads_match:
            try:
                downloads = int(downloads_match.group(1).replace(',', ''))
                stats['downloads'] = downloads
            except ValueError:
                pass

        # Look for likes
        likes_match = re.search(r'([0-9,]+)\s*likes?', soup.text, re.IGNORECASE)
        if likes_match:
            try:
                likes = int(likes_match.group(1).replace(',', ''))
                stats['likes'] = likes
            except ValueError:
                pass

        return stats

    def _extract_parameters(self, soup: BeautifulSoup, html: str) -> Optional[str]:
        """Extract model parameter count"""
        # Look for parameter mentions
        param_patterns = [
            r'(\d+\.?\d*[BMK])\s*parameters?',
            r'parameters?[:\s]+(\d+\.?\d*[BMK])',
        ]

        for pattern in param_patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return match.group(1).upper()

        return None

    def _extract_arxiv(self, soup: BeautifulSoup, html: str) -> Optional[str]:
        """Extract arXiv ID"""
        arxiv_match = re.search(r'arxiv[:\s]+(\d+\.\d+)', html, re.IGNORECASE)
        if arxiv_match:
            return arxiv_match.group(1)

        # Look for arxiv links
        arxiv_link = soup.find('a', href=re.compile(r'arxiv\.org'))
        if arxiv_link:
            link_match = re.search(r'(\d+\.\d+)', arxiv_link.get('href', ''))
            if link_match:
                return link_match.group(1)

        return None

    async def scrape_models_batch(self, model_ids: List[str], max_concurrent: int = 3) -> List[Dict]:
        """
        Scrape multiple models with rate limiting

        Args:
            model_ids: List of HuggingFace model IDs
            max_concurrent: Maximum concurrent requests

        Returns:
            List of model data dictionaries
        """
        # Remove duplicates while preserving order
        unique_ids = list(dict.fromkeys(model_ids))

        print(f"  Fetching {len(unique_ids)} unique models (de-duped from {len(model_ids)} IDs)")

        results = []

        # Process in batches to limit concurrent requests
        for i in range(0, len(unique_ids), max_concurrent):
            batch = unique_ids[i:i + max_concurrent]
            batch_results = await asyncio.gather(*[self.scrape_model(model_id) for model_id in batch])
            results.extend([r for r in batch_results if r is not None])

            # Small delay between batches
            if i + max_concurrent < len(unique_ids):
                await asyncio.sleep(0.5)

        return results


if __name__ == "__main__":
    async def test():
        scraper = HuggingFaceScraper()

        # Test with example model
        test_models = [
            "zai-org/GLM-4.7",
            "deepseek-ai/DeepSeek-V3",
            "meta-llama/Llama-3.3-70B-Instruct"
        ]

        results = await scraper.scrape_models_batch(test_models)

        print(f"\nScraped {len(results)} models:")
        for model in results:
            print(f"\n{model['model_id']}:")
            print(f"  License: {model.get('license')}")
            print(f"  Open Source: {model.get('is_open_source')}")
            print(f"  Parameters: {model.get('parameters')}")
            print(f"  Benchmarks: {len(model.get('benchmarks', []))}")
            for bench in model.get('benchmarks', [])[:3]:
                print(f"    - {bench['name']}: {bench['score']} ({bench['category']})")

    asyncio.run(test())
