# import boto3  # Removed, not needed for Supabase
import hashlib
import json
import base64
from datetime import datetime
from typing import Dict, Any, Optional
import asyncio
import aiofiles
from playwright.async_api import async_playwright
import logging
from supabase import create_client, Client
import os


class EvidenceArchiver:
    def __init__(
        self,
        aws_access_key: str = None,
        aws_secret_key: str = None,
        bucket_name: str = None,
    ):
        self.s3_client = None
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        )
        self.bucket_name = bucket_name or "evidence"

    async def preserve_evidence(self, listing: Dict, analysis: Dict) -> Dict[str, Any]:
        evidence_id = self._generate_evidence_id(listing)
        evidence_package = {
            "evidence_id": evidence_id,
            "timestamp": datetime.utcnow().isoformat(),
            "listing_id": listing.get("id", ""),
            "platform": listing.get("platform", ""),
            "threat_analysis": analysis,
            "original_data": listing,
            "metadata": {"user_agent": "ConservationBot/1.0"},
        }
        # Upload evidence JSON to Supabase Storage
        import tempfile, json

        with tempfile.NamedTemporaryFile("w+", delete=False) as tmp:
            json.dump(evidence_package, tmp, indent=2)
            tmp.flush()
            tmp.seek(0)
            with open(tmp.name, "rb") as f:
                self.supabase.storage().from_(self.bucket_name).upload(
                    f"{evidence_id}.json", f
                )
        return {
            "evidence_id": evidence_id,
            "storage_location": f"supabase://{self.bucket_name}/{evidence_id}.json",
            "legal_report": {},
            "preservation_timestamp": evidence_package["timestamp"],
        }

    def _generate_evidence_id(self, listing: Dict) -> str:
        content = f"{listing.get('url', '')}{listing.get('title', '')}{datetime.utcnow().isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:16].upper()
