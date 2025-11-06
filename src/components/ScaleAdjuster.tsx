import React, { useState, useCallback, useEffect, useRef } from 'react';
import { applyScaleFactor as applyScaleFactorAPI } from '../api/axios';
import { useMessages } from '../contexts/MessageContext';

interface ScaleAdjusterProps {
  jobId: string;
  originalJobId?: string; // The original unscaled job ID for reset operations
  filename: string; // Original filename for user messages
  currentCrs: string;
  onScaleApplied: (newJobId: string) => void;
  onScalePreview: (scaleFactor: number) => void;
  onDownloadOriginal: () => void;
  isApplying: boolean;
  appliedScaleFactor?: number; // The currently applied scale factor (if any)
}

const ScaleAdjuster: React.FC<ScaleAdjusterProps> = ({
  jobId,
  originalJobId,
  filename,
  currentCrs,
  onScaleApplied,
  onScalePreview,
  onDownloadOriginal,
  isApplying,
  appliedScaleFactor,
}) => {
  const [scaleFactor, setScaleFactor] = useState<string>('1.0');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { addMessage } = useMessages();

  // Helper function to show success message using global message system
  const showSuccessMessage = useCallback((message: string) => {
    addMessage(message, 'success', 8000);
    setError(null); // Clear any local errors
  }, [addMessage]);

  // Validate scale factor with comprehensive error messages
  const validateScaleFactor = useCallback((value: string): boolean => {
    // Allow empty or incomplete input during typing
    if (!value || value.trim() === '') {
      setError(null); // Don't show error for empty input during typing
      return false;
    }

    // Allow partial input like "1." or "0." during typing
    if (value === '.' || value === '0.' || value === '1.') {
      setError(null);
      return false;
    }

    // Check for basic numeric format (allow partial input)
    if (!/^-?\d*\.?\d*$/.test(value.trim())) {
      setError('Scale factor must contain only numbers and decimal points');
      return false;
    }

    const numValue = parseFloat(value);
    
    // Allow NaN for incomplete input during typing
    if (isNaN(numValue)) {
      setError(null); // Don't show error for incomplete input
      return false;
    }

    if (!isFinite(numValue)) {
      setError('Scale factor must be a finite number');
      return false;
    }

    if (numValue <= 0) {
      setError('Scale factor must be greater than 0');
      return false;
    }

    if (numValue < 0.9) {
      setError('Scale factor must be at least 0.9 (minimum allowed value)');
      return false;
    }

    if (numValue > 1.1) {
      setError('Scale factor must be at most 1.1 (maximum allowed value)');
      return false;
    }

    // Check for excessive precision (more than 6 decimal places)
    const decimalPart = value.split('.')[1];
    if (decimalPart && decimalPart.length > 6) {
      setError('Scale factor precision limited to 6 decimal places');
      return false;
    }

    setError(null);
    return true;
  }, []);

  // Handle scale factor input change with debouncing and error handling
  const handleScaleChange = useCallback((value: string) => {
    // Always update the display value immediately
    setScaleFactor(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Validate the input
    const isValid = validateScaleFactor(value);
    
    // Only trigger preview for valid complete numbers
    if (isValid) {
      debounceTimerRef.current = setTimeout(() => {
        try {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            onScalePreview(numValue);
          }
        } catch (err: any) {
          console.error('Preview update error:', err);
          setError('Failed to update preview. Please try entering the scale factor again.');
        }
      }, 300);
    } else {
      // For incomplete but potentially valid input, still clear any previous error after a delay
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && isFinite(numValue) && numValue > 0) {
        debounceTimerRef.current = setTimeout(() => {
          try {
            onScalePreview(numValue);
          } catch (err: any) {
            console.error('Preview update error:', err);
          }
        }, 500); // Longer delay for incomplete input
      }
    }
  }, [validateScaleFactor, onScalePreview]);

  // Handle apply button click with comprehensive error handling
  const handleApply = useCallback(async () => {
    if (!validateScaleFactor(scaleFactor)) {
      return;
    }

    const numValue = parseFloat(scaleFactor);
    
    try {
      setError(null); // Clear any previous errors
      
      // Additional validation before API call
      if (!jobId || jobId.trim() === '') {
        throw new Error('Invalid job ID. Please refresh and try again.');
      }

      // Call API to apply scale factor using the API client method
      const response = await applyScaleFactorAPI(jobId, numValue);
      
      if (!response || !response.job_id) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Show success message
      const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      showSuccessMessage(`✓ "${baseFilename}" scaled to ${numValue.toFixed(6)} - new file ready for download`);

      onScaleApplied(response.job_id);
    } catch (err: any) {
      console.error('Scale factor application error:', err);
      
      // Provide user-friendly error messages based on error type
      let errorMessage = 'Failed to apply scale factor';
      
      if (err.message) {
        if (err.message.includes('Job not found')) {
          errorMessage = 'Original conversion job not found. Please refresh and try again.';
        } else if (err.message.includes('not completed')) {
          errorMessage = 'Original conversion is not complete. Please wait for it to finish.';
        } else if (err.message.includes('output file not found')) {
          errorMessage = 'Original conversion file is missing. Please convert your file again.';
        } else if (err.message.includes('connection')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  }, [scaleFactor, jobId, validateScaleFactor, onScaleApplied, filename, showSuccessMessage]);

  // Handle reset button click
  const handleReset = useCallback(async () => {
    try {
      setScaleFactor('1.0');
      setError(null);
      onScalePreview(1.0);
      
      // Use the original job ID for reset to ensure we get back to the true original scale
      // If no originalJobId is provided, fall back to current jobId (for original jobs)
      const targetJobId = originalJobId || jobId;
      
      // Apply scale factor 1.0 to the original job to create a new job with true 1.0 scale
      // This ensures that when user clicks download after reset, they get the original file with scale factor 1.0 applied
      const response = await applyScaleFactorAPI(targetJobId, 1.0);
      
      if (!response || !response.job_id) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Show success message
      const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
      showSuccessMessage(`✓ "${baseFilename}" reset to original scale (1.000000) - new file ready for download`);

      onScaleApplied(response.job_id);
    } catch (err: any) {
      console.error('Reset to scale factor 1.0 failed:', err);
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to reset to original scale';
      
      if (err.message) {
        if (err.message.includes('Job not found')) {
          errorMessage = 'Original conversion job not found. Please refresh and try again.';
        } else if (err.message.includes('not completed')) {
          errorMessage = 'Original conversion is not complete. Please wait for it to finish.';
        } else if (err.message.includes('output file not found')) {
          errorMessage = 'Original conversion file is missing. Please convert your file again.';
        } else if (err.message.includes('connection')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  }, [jobId, originalJobId, onScalePreview, onScaleApplied, filename, showSuccessMessage]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Check validity without triggering state updates
  const currentScaleValue = parseFloat(scaleFactor);
  const isValidNumber = !isNaN(currentScaleValue) && currentScaleValue >= 0.9 && currentScaleValue <= 1.1;
  const isApplyDisabled = !isValidNumber || currentScaleValue === 1.0 || isApplying || error !== null;
  
  // Use appliedScaleFactor to determine if scale has been applied, not the input value
  // Only consider it "scaled" if the applied scale factor exists AND is significantly different from 1.0
  const isScaled = appliedScaleFactor !== undefined && 
                   appliedScaleFactor !== null && 
                   Math.abs(appliedScaleFactor - 1.0) > 0.000001; // Use epsilon comparison for floating point
  const displayScaleFactor = appliedScaleFactor || 1.0;
  
  // Track previous scaled state for animation, but only after initial mount
  const [prevIsScaled, setPrevIsScaled] = React.useState(isScaled);
  const [isInitialMount, setIsInitialMount] = React.useState(true);
  const shouldAnimateStatus = !isInitialMount && prevIsScaled !== isScaled;
  
  React.useEffect(() => {
    // Mark as no longer initial mount after first render
    if (isInitialMount) {
      setIsInitialMount(false);
    }
    
    if (prevIsScaled !== isScaled) {
      setPrevIsScaled(isScaled);
    }
  }, [isScaled, prevIsScaled, isInitialMount]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 scale-adjuster-enter scale-adjuster-mobile">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Scale Factor Adjustment</h3>
            <p className="text-sm text-gray-600">
              Apply surface-to-grid scale correction
            </p>
          </div>
        </div>

        {/* Visual Status Indicator */}
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium status-indicator ${
          isScaled 
            ? 'scaled bg-blue-100 text-blue-800' 
            : 'original bg-gray-100 text-gray-800'
        } ${shouldAnimateStatus ? 'status-indicator-change' : ''}`}>
          {isScaled ? `Scaled (${displayScaleFactor.toFixed(6)})` : 'Original (1.0)'}
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scale Factor Input */}
        <div className="space-y-2">
          <label htmlFor="scale-factor" className="flex items-center text-sm font-medium text-gray-700">
            Scale Factor
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Help information"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </label>
          
          <input
            id="scale-factor"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={scaleFactor}
            onChange={(e) => handleScaleChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 scale-input ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500 error' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="1.0"
            disabled={isApplying}
            aria-describedby={error ? 'scale-factor-error' : undefined}
            autoComplete="off"
          />

          {error && (
            <p id="scale-factor-error" className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-end space-x-2 scale-btn-group">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplyDisabled}
            className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isApplyDisabled
                ? 'bg-gray-300 cursor-not-allowed opacity-50'
                : 'scale-btn-primary btn-hover-lift'
            }`}
          >
            {isApplying ? (
              <>
                <div className="scale-loading-spinner mr-2"></div>
                Applying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 scale-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply Scale Factor
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isApplying}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white scale-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Reset to 1.0"
            title="Reset to original scale (1.0)"
          >
            {isApplying ? (
              <div className="scale-loading-spinner"></div>
            ) : (
              <svg className="w-4 h-4 scale-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onDownloadOriginal}
            disabled={isApplying}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white scale-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download"
            aria-label="Download original unscaled version"
          >
            <svg className="w-4 h-4 scale-btn-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Help Tooltip */}
      {showHelp && (
        <div className="mt-4 p-4 rounded-md help-tooltip-enhanced">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">About Scale Factors</h4>
              <div className="mt-2 text-sm text-blue-800 space-y-2">
                <p>
                  Scale factors correct for distortions when projecting curved earth measurements 
                  onto flat coordinate systems. This is essential for accurate surveying work.
                </p>
                <p>
                  <strong>Typical values:</strong> Most scale factors range from 0.9999 to 1.0004
                </p>
                <p>
                  <strong>Example:</strong> A scale factor of 1.00013 means coordinates will be 
                  scaled by 0.013% relative to the geometric center of your data.
                </p>
                <p>
                  <strong>Usage:</strong> Enter your scale factor, preview the adjustment on the map, 
                  then click "Apply Scale Factor" to create a new downloadable file with corrected coordinates.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ScaleAdjuster;
