# src/processing/ee_utils.py
import ee
import folium
from datetime import datetime, timedelta
import pandas as pd


class EarthEngineProcessor:
    def __init__(self):
        try:
            ee.Initialize()
            print("Earth Engine initialized successfully")
        except Exception as e:
            print(f"Error initializing Earth Engine: {e}")
            print("Run 'earthengine authenticate' in terminal")

    def get_sentinel2_collection(self, start_date, end_date, bounds):
        """Get Sentinel-2 imagery for specified area and time"""
        return (
            ee.ImageCollection("COPERNICUS/S2_SR")
            .filterBounds(bounds)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            .select(["B2", "B3", "B4", "B8", "B11", "B12"])
        )

    def get_landsat8_collection(self, start_date, end_date, bounds):
        """Get Landsat 8 imagery"""
        return (
            ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
            .filterBounds(bounds)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUD_COVER", 20))
            .select(["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"])
        )

    def calculate_ndvi(self, image):
        """Calculate NDVI for vegetation monitoring"""
        if "B8" in image.bandNames().getInfo():  # Sentinel-2
            ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
        else:  # Landsat 8
            ndvi = image.normalizedDifference(["SR_B5", "SR_B4"]).rename("NDVI")
        return image.addBands(ndvi)
