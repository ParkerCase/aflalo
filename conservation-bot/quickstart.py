# quickstart.py
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.processing.ee_utils import EarthEngineProcessor
from src.processing.aoi_manager import AOIManager
from src.detection.change_detector import ForestChangeDetector
from src.detection.alert_system import AlertSystem
from datetime import datetime, timedelta

def main():
    print("Initializing Deforestation Monitoring System...")
    
    # Initialize components
    ee_processor = EarthEngineProcessor()
    aoi_manager = AOIManager()
    detector = ForestChangeDetector(ee_processor)
    alert_system = AlertSystem()
    
    # Create test AOI
    print("\nCreating test Area of Interest...")
    test_aoi = aoi_manager.get_test_aoi()
    print(f"Test AOI created: Rondônia, Brazil")
    
    # Run detection
    print("\nRunning forest loss detection...")
    print("Baseline period: 2023-01-01 to 2023-12-31")
    print("Analysis period: 2024-01-01 to 2024-12-31")
    
    try:
        result = detector.detect_forest_loss(
            test_aoi,
            '2023-01-01', '2023-12-31',
            '2024-01-01', '2024-12-31'
        )
        
        print(f"\nDetection Results:")
        print(f"Forest loss detected: {result['statistics']['forest_loss_hectares']} hectares")
        
        # Generate alert
        alert = alert_system.generate_alert(result, 'rondonia_test')
        if alert:
            print(f"\nAlert generated!")
            print(f"Alert ID: {alert['id']}")
            print(f"Priority: {alert['priority']}")
        else:
            print("\nNo significant forest loss detected (below threshold)")
            
    except Exception as e:
        print(f"\nError during detection: {e}")
        print("Make sure you have authenticated with Google Earth Engine")
        print("Run: earthengine authenticate")
    
    # Export results
    print("\nExporting results...")
    alert_system.export_alerts('outputs/alerts.json')
    print("Results exported to outputs/alerts.json")
    
    print("\n✅ Quick test completed!")
    print("\nTo start the web dashboard:")
    print("python -m src.api.app")
    print("Then open http://localhost:5000 in your browser")

if __name__ == '__main__':
    main()
