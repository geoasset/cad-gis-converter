# State Plane Projection Guide

## Overview

The CAD to GIS Converter now supports US State Plane coordinate systems (NAD83 datum). State Plane projections are optimized for specific geographic regions within the United States, providing high accuracy for surveying and engineering projects.

## How to Use State Plane Projections

### Before Upload

1. **Select Coordinate System Tab**
   - Click on the "US State Plane" tab in the Conversion Settings panel
   - This will display all available State Plane zones

2. **Choose Your State and Zone**
   - Select the appropriate state and zone from the dropdown
   - Each state has one or more zones (e.g., California has 6 zones)
   - Choose the zone that covers your project area

3. **Upload Your DXF File**
   - After selecting the State Plane zone, upload your DXF file
   - The converter will transform your data to the selected projection

## Available State Plane Zones

The converter supports all US State Plane zones using NAD83 datum, including:

- **Single-zone states**: Connecticut, Delaware, Maryland, Rhode Island, etc.
- **Multi-zone states**: 
  - California (6 zones)
  - Alaska (10 zones)
  - Texas (5 zones)
  - And many more

## When to Use State Plane Projections

Use State Plane projections when:

- Working on surveying or civil engineering projects
- Your project is confined to a specific US state or region
- You need high accuracy for distance and area measurements
- Your data is already in State Plane coordinates
- You're working with local government GIS data

## Common CRS vs State Plane

**Common CRS** (like WGS84, Web Mercator):
- Best for web mapping and global applications
- Good for general-purpose GIS work
- May have distortion over large areas

**State Plane**:
- Optimized for specific US regions
- Minimal distortion within the zone
- Required for many surveying and engineering applications
- Better accuracy for measurements

## Example Workflow

1. You have a DXF file from a survey in California
2. Determine which California zone covers your area (e.g., Zone 3 for Central California)
3. Select "US State Plane" tab
4. Choose "California Zone 3 (NAD83)" from the dropdown
5. Upload your DXF file
6. Preview the data on the map (note: the CRS indicator shows your selected projection)
7. Download the converted GeoJSON in State Plane coordinates

## Map Preview

The map preview includes a **CRS indicator badge** (blue badge in top-left corner) that shows:
- The coordinate system name (e.g., "State Plane")
- The EPSG code (e.g., "EPSG:26743")

This helps you verify that the correct projection was selected before downloading. The preview map displays data in WGS84 for compatibility with web mapping tiles, but your downloaded file will be in the selected State Plane projection.

## Technical Details

- **Datum**: NAD83 (North American Datum 1983)
- **EPSG Codes**: All standard State Plane EPSG codes are supported
- **Transformation**: Automatic coordinate transformation using pyproj
- **Accuracy**: Maintains high precision within each zone

## Tips

- If you're unsure which zone to use, consult your project specifications or local GIS department
- State Plane zones are designed to minimize distortion, so always use the correct zone for your area
- You can convert between State Plane zones by running the conversion twice with different target CRS
