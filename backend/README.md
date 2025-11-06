# CAD to GIS Converter Backend

Python FastAPI backend for converting DXF files to GeoJSON format.

## Features

- DXF file parsing and conversion
- Support for multiple coordinate reference systems (CRS)
- GeoJSON output format
- Scale factor application
- Coordinate system reprojection
- Asynchronous processing with progress tracking

## Installation

### Option 1: Full Installation (with GDAL)
```bash
cd backend
pip install -r requirements.txt
```

### Option 2: Simplified Installation (without GDAL)
```bash
cd backend
pip install -r requirements-simple.txt
```

## Usage

### Start the API Server
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### Run Tests
```bash
cd backend
python test_conversion.py
```

## API Endpoints

- `POST /api/upload` - Upload DXF file for conversion
- `GET /api/job/{job_id}` - Get conversion job status
- `GET /api/preview/{job_id}` - Preview converted GeoJSON
- `GET /api/download/{job_id}` - Download converted file
- `POST /api/reproject/{job_id}` - Reproject to different CRS
- `POST /api/apply-scale-factor/{job_id}` - Apply scale factor correction

### Scale Factor API

#### Apply Scale Factor
```http
POST /api/apply-scale-factor/{job_id}
Content-Type: application/json

Request Body:
{
  "scale_factor": 1.00013,        // Required: 0.9 to 1.1 range
  "output_format": "geojson"      // Optional: defaults to original format
}

Response (200 OK):
{
  "job_id": "new-job-uuid",
  "message": "Scale factor application started",
  "scale_factor": 1.00013
}

Error Responses:
- 404: Job not found
- 422: Invalid scale factor (outside 0.9-1.1 range)
- 500: Processing error
```

#### Scale Factor Processing

The scale factor is applied using the following algorithm:

1. **Calculate Centroid**: Find geometric center of all features as origin point
2. **Transform Coordinates**: For each coordinate pair [x, y]:
   ```
   dx = x - origin_x
   dy = y - origin_y
   x_new = origin_x + (dx * scale_factor)
   y_new = origin_y + (dy * scale_factor)
   ```
3. **Preserve Properties**: All feature properties and CRS information maintained
4. **Create New Job**: New job created with scaled output, original job unchanged

#### Job Model Extensions

Scale factor jobs include additional metadata:
```json
{
  "job_id": "uuid",
  "status": "completed",
  "scale_factor": 1.00013,
  "parent_job_id": "original-job-uuid",
  "filename": "scaled_output.geojson",
  // ... other standard job fields
}
```

## Supported DXF Entities

- LINE
- POLYLINE
- LWPOLYLINE
- CIRCLE
- ARC
- POINT

## Scale Factor Processing

### Overview
Scale factor adjustment corrects for surface-to-grid distortions in surveying data. The backend applies uniform scaling to all coordinates relative to the geometric centroid of the dataset.

### Implementation Details

#### DXFProcessor.apply_scale_to_geojson()
```python
def apply_scale_to_geojson(self, geojson_data: Dict[str, Any], scale_factor: float) -> Dict[str, Any]:
    """
    Apply scale factor to all coordinates in GeoJSON
    
    Args:
        geojson_data: Input GeoJSON dictionary
        scale_factor: Scale factor (0.9 to 1.1)
        
    Returns:
        Scaled GeoJSON with preserved properties and CRS
    """
```

#### Processing Steps
1. **Load GeoJSON**: Parse features from completed conversion job
2. **Calculate Centroid**: Use GeoPandas unary_union to find geometric center
3. **Apply Scaling**: Use Shapely affinity.scale() for precise transformation
4. **Preserve Metadata**: Maintain all feature properties and CRS information
5. **Save Output**: Create new file in GeoJSON format

#### Coordinate Precision
- Maintains 6+ decimal places during transformation
- Uses Shapely's optimized geometric operations
- Preserves spatial relationships between features

### Error Handling

Common error scenarios and responses:

| Error | HTTP Status | Description |
|-------|-------------|-------------|
| Job not found | 404 | Original job ID doesn't exist |
| Invalid scale factor | 422 | Value outside 0.9-1.1 range |
| Missing output file | 404 | Original conversion output not found |
| Processing failure | 500 | Geometric transformation error |
| File I/O error | 500 | Cannot read/write files |

### Performance Considerations

- **Small files** (<1,000 features): <1 second processing
- **Medium files** (1,000-10,000 features): <5 seconds processing  
- **Large files** (>10,000 features): <30 seconds processing
- Memory usage: ~2x original file size during processing

## Dependencies

- **FastAPI** - Web framework for API endpoints
- **ezdxf** - DXF file parsing and entity extraction
- **GeoPandas** - GIS data processing and analysis
- **Shapely** - Geometric operations and transformations
- **PyProj** - Coordinate reference system transformations
- **Fiona** - File I/O for GeoJSON format
- **Pydantic** - Data validation and serialization
- **UUID** - Unique job identifier generation

### Scale Factor Dependencies

The scale factor feature specifically uses:
- **Shapely.affinity.scale()** - Precise geometric scaling operations
- **GeoPandas.unary_union** - Centroid calculation for origin point
- **JSON** - GeoJSON file processing and manipulation