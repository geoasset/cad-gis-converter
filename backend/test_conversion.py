#!/usr/bin/env python3
"""
Test script for DXF processing functionality
Run this to validate the core conversion logic without the web interface
"""

import asyncio
import json
import sys
from pathlib import Path
import tempfile
import logging

# Add the backend directory to the path
sys.path.append(str(Path(__file__).parent))

from dxf_processor import DXFProcessor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sample_dxf():
    """Create a simple DXF file for testing"""
    try:
        import ezdxf
        
        # Create a new DXF document
        doc = ezdxf.new('R2010')
        msp = doc.modelspace()
        
        # Add some basic entities
        # Line
        msp.add_line((0, 0), (100, 100))
        
        # Rectangle (polyline)
        points = [(0, 0), (100, 0), (100, 50), (0, 50), (0, 0)]
        msp.add_lwpolyline(points, close=True)
        
        # Circle
        msp.add_circle((50, 25), 15)
        
        # Point
        msp.add_point((75, 75))
        
        # Arc
        msp.add_arc((25, 75), 20, start_angle=0, end_angle=90)
        
        # Save to temp file
        temp_file = tempfile.NamedTemporaryFile(suffix='.dxf', delete=False)
        doc.saveas(temp_file.name)
        temp_file.close()
        
        logger.info(f"Created sample DXF file: {temp_file.name}")
        return temp_file.name
        
    except ImportError:
        logger.error("ezdxf not installed. Run: pip install ezdxf")
        return None
    except Exception as e:
        logger.error(f"Failed to create sample DXF: {e}")
        return None

async def test_dxf_conversion():
    """Test the DXF conversion process"""
    
    # Create sample DXF file
    dxf_file = create_sample_dxf()
    if not dxf_file:
        logger.error("Failed to create sample DXF file")
        return False
    
    try:
        # Initialize processor
        processor = DXFProcessor()
        
        # Test conversion to GeoJSON
        logger.info("Testing conversion to GeoJSON...")
        geojson_result = await processor.convert_dxf_to_gis(
            dxf_file,
            target_crs="EPSG:4326",
            output_format="geojson"
        )
        
        logger.info(f"GeoJSON conversion successful!")
        logger.info(f"Features found: {len(geojson_result.get('features', []))}")
        
        # Check if CRS is included
        if 'crs' in geojson_result:
            crs_name = geojson_result['crs'].get('properties', {}).get('name', 'unknown')
            logger.info(f"✓ CRS information included: {crs_name}")
        else:
            logger.warning("✗ CRS information NOT included in GeoJSON!")
        
        # Print feature summary
        if 'features' in geojson_result:
            layer_counts = {}
            geometry_types = {}
            
            for feature in geojson_result['features']:
                # Count by layer
                layer = feature.get('properties', {}).get('layer', 'unknown')
                layer_counts[layer] = layer_counts.get(layer, 0) + 1
                
                # Count by geometry type
                geom_type = feature.get('geometry', {}).get('type', 'unknown')
                geometry_types[geom_type] = geometry_types.get(geom_type, 0) + 1
            
            logger.info("Layer summary:")
            for layer, count in layer_counts.items():
                logger.info(f"  {layer}: {count} features")
            
            logger.info("Geometry type summary:")
            for geom_type, count in geometry_types.items():
                logger.info(f"  {geom_type}: {count} features")
        
        # Save output for inspection
        output_file = "test_output.geojson"
        with open(output_file, 'w') as f:
            json.dump(geojson_result, f, indent=2)
        logger.info(f"Output saved to: {output_file}")
        
        # Test Texas State Plane conversion
        logger.info("Testing conversion to Texas State Plane South Central...")
        tx_result = await processor.convert_dxf_to_gis(
            dxf_file,
            target_crs="EPSG:32140",
            output_format="geojson"
        )
        
        if 'crs' in tx_result:
            crs_name = tx_result['crs'].get('properties', {}).get('name', 'unknown')
            logger.info(f"✓ Texas State Plane CRS: {crs_name}")
        
        # Save Texas State Plane output
        tx_output_file = "test_output_tx_state_plane.geojson"
        with open(tx_output_file, 'w') as f:
            json.dump(tx_result, f, indent=2)
        logger.info(f"Texas State Plane output saved to: {tx_output_file}")
        
        logger.info("Shapefile functionality has been removed - only GeoJSON output is supported")
        return True
        
    except Exception as e:
        logger.error(f"Conversion test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        try:
            Path(dxf_file).unlink()
            logger.info("Cleaned up temporary DXF file")
        except:
            pass

async def test_coordinate_transformation():
    """Test coordinate system transformations"""
    logger.info("Testing coordinate transformations...")
    
    try:
        from dxf_processor import transform_coordinates
        from shapely.geometry import Point, LineString
        
        # Create test geometries
        test_geometries = [
            {
                'geometry': Point(0, 0),
                'properties': {'test': 'point'}
            },
            {
                'geometry': LineString([(0, 0), (100, 100)]),
                'properties': {'test': 'line'}
            }
        ]
        
        # Test transformation from Web Mercator to WGS84
        transformed = transform_coordinates(
            test_geometries,
            "EPSG:3857",
            "EPSG:4326"
        )
        
        logger.info("Coordinate transformation successful!")
        logger.info(f"Transformed {len(transformed)} geometries")
        
        return True
        
    except Exception as e:
        logger.error(f"Coordinate transformation test failed: {e}")
        return False

def test_dependencies():
    """Test that all required dependencies are available"""
    logger.info("Testing dependencies...")
    
    dependencies = [
        'ezdxf',
        'geopandas',
        'shapely',
        'fiona',
        'pyproj',
        'pandas'
    ]
    
    missing = []
    for dep in dependencies:
        try:
            __import__(dep)
            logger.info(f"✓ {dep}")
        except ImportError:
            logger.error(f"✗ {dep} - MISSING")
            missing.append(dep)
    
    if missing:
        logger.error(f"Missing dependencies: {', '.join(missing)}")
        logger.error("Install with: pip install " + " ".join(missing))
        return False
    
    logger.info("All dependencies available!")
    return True

async def main():
    """Run all tests"""
    logger.info("Starting CAD to GIS conversion tests...")
    
    # Test dependencies first
    if not test_dependencies():
        logger.error("Dependency test failed. Cannot continue.")
        return False
    
    # Test coordinate transformations
    if not await test_coordinate_transformation():
        logger.error("Coordinate transformation test failed.")
        return False
    
    # Test full DXF conversion
    if not await test_dxf_conversion():
        logger.error("DXF conversion test failed.")
        return False
    
    logger.info("All tests passed! 🎉")
    logger.info("The conversion system is working correctly.")
    return True

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)