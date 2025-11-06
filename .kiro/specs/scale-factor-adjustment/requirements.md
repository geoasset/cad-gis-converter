# Requirements Document

## Introduction

This document defines the requirements for implementing a scale factor adjustment feature in the CAD to GIS Converter application. The feature enables users to apply surface-to-grid scale factor corrections to DXF files after upload, with real-time preview of adjustments and the ability to download the corrected file. Scale factor adjustments are critical in surveying workflows to account for the distortion that occurs when projecting curved earth measurements onto flat coordinate systems.

## Glossary

- **Scale Factor**: A multiplier applied to coordinates to convert between surface (ground) measurements and grid (projected) coordinates
- **Surface Coordinates**: Measurements taken at actual ground elevation, also called ground coordinates
- **Grid Coordinates**: Coordinates within a flat grid projection system (e.g., State Plane, OSGB36)
- **Combined Scale Factor**: The product of grid scale factor and elevation factor, typically ranging from 0.9999 to 1.0004
- **DXF File**: Drawing Exchange Format file used in CAD applications
- **GeoJSON**: Geographic data format based on JSON for representing geographic features
- **Map Preview**: Interactive Leaflet map displaying converted DXF geometries
- **Conversion System**: The backend processing system that converts DXF files to GIS formats
- **Scale Adjustment UI**: User interface component for inputting and applying scale factors

## Requirements

### Requirement 1

**User Story:** As a surveyor, I want to input a scale factor value after uploading my DXF file, so that I can correct for surface-to-grid distortions in my coordinate data

#### Acceptance Criteria

1. WHEN the DXF file conversion is completed, THE Scale Adjustment UI SHALL display an input field for the scale factor value
2. THE Scale Adjustment UI SHALL accept numeric scale factor values between 0.9 and 1.1
3. THE Scale Adjustment UI SHALL display the current scale factor value with at least 6 decimal places of precision
4. THE Scale Adjustment UI SHALL provide a default scale factor value of 1.0 (no adjustment)
5. WHEN the user enters an invalid scale factor value, THE Scale Adjustment UI SHALL display an error message indicating the valid range

### Requirement 2

**User Story:** As a surveyor, I want to see the map preview update in real-time as I adjust the scale factor, so that I can visually verify the adjustment is correct before downloading

#### Acceptance Criteria

1. WHEN the user modifies the scale factor value, THE Map Preview SHALL update the displayed geometries within 500 milliseconds
2. THE Map Preview SHALL apply the scale factor transformation to all coordinate pairs in the GeoJSON data
3. THE Map Preview SHALL maintain the map center and zoom level during scale factor updates
4. THE Map Preview SHALL preserve all feature properties and layer information during transformation
5. WHILE the scale factor is being applied, THE Map Preview SHALL display a visual indicator showing the transformation is in progress

### Requirement 3

**User Story:** As a surveyor, I want to approve the scale factor adjustment and download a new file with the corrected coordinates, so that I can use the adjusted data in my GIS workflow

#### Acceptance Criteria

1. THE Scale Adjustment UI SHALL provide an "Apply Scale Factor" button that is enabled when a valid scale factor is entered
2. WHEN the user clicks "Apply Scale Factor", THE Conversion System SHALL create a new conversion job with the adjusted coordinates
3. THE Conversion System SHALL apply the scale factor to all X and Y coordinates in the DXF geometries
4. WHEN the scale factor adjustment is complete, THE Conversion System SHALL make the adjusted file available for download
5. THE Download System SHALL provide the adjusted file in GeoJSON format

### Requirement 4

**User Story:** As a surveyor, I want the scale factor to be applied from a specific origin point, so that the adjustment matches standard surveying practices

#### Acceptance Criteria

1. THE Conversion System SHALL calculate the centroid of all geometries as the default scale origin point
2. THE Conversion System SHALL apply the scale factor by transforming each coordinate relative to the origin point
3. THE Conversion System SHALL preserve the spatial relationships between all features during scaling
4. THE Conversion System SHALL maintain coordinate precision to at least 6 decimal places during transformation
5. THE Conversion System SHALL apply the same scale factor uniformly to all layers and features

### Requirement 5

**User Story:** As a surveyor, I want to reset the scale factor to 1.0 and see the original preview, so that I can start over if I make a mistake

#### Acceptance Criteria

1. THE Scale Adjustment UI SHALL provide a "Reset" button adjacent to the scale factor input field
2. WHEN the user clicks "Reset", THE Scale Adjustment UI SHALL set the scale factor value to 1.0
3. WHEN the scale factor is reset to 1.0, THE Map Preview SHALL display the original unscaled geometries
4. THE Reset function SHALL not affect the original uploaded DXF file or the initial conversion
5. THE Reset function SHALL clear any error messages related to invalid scale factor values

### Requirement 6

**User Story:** As a surveyor, I want to see information about what the scale factor does, so that I can understand how to use this feature correctly

#### Acceptance Criteria

1. THE Scale Adjustment UI SHALL display a help icon or tooltip near the scale factor input field
2. WHEN the user hovers over or clicks the help icon, THE Scale Adjustment UI SHALL display explanatory text about scale factors
3. THE explanatory text SHALL describe the purpose of surface-to-grid scale factor adjustments
4. THE explanatory text SHALL provide an example scale factor value (e.g., 1.00013)
5. THE explanatory text SHALL indicate the typical range of scale factor values used in surveying

### Requirement 7

**User Story:** As a project manager, I want the existing conversion workflow to remain unchanged, so that users who don't need scale factor adjustments are not affected

#### Acceptance Criteria

1. THE Conversion System SHALL complete the initial DXF to GIS conversion without requiring a scale factor input
2. THE Scale Adjustment UI SHALL appear only after the initial conversion is completed successfully
3. THE Download System SHALL allow users to download the original converted file without applying any scale factor
4. THE Scale Adjustment UI SHALL be positioned in a non-intrusive location that does not block the map preview
5. WHEN no scale factor adjustment is applied, THE Conversion System SHALL function identically to the current implementation
