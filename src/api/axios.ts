import axios from 'axios';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// TypeScript interfaces for scale factor operations
export interface ScaleFactorRequest {
  scale_factor: number;
  output_format?: string;
}

export interface ScaleFactorResponse {
  job_id: string;
  message: string;
  scale_factor: number;
}

/**
 * Apply scale factor to an already converted file
 * @param jobId - The ID of the completed conversion job
 * @param scaleFactor - Scale factor to apply (must be between 0.9 and 1.1)
 * @param outputFormat - Optional output format (defaults to original format)
 * @returns Promise with new job ID for the scaled conversion
 * @throws Error if job not found, not completed, or scale factor is invalid
 */
export const applyScaleFactor = async (
  jobId: string,
  scaleFactor: number,
  outputFormat?: string
): Promise<ScaleFactorResponse> => {
  try {
    // Comprehensive input validation
    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
      throw new Error('Valid job ID is required');
    }

    if (typeof scaleFactor !== 'number' || !isFinite(scaleFactor)) {
      throw new Error('Scale factor must be a finite number');
    }

    if (scaleFactor <= 0) {
      throw new Error('Scale factor must be greater than 0');
    }

    if (scaleFactor < 0.9 || scaleFactor > 1.1) {
      throw new Error('Scale factor must be between 0.9 and 1.1');
    }

    if (outputFormat && outputFormat !== 'geojson') {
      throw new Error('Output format must be "geojson"');
    }

    const requestData: ScaleFactorRequest = {
      scale_factor: scaleFactor,
    };

    if (outputFormat) {
      requestData.output_format = outputFormat;
    }

    console.log(`Applying scale factor ${scaleFactor} to job ${jobId}`);

    const response = await api.post<ScaleFactorResponse>(
      `/api/apply-scale-factor/${jobId}`,
      requestData,
      {
        timeout: 60000, // 60 second timeout for scale factor operations
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate response structure
    if (!response.data) {
      throw new Error('Empty response from server');
    }

    if (!response.data.job_id) {
      throw new Error('Server response missing job ID');
    }

    if (typeof response.data.job_id !== 'string' || response.data.job_id.trim() === '') {
      throw new Error('Invalid job ID in server response');
    }

    console.log(`Scale factor application started: new job ID ${response.data.job_id}`);
    return response.data;

  } catch (error: any) {
    console.error('Scale factor application error:', error);

    // Enhanced error handling with specific error types
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const detail = error.response.data?.detail || 'Scale factor application failed';
      
      let errorMessage = detail;
      
      // Provide more specific error messages based on status code
      switch (status) {
        case 400:
          if (detail.includes('not completed')) {
            errorMessage = 'The original conversion is not complete. Please wait for it to finish.';
          } else if (detail.includes('Invalid job ID')) {
            errorMessage = 'Invalid job ID. Please refresh the page and try again.';
          } else if (detail.includes('Scale factor')) {
            errorMessage = 'Invalid scale factor value. Please enter a value between 0.9 and 1.1.';
          } else {
            errorMessage = `Invalid request: ${detail}`;
          }
          break;
        case 404:
          if (detail.includes('Job not found')) {
            errorMessage = 'Conversion job not found. Please refresh the page and try again.';
          } else if (detail.includes('output file not found')) {
            errorMessage = 'Original conversion file not found. Please convert your file again.';
          } else {
            errorMessage = 'Resource not found. Please try again.';
          }
          break;
        case 422:
          errorMessage = 'Invalid scale factor value. Please enter a number between 0.9 and 1.1.';
          break;
        case 500:
          errorMessage = 'Server error occurred. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          errorMessage = `Server error (${status}): ${detail}`;
      }
      
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response received
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error('No response from server. Please check your connection and try again.');
      }
    } else {
      // Error in request setup or validation
      throw error;
    }
  }
};

export default api;
