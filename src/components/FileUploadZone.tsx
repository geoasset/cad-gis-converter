import React from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadZoneProps {
  onDrop: (files: File[]) => void;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onDrop }) => {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
  } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    noKeyboard: true,
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Drag state changed:', { isDragActive });
  }, [isDragActive]);

  return (
    <div className="w-full h-full min-h-[400px]">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out h-full flex items-center justify-center
          ${isDragActive
            ? 'border-blue-500 bg-blue-100 shadow-xl border-4'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-white hover:shadow-md'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          <div className={`mx-auto w-24 h-24 transition-all duration-200 ${
            isDragActive 
              ? 'text-blue-500 scale-110' 
              : 'text-gray-400'
          }`}>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
              className="w-full h-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              />
            </svg>
          </div>
          
          {isDragActive ? (
            <div className="animate-pulse">
              <p className="text-blue-600 font-semibold text-xl">
                ✓ Drop your file here
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 font-medium text-xl">
                Drag and drop your DXF file here
              </p>
              <p className="text-gray-500 mt-3">
                or click to browse files
              </p>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Supported format: DXF files only
          </div>
        </div>
      </div>
      
      {acceptedFiles.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">
            Selected file: {acceptedFiles[0].name}
          </p>
          <p className="text-xs text-green-600">
            Size: {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
