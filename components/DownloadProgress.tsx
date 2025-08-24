// components/DownloadProgress.tsx
import React, { useEffect, useState } from 'react';
import { Download, Check, X, AlertCircle } from 'lucide-react';

interface DownloadProgressProps {
  progress: number;
  status: 'idle' | 'fetching' | 'converting' | 'tagging' | 'downloading' | 'complete' | 'error';
  error?: string;
  onCancel?: () => void;
  onComplete?: () => void;
  isMobile?: boolean;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ 
  progress, 
  status, 
  error, 
  onCancel,
  onComplete,
  isMobile = false
}) => {
  const [showComplete, setShowComplete] = useState(false);

  // Handle auto-hide for complete status
  useEffect(() => {
    if (status === 'complete') {
      setShowComplete(true);
      const timer = setTimeout(() => {
        setShowComplete(false);
        if (onComplete) {
          onComplete();
        }
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    } else {
      setShowComplete(false);
    }
  }, [status, onComplete]);

  const buttonSize = isMobile ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const strokeWidth = isMobile ? 2 : 2.5;
  const circleSize = isMobile ? 28 : 32; // Slightly smaller than button for padding

  // If status is complete but we're not showing it anymore, return normal download button
  if (status === 'complete' && !showComplete) {
    return (
      <button
        className={`flex items-center justify-center transition-all duration-200 rounded-full
          ${buttonSize} bg-white/10 hover:bg-white/20 active:bg-white/30 
          ${!isMobile && 'hover:scale-105 active:scale-95'}
        `}
        title="Download"
      >
        <Download className={`${iconSize} text-gray-300 hover:text-white`} />
      </button>
    );
  }

  // Idle state - normal download button
  if (status === 'idle') {
    return (
      <button
        className={`flex items-center justify-center transition-all duration-200 rounded-full
          ${buttonSize} bg-white/10 hover:bg-white/20 active:bg-white/30 
          ${!isMobile && 'hover:scale-105 active:scale-95'}
        `}
        title="Download"
      >
        <Download className={`${iconSize} text-gray-300 hover:text-white`} />
      </button>
    );
  }

  // Get icon based on status
  const getIcon = () => {
    switch (status) {
      case 'complete':
        return <Check className={`${iconSize} text-green-400`} />;
      case 'error':
        return <AlertCircle className={`${iconSize} text-red-400`} />;
      default:
        return <Download className={`${iconSize} text-purple-300`} />;
    }
  };

  // Get colors based on status
  const getColors = () => {
    switch (status) {
      case 'complete':
        return { bg: 'bg-green-500/20', stroke: 'stroke-green-400', text: 'text-green-400' };
      case 'error':
        return { bg: 'bg-red-500/20', stroke: 'stroke-red-400', text: 'text-red-400' };
      default:
        return { bg: 'bg-purple-500/20', stroke: 'stroke-purple-400', text: 'text-purple-400' };
    }
  };

  const colors = getColors();
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <button
        className={`flex items-center justify-center transition-all duration-200 rounded-full
          ${buttonSize} ${colors.bg} border border-white/10
          ${!isMobile && 'hover:scale-105 active:scale-95'}
        `}
        title={status === 'error' ? error || 'Download failed' : 'Downloading...'}
      >
        {getIcon()}
      </button>

      {/* Circular Progress Ring */}
      {status !== 'complete' && status !== 'error' && (
        <svg
          className={`absolute inset-0 ${buttonSize} transform -rotate-90 pointer-events-none`}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
        >
          {/* Background Circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-600/30"
          />
          
          {/* Progress Circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-300`}
          />
        </svg>
      )}

      {/* Cancel Button - Only show during active download */}
      {onCancel && status !== 'complete' && status !== 'error' && status !== 'idle' && (
        <button
          onClick={onCancel}
          className={`absolute -top-1 -right-1 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} 
            bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center
            hover:bg-gray-700 transition-colors duration-200`}
          title="Cancel Download"
        >
          <X className={`${isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} text-gray-300`} />
        </button>
      )}
    </div>
  );
};

export default DownloadProgress;
