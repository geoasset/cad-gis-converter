import React, { useState } from 'react';
import { CrsCategory, getCurrentCRSList, commonCRS, statePlane2DCRS, statePlane3DCRS } from './crsOptions';

interface ConversionOptionsProps {
  targetCrs: string;
  outputFormat: string;
  onTargetCrsChange: (crs: string) => void;
  onOutputFormatChange: (format: string) => void;
}

const ConversionOptions: React.FC<ConversionOptionsProps> = ({
  targetCrs,
  outputFormat,
  onTargetCrsChange,
  onOutputFormatChange,
}) => {
  const [crsCategory, setCrsCategory] = useState<CrsCategory>('state-plane-2d');

  const currentCRSList = getCurrentCRSList(crsCategory);

  const outputFormats = [
    { value: 'geojson', label: 'GeoJSON (.json)', description: 'Web-friendly, lightweight' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Conversion Settings</h3>
      
      {/* Coordinate Reference System */}
      <div>
        <label htmlFor="target-crs" className="block text-sm font-medium text-gray-700 mb-2">
          Target Coordinate System
        </label>
        
        {/* CRS Category Tabs */}
        <div className="flex space-x-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setCrsCategory('common');
              if (!commonCRS.find(c => c.value === targetCrs)) {
                onTargetCrsChange('EPSG:4326');
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              crsCategory === 'common'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Common CRS
          </button>
          <button
            type="button"
            onClick={() => {
              setCrsCategory('state-plane-2d');
              if (!statePlane2DCRS.find(c => c.value === targetCrs)) {
                onTargetCrsChange('EPSG:2222');
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              crsCategory === 'state-plane-2d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            State Plane (2D)
          </button>
          <button
            type="button"
            onClick={() => {
              setCrsCategory('state-plane-3d');
              if (!statePlane3DCRS.find(c => c.value === targetCrs)) {
                onTargetCrsChange('EPSG:8712');
              }
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              crsCategory === 'state-plane-3d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            State Plane (3D)
          </button>
        </div>

        <select
          id="target-crs"
          value={targetCrs}
          onChange={(e) => onTargetCrsChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {currentCRSList.map((crs) => (
            <option key={crs.value} value={crs.value}>
              {crs.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {crsCategory === 'common' 
            ? 'Select a common coordinate system for your output data'
            : crsCategory === 'state-plane-2d'
            ? 'Select a 2D US State Plane coordinate system (NAD83 datum, no height component)'
            : 'Select a 3D US State Plane coordinate system (NAD83 datum with NAVD88 height)'}
        </p>
      </div>

      {/* Output Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Output Format
        </label>
        <div className="space-y-3">
          {outputFormats.map((format) => (
            <div key={format.value} className="flex items-start">
              <input
                id={format.value}
                name="output-format"
                type="radio"
                value={format.value}
                checked={outputFormat === format.value}
                onChange={(e) => onOutputFormatChange(e.target.value)}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3">
                <label htmlFor={format.value} className="text-sm font-medium text-gray-700">
                  {format.label}
                </label>
                <p className="text-xs text-gray-500">{format.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {crsCategory === 'common' ? 'Coordinate System Detection' : 'State Plane Projections'}
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              {crsCategory === 'common' ? (
                <p>
                  The tool will attempt to detect the source coordinate system from your DXF file. 
                  If detection fails, Web Mercator (EPSG:3857) will be used as default.
                </p>
              ) : crsCategory === 'state-plane-2d' ? (
                <p>
                  2D State Plane coordinate systems (NAD83 datum) are optimized for specific US states and zones. 
                  These systems provide accurate horizontal positioning without elevation data.
                </p>
              ) : (
                <p>
                  3D State Plane coordinate systems (NAD83 datum with NAVD88 height) include both horizontal and vertical positioning. 
                  Select the appropriate zone for your project area to ensure accurate measurements.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionOptions;
