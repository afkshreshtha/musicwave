// components/PlaylistDownloadProgress.tsx
import React from 'react';
import { X, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface PlaylistDownloadProgressProps {
  isVisible: boolean;
  currentSong: number;
  totalSongs: number;
  currentSongProgress: number;
  currentSongStatus: string;
  overallProgress: number;
  currentSongName: string;
  errors: Array<{ song: string; error: string }>;
  onCancel: () => void;
}

const PlaylistDownloadProgress: React.FC<PlaylistDownloadProgressProps> = ({
  isVisible,
  currentSong,
  totalSongs,
  currentSongProgress,
  currentSongStatus,
  overallProgress,
  currentSongName,
  errors,
  onCancel
}) => {
  if (!isVisible) return null;
  console.log(totalSongs)

  const getStatusText = (status: string) => {
    switch (status) {
      case 'fetching': return 'Fetching audio...';
      case 'converting': return 'Converting to MP3...';
      case 'tagging': return 'Adding metadata...';
      case 'finalizing': return 'Finalizing...';
      case 'complete': return 'Complete';
      case 'creating_zip': return 'Creating ZIP file...';
      default: return 'Processing...';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-4 md:p-6 w-full max-w-sm md:max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Download className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white">
                Downloading Playlist
              </h3>
              <p className="text-xs md:text-sm text-purple-400">
                {currentSong}/{totalSongs} songs
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-white/10 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Card */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">
                Overall Progress
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-600 px-2 py-1 rounded-full text-white">
                  {currentSong}/{totalSongs}
                </span>
                <span className="text-sm text-purple-400 font-medium">
                  {Math.round(overallProgress)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Current Song Progress */}
          {currentSongStatus !== 'complete' && currentSongName !== 'Creating ZIP file...' && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm text-white truncate font-medium">
                    {currentSongName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getStatusText(currentSongStatus)}
                  </p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  {Math.round(currentSongProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${currentSongProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ZIP Creation Status */}
        {currentSongName === 'Creating ZIP file...' && (
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-400">Creating ZIP file...</p>
                <p className="text-xs text-gray-400">Almost done!</p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <span className="text-sm text-yellow-500 font-medium">
                {errors.length} song(s) failed
              </span>
            </div>
            <div className="max-h-20 overflow-y-auto">
              {errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-gray-400 mb-1">
                  • {error.song}
                </div>
              ))}
              {errors.length > 3 && (
                <div className="text-xs text-gray-500">
                  + {errors.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Complete Status */}
        {currentSongStatus === 'complete' && (
          <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-400">
                  Download Complete!
                </p>
                <p className="text-xs text-gray-400">
                  {totalSongs - errors.length}/{totalSongs} songs downloaded successfully
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default PlaylistDownloadProgress;
