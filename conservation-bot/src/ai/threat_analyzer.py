import anthropic
import json
import logging
from typing import Dict, List, Any
import asyncio
from datetime import datetime


class ThreatAnalyzer:
    api_call_count = 0
    api_call_limit = 5  # Limit Anthropic API calls per run for cost control

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.threat_patterns = self._load_threat_patterns()

    async def analyze_listing(self, listing: Dict) -> Dict:
        if ThreatAnalyzer.api_call_count >= ThreatAnalyzer.api_call_limit:
            return {
                "threat_score": 0,
                "threat_level": "LOW",
                "confidence": 0,
                "reasoning": "API call limit reached",
            }
        prompt = f"""
        Analyze this marketplace listing for illegal wildlife trade indicators:
        Platform: {listing.get('platform', 'Unknown')}
        Title: {listing.get('title', '')}
        Description: {listing.get('description', '')}
        Price: {listing.get('price', '')}
        Location: {listing.get('location', '')}
        Search Term: {listing.get('search_term', '')}
        Images: {len(listing.get('images', [])) if 'images' in listing else 0} attached
        Respond in JSON format with threat_score, threat_level, confidence, reasoning.
        """
        try:
            ThreatAnalyzer.api_call_count += 1
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            analysis = json.loads(response.content[0].text)
            analysis["listing_id"] = listing.get("id", "")
            analysis["analysis_timestamp"] = datetime.utcnow().isoformat()
            return analysis
        except Exception as e:
            logging.error(f"AI analysis failed: {e}")
            return {
                "threat_score": 0,
                "threat_level": "LOW",
                "confidence": 0,
                "error": str(e),
            }

    def _load_threat_patterns(self) -> Dict:
        return {
            "high_risk_species": [
                "elephant",
                "rhino",
                "tiger",
                "pangolin",
                "bear",
                "shark",
                "turtle",
                "leopard",
                "jaguar",
                "cheetah",
            ],
            "risk_multipliers": {
                "cash_only": 2.0,
                "discreet_shipping": 1.8,
                "no_questions": 2.5,
                "traditional_medicine": 1.5,
            },
        }
