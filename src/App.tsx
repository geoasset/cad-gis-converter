import { useState, useCallback, useRef, useEffect } from 'react';
import api from './api/axios';
import type { FeatureCollection } from 'geojson';
import MapViewer from './components/MapViewer';
import ProgressIndicator from './components/ProgressIndicator';
import FileUploadZone from './components/FileUploadZone';
import ConversionOptions from './components/ConversionOptions';
import ProjectionChanger from './components/ProjectionChanger';
import ScaleAdjuster from './components/ScaleAdjuster';
import GlobalMessages from './components/GlobalMessages';
import { MessageProvider } from './contexts/MessageContext';
import { applyScaleFactor } from './utils/scaleTransform';
import { getEpsgDisplayName } from './components/crsOptions';
import './App.css';

interface Job {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  filename: string;
  output_format: string;
  target_crs?: string;
  scale_factor?: number;  // Scale factor applied (null/undefined for original conversions)
  parent_job_id?: string; // Reference to original job (null/undefined for original conversions)
}

function App() {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [conversionResult, setConversionResult] = useState<FeatureCollection | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReprojecting, setIsReprojecting] = useState(false);

  // Conversion options
  const [targetCrs, setTargetCrs] = useState('EPSG:4326');
  const [outputFormat, setOutputFormat] = useState('geojson');

  // Scale factor state
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [scaledPreviewData, setScaledPreviewData] = useState<FeatureCollection | null>(null);
  const [isApplyingScale, setIsApplyingScale] = useState<boolean>(false);
  const [isTransformingPreview, setIsTransformingPreview] = useState<boolean>(false);
  const [originalConversionResult, setOriginalConversionResult] = useState<FeatureCollection | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversionResult = useCallback(async (jobId: string, job?: Job) => {
    try {
      // Use separate preview endpoint for GeoJSON preview, always request WGS84 for map display
      const response = await api.get(`/api/preview/${jobId}`, {
        params: {
          preview_crs: 'EPSG:4326' // Always request WGS84 for map preview
        }
      });
      setConversionResult(response.data);
      
      // Handle scale factor based on job type
      if (job?.scale_factor && job.scale_factor !== 1.0) {
        // This is a scaled conversion - set the scale factor and mark as scaled
        setScaleFactor(job.scale_factor);
        setScaledPreviewData(response.data);
        // Don't update originalConversionResult for scaled jobs
      } else {
        // This is an original conversion - store as original and reset scale state
        setOriginalConversionResult(response.data);
        setScaleFactor(1.0);
        setScaledPreviewData(null);
      }
    } catch (err) {
      console.warn('Could not fetch result for preview:', err);
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    const checkStatus = async () => {
      try {
        const response = await api.get(`/api/job/${jobId}`);
        const job: Job = response.data;
        
        setCurrentJob(job);

        if (job.status === 'completed') {
          setIsPolling(false);
          setIsReprojecting(false);
          setIsApplyingScale(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Fetch the result for preview, passing job data for scale factor handling
          await fetchConversionResult(jobId, job);
        } else if (job.status === 'failed') {
          setIsPolling(false);
          setIsReprojecting(false);
          setIsApplyingScale(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError(job.message || 'Conversion failed');
        }
      } catch (err: any) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError(err.response?.data?.detail || 'Failed to check job status');
      }
    };

    // Initial check
    await checkStatus();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(checkStatus, 2000); // Poll every 2 seconds
  }, [fetchConversionResult]);

  const uploadAndConvert = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_crs', targetCrs);
      formData.append('output_format', outputFormat);

      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const jobId = response.data.job_id;
      
      // Start polling for job status
      setIsPolling(true);
      pollJobStatus(jobId);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    }
  }, [targetCrs, outputFormat, pollJobStatus]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      setError('Please upload a DXF file');
      return;
    }

    setError(null);
    await uploadAndConvert(file);
  }, [uploadAndConvert]);

  const downloadResult = async () => {
    console.log('Download button clicked!', currentJob);
    
    if (!currentJob?.job_id) {
      console.error('No job ID found!', currentJob);
      setError('Unable to download: Job ID is missing');
      return;
    }

    try {
      console.log('Starting download for job:', currentJob.job_id);
      
      const response = await api.get(`/api/download/${currentJob.job_id}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/json, application/zip, */*'
        }
      });

      console.log('Download response received:', response.status, response.headers);
      console.log('Blob size:', response.data.size, 'bytes');

      // Get filename from response header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `converted_${currentJob.filename}.${currentJob.output_format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      console.log('Downloading as:', filename);

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated successfully');
    } catch (err: any) {
      console.error('Download error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.detail || 'Download failed. Please try again.');
    }
  };

  const resetConversion = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setCurrentJob(null);
    setConversionResult(null);
    setOriginalConversionResult(null);
    setScaledPreviewData(null);
    setScaleFactor(1.0);
    setError(null);
    setIsPolling(false);
    setIsReprojecting(false);
    setIsApplyingScale(false);
    setIsTransformingPreview(false);
  };

  // Handle scale factor preview updates with error handling
  const handleScalePreview = useCallback((factor: number) => {
    try {
      if (!originalConversionResult) {
        console.warn('No original conversion result available for preview');
        return;
      }

      // Validate scale factor
      if (typeof factor !== 'number' || !isFinite(factor)) {
        console.error('Invalid scale factor for preview:', factor);
        setError('Invalid scale factor value');
        return;
      }

      // Show loading indicator for preview transformation
      setIsTransformingPreview(true);
      
      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(() => {
        try {
          setScaleFactor(factor);
          
          if (factor === 1.0) {
            // Reset to original when scale factor is 1.0
            setScaledPreviewData(null);
            setConversionResult(originalConversionResult);
          } else {
            // Apply scale factor transformation for preview
            const scaled = applyScaleFactor(originalConversionResult, factor);
            setScaledPreviewData(scaled);
            setConversionResult(scaled);
          }
        } catch (err: any) {
          console.error('Scale preview error:', err);
          
          // Provide user-friendly error message
          let errorMessage = 'Failed to update scale preview';
          if (err.message) {
            if (err.message.includes('No valid coordinates')) {
              errorMessage = 'Unable to preview: No valid coordinates found in the data';
            } else if (err.message.includes('Scale factor')) {
              errorMessage = 'Invalid scale factor value';
            } else {
              errorMessage = `Preview error: ${err.message}`;
            }
          }
          
          setError(errorMessage);
          
          // Reset to original data on error
          setScaleFactor(1.0);
          setScaledPreviewData(null);
          setConversionResult(originalConversionResult);
        } finally {
          setIsTransformingPreview(false);
        }
      }, 50); // Small delay to show loading indicator
    } catch (err: any) {
      console.error('Scale preview error:', err);
      setError('Failed to update scale preview');
      setIsTransformingPreview(false);
    }
  }, [originalConversionResult]);

  // Handle scale factor application (creates new job) with error handling
  const handleScaleApplied = useCallback(async (newJobId: string) => {
    try {
      // Validate job ID
      if (!newJobId || typeof newJobId !== 'string' || newJobId.trim() === '') {
        throw new Error('Invalid job ID received from server');
      }

      setIsApplyingScale(true);
      setError(null);
      
      // Start polling for the new scaled conversion job
      setIsPolling(true);
      pollJobStatus(newJobId);
    } catch (err: any) {
      console.error('Scale application error:', err);
      setError(err.message || 'Failed to start scale factor application');
      setIsApplyingScale(false);
      setIsPolling(false);
    }
  }, [pollJobStatus]);

  // Handle download of original unscaled version with comprehensive error handling
  const handleDownloadOriginal = useCallback(async () => {
    if (!currentJob?.job_id) {
      setError('Unable to download: Job ID is missing');
      return;
    }

    try {
      setError(null); // Clear any previous errors

      const response = await api.get(`/api/download/${currentJob.job_id}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/json, application/zip, */*'
        },
        timeout: 30000 // 30 second timeout for downloads
      });

      // Validate response
      if (!response.data || response.data.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Get filename from response header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `converted_${currentJob.filename}.${currentJob.output_format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Validate filename
      if (!filename || filename.trim() === '') {
        filename = `download_${Date.now()}.${currentJob.output_format}`;
      }

      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err: any) {
      console.error('Download error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Download failed. Please try again.';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'File not found. The conversion may have expired.';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error during download. Please try again later.';
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Download timed out. Please check your connection and try again.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  }, [currentJob]);

  const handleReproject = useCallback(async (newCrs: string) => {
    if (!currentJob?.job_id) return;

    try {
      setIsReprojecting(true);
      setError(null);

      const response = await api.post(`/api/reproject/${currentJob.job_id}`, null, {
        params: {
          target_crs: newCrs,
          output_format: currentJob.output_format
        }
      });

      const newJobId = response.data.job_id;
      
      // Start polling for the new job
      setIsPolling(true);
      pollJobStatus(newJobId);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reprojection failed');
      setIsReprojecting(false);
    }
  }, [currentJob, pollJobStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <MessageProvider>
      <div className="min-h-screen bg-gray-50">
        <GlobalMessages />
        <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            CAD to GIS Converter
          </h1>
          <p className="text-gray-600">
            Convert DXF files to GeoJSON format
          </p>
        </header>

        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {!currentJob && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
              {/* Left Column - Conversion Options */}
              <div className="space-y-6 overflow-y-auto">
                <ConversionOptions
                  targetCrs={targetCrs}
                  outputFormat={outputFormat}
                  onTargetCrsChange={setTargetCrs}
                  onOutputFormatChange={setOutputFormat}
                />

                {/* Collapsible Features Section */}
                <details className="bg-white rounded-lg shadow">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    View Supported Features & Workflow
                  </summary>
                  <div className="p-6 pt-2 border-t">
                    <h3 className="text-lg font-semibold mb-4">Supported Features</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• DXF file input</li>
                      <li>• Layer-based organization</li>
                      <li>• Coordinate system transformation</li>
                      <li>• US State Plane projections (NAD83)</li>
                      <li>• GeoJSON output</li>
                      <li>• Support for lines, polylines, points, circles, and arcs</li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6 mb-4">Workflow</h3>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li>1. Select output format and coordinate system</li>
                      <li>2. Choose State Plane zone if applicable</li>
                      <li>3. Upload your DXF file</li>
                      <li>4. Preview the converted data on the map</li>
                      <li>5. Download the GIS-ready file</li>
                    </ol>
                  </div>
                </details>
              </div>

              {/* Right Column - File Upload Zone */}
              <div className="bg-white rounded-lg shadow flex items-center justify-center p-6">
                <FileUploadZone onDrop={onDrop} />
              </div>
            </div>
          )}

          {currentJob && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
              {/* Left Column - Controls (Half Width) */}
              <div className="space-y-6 overflow-y-auto">
                <ProgressIndicator 
                  job={currentJob} 
                  isPolling={isPolling}
                  onReset={resetConversion}
                  onDownload={downloadResult}
                />

                {conversionResult && currentJob && currentJob.status === 'completed' && (
                  <>
                    <ProjectionChanger
                      currentCrs={currentJob.target_crs || targetCrs}
                      onReproject={handleReproject}
                      isReprojecting={isReprojecting}
                    />

                    <ScaleAdjuster
                      jobId={currentJob.job_id}
                      originalJobId={currentJob.parent_job_id || currentJob.job_id}
                      filename={currentJob.filename}
                      currentCrs={currentJob.target_crs || targetCrs}
                      onScaleApplied={handleScaleApplied}
                      onScalePreview={handleScalePreview}
                      onDownloadOriginal={handleDownloadOriginal}
                      isApplying={isApplyingScale}
                      appliedScaleFactor={currentJob.scale_factor}
                    />
                  </>
                )}
              </div>

              {/* Right Column - Map Preview (Always Visible) */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold">Conversion Preview</h3>
                  {conversionResult ? (
                    <p className="text-sm text-gray-600">
                      {conversionResult.features.length} features • Download: {getEpsgDisplayName(currentJob.target_crs || targetCrs)}
                      {scaleFactor !== 1.0 && ` • Scale Factor: ${scaleFactor.toFixed(6)}`}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {currentJob.status === 'completed' ? 'Loading preview...' : 'Processing conversion...'}
                    </p>
                  )}
                </div>
                <div className="h-[calc(100%-4rem)]">
                  {conversionResult ? (
                    <MapViewer 
                      data={scaledPreviewData || conversionResult} 
                      targetCrs={currentJob.target_crs || targetCrs}
                      scaleFactor={scaleFactor}
                      isTransforming={isTransformingPreview}
                      isScaleApplied={currentJob.scale_factor !== undefined && currentJob.scale_factor !== null}
                      appliedScaleFactor={currentJob.scale_factor}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="text-center p-8">
                        {currentJob.status === 'processing' || currentJob.status === 'pending' ? (
                          <>
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Converting Your File</h3>
                            <p className="text-gray-500 text-sm">Map preview will appear here when conversion is complete</p>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-400 mb-4">
                              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Preview</h3>
                            <p className="text-gray-500 text-sm">Your converted data will be displayed here</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </MessageProvider>
  );
}

export default App;
