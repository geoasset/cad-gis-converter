import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject, FeatureCollection } from 'geojson';
import { getEpsgDisplayName } from './crsOptions';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom styles for Leaflet controls to prevent overlap
const customMapStyles = `
  .leaflet-top.leaflet-left {
    top: 70px !important;
    left: 16px !important;
  }
  .leaflet-control-attribution {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(4px) !important;
    font-size: 10px !important;
  }
  .leaflet-popup-content-wrapper {
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
  .leaflet-popup-tip {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customMapStyles;
  document.head.appendChild(styleElement);
}

interface MapViewerProps {
  data: GeoJsonObject;
  targetCrs?: string;
  scaleFactor?: number;
  isTransforming?: boolean;
  isScaleApplied?: boolean; // True when scale factor has been applied via backend, false for preview
  appliedScaleFactor?: number; // The actually applied scale factor from backend
}

interface FitBoundsProps {
  data: GeoJsonObject;
  preserveView: boolean;
  onViewChange?: (center: [number, number], zoom: number) => void;
}

// Component to fit map bounds to data
const FitBounds: React.FC<FitBoundsProps> = ({ data, preserveView, onViewChange }) => {
  const map = useMap();

  useEffect(() => {
    if (data && 'features' in data && Array.isArray((data as FeatureCollection).features) && (data as FeatureCollection).features.length > 0) {
      const geoJsonLayer = L.geoJSON(data as GeoJsonObject);
      const bounds = geoJsonLayer.getBounds();

      if (bounds.isValid() && !preserveView) {
        map.fitBounds(bounds, { padding: [20, 20] });
        
        // Save the view after fitting bounds
        if (onViewChange) {
          const center = map.getCenter();
          const zoom = map.getZoom();
          onViewChange([center.lat, center.lng], zoom);
        }
      }
    }
  }, [data, map, preserveView, onViewChange]);

  return null;
};

// Custom zoom control component using Leaflet's control system
const ZoomControls: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Create a custom Leaflet control
    const ZoomControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.style.cssText = 'background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;';
        
        // Zoom in button
        const zoomInBtn = L.DomUtil.create('button', '', container);
        zoomInBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>';
        zoomInBtn.style.cssText = 'width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; background: white; cursor: pointer; color: #374151; border-bottom: 1px solid #e5e7eb; border-radius: 0.5rem 0.5rem 0 0;';
        zoomInBtn.setAttribute('type', 'button');
        zoomInBtn.setAttribute('aria-label', 'Zoom in');
        zoomInBtn.onmouseover = () => zoomInBtn.style.background = '#f9fafb';
        zoomInBtn.onmouseout = () => zoomInBtn.style.background = 'white';
        
        // Zoom out button
        const zoomOutBtn = L.DomUtil.create('button', '', container);
        zoomOutBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" /></svg>';
        zoomOutBtn.style.cssText = 'width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; background: white; cursor: pointer; color: #374151; border-radius: 0 0 0.5rem 0.5rem;';
        zoomOutBtn.setAttribute('type', 'button');
        zoomOutBtn.setAttribute('aria-label', 'Zoom out');
        zoomOutBtn.onmouseover = () => zoomOutBtn.style.background = '#f9fafb';
        zoomOutBtn.onmouseout = () => zoomOutBtn.style.background = 'white';
        
        // Event handlers
        L.DomEvent.on(zoomInBtn, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          map.zoomIn();
        });
        
        L.DomEvent.on(zoomOutBtn, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          map.zoomOut();
        });
        
        // Prevent map interactions on the control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        
        return container;
      }
    });

    // Add control to map at topleft position
    const control = new ZoomControl({ position: 'topleft' });
    control.addTo(map);

    // Cleanup
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
};

// Tile layer configurations
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartodb_positron: {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartodb_voyager: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  cartodb_dark: {
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
} as const;

type TileLayerKey = keyof typeof TILE_LAYERS;

// MapViewer always displays data in WGS84 (EPSG:4326) for optimal web mapping compatibility
// The targetCrs parameter indicates the coordinate system of the downloadable file
const MapViewer: React.FC<MapViewerProps> = ({ data, targetCrs = 'EPSG:4326', scaleFactor = 1.0, isTransforming = false, isScaleApplied = false, appliedScaleFactor }) => {
  const [layerStats, setLayerStats] = useState<Record<string, number>>({});
  const [dataKey, setDataKey] = useState<number>(0);
  const [selectedTileLayer, setSelectedTileLayer] = useState<TileLayerKey>('cartodb_positron');
  const [isControlsExpanded, setIsControlsExpanded] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    // Force re-render of GeoJSON layer when data changes
    setDataKey(prev => prev + 1);

    if (data && 'features' in data && Array.isArray((data as FeatureCollection).features)) {
      // Calculate layer statistics
      const stats: Record<string, number> = {};
      (data as FeatureCollection).features.forEach((feature: any) => {
        const layer = feature.properties?.layer || 'default';
        stats[layer] = (stats[layer] || 0) + 1;
      });
      setLayerStats(stats);
    }
  }, [data, targetCrs]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleViewChange = (center: [number, number], zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  // Only show "Scaled Preview" when scale factor has been actually applied (not just during preview typing)
  const isScaled = appliedScaleFactor !== undefined && 
                   appliedScaleFactor !== null && 
                   Math.abs(appliedScaleFactor - 1.0) > 0.000001; // Use epsilon comparison for floating point
  const displayScaleFactor = appliedScaleFactor || 1.0;
  const scaleIndicatorText = isScaled ? `Scaled Preview (${displayScaleFactor.toFixed(5)})` : 'Original (1.0)';
  const scaleIndicatorColor = isScaled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200';

  const getFeatureStyle = (feature: any) => {
    const layer = feature.properties?.layer || 'default';

    // Modern color palette with better contrast
    const colorPalette = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6366F1', // Indigo
    ];

    const layerHash = layer.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const colorIndex = layerHash % colorPalette.length;
    const color = colorPalette[colorIndex];

    const baseStyle = {
      color: color,
      weight: 2.5,
      opacity: 0.9,
      fillOpacity: 0.4,
      fillColor: color,
    };

    // Adjust style based on geometry type
    if (feature.geometry.type === 'Point') {
      return {
        ...baseStyle,
        radius: 6,
        weight: 2,
      };
    }

    return baseStyle;
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const props = feature.properties;
      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.4; color: #374151;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #E5E7EB;">
            Feature Details
          </div>
          <div style="display: grid; gap: 4px;">
            <div><span style="color: #6B7280; font-weight: 500;">Layer:</span> <span style="color: #111827;">${props.layer || 'Unknown'}</span></div>
            <div><span style="color: #6B7280; font-weight: 500;">Type:</span> <span style="color: #111827;">${props.entity_type || 'Unknown'}</span></div>
            <div><span style="color: #6B7280; font-weight: 500;">Geometry:</span> <span style="color: #111827;">${feature.geometry.type}</span></div>
            ${props.color ? `<div><span style="color: #6B7280; font-weight: 500;">Color:</span> <span style="color: #111827;">${props.color}</span></div>` : ''}
          </div>
        </div>
      `;
      layer.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'custom-popup'
      });
    }
  };

  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const style = getFeatureStyle(feature);
    return L.circleMarker(latlng, style);
  };

  if (!data || !('features' in data) || !Array.isArray((data as FeatureCollection).features) || (data as FeatureCollection).features.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Map Data Available</h3>
          <p className="text-gray-500 text-sm">Upload a file to see the conversion preview</p>
        </div>
      </div>
    );
  }

  const totalFeatures = 'features' in data && Array.isArray((data as FeatureCollection).features) ? (data as FeatureCollection).features.length : 0;

  const toggleFullscreen = () => {
    const mapContainer = document.querySelector('.map-viewer-container') as HTMLElement;
    if (!mapContainer) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
      } else if ((mapContainer as any).webkitRequestFullscreen) {
        (mapContainer as any).webkitRequestFullscreen();
      } else if ((mapContainer as any).msRequestFullscreen) {
        (mapContainer as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  return (
    <div className="h-full relative map-viewer-container">
      <MapContainer
        center={mapCenter || [39.8283, -98.5795]} // Center of US as default
        zoom={mapZoom || 10}
        maxZoom={25} // Allow much deeper zoom for detailed CAD inspection
        style={{ height: '100%', width: '100%' }}
        className="z-0 rounded-lg overflow-hidden"
        zoomControl={false}
      >
        <TileLayer
          url={TILE_LAYERS[selectedTileLayer].url}
          attribution={TILE_LAYERS[selectedTileLayer].attribution}
          maxNativeZoom={18}
          maxZoom={25}
        />

        <GeoJSON
          key={dataKey}
          data={data}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
          pointToLayer={pointToLayer}
        />

        <FitBounds 
          data={data} 
          preserveView={mapCenter !== null && mapZoom !== null}
          onViewChange={handleViewChange}
        />
        <ZoomControls />
      </MapContainer>

      {/* Header Bar with CRS Info and Controls Toggle */}
      <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-95 map-header-bar border-b border-gray-200 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-semibold text-gray-900">Conversion Preview</span>
            </div>
            {/* Scale Factor Indicator */}
            <div className={`px-2.5 py-1 rounded-md border text-xs font-medium ${scaleIndicatorColor}`}>
              <span>{scaleIndicatorText}</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-all btn-hover-lift"
            aria-label="Toggle map controls"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading Indicator during scale transformations */}
      {isTransforming && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <div className="text-sm font-medium text-gray-900">Applying scale transformation...</div>
            <div className="text-xs text-gray-500">Please wait</div>
          </div>
        </div>
      )}

      {/* Expandable Controls Panel */}
      {isControlsExpanded && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-72 map-controls-panel fade-in">
          {/* Base Layer Selector */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Base Layer
            </h4>
            <select 
              value={selectedTileLayer}
              onChange={(e) => setSelectedTileLayer(e.target.value as TileLayerKey)}
              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Select base map layer"
            >
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <option key={key} value={key}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layer Statistics */}
          <div className="p-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Layer Summary
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {Object.entries(layerStats).map(([layer, count]) => (
                <div key={layer} className="flex items-center justify-between p-2 bg-gray-50 rounded-md layer-stat-item">
                  <span className="text-sm text-gray-700 truncate mr-2">{layer}</span>
                  <span className="text-sm font-semibold text-gray-900 bg-white px-2 py-1 rounded">{count}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                <span className="text-sm font-medium text-blue-900">Total Features</span>
                <span className="text-sm font-bold text-blue-900">{totalFeatures}</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Fullscreen Toggle Button */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute bottom-8 right-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-md p-2 shadow-sm transition-all duration-200 z-20 group"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        )}
      </button>

      {/* Help Text */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 help-tooltip px-3 py-2 rounded-lg shadow-sm border border-gray-200 z-10">
        <p className="text-xs text-gray-600 flex items-center">
          <svg className="w-3 h-3 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Click features for details • Colors represent different layers
        </p>
      </div>
    </div>
  );
};

export default MapViewer;
