// components/DownloadProgress.tsx
import React from 'react';
import { Download, Loader, Check, X, AlertCircle } from 'lucide-react';

interface DownloadProgressProps {
  progress: number;
  status: 'idle' | 'fetching' | 'converting' | 'tagging' | 'downloading' | 'complete' | 'error';
  error?: string;
  onCancel?: () => void;
  isMobile?: boolean;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ 
  progress, 
  status, 
  error, 
  onCancel,
  isMobile = false
}) => {
  const getStatusText = () => {
    switch (status) {
      case 'fetching': return isMobile ? 'Fetching...' : 'Fetching...';
      case 'converting': return isMobile ? 'Converting...' : 'Converting...';
      case 'tagging': return isMobile ? 'Adding tags...' : 'Adding metadata...';
      case 'downloading': return isMobile ? 'Downloading...' : 'Downloading...';
      case 'complete': return 'Done!';
      case 'error': return isMobile ? 'Failed' : (error || 'Failed');
      default: return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <Check className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-green-400`} />;
      case 'error':
        return <AlertCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-red-400`} />;
      case 'idle':
        return <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />;
      default:
        return <Loader className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} animate-spin text-purple-400`} />;
    }
  };

  if (status === 'idle') {
    return (
      <div className={`flex items-center justify-center ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
        <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 min-w-0 ${
      isMobile ? 'bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1' : ''
    }`}>
      {/* Icon */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>

      {/* Progress Bar and Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300 truncate`}>
            {getStatusText()}
          </span>
          {onCancel && status !== 'complete' && status !== 'error' && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white ml-2 flex-shrink-0"
            >
              <X className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
            </button>
          )}
        </div>
        
        {status !== 'error' && status !== 'complete' && (
          <div className={`w-full bg-gray-700 rounded-full ${isMobile ? 'h-0.5' : 'h-1'}`}>
            <div
              className={`${isMobile ? 'h-0.5' : 'h-1'} rounded-full transition-all duration-300 ${
                status === 'complete' ? 'bg-green-400' : 'bg-purple-400'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadProgress;
