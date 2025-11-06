# Scale Factor Adjustment Guide

## Overview

Scale factor adjustment is a critical feature for surveying workflows that corrects for distortions when projecting curved earth measurements onto flat coordinate systems. This guide provides comprehensive information on using the scale factor feature effectively.

## Understanding Scale Factors

### What is a Scale Factor?

A scale factor is a multiplier applied to coordinates to convert between:
- **Surface coordinates**: Measurements taken at actual ground elevation
- **Grid coordinates**: Coordinates within a flat projection system (State Plane, UTM, etc.)

### Why Scale Factors are Needed

When surveyors measure distances on the curved earth surface, these measurements must be adjusted when projected onto flat coordinate systems. The adjustment accounts for:

1. **Grid Scale Factor**: Distortion from projecting curved earth onto flat grid
2. **Elevation Factor**: Correction for height above sea level
3. **Combined Factor**: Product of grid and elevation factors

**Formula**: `Combined Scale Factor = Grid Scale Factor × Elevation Factor`

## Regional Scale Factor Reference

### United States - State Plane Systems

#### Texas
- **Central Zone (EPSG:2277)**: 0.99996 - 1.00004
- **North Zone (EPSG:2275)**: 0.99995 - 1.00003  
- **South Zone (EPSG:2279)**: 0.99997 - 1.00002
- **Typical Value**: 1.00013

#### California
- **Zone I (EPSG:2225)**: 0.99992 - 1.00008
- **Zone II (EPSG:2226)**: 0.99993 - 1.00007
- **Zone VI (EPSG:2230)**: 0.99995 - 1.00005
- **Typical Value**: 1.00002

#### Florida
- **East Zone (EPSG:2236)**: 0.99998 - 1.00002
- **West Zone (EPSG:2237)**: 0.99998 - 1.00002
- **Typical Value**: 1.00001

#### Colorado
- **Central Zone (EPSG:2232)**: 0.99990 - 1.00010
- **North Zone (EPSG:2231)**: 0.99992 - 1.00008
- **Typical Value**: 1.00008

#### New York
- **Long Island Zone (EPSG:2263)**: 0.99995 - 1.00005
- **Central Zone (EPSG:2261)**: 0.99996 - 1.00004
- **Typical Value**: 1.00003

### Elevation-Based Corrections

| Elevation | Approximate Factor | Notes |
|-----------|-------------------|-------|
| Sea Level | 1.00000 | No elevation correction |
| 500 ft | 1.00002 | Minimal correction |
| 1000 ft | 1.00005 | Typical low elevation |
| 2000 ft | 1.00010 | Moderate elevation |
| 3000 ft | 1.00015 | Higher elevation areas |
| 5000 ft | 1.00025 | Mountain regions |

## Step-by-Step Usage Guide

### Step 1: Complete Initial Conversion
1. Upload your DXF file
2. Select target coordinate system
3. Output format is GeoJSON
4. Wait for conversion to complete

![Conversion Complete](../screenshots/conversion-complete.png)
*Screenshot: Conversion complete screen showing successful DXF processing*

### Step 2: Access Scale Factor Controls
After successful conversion, the Scale Factor Adjustment panel appears below the progress indicator.

![Scale Factor Panel](../screenshots/scale-factor-panel.png)
*Screenshot: Scale Factor Adjustment panel location in the interface*

### Step 3: Enter Scale Factor
1. Click in the "Scale Factor" input field
2. Enter your scale factor value (e.g., 1.00013)
3. Use up to 6 decimal places for precision
4. Valid range: 0.9 to 1.1

![Scale Factor Input](../screenshots/scale-factor-input.png)
*Screenshot: Scale factor input field with validation and help tooltip*

### Step 4: Preview Changes
- Map updates in real-time as you type
- Visual indicator shows current state:
  - "Original (1.0)" - No scaling applied
  - "Scaled (1.00013)" - Scale factor applied
- Map center and zoom remain stable

![Preview Comparison](../screenshots/scale-factor-preview.png)
*Screenshot: Map preview showing before and after scale factor application*

### Step 5: Apply Scale Factor
1. Click "Apply Scale Factor" button (enabled when factor ≠ 1.0)
2. New processing job starts
3. Progress indicator shows scaling progress
4. New scaled file becomes available for download

![Apply Scale Factor](../screenshots/apply-scale-factor.png)
*Screenshot: Apply scale factor button and processing progress*

### Step 6: Download Options
- **Download Scaled**: Get the scale-adjusted file
- **Download Original**: Get the original unscaled file
- **Reset to 1.0**: Return preview to original state

![Download Options](../screenshots/download-options.png)
*Screenshot: Download options showing original and scaled file choices*

## Real-World Examples

### Example 1: Municipal Water System (Austin, Texas)

**Scenario**: Converting CAD drawings of water mains for GIS integration

**Details**:
- Survey conducted at ground level in Austin, TX
- Target CRS: Texas State Plane Central (EPSG:2277)
- Elevation: ~500 feet above sea level
- Survey software: Trimble Business Center

**Scale Factor Calculation**:
- Grid Scale Factor: 1.000125 (from State Plane projection)
- Elevation Factor: 1.000008 (500ft elevation)
- Combined Factor: 1.000125 × 1.000008 = 1.000133

**Usage**:
1. Upload DXF file from CAD system
2. Convert to GeoJSON with EPSG:2277
3. Enter scale factor: 1.000133
4. Preview shows ~4 inch shift for 1000ft features
5. Apply scale factor and download corrected file
6. Import into ArcGIS for utility management

### Example 2: Coastal Development (Miami, Florida)

**Scenario**: Site development survey near sea level

**Details**:
- Survey elevation: 10 feet above sea level
- Target CRS: Florida State Plane East (EPSG:2236)
- Survey equipment: Leica total station
- Project area: 50 acres

**Scale Factor Calculation**:
- Grid Scale Factor: 0.999998 (minimal distortion near coast)
- Elevation Factor: 1.000000 (essentially sea level)
- Combined Factor: 0.999998 × 1.000000 = 0.999998

**Usage**:
1. Convert DXF to GeoJSON format
2. Enter scale factor: 0.999998
3. Minimal visual change in preview (< 1 inch per 1000ft)
4. Apply factor for surveying accuracy compliance
5. Deliver to engineering team for design work

### Example 3: Mountain Survey (Denver, Colorado)

**Scenario**: Infrastructure survey in high elevation area

**Details**:
- Survey elevation: 5,280 feet (1 mile high)
- Target CRS: Colorado State Plane Central (EPSG:2232)
- Large elevation correction needed
- Survey area: Mountain highway project

**Scale Factor Calculation**:
- Grid Scale Factor: 1.000040 (State Plane distortion)
- Elevation Factor: 1.000260 (5,280ft elevation)
- Combined Factor: 1.000040 × 1.000260 = 1.000300

**Usage**:
1. Upload highway alignment DXF
2. Convert to GeoJSON for web mapping
3. Enter scale factor: 1.000300
4. Preview shows significant coordinate shift (~1 foot per 1000ft)
5. Critical for accurate GPS/GIS integration
6. Download for DOT project delivery

## Troubleshooting

### Common Issues and Solutions

#### "Scale factor must be between 0.9 and 1.1"
**Cause**: Entered value outside valid range
**Solution**: 
- Check if you entered elevation instead of scale factor
- Verify decimal point placement (1.00013, not 100013)
- Consult surveyor for correct combined scale factor

#### Preview Not Updating
**Cause**: Invalid number format
**Solution**:
- Ensure decimal point is used (not comma)
- Remove any extra characters or spaces
- Use only numeric values

#### Coordinates Shifted Incorrectly
**Cause**: Wrong scale factor or double-application
**Solution**:
- Verify factor with original surveyor
- Check if scale factor already applied in survey software
- Ensure using combined factor, not individual components

#### Can't Access Original File After Scaling
**Cause**: Confusion about download options
**Solution**:
- Use "Download Original" button for unscaled version
- Original file always remains available
- Each scale application creates independent file

#### Scale Factor Seems Too Large/Small
**Cause**: Misunderstanding of typical values
**Solution**:
- Most scale factors are very close to 1.0
- Typical range: 0.9999 to 1.0003
- Values like 1.5 or 0.5 are likely incorrect

### Getting Help

1. **Consult Original Surveyor**: Best source for correct scale factor
2. **Check Survey Software**: Many programs calculate combined factors
3. **State DOT Resources**: Guidelines for regional scale factors
4. **Professional Surveyors**: Local knowledge of area-specific factors
5. **Survey Equipment Manuals**: Documentation on scale factor calculations

## Best Practices

### Before Using Scale Factors

1. **Verify Need**: Confirm scale factor correction is required
2. **Get Authoritative Source**: Obtain factor from surveyor or survey software
3. **Understand Components**: Know if factor includes grid and/or elevation corrections
4. **Document Source**: Record where scale factor came from

### During Application

1. **Start with Preview**: Always preview before applying
2. **Check Magnitude**: Verify coordinate shift makes sense for your area
3. **Test Known Points**: Compare results with known control points
4. **Save Both Versions**: Keep original and scaled files

### After Application

1. **Validate Results**: Check against independent measurements
2. **Document Process**: Record scale factor and source in project files
3. **Quality Control**: Verify accuracy with field measurements
4. **Archive Files**: Maintain both original and corrected versions

## Technical Details

### Transformation Algorithm

The scale factor is applied using the following process:

1. **Calculate Centroid**: Find geometric center of all features
   ```
   centroid = unary_union(all_geometries).centroid
   origin_x, origin_y = centroid.x, centroid.y
   ```

2. **Transform Each Coordinate**: Apply scaling relative to origin
   ```
   for each coordinate [x, y]:
     dx = x - origin_x
     dy = y - origin_y
     x_new = origin_x + (dx * scale_factor)
     y_new = origin_y + (dy * scale_factor)
   ```

3. **Preserve Properties**: All feature attributes and CRS information maintained

### Coordinate Precision

- Input precision: Maintains original DXF precision
- Processing precision: 64-bit floating point arithmetic
- Output precision: 6+ decimal places (sub-millimeter accuracy)
- Spatial relationships: Preserved during transformation

### Performance Characteristics

| File Size | Features | Processing Time | Memory Usage |
|-----------|----------|-----------------|--------------|
| Small | <1,000 | <1 second | <10 MB |
| Medium | 1,000-10,000 | <5 seconds | 10-100 MB |
| Large | >10,000 | <30 seconds | >100 MB |

## API Integration

For developers integrating with the scale factor API:

### Request Format
```json
POST /api/apply-scale-factor/{job_id}
{
  "scale_factor": 1.00013,
  "output_format": "geojson"
}
```

### Response Format
```json
{
  "job_id": "new-job-uuid",
  "message": "Scale factor application started",
  "scale_factor": 1.00013
}
```

### Error Handling
```json
{
  "detail": "Scale factor must be between 0.9 and 1.1",
  "type": "validation_error"
}
```

## Additional Resources

### Professional Organizations
- **NSPS**: National Society of Professional Surveyors
- **ACSM**: American Congress on Surveying and Mapping
- **State Surveyor Boards**: Local licensing and standards

### Software Resources
- **Trimble Business Center**: Scale factor calculation tools
- **Leica Infinity**: Combined factor computation
- **Topcon MAGNET**: Grid and elevation factor tools
- **Carlson Survey**: Scale factor utilities

### Reference Materials
- **NOAA/NGS**: Coordinate system documentation
- **State DOT Manuals**: Regional surveying standards
- **EPSG Database**: Coordinate reference system definitions
- **Professional Surveying Textbooks**: Theoretical background

---

*This guide is part of the CAD to GIS Converter documentation. For technical support, refer to the main README.md troubleshooting section.*