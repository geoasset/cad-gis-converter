# Change Projection On-The-Fly Feature

## Overview
This feature allows users to change the coordinate reference system (CRS) of their converted DXF file after the initial upload and conversion, without needing to re-upload the file.

## How It Works

### Backend
- **New API Endpoint**: `/api/reproject/{job_id}`
  - Accepts a `job_id` from a completed conversion
  - Takes `target_crs` and optional `output_format` parameters
  - Reprocesses the original DXF file with the new projection
  - Returns a new job ID for tracking the reprojection progress

### Frontend
- **ProjectionChanger Component**: A new UI component that appears after successful conversion
  - Displays the current projection
  - Provides a "Change Projection" button
  - Opens a dropdown with Common CRS and US State Plane options
  - Allows users to select a new projection and apply it

### User Flow
1. User uploads a DXF file with initial projection settings
2. File is converted and preview is displayed
3. User sees the ProjectionChanger component above the map preview
4. User clicks "Change Projection" button
5. User selects a new coordinate system from the dropdown
6. User clicks "Apply Projection"
7. System reprocesses the file with the new projection
8. Updated preview is displayed with the new projection
9. User can download the file in the new projection

## Benefits
- **No Re-upload Required**: Original DXF file is retained on the server
- **Fast Iteration**: Users can quickly try different projections
- **Efficient Workflow**: Especially useful when unsure of the correct projection
- **State Plane Support**: Easy access to all US State Plane coordinate systems

## Technical Details

### API Request
```http
POST /api/reproject/{job_id}?target_crs=EPSG:32118&output_format=geojson
```

### Response
```json
{
  "job_id": "new-uuid-here",
  "message": "Reprojection started"
}
```

### State Management
- The original job's file path is preserved
- A new job is created for the reprojection
- The new job references the parent job ID
- Progress polling works the same as initial conversion

## Supported Projections
- All Common CRS (WGS84, Web Mercator, UTM zones, etc.)
- All US State Plane coordinate systems (NAD83)
- Custom EPSG codes can be added to the dropdown lists

## Future Enhancements
- Add custom EPSG code input field
- Show projection comparison side-by-side
- Cache reprojected results for faster switching
- Add projection accuracy warnings based on geographic extent
