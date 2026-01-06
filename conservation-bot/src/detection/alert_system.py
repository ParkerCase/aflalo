# src/detection/alert_system.py
import json
from datetime import datetime
import pandas as pd
from typing import Dict, List

class AlertSystem:
    def __init__(self, threshold_hectares=5):
        self.alerts = []
        self.threshold_hectares = threshold_hectares
        
    def generate_alert(self, detection_result, aoi_name, priority='medium'):
        """Generate alert from detection results"""
        stats = detection_result['statistics']
        loss_ha = stats['forest_loss_hectares']
        
        if loss_ha >= self.threshold_hectares:
            alert = {
                'id': f"ALERT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                'timestamp': datetime.now().isoformat(),
                'aoi': aoi_name,
                'forest_loss_hectares': loss_ha,
                'priority': self._calculate_priority(loss_ha),
                'status': 'new',
                'coordinates': None  # Will be populated with specific locations
            }
            
            self.alerts.append(alert)
            return alert
        return None
    
    def _calculate_priority(self, loss_hectares):
        """Calculate alert priority based on area"""
        if loss_hectares > 50:
            return 'critical'
        elif loss_hectares > 20:
            return 'high'
        elif loss_hectares > 10:
            return 'medium'
        else:
            return 'low'
    
    def get_recent_alerts(self, days=7):
        """Get alerts from the last N days"""
        cutoff = datetime.now() - timedelta(days=days)
        return [a for a in self.alerts 
                if datetime.fromisoformat(a['timestamp']) > cutoff]
    
    def export_alerts(self, filepath):
        """Export alerts to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.alerts, f, indent=2)
