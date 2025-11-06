# Design Document

## Overview

This design document outlines the implementation of a scale factor adjustment feature for the CAD to GIS Converter application. The feature allows users to apply surface-to-grid scale factor corrections to converted DXF files with real-time preview updates and the ability to download the adjusted file.

The scale factor adjustment addresses a fundamental surveying challenge: when projecting curved earth measurements onto flat coordinate systems, geometric distortions occur. A scale factor (typically ranging from 0.9999 to 1.0004) corrects these distortions by uniformly scaling all coordinates relative to a central origin point.

## Architecture

### High-Level Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   App.tsx    │───▶│ ScaleAdjuster    │───▶│  MapViewer   │  │
│  │              │    │   Component      │    │              │  │
│  │ - State Mgmt │    │ - Input UI       │    │ - Preview    │  │
│  │ - Job Flow   │    │ - Validation     │    │ - Real-time  │  │
│  └──────────────┘    │ - Apply/Reset    │    │   Updates    │  │
│                      └──────────────────┘    └──────────────┘  │
│                               │                                  │
│                               ▼                                  │
│                      ┌──────────────────┐                       │
│                      │  Scale Transform │                       │
│                      │     Utility      │                       │
│                      │ - Client-side    │                       │
│                      │   Scaling        │                       │
│                      └──────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  /api/apply-     │────────▶│  DXFProcessor    │             │
│  │   scale-factor   │         │                  │             │
│  │                  │         │ - Load GeoJSON   │             │
│  │ - Receives job_id│         │ - Apply Scale    │             │
│  │ - Receives scale │         │ - Save Result    │             │
│  │ - Creates new job│         └──────────────────┘             │
│  └──────────────────┘                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initial Conversion**: User uploads DXF → Backend converts to GeoJSON → Frontend displays preview
2. **Scale Adjustment Preview**: User enters scale factor → Frontend applies transformation client-side → Map updates in real-time
3. **Apply Scale Factor**: User clicks "Apply" → Backend creates new job with scaled coordinates → New file available for download

## Components and Interfaces

### Frontend Components

#### 1. ScaleAdjuster Component (New)

**Location**: `src/components/ScaleAdjuster.tsx`

**Purpose**: Provides UI for scale factor input, validation, and application

**Props Interface**:
```typescript
interface ScaleAdjusterProps {
  jobId: string;
  currentCrs: string;
  onScaleApplied: (newJobId: string) => void;
  onScalePreview: (scaleFactor: number) => void;
  isApplying: boolean;
}
```

**State**:
```typescript
interface ScaleAdjusterState {
  scaleFactor: string;  // String for input control
  error: string | null;
  showHelp: boolean;
}
```

**Key Methods**:
- `validateScaleFactor(value: string): boolean` - Validates input is numeric and within range (0.9 - 1.1)
- `handleScaleChange(value: string): void` - Updates state and triggers preview
- `handleApply(): void` - Calls backend API to apply scale factor
- `handleReset(): void` - Resets to scale factor 1.0 and restores original preview
- `handleDownloadOriginal(): void` - Downloads the original unscaled conversion

**UI Elements**:
- Numeric input field with 6 decimal precision
- Help icon with tooltip explaining scale factors
- "Apply Scale Factor" button (enabled when valid and factor ≠ 1.0)
- "Reset to 1.0" button (always visible, resets input and preview to original)
- "Download Original" button (allows downloading unscaled version)
- Error message display area
- Visual indicator showing current scale factor status (e.g., "Original (1.0)" or "Scaled (1.00013)")

#### 2. Scale Transform Utility (New)

**Location**: `src/utils/scaleTransform.ts`

**Purpose**: Client-side geometric transformation for real-time preview

**Key Functions**:

```typescript
/**
 * Calculate the centroid of all geometries in a FeatureCollection
 */
function calculateCentroid(geojson: FeatureCollection): [number, number]

/**
 * Apply scale factor to a single coordinate pair relative to origin
 */
function scaleCoordinate(
  coord: [number, number],
  origin: [number, number],
  scaleFactor: number
): [number, number]

/**
 * Apply scale factor to all geometries in a FeatureCollection
 */
function applyScaleFactor(
  geojson: FeatureCollection,
  scaleFactor: number
): FeatureCollection
```

**Algorithm**:
```
For each coordinate [x, y]:
  1. Calculate offset from origin: dx = x - origin_x, dy = y - origin_y
  2. Apply scale: dx_scaled = dx * scaleFactor, dy_scaled = dy * scaleFactor
  3. Calculate new position: x_new = origin_x + dx_scaled, y_new = origin_y + dy_scaled
```

#### 3. App.tsx Modifications

**New State**:
```typescript
const [scaleFactor, setScaleFactor] = useState<number>(1.0);
const [scaledPreviewData, setScaledPreviewData] = useState<FeatureCollection | null>(null);
const [isApplyingScale, setIsApplyingScale] = useState<boolean>(false);
```

**New Methods**:
```typescript
const handleScalePreview = useCallback((factor: number) => {
  if (conversionResult) {
    const scaled = applyScaleFactor(conversionResult, factor);
    setScaledPreviewData(scaled);
    setScaleFactor(factor);
  }
}, [conversionResult]);

const handleScaleApplied = useCallback(async (newJobId: string) => {
  setIsApplyingScale(true);
  pollJobStatus(newJobId);
}, [pollJobStatus]);
```

#### 4. MapViewer Modifications

**Props Update**:
```typescript
interface MapViewerProps {
  data: GeoJsonObject;
  targetCrs?: string;
  scaleFactor?: number;  // New: Display current scale factor
}
```

**UI Enhancement**:
- Display current scale factor in header bar
- Show "Scaled Preview" indicator when scale factor ≠ 1.0

### Backend Components

#### 1. New API Endpoint

**Route**: `POST /api/apply-scale-factor/{job_id}`

**Request Body**:
```python
class ScaleFactorRequest(BaseModel):
    scale_factor: float = Field(..., ge=0.9, le=1.1)
    output_format: Optional[str] = None  # Defaults to original format
```

**Response**:
```python
{
    "job_id": str,  # New job ID for scaled conversion
    "message": str,
    "scale_factor": float
}
```

**Implementation**:
```python
@app.post("/api/apply-scale-factor/{job_id}")
async def apply_scale_factor(
    job_id: str,
    request: ScaleFactorRequest,
    background_tasks: BackgroundTasks
):
    # Validate original job exists
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    original_job = jobs[job_id]
    
    # Create new job for scaled conversion
    new_job_id = str(uuid.uuid4())
    
    jobs[new_job_id] = {
        "status": JobStatus.PENDING,
        "filename": original_job["filename"],
        "target_crs": original_job["target_crs"],
        "output_format": request.output_format or original_job["output_format"],
        "file_path": original_job["file_path"],
        "scale_factor": request.scale_factor,
        "progress": 0,
        "message": f"Applying scale factor {request.scale_factor}...",
        "parent_job_id": job_id
    }
    
    # Start background processing
    background_tasks.add_task(process_scaled_conversion, new_job_id)
    
    return {
        "job_id": new_job_id,
        "message": "Scale factor application started",
        "scale_factor": request.scale_factor
    }
```

#### 2. DXFProcessor Enhancements

**New Method**: `apply_scale_to_geojson`

**Location**: `dxf_processor.py`

```python
def apply_scale_to_geojson(
    self,
    geojson_data: Dict[str, Any],
    scale_factor: float
) -> Dict[str, Any]:
    """
    Apply scale factor to all coordinates in GeoJSON
    
    Args:
        geojson_data: GeoJSON dictionary
        scale_factor: Scale factor to apply
        
    Returns:
        Scaled GeoJSON dictionary
    """
    # Calculate centroid as origin
    gdf = gpd.GeoDataFrame.from_features(geojson_data["features"])
    centroid = gdf.geometry.unary_union.centroid
    origin_x, origin_y = centroid.x, centroid.y
    
    # Apply scaling transformation
    scaled_features = []
    for feature in geojson_data["features"]:
        geom = shape(feature["geometry"])
        
        # Scale geometry relative to origin
        scaled_geom = affinity.scale(
            geom,
            xfact=scale_factor,
            yfact=scale_factor,
            origin=(origin_x, origin_y)
        )
        
        scaled_feature = {
            "type": "Feature",
            "geometry": mapping(scaled_geom),
            "properties": feature["properties"]
        }
        scaled_features.append(scaled_feature)
    
    # Preserve CRS information
    scaled_geojson = {
        "type": "FeatureCollection",
        "features": scaled_features
    }
    
    if "crs" in geojson_data:
        scaled_geojson["crs"] = geojson_data["crs"]
    
    return scaled_geojson
```

**New Background Task**: `process_scaled_conversion`

```python
async def process_scaled_conversion(job_id: str):
    """Background task to apply scale factor to existing conversion"""
    try:
        job = jobs[job_id]
        job["status"] = JobStatus.PROCESSING
        job["progress"] = 20
        
        # Get original job output
        original_job = jobs[job["parent_job_id"]]
        original_output_path = original_job["output_path"]
        
        # Load original GeoJSON
        with open(original_output_path, 'r') as f:
            geojson_data = json.load(f)
        
        job["progress"] = 40
        job["message"] = "Applying scale factor..."
        
        # Apply scale factor
        processor = DXFProcessor()
        scaled_geojson = processor.apply_scale_to_geojson(
            geojson_data,
            job["scale_factor"]
        )
        
        job["progress"] = 70
        job["message"] = "Saving scaled output..."
        
        # Save scaled result
        output_filename = f"{job_id}_scaled.{job['output_format']}"
        output_path = OUTPUT_DIR / output_filename
        
        # Save as GeoJSON
        with open(output_path, 'w') as f:
            json.dump(scaled_geojson, f, indent=2)
        
        job["output_path"] = str(output_path)
        job["progress"] = 100
        job["status"] = JobStatus.COMPLETED
        job["message"] = f"Scale factor {job['scale_factor']} applied successfully!"
        
    except Exception as e:
        logger.error(f"Scale factor application failed for job {job_id}: {e}")
        jobs[job_id]["status"] = JobStatus.FAILED
        jobs[job_id]["message"] = f"Scale factor application failed: {str(e)}"
```

## Data Models

### Job Model Enhancement

```python
# Existing fields remain unchanged
# New optional fields:
{
    "scale_factor": Optional[float],  # Scale factor applied (if any)
    "parent_job_id": Optional[str],   # Reference to original job
}
```

### GeoJSON Structure

The GeoJSON structure remains unchanged. Scale factor is applied to coordinate arrays within geometry objects:

```json
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:EPSG::8782"
    }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [x1_scaled, y1_scaled],
          [x2_scaled, y2_scaled]
        ]
      },
      "properties": {
        "layer": "WATERLINE",
        "entity_type": "LWPOLYLINE"
      }
    }
  ]
}
```

## Error Handling

### Frontend Error Scenarios

1. **Invalid Scale Factor Input**
   - **Trigger**: User enters non-numeric value or value outside range (0.9 - 1.1)
   - **Handling**: Display inline error message, disable "Apply" button
   - **Message**: "Scale factor must be between 0.9 and 1.1"

2. **Scale Application Failure**
   - **Trigger**: Backend API returns error
   - **Handling**: Display error notification, keep current preview
   - **Message**: "Failed to apply scale factor: [error details]"

3. **Preview Transformation Error**
   - **Trigger**: Client-side transformation throws exception
   - **Handling**: Log error, display original data, show warning
   - **Message**: "Unable to preview scale adjustment. You can still apply the scale factor."

### Backend Error Scenarios

1. **Job Not Found**
   - **HTTP Status**: 404
   - **Response**: `{"detail": "Job not found"}`

2. **Invalid Scale Factor**
   - **HTTP Status**: 422 (Validation Error)
   - **Response**: Pydantic validation error details

3. **File Processing Error**
   - **HTTP Status**: 500
   - **Response**: `{"detail": "Failed to apply scale factor: [error details]"}`
   - **Job Status**: Set to "failed" with error message

4. **Missing Original Output**
   - **HTTP Status**: 404
   - **Response**: `{"detail": "Original conversion output not found"}`

## Testing Strategy

### Unit Tests

#### Frontend Tests

**File**: `src/utils/scaleTransform.test.ts`

```typescript
describe('scaleTransform', () => {
  test('calculateCentroid returns correct center point', () => {
    const geojson = createTestFeatureCollection();
    const centroid = calculateCentroid(geojson);
    expect(centroid).toEqual([expectedX, expectedY]);
  });

  test('scaleCoordinate applies factor correctly', () => {
    const coord = [100, 200];
    const origin = [0, 0];
    const scaled = scaleCoordinate(coord, origin, 1.0001);
    expect(scaled[0]).toBeCloseTo(100.01);
    expect(scaled[1]).toBeCloseTo(200.02);
  });

  test('applyScaleFactor preserves feature properties', () => {
    const geojson = createTestFeatureCollection();
    const scaled = applyScaleFactor(geojson, 1.0001);
    expect(scaled.features[0].properties).toEqual(geojson.features[0].properties);
  });

  test('applyScaleFactor with factor 1.0 returns unchanged coordinates', () => {
    const geojson = createTestFeatureCollection();
    const scaled = applyScaleFactor(geojson, 1.0);
    expect(scaled).toEqual(geojson);
  });
});
```

**File**: `src/components/ScaleAdjuster.test.tsx`

```typescript
describe('ScaleAdjuster', () => {
  test('validates scale factor within range', () => {
    const { getByLabelText } = render(<ScaleAdjuster {...props} />);
    const input = getByLabelText('Scale Factor');
    
    fireEvent.change(input, { target: { value: '1.5' } });
    expect(screen.getByText(/must be between/i)).toBeInTheDocument();
  });

  test('calls onScalePreview when valid factor entered', () => {
    const onScalePreview = jest.fn();
    const { getByLabelText } = render(<ScaleAdjuster {...props} onScalePreview={onScalePreview} />);
    
    fireEvent.change(getByLabelText('Scale Factor'), { target: { value: '1.00013' } });
    expect(onScalePreview).toHaveBeenCalledWith(1.00013);
  });

  test('reset button sets factor to 1.0', () => {
    const onScalePreview = jest.fn();
    const { getByText, getByLabelText } = render(<ScaleAdjuster {...props} onScalePreview={onScalePreview} />);
    
    fireEvent.change(getByLabelText('Scale Factor'), { target: { value: '1.00013' } });
    fireEvent.click(getByText('Reset'));
    
    expect(onScalePreview).toHaveBeenLastCalledWith(1.0);
  });
});
```

#### Backend Tests

**File**: `test_scale_factor.py`

```python
def test_apply_scale_to_geojson():
    """Test scale factor application to GeoJSON"""
    processor = DXFProcessor()
    
    # Create test GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[0, 0], [100, 100]]
            },
            "properties": {"layer": "TEST"}
        }]
    }
    
    # Apply scale factor
    scaled = processor.apply_scale_to_geojson(geojson, 1.0001)
    
    # Verify coordinates changed
    original_coords = geojson["features"][0]["geometry"]["coordinates"]
    scaled_coords = scaled["features"][0]["geometry"]["coordinates"]
    
    assert scaled_coords != original_coords
    assert scaled["features"][0]["properties"] == geojson["features"][0]["properties"]

def test_apply_scale_factor_endpoint():
    """Test API endpoint for scale factor application"""
    # Upload and convert test file
    response = client.post("/api/upload", files={"file": test_dxf_file})
    job_id = response.json()["job_id"]
    
    # Wait for completion
    wait_for_job_completion(job_id)
    
    # Apply scale factor
    response = client.post(
        f"/api/apply-scale-factor/{job_id}",
        json={"scale_factor": 1.00013}
    )
    
    assert response.status_code == 200
    new_job_id = response.json()["job_id"]
    assert new_job_id != job_id
    
    # Verify new job completes
    wait_for_job_completion(new_job_id)
    job = client.get(f"/api/job/{new_job_id}").json()
    assert job["status"] == "completed"
    assert job["scale_factor"] == 1.00013
```

### Integration Tests

1. **End-to-End Scale Factor Workflow**
   - Upload DXF file
   - Wait for conversion completion
   - Enter scale factor in UI
   - Verify preview updates
   - Click "Apply Scale Factor"
   - Wait for new job completion
   - Download scaled file
   - Verify coordinates in downloaded file

2. **Multiple Scale Adjustments**
   - Apply scale factor 1.0001
   - Download result
   - Apply different scale factor 1.00013 to same original job
   - Verify both results are independent

3. **Reset Functionality**
   - Enter scale factor
   - Verify preview changes
   - Click reset
   - Verify preview returns to original

### Manual Testing Checklist

- [ ] Scale factor input accepts decimal values with 6+ digits
- [ ] Invalid scale factors show appropriate error messages
- [ ] Map preview updates smoothly when scale factor changes
- [ ] Map center and zoom remain stable during preview updates
- [ ] "Apply Scale Factor" button is disabled for invalid inputs or when factor is 1.0
- [ ] "Reset to 1.0" button returns preview to original state
- [ ] "Download Original" button downloads unscaled version at any time
- [ ] Visual indicator correctly shows current scale status
- [ ] Help tooltip displays explanatory text
- [ ] Applied scale factor creates new downloadable file
- [ ] Downloaded file contains correctly scaled coordinates
- [ ] Original conversion remains available after scale adjustment
- [ ] User can download both original and scaled versions
- [ ] Feature properties are preserved during scaling
- [ ] Layer information is maintained
- [ ] CRS information is preserved in output file
- [ ] Reset functionality works after applying a scale factor

## Performance Considerations

### Client-Side Performance

**Challenge**: Real-time transformation of large GeoJSON files

**Optimization Strategies**:
1. **Debouncing**: Debounce scale factor input changes (300ms delay)
2. **Memoization**: Cache centroid calculation
3. **Efficient Iteration**: Use map() instead of forEach for coordinate transformation
4. **Progressive Rendering**: For very large datasets (>10,000 features), consider:
   - Web Workers for transformation
   - Chunked processing with progress indicator

**Expected Performance**:
- Small files (<1,000 features): <50ms transformation time
- Medium files (1,000-10,000 features): <200ms transformation time
- Large files (>10,000 features): <1s transformation time

### Backend Performance

**Challenge**: Processing large GeoJSON files for scale application

**Optimization Strategies**:
1. **Shapely Affinity**: Use optimized `affinity.scale()` function
2. **Batch Processing**: Process features in batches for very large files
3. **Memory Management**: Stream large files instead of loading entirely into memory

**Expected Performance**:
- Small files: <1s processing time
- Medium files: <5s processing time
- Large files: <30s processing time

## Security Considerations

1. **Input Validation**
   - Validate scale factor range (0.9 - 1.1) on both frontend and backend
   - Sanitize job_id parameter to prevent injection attacks
   - Validate file paths to prevent directory traversal

2. **Rate Limiting**
   - Implement rate limiting on `/api/apply-scale-factor` endpoint
   - Limit number of scale factor applications per job

3. **Resource Management**
   - Set maximum file size for scale factor operations
   - Implement timeout for long-running scale operations
   - Clean up temporary files after processing

## Deployment Considerations

### Environment Variables

No new environment variables required.

### Database Migrations

No database schema changes (using in-memory job storage).

### Backward Compatibility

- Existing conversion workflow remains unchanged
- Scale factor fields are optional in job model
- API endpoints are additive (no breaking changes)

### Rollout Strategy

1. **Phase 1**: Deploy backend changes
   - Add new API endpoint
   - Add scale factor processing logic
   - Monitor for errors

2. **Phase 2**: Deploy frontend changes
   - Add ScaleAdjuster component
   - Add scale transform utility
   - Enable feature for all users

3. **Phase 3**: Monitor and optimize
   - Track usage metrics
   - Monitor performance
   - Gather user feedback

## Fallback and Original Access

To ensure users always have access to their original unscaled data, the design includes multiple fallback mechanisms:

### 1. Reset to Original Preview
- **"Reset to 1.0" button**: Immediately returns the map preview to the original unscaled state
- Clears any entered scale factor value
- Does not affect any previously applied/downloaded scaled versions
- Always available, even after applying a scale factor

### 2. Download Original Anytime
- **"Download Original" button**: Always visible alongside the scaled download option
- Downloads the original conversion without any scale factor applied
- Available even after applying and downloading scaled versions
- Ensures users never lose access to their original data

### 3. Visual Status Indicator
- Clear indication of current state: "Original (1.0)" or "Scaled (1.00013)"
- Helps users understand what they're viewing in the preview
- Updates in real-time as scale factor changes

### 4. Independent Job Tracking
- Original conversion job remains intact
- Each scale factor application creates a new independent job
- Users can apply multiple different scale factors to the same original
- All versions remain downloadable through their respective job IDs

### Implementation Notes
- The original job's output file is never modified
- Scale factor applications always reference the original job
- Users can return to the original state at any point in the workflow
- No destructive operations - all transformations create new files

## Future Enhancements

1. **Custom Origin Point**: Allow users to specify custom origin point for scaling
2. **Scale Factor Presets**: Provide common scale factors for different regions
3. **Batch Scale Adjustment**: Apply scale factor to multiple files at once
4. **Scale Factor History**: Save and recall previously used scale factors
5. **Combined Factor Calculator**: Tool to calculate combined scale factor from grid and elevation factors
6. **Differential Scaling**: Support different scale factors for X and Y axes (for specialized use cases)
7. **Comparison View**: Side-by-side preview of original vs scaled data
