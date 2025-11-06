import type { FeatureCollection, Feature, Geometry, Position } from 'geojson';

/**
 * Calculate the centroid (geometric center) of all features in a FeatureCollection
 * @param geojson - The FeatureCollection to calculate centroid for
 * @returns [longitude, latitude] coordinates of the centroid
 * @throws Error if geojson is invalid or contains no valid coordinates
 */
export function calculateCentroid(geojson: FeatureCollection): [number, number] {
  if (!geojson) {
    throw new Error('GeoJSON data is required');
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    throw new Error('GeoJSON must contain a features array');
  }

  if (geojson.features.length === 0) {
    throw new Error('GeoJSON contains no features');
  }

  let totalX = 0;
  let totalY = 0;
  let pointCount = 0;

  const processCoordinates = (coords: Position | Position[] | Position[][] | Position[][][]): void => {
    try {
      if (typeof coords[0] === 'number') {
        // Single coordinate pair
        const [x, y] = coords as Position;
        
        // Validate coordinates are finite numbers
        if (!isFinite(x) || !isFinite(y)) {
          console.warn('Skipping invalid coordinate pair:', [x, y]);
          return;
        }
        
        totalX += x;
        totalY += y;
        pointCount++;
      } else {
        // Nested array of coordinates
        (coords as any[]).forEach(processCoordinates);
      }
    } catch (err) {
      console.warn('Error processing coordinates:', coords, err);
    }
  };

  geojson.features.forEach((feature: Feature, index: number) => {
    try {
      if (!feature) {
        console.warn(`Skipping null feature at index ${index}`);
        return;
      }

      if (feature.geometry) {
        const geom = feature.geometry;
        
        // Handle GeometryCollection separately
        if (geom.type === 'GeometryCollection') {
          if (geom.geometries && Array.isArray(geom.geometries)) {
            geom.geometries.forEach((g) => {
              if (g && 'coordinates' in g) {
                processCoordinates((g as any).coordinates);
              }
            });
          }
        } else if ('coordinates' in geom) {
          processCoordinates((geom as any).coordinates);
        }
      }
    } catch (err) {
      console.warn(`Error processing feature at index ${index}:`, err);
    }
  });

  if (pointCount === 0) {
    throw new Error('No valid coordinates found in GeoJSON features');
  }

  const centroidX = totalX / pointCount;
  const centroidY = totalY / pointCount;

  // Validate centroid is finite
  if (!isFinite(centroidX) || !isFinite(centroidY)) {
    throw new Error('Calculated centroid contains invalid coordinates');
  }

  return [centroidX, centroidY];
}

/**
 * Apply scale factor to a single coordinate pair relative to an origin point
 * @param coord - The coordinate pair [x, y] to scale
 * @param origin - The origin point [x, y] to scale from
 * @param scaleFactor - The scale factor to apply
 * @returns The scaled coordinate pair [x, y]
 * @throws Error if inputs are invalid
 */
export function scaleCoordinate(
  coord: [number, number],
  origin: [number, number],
  scaleFactor: number
): [number, number] {
  // Validate inputs
  if (!coord || coord.length !== 2) {
    throw new Error('Coordinate must be an array of two numbers');
  }

  if (!origin || origin.length !== 2) {
    throw new Error('Origin must be an array of two numbers');
  }

  if (typeof scaleFactor !== 'number' || !isFinite(scaleFactor)) {
    throw new Error('Scale factor must be a finite number');
  }

  const [x, y] = coord;
  const [originX, originY] = origin;

  // Validate coordinate values
  if (!isFinite(x) || !isFinite(y)) {
    throw new Error(`Invalid coordinate values: [${x}, ${y}]`);
  }

  if (!isFinite(originX) || !isFinite(originY)) {
    throw new Error(`Invalid origin values: [${originX}, ${originY}]`);
  }

  // Calculate offset from origin
  const dx = x - originX;
  const dy = y - originY;

  // Apply scale factor
  const dxScaled = dx * scaleFactor;
  const dyScaled = dy * scaleFactor;

  // Calculate new position
  const xNew = originX + dxScaled;
  const yNew = originY + dyScaled;

  // Validate result
  if (!isFinite(xNew) || !isFinite(yNew)) {
    throw new Error(`Scale transformation resulted in invalid coordinates: [${xNew}, ${yNew}]`);
  }

  return [xNew, yNew];
}

/**
 * Recursively scale all coordinates in a geometry
 * @param coords - Coordinates to scale (can be nested arrays)
 * @param origin - The origin point to scale from
 * @param scaleFactor - The scale factor to apply
 * @returns Scaled coordinates
 * @throws Error if coordinate transformation fails
 */
function scaleCoordinates(
  coords: Position | Position[] | Position[][] | Position[][][],
  origin: [number, number],
  scaleFactor: number
): any {
  try {
    if (!coords) {
      throw new Error('Coordinates are required');
    }

    if (typeof coords[0] === 'number') {
      // Single coordinate pair
      if (coords.length < 2) {
        throw new Error('Coordinate pair must have at least 2 values');
      }
      return scaleCoordinate(coords as [number, number], origin, scaleFactor);
    } else {
      // Nested array of coordinates
      if (!Array.isArray(coords)) {
        throw new Error('Nested coordinates must be an array');
      }
      return (coords as any[]).map((c, index) => {
        try {
          return scaleCoordinates(c, origin, scaleFactor);
        } catch (err) {
          throw new Error(`Error scaling coordinate at index ${index}: ${err instanceof Error ? err.message : String(err)}`);
        }
      });
    }
  } catch (err) {
    throw new Error(`Coordinate scaling failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Scale a geometry by applying scale factor to all coordinates
 * @param geometry - The geometry to scale
 * @param origin - The origin point to scale from
 * @param scaleFactor - The scale factor to apply
 * @returns Scaled geometry
 * @throws Error if geometry transformation fails
 */
function scaleGeometry(
  geometry: Geometry,
  origin: [number, number],
  scaleFactor: number
): Geometry {
  if (!geometry) {
    throw new Error('Geometry is required');
  }

  if (!geometry.type) {
    throw new Error('Geometry must have a type property');
  }

  try {
    // Handle GeometryCollection
    if (geometry.type === 'GeometryCollection') {
      if (!geometry.geometries || !Array.isArray(geometry.geometries)) {
        throw new Error('GeometryCollection must have a geometries array');
      }

      return {
        ...geometry,
        geometries: geometry.geometries.map((g, index) => {
          try {
            return scaleGeometry(g, origin, scaleFactor);
          } catch (err) {
            throw new Error(`Error scaling geometry at index ${index}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }),
      };
    }

    // Handle other geometry types with coordinates
    if (!('coordinates' in geometry)) {
      // Geometry types without coordinates (shouldn't happen in valid GeoJSON)
      console.warn('Geometry type without coordinates:', (geometry as any).type);
      return geometry;
    }

    const scaledCoordinates = scaleCoordinates(
      (geometry as any).coordinates,
      origin,
      scaleFactor
    );

    return {
      ...geometry,
      coordinates: scaledCoordinates,
    } as Geometry;
  } catch (err) {
    throw new Error(`Failed to scale ${geometry.type} geometry: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Apply scale factor to all geometries in a FeatureCollection
 * Handles all geometry types: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
 * Preserves feature properties and CRS information
 * 
 * @param geojson - The FeatureCollection to transform
 * @param scaleFactor - The scale factor to apply (typically between 0.9 and 1.1)
 * @returns A new FeatureCollection with scaled coordinates
 * @throws Error if transformation fails or inputs are invalid
 */
export function applyScaleFactor(
  geojson: FeatureCollection,
  scaleFactor: number
): FeatureCollection {
  // Validate inputs
  if (!geojson) {
    throw new Error('GeoJSON data is required');
  }

  if (typeof scaleFactor !== 'number' || !isFinite(scaleFactor)) {
    throw new Error('Scale factor must be a finite number');
  }

  if (scaleFactor <= 0) {
    throw new Error('Scale factor must be greater than 0');
  }

  // If scale factor is 1.0, return unchanged (but still validate the GeoJSON)
  if (scaleFactor === 1.0) {
    if (!geojson.features || !Array.isArray(geojson.features)) {
      throw new Error('GeoJSON must contain a features array');
    }
    return geojson;
  }

  try {
    // Calculate centroid as origin point
    const origin = calculateCentroid(geojson);

    // Scale all features
    const scaledFeatures: Feature[] = geojson.features.map((feature: Feature, index: number) => {
      try {
        if (!feature) {
          throw new Error(`Feature at index ${index} is null or undefined`);
        }

        if (!feature.geometry) {
          // Feature without geometry - return as is
          return feature;
        }

        const scaledGeometry = scaleGeometry(feature.geometry, origin, scaleFactor);

        return {
          ...feature,
          geometry: scaledGeometry,
        };
      } catch (err) {
        throw new Error(`Error scaling feature at index ${index}: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    // Preserve CRS information if present
    const scaledGeoJSON: FeatureCollection = {
      type: 'FeatureCollection',
      features: scaledFeatures,
    };

    // Preserve CRS if it exists in the original
    if ('crs' in geojson) {
      (scaledGeoJSON as any).crs = geojson.crs;
    }

    return scaledGeoJSON;
  } catch (err) {
    throw new Error(`Scale factor transformation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
