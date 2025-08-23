// hooks/useDownloadProgress.ts
import { useState, useCallback } from 'react';

interface DownloadState {
  progress: number;
  status: string;
  error?: string;
}

interface PlaylistDownloadState {
  isDownloading: boolean;
  currentSong: number;
  totalSongs: number;
  currentSongProgress: number;
  currentSongStatus: string;
  overallProgress: number;
  currentSongName: string;
  errors: Array<{ song: string; error: string }>;
}

export const useDownloadProgress = () => {
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  const [playlistDownload, setPlaylistDownload] = useState<PlaylistDownloadState>({
    isDownloading: false,
    currentSong: 0,
    totalSongs: 0,
    currentSongProgress: 0,
    currentSongStatus: '',
    overallProgress: 0,
    currentSongName: '',
    errors: []
  });

  const startDownload = useCallback((id: string) => {
    setDownloads(prev => ({
      ...prev,
      [id]: { progress: 0, status: 'starting' }
    }));
  }, []);

  const updateProgress = useCallback((id: string, progress: number, status: string) => {
    setDownloads(prev => ({
      ...prev,
      [id]: { ...prev[id], progress, status }
    }));
  }, []);

  const setError = useCallback((id: string, error: string) => {
    setDownloads(prev => ({
      ...prev,
      [id]: { ...prev[id], error, status: 'error' }
    }));
  }, []);

  const completeDownload = useCallback((id: string) => {
    setDownloads(prev => ({
      ...prev,
      [id]: { ...prev[id], progress: 100, status: 'complete' }
    }));
  }, []);

  const cancelDownload = useCallback((id: string) => {
    setDownloads(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  const getDownloadState = useCallback((id: string) => {
    return downloads[id];
  }, [downloads]);

  // Playlist download methods
  const startPlaylistDownload = useCallback(() => {
    setPlaylistDownload({
      isDownloading: true,
      currentSong: 0,
      totalSongs: 0,
      currentSongProgress: 0,
      currentSongStatus: 'starting',
      overallProgress: 0,
      currentSongName: '',
      errors: []
    });
  }, []);

  const updatePlaylistProgress = useCallback((progress: PlaylistDownloadState) => {
    setPlaylistDownload(prev => ({ ...prev, ...progress }));
  }, []);

  const completePlaylistDownload = useCallback((errors: Array<{ song: string; error: string }>) => {
    setPlaylistDownload(prev => ({
      ...prev,
      isDownloading: false,
      overallProgress: 100,
      currentSongStatus: 'complete',
      errors
    }));
  }, []);

  const cancelPlaylistDownload = useCallback(() => {
    setPlaylistDownload({
      isDownloading: false,
      currentSong: 0,
      totalSongs: 0,
      currentSongProgress: 0,
      currentSongStatus: '',
      overallProgress: 0,
      currentSongName: '',
      errors: []
    });
  }, []);

  return {
    downloads,
    playlistDownload,
    startDownload,
    updateProgress,
    setError,
    completeDownload,
    cancelDownload,
    getDownloadState,
    startPlaylistDownload,
    updatePlaylistProgress,
    completePlaylistDownload,
    cancelPlaylistDownload
  };
};
