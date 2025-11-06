import ezdxf
import json
import logging
import math
from pathlib import Path
from typing import Dict, List, Any, Optional
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, Polygon, MultiPolygon, mapping
from shapely import affinity
import pyproj
from pyproj import Transformer
import fiona
from fiona.crs import from_epsg

logger = logging.getLogger(__name__)

class DXFProcessor:
    """Handles DXF to GIS conversion using Python GIS libraries"""
    
    def __init__(self):
        self.supported_entities = ['LINE', 'POLYLINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'POINT']
        
    async def convert_dxf_to_gis(
        self, 
        dxf_path: str, 
        target_crs: str = "EPSG:4326",
        output_format: str = "geojson"
    ) -> Dict[str, Any]:
        """
        Convert DXF file to GIS format
        
        Args:
            dxf_path: Path to DXF file
            target_crs: Target coordinate reference system
            output_format: Output format (geojson)
            
        Returns:
            GeoJSON dictionary
        """
        try:
            # Log the target CRS being used
            logger.info(f"Converting DXF with target_crs: {target_crs}")
            
            # Read DXF file
            logger.info(f"Reading DXF file: {dxf_path}")
            doc = ezdxf.readfile(dxf_path)
            
            # Extract geometries by layer
            geometries_by_layer = self._extract_geometries_by_layer(doc)
            
            # Use target CRS as source CRS since DXF files don't contain CRS info
            # The user must specify the correct CRS when uploading
            source_crs = target_crs
            
            # Convert to GeoDataFrame
            gdf = self._create_geodataframe(geometries_by_layer, source_crs)
            
            # Transform coordinates if needed
            if source_crs != target_crs:
                gdf = gdf.to_crs(target_crs)
            
            # Return based on format
            if output_format == "geojson":
                # Convert to GeoJSON
                geojson_dict = json.loads(gdf.to_json())
                
                # Remove any CRS that GeoPandas added (it's not in URN format)
                if "crs" in geojson_dict:
                    del geojson_dict["crs"]
                
                # Add CRS information to GeoJSON in URN format for QGIS compatibility
                # Extract EPSG code from target_crs (e.g., "EPSG:8782" -> "8782")
                epsg_code = target_crs.split(":")[-1] if ":" in target_crs else target_crs
                urn_crs = f"urn:ogc:def:crs:EPSG::{epsg_code}"
                logger.info(f"Setting GeoJSON CRS to: {urn_crs}")
                geojson_dict["crs"] = {
                    "type": "name",
                    "properties": {
                        "name": urn_crs
                    }
                }
                return geojson_dict
            else:
                return gdf
                
        except Exception as e:
            logger.error(f"DXF conversion failed: {e}", exc_info=True)
            raise Exception(f"Failed to convert DXF: {str(e)}")
    
    def _extract_geometries_by_layer(self, doc: ezdxf.document.Drawing) -> Dict[str, List[Dict]]:
        """Extract geometries organized by layer"""
        geometries_by_layer = {}
        
        # Get modelspace
        msp = doc.modelspace()
        
        for entity in msp:
            if entity.dxftype() not in self.supported_entities:
                continue
                
            layer_name = entity.dxf.layer or "0"  # Default layer
            
            if layer_name not in geometries_by_layer:
                geometries_by_layer[layer_name] = []
            
            geometry = self._entity_to_geometry(entity)
            if geometry:
                geometries_by_layer[layer_name].append({
                    'geometry': geometry,
                    'properties': {
                        'layer': layer_name,
                        'entity_type': entity.dxftype(),
                        'color': getattr(entity.dxf, 'color', 256)
                    }
                })
        
        return geometries_by_layer
    
    def _entity_to_geometry(self, entity) -> Optional[Any]:
        """Convert DXF entity to Shapely geometry"""
        try:
            entity_type = entity.dxftype()
            
            if entity_type == 'POINT':
                return Point(entity.dxf.location.x, entity.dxf.location.y)
            
            elif entity_type == 'LINE':
                start = entity.dxf.start
                end = entity.dxf.end
                return LineString([(start.x, start.y), (end.x, end.y)])
            
            elif entity_type in ['POLYLINE', 'LWPOLYLINE']:
                points = []
                is_closed = False
                
                if entity_type == 'POLYLINE':
                    # POLYLINE - iterate through vertices
                    for vertex in entity.vertices:
                        points.append((vertex.dxf.location.x, vertex.dxf.location.y))
                    is_closed = entity.is_closed
                else:
                    # LWPOLYLINE - use get_points() method
                    try:
                        # get_points() returns a generator of tuples
                        points = list(entity.get_points('xy'))
                        is_closed = entity.closed
                    except Exception as e:
                        logger.warning(f"Failed to get LWPOLYLINE points: {e}")
                        return None
                
                if len(points) < 2:
                    return None
                
                # Check if closed and create appropriate geometry
                if is_closed and len(points) > 2:
                    # Ensure polygon is closed
                    if points[0] != points[-1]:
                        points.append(points[0])
                    return Polygon(points)
                else:
                    return LineString(points)
            
            elif entity_type == 'CIRCLE':
                center = entity.dxf.center
                radius = entity.dxf.radius
                # Create circle as polygon with 32 points
                circle_points = []
                import math
                for i in range(33):  # 33 to close the polygon
                    angle = 2 * math.pi * i / 32
                    x = center.x + radius * math.cos(angle)
                    y = center.y + radius * math.sin(angle)
                    circle_points.append((x, y))
                return Polygon(circle_points)
            
            elif entity_type == 'ARC':
                # Simplified arc as linestring
                center = entity.dxf.center
                radius = entity.dxf.radius
                start_angle = math.radians(entity.dxf.start_angle)
                end_angle = math.radians(entity.dxf.end_angle)
                
                points = []
                num_points = 16
                angle_step = (end_angle - start_angle) / num_points
                
                for i in range(num_points + 1):
                    angle = start_angle + i * angle_step
                    x = center.x + radius * math.cos(angle)
                    y = center.y + radius * math.sin(angle)
                    points.append((x, y))
                
                return LineString(points)
            
        except Exception as e:
            logger.warning(f"Failed to convert entity {entity_type}: {e}")
            return None
        
        return None
    
    def _detect_coordinate_system(self, doc: ezdxf.document.Drawing) -> Optional[str]:
        """Attempt to detect coordinate system from DXF metadata"""
        try:
            # Check for coordinate system in header variables
            header = doc.header
            
            # Look for common CRS indicators
            # This is simplified - in practice, you'd need more sophisticated detection
            if hasattr(header, '$MEASUREMENT'):
                if header['$MEASUREMENT'] == 0:  # Imperial
                    return "EPSG:2154"  # Example state plane
                else:  # Metric
                    return "EPSG:3857"  # Web Mercator
            
            # Default fallback
            return "EPSG:3857"
            
        except Exception as e:
            logger.warning(f"Could not detect CRS: {e}")
            return None
    
    def _create_geodataframe(
        self, 
        geometries_by_layer: Dict[str, List[Dict]], 
        crs: str
    ) -> gpd.GeoDataFrame:
        """Create GeoDataFrame from extracted geometries"""
        
        all_features = []
        
        for layer_name, features in geometries_by_layer.items():
            for feature in features:
                all_features.append({
                    'geometry': feature['geometry'],
                    **feature['properties']
                })
        
        if not all_features:
            # Return empty GeoDataFrame
            return gpd.GeoDataFrame(columns=['geometry'], crs=crs)
        
        gdf = gpd.GeoDataFrame(all_features, crs=crs)
        return gdf
    

    def apply_scale_to_geojson(
        self,
        geojson_data: Dict[str, Any],
        scale_factor: float,
        output_format: str = "geojson"
    ) -> Dict[str, Any]:
        """
        Apply scale factor to all coordinates in GeoJSON
        
        Args:
            geojson_data: GeoJSON dictionary
            scale_factor: Scale factor to apply (typically 0.9 to 1.1)
            output_format: Output format - "geojson"
            
        Returns:
            Scaled GeoJSON dictionary with preserved properties and CRS
        """
        try:
            # Validate inputs
            if not geojson_data:
                raise ValueError("GeoJSON data is required")
            
            if not isinstance(geojson_data, dict):
                raise ValueError("GeoJSON data must be a dictionary")
            
            if geojson_data.get("type") != "FeatureCollection":
                raise ValueError("GeoJSON must be a FeatureCollection")
            
            if "features" not in geojson_data:
                raise ValueError("GeoJSON must contain features array")
            
            if not isinstance(geojson_data["features"], list):
                raise ValueError("Features must be an array")
            
            if len(geojson_data["features"]) == 0:
                raise ValueError("GeoJSON contains no features to scale")
            
            # Validate scale factor
            if not isinstance(scale_factor, (int, float)):
                raise ValueError("Scale factor must be a number")
            
            if not math.isfinite(scale_factor):
                raise ValueError("Scale factor must be finite")
            
            if scale_factor <= 0:
                raise ValueError("Scale factor must be greater than 0")
            
            if not (0.9 <= scale_factor <= 1.1):
                raise ValueError(f"Scale factor {scale_factor} is outside valid range (0.9-1.1)")
            
            # Validate output format
            if output_format != "geojson":
                raise ValueError(f"Invalid output format: {output_format}")
            
            logger.info(f"Starting scale factor application: factor={scale_factor}, format={output_format}")
            
            # Convert GeoJSON to GeoDataFrame with error handling
            try:
                gdf = gpd.GeoDataFrame.from_features(geojson_data["features"])
            except Exception as e:
                raise ValueError(f"Failed to create GeoDataFrame from features: {str(e)}")
            
            # Validate GeoDataFrame
            if gdf.empty:
                raise ValueError("No valid geometries found in features")
            
            if gdf.geometry.isna().all():
                raise ValueError("All geometries are null or invalid")
            
            # Remove any null geometries
            valid_geoms = gdf.geometry.notna()
            if not valid_geoms.any():
                raise ValueError("No valid geometries found")
            
            if not valid_geoms.all():
                logger.warning(f"Removing {(~valid_geoms).sum()} null geometries")
                gdf = gdf[valid_geoms]
            
            # Preserve CRS from original GeoJSON if available
            if "crs" in geojson_data:
                try:
                    # Extract EPSG code from CRS URN format
                    crs_name = geojson_data["crs"].get("properties", {}).get("name", "")
                    if "EPSG::" in crs_name:
                        epsg_code = crs_name.split("EPSG::")[-1]
                        gdf.crs = f"EPSG:{epsg_code}"
                        logger.info(f"Set GeoDataFrame CRS to EPSG:{epsg_code}")
                except Exception as e:
                    logger.warning(f"Failed to set CRS from GeoJSON: {e}")
            
            logger.info(f"Applying uniform coordinate scaling with factor {scale_factor}")
            
            # Apply uniform coordinate scaling to each geometry (like ArcGIS tool)
            # This scales each coordinate directly without using an origin point
            scaled_geometries = []
            failed_count = 0
            
            for i, geom in enumerate(gdf.geometry):
                try:
                    if geom is None or geom.is_empty:
                        logger.warning(f"Skipping empty geometry at index {i}")
                        scaled_geometries.append(geom)
                        continue
                    
                    if not geom.is_valid:
                        logger.warning(f"Invalid geometry at index {i}, attempting to fix")
                        try:
                            geom = geom.buffer(0)  # Attempt to fix invalid geometry
                        except:
                            logger.warning(f"Could not fix geometry at index {i}, skipping")
                            scaled_geometries.append(geom)
                            failed_count += 1
                            continue
                    
                    # Apply uniform coordinate scaling (multiply each coordinate by scale factor)
                    # This matches the ArcGIS tool behavior: new_x = x * scale_factor, new_y = y * scale_factor
                    scaled_geom = self._scale_geometry_coordinates(geom, scale_factor)
                    
                    # Validate scaled geometry
                    if scaled_geom is None or scaled_geom.is_empty:
                        logger.warning(f"Scaling resulted in empty geometry at index {i}")
                        scaled_geometries.append(geom)  # Keep original
                        failed_count += 1
                    else:
                        scaled_geometries.append(scaled_geom)
                        
                except Exception as e:
                    logger.warning(f"Failed to scale geometry at index {i}: {e}")
                    scaled_geometries.append(geom)  # Keep original geometry
                    failed_count += 1
            
            if failed_count > 0:
                logger.warning(f"Failed to scale {failed_count} out of {len(gdf)} geometries")
            
            # Update geometries in GeoDataFrame
            gdf.geometry = scaled_geometries
            
            # Convert back to GeoJSON with error handling
            try:
                scaled_geojson = json.loads(gdf.to_json())
            except Exception as e:
                raise ValueError(f"Failed to convert scaled data to GeoJSON: {str(e)}")
            
            # Validate GeoJSON structure
            if not isinstance(scaled_geojson, dict):
                raise ValueError("Scaled GeoJSON is not a valid dictionary")
            
            if "features" not in scaled_geojson:
                raise ValueError("Scaled GeoJSON missing features array")
            
            # Preserve CRS information from original
            if "crs" in geojson_data:
                scaled_geojson["crs"] = geojson_data["crs"]
                logger.info(f"Preserved CRS: {geojson_data['crs']}")
            
            logger.info(f"Scale factor application completed successfully: {len(scaled_geojson['features'])} features")
            return scaled_geojson
            
        except ValueError as e:
            # Re-raise validation errors as-is
            logger.error(f"Validation error in scale factor application: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in scale factor application: {e}", exc_info=True)
            raise Exception(f"Failed to apply scale factor: {str(e)}")
    
    def _scale_geometry_coordinates(self, geometry, scale_factor):
        """
        Apply uniform coordinate scaling to geometry (matches ArcGIS tool behavior)
        Scales each coordinate directly: new_x = x * scale_factor, new_y = y * scale_factor
        """
        from shapely.geometry import Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
        from shapely.ops import transform
        
        def scale_coords(x, y, z=None):
            """Scale coordinate function for shapely transform"""
            return x * scale_factor, y * scale_factor
        
        try:
            # Use shapely's transform function with coordinate scaling
            scaled_geom = transform(scale_coords, geometry)
            return scaled_geom
        except Exception as e:
            logger.warning(f"Failed to scale geometry coordinates: {e}")
            return geometry

# Utility functions for coordinate transformations
def transform_coordinates(
    geometries: List[Dict], 
    source_crs: str, 
    target_crs: str
) -> List[Dict]:
    """Transform coordinates from source to target CRS"""
    if source_crs == target_crs:
        return geometries
    
    try:
        transformer = Transformer.from_crs(source_crs, target_crs, always_xy=True)
        
        transformed_geometries = []
        for geom_dict in geometries:
            geom = geom_dict['geometry']
            if geom:
                # Transform using shapely's transform function
                from shapely.ops import transform
                transformed_geom = transform(transformer.transform, geom)
                transformed_geometries.append({
                    **geom_dict,
                    'geometry': transformed_geom
                })
            else:
                transformed_geometries.append(geom_dict)
        
        return transformed_geometries
        
    except Exception as e:
        logger.error(f"Coordinate transformation failed: {e}")
        raise Exception(f"Failed to transform coordinates: {str(e)}")