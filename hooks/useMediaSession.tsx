// hooks/useMediaSession.js
import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { playPause, nextSong, previousSong } from '@/redux/features/musicPlayerSlice';

export const useMediaSession = () => {
  const dispatch = useDispatch();
  const { currentSong, isPlaying, currentTime, duration } = useSelector((state) => state.player);

  // Update media metadata whenever song changes
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.name,
        artist: currentSong.artists?.primary?.map(artist => artist.name).join(', ') || 'Unknown Artist',
        album: currentSong.album?.name || 'Unknown Album',
        artwork: [
          {
            src: currentSong.image?.[0]?.url || '/default-album-96.png',
            sizes: '96x96',
            type: 'image/jpg'
          },
          {
            src: currentSong.image?.[1]?.url || '/default-album-128.png',
            sizes: '128x128',
            type: 'image/jpb'
          },
          {
            src: currentSong.image?.[2]?.url || '/default-album-256.png',
            sizes: '256x256',
            type: 'image/jpg'
          }
        ]
      });
    }
  }, [currentSong]);

  // Set up action handlers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      // Play/Pause handlers
      navigator.mediaSession.setActionHandler('play', () => {
        dispatch(playPause());
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        dispatch(playPause());
      });

      // Previous/Next track handlers[6]
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        dispatch(previousSong());
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        dispatch(nextSong());
      });

      // Seek handlers (optional)[6]
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        // Implement seek backward logic
        if (window.audioElement) {
          window.audioElement.currentTime = Math.max(window.audioElement.currentTime - skipTime, 0);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        // Implement seek forward logic
        if (window.audioElement) {
          window.audioElement.currentTime = Math.min(window.audioElement.currentTime + skipTime, window.audioElement.duration);
        }
      });

      // Seek to specific position
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (window.audioElement && details.seekTime) {
          window.audioElement.currentTime = details.seekTime;
        }
      });
    }

    // Cleanup
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [dispatch]);

  // Update playback state
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Update position state for progress bar in notification
useEffect(() => {
  if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
    if (isPlaying && duration) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1.0, // Always use 1.0 when playing
        position: currentTime || 0
      });
    } else if (duration) {
      // When paused, don't include playbackRate
      navigator.mediaSession.setPositionState({
        duration: duration,
        position: currentTime || 0
      });
    }
  }
}, [currentTime, duration, isPlaying]);
};
