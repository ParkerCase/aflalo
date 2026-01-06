# src/api/app.py
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import ee
from datetime import datetime, timedelta
import json

app = Flask(__name__)
CORS(app)

# Initialize components
from src.processing.ee_utils import EarthEngineProcessor
from src.processing.aoi_manager import AOIManager
from src.detection.change_detector import ForestChangeDetector
from src.detection.alert_system import AlertSystem

ee_processor = EarthEngineProcessor()
aoi_manager = AOIManager()
detector = ForestChangeDetector(ee_processor)
alert_system = AlertSystem()


@app.route("/api/health")
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})


@app.route("/api/aois", methods=["GET", "POST"])
def manage_aois():
    if request.method == "GET":
        return jsonify(list(aoi_manager.aois.keys()))

    elif request.method == "POST":
        data = request.json
        name = data["name"]
        coordinates = data["coordinates"]
        aoi = aoi_manager.add_aoi_from_coords(name, coordinates)
        return jsonify({"status": "success", "aoi": name})


@app.route("/api/detect", methods=["POST"])
def detect_deforestation():
    """Run detection for specified AOI and date range"""
    data = request.json
    aoi_name = data["aoi"]

    # Parse dates
    baseline_start = data.get("baseline_start", "2023-01-01")
    baseline_end = data.get("baseline_end", "2023-12-31")
    analysis_start = data.get("analysis_start", "2024-01-01")
    analysis_end = data.get("analysis_end", "2024-12-31")

    # Get AOI
    if aoi_name not in aoi_manager.aois:
        return jsonify({"error": "AOI not found"}), 404

    aoi = aoi_manager.aois[aoi_name]

    # Run detection
    try:
        result = detector.detect_forest_loss(
            aoi, baseline_start, baseline_end, analysis_start, analysis_end
        )

        # Generate alert if needed
        alert = alert_system.generate_alert(result, aoi_name)

        return jsonify(
            {"status": "success", "statistics": result["statistics"], "alert": alert}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/alerts")
def get_alerts():
    """Get recent alerts"""
    days = request.args.get("days", 7, type=int)
    alerts = alert_system.get_recent_alerts(days)
    return jsonify(alerts)


@app.route("/api/export/<aoi_name>")
def export_visualization(aoi_name):
    """Export visualization data for frontend"""
    # This would export map tiles or GeoJSON for visualization
    pass


@app.route("/")
def dashboard():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
