# src/detection/change_detector.py
import ee
import numpy as np
from datetime import datetime, timedelta

class ForestChangeDetector:
    def __init__(self, ee_processor):
        self.ee_processor = ee_processor
        self.ndvi_threshold = 0.4  # Threshold for forest/non-forest
        
    def detect_forest_loss(self, aoi, baseline_start, baseline_end, 
                          analysis_start, analysis_end):
        """Detect forest loss between two time periods"""
        bounds = aoi['ee_geometry']
        
        # Get baseline forest cover
        baseline_collection = self.ee_processor.get_sentinel2_collection(
            baseline_start, baseline_end, bounds
        )
        baseline_composite = self._create_median_composite(baseline_collection)
        baseline_ndvi = self._calculate_mean_ndvi(baseline_composite)
        
        # Get current forest cover
        current_collection = self.ee_processor.get_sentinel2_collection(
            analysis_start, analysis_end, bounds
        )
        current_composite = self._create_median_composite(current_collection)
        current_ndvi = self._calculate_mean_ndvi(current_composite)
        
        # Calculate forest loss
        forest_baseline = baseline_ndvi.gt(self.ndvi_threshold)
        forest_current = current_ndvi.gt(self.ndvi_threshold)
        forest_loss = forest_baseline.And(forest_current.Not())
        
        # Calculate statistics
        stats = self._calculate_loss_statistics(forest_loss, bounds)
        
        return {
            'baseline_composite': baseline_composite,
            'current_composite': current_composite,
            'forest_loss_mask': forest_loss,
            'statistics': stats,
            'baseline_ndvi': baseline_ndvi,
            'current_ndvi': current_ndvi
        }
    
    def _create_median_composite(self, collection):
        """Create cloud-free composite using median"""
        return collection.median().clip(collection.geometry())
    
    def _calculate_mean_ndvi(self, image):
        """Calculate NDVI for an image"""
        return self.ee_processor.calculate_ndvi(image).select('NDVI')
    
    def _calculate_loss_statistics(self, loss_mask, bounds):
        """Calculate area statistics for forest loss"""
        # Calculate area in square meters
        area_image = loss_mask.multiply(ee.Image.pixelArea())
        
        # Sum the areas
        stats = area_image.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=bounds,
            scale=30,
            maxPixels=1e10
        )
        
        # Convert to hectares
        area_m2 = stats.getInfo()
        area_ha = area_m2.get('NDVI', 0) / 10000 if area_m2 else 0
        
        return {
            'forest_loss_hectares': round(area_ha, 2),
            'detection_date': datetime.now().isoformat()
        }
