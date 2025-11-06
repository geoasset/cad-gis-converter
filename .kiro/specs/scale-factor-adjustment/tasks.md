# Implementation Plan

- [x] 1. Create scale transformation utility module





  - Create `src/utils/scaleTransform.ts` with coordinate transformation functions
  - Implement `calculateCentroid()` to find the geometric center of all features
  - Implement `scaleCoordinate()` to apply scale factor to a single coordinate pair relative to origin
  - Implement `applyScaleFactor()` to transform all geometries in a FeatureCollection
  - Handle all geometry types: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
  - Preserve feature properties and CRS information during transformation
  - _Requirements: 2.2, 2.3, 2.4_
-

- [x] 2. Create ScaleAdjuster component




  - Create `src/components/ScaleAdjuster.tsx` with TypeScript interfaces
  - Implement scale factor input field with 6 decimal precision
  - Add input validation for range 0.9 to 1.1
  - Implement debounced onChange handler (300ms) to trigger preview updates
  - Add "Apply Scale Factor" button (disabled when invalid or factor = 1.0)
  - Add "Reset to 1.0" button to restore original state
  - Add "Download Original" button for unscaled version access
  - Display visual status indicator showing current scale factor
  - Add help icon with tooltip explaining scale factor purpose and typical values
  - Implement error message display for invalid inputs
  - Style component to match existing application design
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_
-

- [x] 3. Integrate ScaleAdjuster into App.tsx




  - Add state variables: `scaleFactor`, `scaledPreviewData`, `isApplyingScale`
  - Import and use `applyScaleFactor` utility function
  - Implement `handleScalePreview()` callback to update preview in real-time
  - Implement `handleScaleApplied()` callback to start new job polling
  - Implement `handleDownloadOriginal()` to download unscaled version
  - Conditionally render ScaleAdjuster component after successful conversion
  - Position ScaleAdjuster between ProgressIndicator and MapViewer
  - Pass scaled preview data to MapViewer when scale factor ≠ 1.0
  - Ensure original conversion data is preserved
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 5.2, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5_
-

- [x] 4. Update MapViewer component




  - Add optional `scaleFactor` prop to MapViewerProps interface
  - Display current scale factor in header bar
  - Show "Scaled Preview" indicator when scale factor ≠ 1.0
  - Show "Original" indicator when scale factor = 1.0
  - Ensure map center and zoom remain stable during data updates
  - Add visual loading indicator during scale transformations
  - _Requirements: 2.3, 2.5_
-

- [x] 5. Create backend API endpoint for scale factor application




  - Add `ScaleFactorRequest` Pydantic model with validation (0.9 ≤ scale_factor ≤ 1.1)
  - Implement `POST /api/apply-scale-factor/{job_id}` endpoint in `main.py`
  - Validate original job exists and has completed successfully
  - Create new job with scale factor metadata
  - Return new job_id for polling
  - Add background task to process scaled conversion
  - Handle error cases: job not found, invalid scale factor, missing output file
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
-

- [x] 6. Implement scale factor processing in DXFProcessor





  - Add `apply_scale_to_geojson()` method to `dxf_processor.py`
  - Calculate centroid using GeoPandas unary_union
  - Use Shapely's `affinity.scale()` for geometric transformation
  - Apply scale factor relative to calculated origin point
  - Preserve all feature properties during transformation
  - Preserve CRS information in output GeoJSON
  - Handle GeoJSON output format
  - Maintain coordinate precision to 6 decimal places
  - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Create background task for scaled conversion processing





  - Implement `process_scaled_conversion()` async function in `main.py`
  - Load original GeoJSON from completed job output
  - Call DXFProcessor to apply scale factor
  - Save scaled result to new output file
  - Update job status and progress throughout processing
  - Handle conversion to GeoJSON format
  - Set job status to completed with success message
  - Handle errors and set job status to failed with error details
  - _Requirements: 3.2, 3.3, 3.4, 3.5_


- [x] 8. Add API client methods for scale factor operations




  - Add TypeScript interface for scale factor request/response in `src/api/axios.ts`
  - Create `applyScaleFactor(jobId: string, scaleFactor: number)` API method
  - Add proper error handling and timeout configuration
  - Ensure response types match backend API contract
  - _Requirements: 3.1, 3.2_

- [x] 9. Update job model to support scale factor metadata





  - Add optional `scale_factor` field to job dictionary
  - Add optional `parent_job_id` field to track original job
  - Update job status responses to include scale factor information
  - Ensure backward compatibility with existing jobs
  - _Requirements: 3.2, 3.3, 7.5_

- [x] 10. Implement comprehensive error handling





  - Add frontend validation error messages for invalid scale factors
  - Add backend validation using Pydantic constraints
  - Handle API errors gracefully with user-friendly messages
  - Add error handling for missing original job or output file
  - Add error handling for transformation failures
  - Log all errors with appropriate context for debugging
  - Display error notifications without breaking existing functionality
  - _Requirements: 1.5, 5.5_




- [ ] 11. Add CSS styling and animations

  - Style ScaleAdjuster component to match application theme
  - Add smooth transitions for preview updates
  - Add loading spinner for scale factor application
  - Style status indicators with appropriate colors
  - Add hover effects for buttons


  - Ensure responsive design for mobile devices
  - Add fade-in animation for ScaleAdjuster component appearance
  - _Requirements: 2.5, 7.4_

- [x] 12. Update documentation



  - Add scale factor feature description to README.md
  - Document typical scale factor values for different regions
  - Add usage examples with screenshots
  - Document API endpoint in backend documentation
  - Add troubleshooting section for common scale factor issues
  - _Requirements: 6.3, 6.4, 6.5_
