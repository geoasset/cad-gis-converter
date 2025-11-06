import React, { useState } from 'react';
import { commonCRS, statePlane2DCRS, getEpsgDisplayName } from './crsOptions';

export interface ProjectionChangerProps {
  currentCrs: string;
  onReproject: (newCrs: string) => void;
  isReprojecting: boolean;
}

const ProjectionChanger: React.FC<ProjectionChangerProps> = ({
  currentCrs,
  onReproject,
  isReprojecting,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCrs, setSelectedCrs] = useState(currentCrs);
  const [crsCategory, setCrsCategory] = useState<'common' | 'state-plane'>('common');

  const currentCRSList = crsCategory === 'common' ? commonCRS : statePlane2DCRS;

  const handleReproject = () => {
    if (selectedCrs !== currentCrs) {
      onReproject(selectedCrs);
      setIsOpen(false);
    }
  };



  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-medium text-gray-900">Current Projection</div>
            <div className="text-xs text-gray-600">{getEpsgDisplayName(currentCrs)}</div>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isReprojecting}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReprojecting ? 'Reprojecting...' : 'Change Projection'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* CRS Category Tabs */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setCrsCategory('common')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  crsCategory === 'common'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Common CRS
              </button>
              <button
                type="button"
                onClick={() => setCrsCategory('state-plane')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  crsCategory === 'state-plane'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                US State Plane
              </button>
            </div>

            {/* CRS Selector */}
            <label
              htmlFor="projection-select"
              className="block text-xs font-medium text-gray-700"
            >
              Select target coordinate reference system
            </label>
            <select
              id="projection-select"
              value={selectedCrs}
              onChange={(e) => setSelectedCrs(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {currentCRSList.map((crs) => (
                <option key={crs.value} value={crs.value}>
                  {getEpsgDisplayName(crs.value)}
                </option>
              ))}
            </select>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReproject}
                disabled={selectedCrs === currentCrs}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Projection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectionChanger;
