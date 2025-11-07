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

def detect_coordinate_system_type(geometries_by_layer: Dict[str, List[Dict]]) -> Dict[str, Any]:
    """
    Detect if coordinates are geographic (lat/long) or projected (State Plane, UTM, etc.)
    
    Returns:
        Dict with detection results:
        {
            "type": "geographic" | "projected" | "unknown",
            "likely_system": str,
            "sample_coords": List[tuple],
            "x_range": tuple,
            "y_range": tuple,
            "suggestion": str
        }
    """
    # Collect sample coordinates from all layers
    sample_coords = []
    for layer_name, features in geometries_by_layer.items():
        for feature in features[:10]:  # Sample first 10 from each layer
            geom = feature.get('geometry')
            if geom:
                if hasattr(geom, 'coords'):
                    sample_coords.extend(list(geom.coords)[:5])
                elif hasattr(geom, 'exterior'):
                    sample_coords.extend(list(geom.exterior.coords)[:5])
    
    if not sample_coords:
        return {
            "type": "unknown",
            "likely_system": "unknown",
            "sample_coords": [],
            "x_range": (0, 0),
            "y_range": (0, 0),
            "suggestion": "No coordinates found to analyze"
        }
    
    # Get coordinate ranges
    x_vals = [coord[0] for coord in sample_coords]
    y_vals = [coord[1] for coord in sample_coords]
    x_min, x_max = min(x_vals), max(x_vals)
    y_min, y_max = min(y_vals), max(y_vals)
    
    # Determine coordinate type
    result = {
        "sample_coords": sample_coords[:5],
        "x_range": (x_min, x_max),
        "y_range": (y_min, y_max)
    }
    
    # Check if values are within typical lat/long ranges
    if all(-180 <= x <= 180 for x in x_vals) and all(-90 <= y <= 90 for y in y_vals):
        result["type"] = "geographic"
        result["likely_system"] = "WGS84 or similar geographic CRS"
        result["suggestion"] = "Coordinates appear to be in Latitude/Longitude format"
    else:
        result["type"] = "projected"
        
        # Analyze magnitude to suggest likely system
        x_magnitude = max(abs(x_min), abs(x_max))
        y_magnitude = max(abs(y_min), abs(y_max))
        
        # US State Plane in feet typically ranges from ~200,000 to ~20,000,000+
        # Some zones (like Texas) can have very large Y values (10M+)
        # State Plane feet are generally larger than meters for the same area
        if 200000 <= x_magnitude <= 20000000 and 200000 <= y_magnitude <= 20000000:
            # Check if values suggest feet vs meters
            # State Plane feet: typically 500k-15M range
            # Meters (UTM/Web Mercator): typically 100k-20M but different patterns
            
            # If Y is much larger than X, likely State Plane (some zones have large false northings)
            y_to_x_ratio = y_magnitude / x_magnitude if x_magnitude > 0 else 0
            
            if y_to_x_ratio > 2.0 or (x_magnitude > 1000000 and y_magnitude > 1000000):
                result["likely_system"] = "US State Plane (US Survey Feet)"
                result["suggestion"] = (
                    "⚠️ These coordinates appear to be in US State Plane (feet). "
                    "Please specify the correct State Plane zone (e.g., EPSG:2227 for CA Zone 3, "
                    "EPSG:2277 for TX Central) as the SOURCE coordinate system to convert to Lat/Long."
                )
            else:
                result["likely_system"] = "Web Mercator (EPSG:3857) or UTM"
                result["suggestion"] = (
                    "⚠️ These coordinates appear to be in a projected system (meters). "
                    "Common systems: Web Mercator (EPSG:3857) or UTM zones. "
                    "Please specify the correct SOURCE coordinate system."
                )
        # Very large values suggest Web Mercator or specific State Plane zones
        elif 100000 <= x_magnitude <= 30000000 and 100000 <= y_magnitude <= 30000000:
            result["likely_system"] = "Projected system (likely State Plane feet or Web Mercator)"
            result["suggestion"] = (
                "⚠️ These coordinates are in a projected system. "
                "For US projects, this is likely State Plane (US Survey Feet). "
                "Please specify the correct State Plane zone (e.g., EPSG:2277 for TX Central) "
                "as the SOURCE coordinate system."
            )
        else:
            result["likely_system"] = "Unknown projected system"
            result["suggestion"] = (
                "⚠️ These coordinates are projected but the system is unclear. "
                "Please specify the correct SOURCE coordinate system."
            )
    
    logger.info(f"Coordinate detection: {result['type']} - {result['likely_system']}")
    return result


class DXFProcessor:
    """Handles DXF to GIS conversion using Python GIS libraries"""
    
    def __init__(self):
        self.supported_entities = ['LINE', 'POLYLINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'POINT']
        
    async def convert_dxf_to_gis(
        self, 
        dxf_path: str, 
        target_crs: str = "EPSG:4326",
        output_format: str = "geojson",
        source_crs: str = None
    ) -> Dict[str, Any]:
        """
        Convert DXF file to GIS format
        
        Args:
            dxf_path: Path to DXF file
            target_crs: Target coordinate reference system
            output_format: Output format (geojson)
            source_crs: Source coordinate reference system (if known)
            
        Returns:
            GeoJSON dictionary with coordinate_info metadata
        """
        try:
            # Log the target CRS being used
            logger.info(f"Converting DXF with target_crs: {target_crs}, source_crs: {source_crs}")
            
            # Read DXF file
            logger.info(f"Reading DXF file: {dxf_path}")
            doc = ezdxf.readfile(dxf_path)
            
            # Extract geometries by layer
            geometries_by_layer = self._extract_geometries_by_layer(doc)
            
            # Detect coordinate characteristics
            coord_info = self._analyze_coordinates(geometries_by_layer)
            logger.info(f"Coordinate analysis: {coord_info}")
            
            # Determine source CRS
            if source_crs:
                # User specified source CRS
                actual_source_crs = source_crs
                logger.info(f"Using user-specified source CRS: {actual_source_crs}")
            else:
                # No source CRS specified - use target as source (legacy behavior)
                actual_source_crs = target_crs
                logger.warning(f"No source CRS specified, using target CRS as source: {actual_source_crs}")
            
            # Convert to GeoDataFrame
            gdf = self._create_geodataframe(geometries_by_layer, actual_source_crs)
            
            # Transform coordinates if needed
            if actual_source_crs != target_crs:
                logger.info(f"Transforming from {actual_source_crs} to {target_crs}")
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
                
                # Add coordinate analysis metadata
                geojson_dict["coordinate_info"] = coord_info
                
                return geojson_dict
            else:
                return gdf
                
        except Exception as e:
            logger.error(f"DXF conversion failed: {e}", exc_info=True)
            raise Exception(f"Failed to convert DXF: {str(e)}")
    
    def _analyze_coordinates(self, geometries_by_layer: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """
        Analyze coordinates to detect their type and provide suggestions.
        This is a wrapper around the standalone detect_coordinate_system_type function.
        """
        return detect_coordinate_system_type(geometries_by_layer)
    
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