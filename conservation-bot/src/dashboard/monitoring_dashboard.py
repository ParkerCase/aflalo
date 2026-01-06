from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
from typing import Dict, List
from datetime import datetime, timedelta
import os
from supabase import create_client, Client


class MonitoringDashboard:
    def __init__(self):
        self.app = FastAPI()
        self.active_connections: List[WebSocket] = []
        self.real_time_data = {
            "active_scans": 0,
            "threats_detected_today": 0,
            "alerts_sent_today": 0,
            "platforms_monitored": 4,
            "total_species_protected": 150,
            "authorities_connected": 12,
        }
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        )
        self.setup_routes()

    def setup_routes(self):
        @self.app.get("/")
        async def dashboard_home():
            return HTMLResponse("<h1>Dashboard Stub</h1>")

    def get_current_statistics(self) -> Dict:
        today = datetime.now().strftime("%Y-%m-%d")
        threats_today = (
            self.supabase.table("detections")
            .select("*")
            .eq("timestamp", today)
            .execute()
            .count
        )
        alerts_today = (
            self.supabase.table("detections")
            .select("*")
            .eq("timestamp", today)
            .eq("alert_sent", True)
            .execute()
            .count
        )
        return {
            "active_scans": self.real_time_data["active_scans"],
            "threats_detected_today": threats_today,
            "alerts_sent_today": alerts_today,
            "platforms_monitored": 4,
            "total_species_protected": 150,
            "authorities_connected": 12,
            "last_updated": datetime.now().isoformat(),
        }

    def get_recent_detections(self, limit: int = 20) -> List[Dict]:
        result = (
            self.supabase.table("detections")
            .select("*")
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data if result.data else []

    async def log_detection(self, evidence_package: Dict, analysis: Dict) -> None:
        detection = {
            "evidence_id": evidence_package["evidence_id"],
            "timestamp": evidence_package["timestamp"],
            "platform": evidence_package["platform"],
            "threat_score": analysis.get("threat_score", 0),
            "threat_level": analysis.get("threat_level", "LOW"),
            "species_involved": json.dumps(analysis.get("species_involved", [])),
            "alert_sent": False,
            "status": "detected",
        }
        self.supabase.table("detections").insert(detection).execute()
        self.real_time_data["threats_detected_today"] += 1
        await self.broadcast_update({"type": "new_detection", "data": detection})
