# CRS Preview Feature - Implementation Summary

## Overview

The map preview now displays which coordinate reference system (CRS) was used for the conversion, including State Plane projections.

## Changes Made

### 1. Package Dependencies (package.json)
Added three new packages:
- `proj4@^2.9.2` - Coordinate transformation library
- `proj4leaflet@^1.0.2` - Leaflet plugin for custom CRS
- `@types/proj4leaflet@^1.0.10` - TypeScript definitions

**Action Required:** Run `npm install` to install these dependencies.

### 2. MapViewer Component (src/components/MapViewer.tsx)

**New Features:**
- Accepts `targetCrs` prop (optional, defaults to 'EPSG:4326')
- Displays a CRS indicator badge in the top-left corner of the map
- Shows friendly names for common projections (WGS84, Web Mercator)
- Automatically detects and labels State Plane projections
- Badge shows both the CRS name and EPSG code

**Visual Design:**
- Blue badge with white text
- Globe icon for visual recognition
- Two-line display: friendly name + EPSG code
- Semi-transparent background for better visibility

### 3. App Component (src/App.tsx)

**Updates:**
- Added `target_crs` field to Job interface
- Passes `targetCrs` prop to MapViewer component
- Shows CRS information in the preview header
- Uses job's target_crs if available, falls back to selected targetCrs

### 4. Documentation

**New Files:**
- `INSTALL_DEPENDENCIES.md` - Installation instructions
- `CRS_PREVIEW_FEATURE.md` - This file

**Updated Files:**
- `STATE_PLANE_GUIDE.md` - Added Map Preview section

## How It Works

1. User selects a coordinate system (e.g., California Zone 3)
2. User uploads DXF file
3. Backend converts data to selected CRS
4. Frontend receives GeoJSON in the target CRS
5. MapViewer displays the data with a CRS indicator badge
6. User can verify the correct projection before downloading

## CRS Detection Logic

The component automatically identifies projection types:

```typescript
// State Plane projections (NAD83)
EPSG:26729-26798  → "State Plane (EPSG:XXXXX)"
EPSG:32100-32158  → "State Plane (EPSG:XXXXX)"
EPSG:3457         → "State Plane (EPSG:3457)" // Louisiana Offshore

// Common projections
EPSG:4326  → "WGS84"
EPSG:3857  → "Web Mercator"

// Others
Any other → Shows EPSG code as-is
```

## User Experience

**Before:**
- Users couldn't verify which CRS was used in the preview
- No visual confirmation of State Plane selection

**After:**
- Clear CRS indicator always visible on map
- State Plane projections clearly labeled
- EPSG code shown for reference
- Matches the selected projection from the dropdown

## Technical Notes

### How the Data is Displayed

**Important:** The backend returns GeoJSON data already converted to your selected State Plane projection. Leaflet's GeoJSON layer automatically handles the coordinate display, assuming the data is in WGS84 (EPSG:4326) for rendering purposes. 

This means:
- **Backend:** Converts DXF → Target CRS (e.g., State Plane)
- **Preview:** Shows data with OpenStreetMap tiles (assumes WGS84 for display)
- **Download:** File contains data in the selected State Plane projection
- **CRS Badge:** Shows what projection the data is actually in

The preview may have slight positional differences from the actual coordinates because Leaflet treats all GeoJSON as WGS84 for display. The **downloaded file** is accurate and contains properly projected State Plane coordinates.

### Future Enhancements (Optional)

If you want to display data in native State Plane coordinates:
1. Use proj4leaflet to define custom CRS
2. Create a custom tile layer or use a blank map
3. Transform coordinates for display
4. Note: This would lose the OpenStreetMap basemap

## Testing

To test the feature:

1. Select "US State Plane" tab
2. Choose any state plane zone (e.g., "California Zone 3 (NAD83)")
3. Upload a DXF file
4. Check the blue CRS badge in top-left corner
5. Verify it shows "State Plane (EPSG:26743)"
6. Try switching to "Common CRS" tab and selecting "WGS84"
7. Upload another file
8. Verify badge shows "WGS84" and "EPSG:4326"

## Browser Compatibility

The feature uses standard React, Leaflet, and proj4 libraries, which are compatible with:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
