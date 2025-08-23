// hooks/useDownloadProgress.ts
import { useState, useRef } from 'react';

interface DownloadState {
  songId: string;
  progress: number;
  status: 'idle' | 'fetching' | 'converting' | 'tagging' | 'downloading' | 'complete' | 'error';
  error?: string;
}

export const useDownloadProgress = () => {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const startDownload = (songId: string) => {
    setDownloads(prev => ({
      ...prev,
      [songId]: {
        songId,
        progress: 0,
        status: 'fetching'
      }
    }));
    abortControllers.current[songId] = new AbortController();
  };

  const updateProgress = (songId: string, progress: number, status: DownloadState['status']) => {
    setDownloads(prev => ({
      ...prev,
      [songId]: {
        ...prev[songId],
        progress,
        status
      }
    }));
  };

  const setError = (songId: string, error: string) => {
    setDownloads(prev => ({
      ...prev,
      [songId]: {
        ...prev[songId],
        status: 'error',
        error
      }
    }));
  };

  const completeDownload = (songId: string) => {
    setDownloads(prev => ({
      ...prev,
      [songId]: {
        ...prev[songId],
        progress: 100,
        status: 'complete'
      }
    }));
    
    // Auto-remove completed downloads after 3 seconds
    setTimeout(() => {
      setDownloads(prev => {
        const { [songId]: removed, ...rest } = prev;
        return rest;
      });
    }, 3000);
  };

  const cancelDownload = (songId: string) => {
    if (abortControllers.current[songId]) {
      abortControllers.current[songId].abort();
      delete abortControllers.current[songId];
    }
    setDownloads(prev => {
      const { [songId]: removed, ...rest } = prev;
      return rest;
    });
  };

  return {
    downloads,
    startDownload,
    updateProgress,
    setError,
    completeDownload,
    cancelDownload,
    getDownloadState: (songId: string) => downloads[songId]
  };
};
