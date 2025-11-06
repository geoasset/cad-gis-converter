# Installing New Dependencies

The State Plane projection preview feature requires additional npm packages.

## Installation

Run the following command in the frontend directory:

```bash
npm install
```

This will install the newly added dependencies:
- `proj4` - JavaScript library for coordinate transformations
- `proj4leaflet` - Leaflet plugin for custom CRS support
- `@types/proj4leaflet` - TypeScript definitions

## What Changed

### Frontend Dependencies (package.json)
- Added `proj4@^2.9.2` for coordinate system definitions
- Added `proj4leaflet@^1.0.2` for Leaflet CRS support
- Added `@types/proj4leaflet@^1.0.10` for TypeScript support

### MapViewer Component
- Now accepts `targetCrs` prop to display the coordinate system
- Shows a CRS indicator badge on the map (top-left corner)
- Displays State Plane projection information when applicable
- Data is still displayed in WGS84 for Leaflet compatibility, but the indicator shows what CRS the data was converted to

### App Component
- Passes the selected `targetCrs` to MapViewer
- Shows CRS information in the preview header

## Usage

After installation, the map preview will show:
1. A blue badge in the top-left corner indicating the target CRS
2. For State Plane projections, it will display "State Plane (EPSG:XXXXX)"
3. For common projections, it will show friendly names like "WGS84" or "Web Mercator"

## Note on Map Display

The backend converts your DXF data to the selected State Plane projection. The preview map displays this data using Leaflet with OpenStreetMap tiles. The CRS indicator badge shows what projection your data is in and what your downloaded file will contain.

**Important:** The map preview is for visual verification of features and layers. For precise coordinate verification, download the file and open it in professional GIS software like QGIS or ArcGIS, which can properly display State Plane projections.
