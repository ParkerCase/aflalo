# src/web/dashboard.py
# Create templates/index.html
html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>Deforestation Monitor</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #map { height: 500px; margin: 20px 0; }
        .alert-box { 
            background: #f8d7da; 
            border: 1px solid #f5c6cb; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .controls { margin: 20px 0; }
        button { 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
        }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>Deforestation Monitoring Dashboard</h1>
    
    <div class="controls">
        <button onclick="runDetection()">Run Detection</button>
        <button onclick="loadAlerts()">Refresh Alerts</button>
        <select id="aoiSelect">
            <option value="rondonia_test">Rondônia Test Area</option>
        </select>
    </div>
    
    <div id="map"></div>
    
    <div id="alerts">
        <h2>Recent Alerts</h2>
        <div id="alertsList"></div>
    </div>
    
    <script>
        // Initialize map
        var map = L.map('map').setView([-9.25, -63.25], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        // Test area polygon
        var testArea = L.polygon([
            [-9.0, -63.5],
            [-9.0, -63.0],
            [-9.5, -63.0],
            [-9.5, -63.5]
        ]).addTo(map);
        
        async function runDetection() {
            const aoi = document.getElementById('aoiSelect').value;
            const response = await fetch('/api/detect', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    aoi: aoi,
                    baseline_start: '2023-01-01',
                    baseline_end: '2023-12-31',
                    analysis_start: '2024-01-01',
                    analysis_end: '2024-12-31'
                })
            });
            const data = await response.json();
            console.log('Detection result:', data);
            if (data.alert) {
                displayAlert(data.alert);
            }
        }
        
        async function loadAlerts() {
            const response = await fetch('/api/alerts?days=30');
            const alerts = await response.json();
            displayAlerts(alerts);
        }
        
        function displayAlerts(alerts) {
            const container = document.getElementById('alertsList');
            container.innerHTML = alerts.map(alert => `
                <div class="alert-box">
                    <strong>${alert.id}</strong><br>
                    Area: ${alert.aoi}<br>
                    Loss: ${alert.forest_loss_hectares} hectares<br>
                    Priority: ${alert.priority}<br>
                    Time: ${new Date(alert.timestamp).toLocaleString()}
                </div>
            `).join('');
        }
        
        function displayAlert(alert) {
            const container = document.getElementById('alertsList');
            const alertHtml = `
                <div class="alert-box" style="background: #fff3cd; border-color: #ffeeba;">
                    <strong>NEW ALERT: ${alert.id}</strong><br>
                    Forest loss detected: ${alert.forest_loss_hectares} hectares<br>
                    Priority: ${alert.priority}
                </div>
            `;
            container.innerHTML = alertHtml + container.innerHTML;
        }
        
        // Load alerts on startup
        loadAlerts();
    </script>
</body>
</html>
"""

# Save template
import os
os.makedirs('templates', exist_ok=True)
with open('templates/index.html', 'w') as f:
    f.write(html_template)
