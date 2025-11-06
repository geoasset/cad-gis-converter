import React, { useState } from 'react';

interface Job {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  filename: string;
  output_format: string;
  scale_factor?: number;  // Scale factor applied (null/undefined for original conversions)
  parent_job_id?: string; // Reference to original job (null/undefined for original conversions)
}

interface ProgressIndicatorProps {
  job: Job;
  isPolling: boolean;
  onReset: () => void;
  onDownload: () => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  job,
  onReset,
  onDownload,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressBarColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Converting: {job.filename}
            </h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {job.message}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {job.status === 'completed' && (
            <button
              type="button"
              onClick={() => {
                console.log('Download button clicked in ProgressIndicator');
                onDownload();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download
            </button>
          )}
          
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Convert Another File
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ease-out ${getProgressBarColor()}`}
          style={{ width: `${job.progress}%` }}
        ></div>
      </div>

      {/* Progress Percentage */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progress</span>
        <span>{job.progress}%</span>
      </div>

      {/* Job Details - Collapsible */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2 -m-2"
        >
          <span>Job Details</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              showDetails ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDetails && (
          <div className="mt-3">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Job ID:</dt>
                <dd className="text-gray-900 font-mono text-xs break-all">{job.job_id}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Output Format:</dt>
                <dd className="text-gray-900">{job.output_format.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status:</dt>
                <dd className={`font-medium ${getStatusColor()}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">File Size:</dt>
                <dd className="text-gray-900">
                  {/* This would be populated from the original file info */}
                  -
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Error Details */}
      {job.status === 'failed' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Conversion Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{job.message}</p>
                <p className="mt-1">
                  Please check your DXF file and try again. If the problem persists, 
                  contact support with the job ID above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
