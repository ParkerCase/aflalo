# src/processing/aoi_manager.py
import ee
import geopandas as gpd
from shapely.geometry import Polygon, Point

class AOIManager:
    def __init__(self):
        self.aois = {}
    
    def add_aoi_from_coords(self, name, coordinates):
        """Add Area of Interest from coordinates
        coordinates: [[lon1, lat1], [lon2, lat2], ...]
        """
        polygon = Polygon(coordinates)
        self.aois[name] = {
            'polygon': polygon,
            'ee_geometry': ee.Geometry.Polygon(coordinates),
            'bounds': polygon.bounds
        }
        return self.aois[name]
    
    def add_aoi_from_geojson(self, name, geojson_path):
        """Load AOI from GeoJSON file"""
        gdf = gpd.read_file(geojson_path)
        geometry = gdf.geometry.iloc[0]
        coords = list(geometry.exterior.coords)
        return self.add_aoi_from_coords(name, coords)
    
    def get_test_aoi(self):
        """Get a test AOI (Amazon rainforest region)"""
        # Area in Rondônia, Brazil - high deforestation activity
        coords = [
            [-63.5, -9.0],
            [-63.0, -9.0],
            [-63.0, -9.5],
            [-63.5, -9.5],
            [-63.5, -9.0]
        ]
        return self.add_aoi_from_coords('rondonia_test', coords)
