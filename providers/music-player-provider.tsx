"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import MusicPlayer from '@/components/music-player';
import {
  setCurrentTime,
  setDuration,
  playPause,
  nextSong,
  playSong,
  addToQueue,
  setQueue,
  startPlaylist,
} from '@/redux/features/musicPlayerSlice';

// Create context for audio ref if needed elsewhere
const MusicPlayerContext = createContext(null);

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};

export function MusicPlayerProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const audioRef = useRef(null);
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeatMode,
  } = useSelector((state) => state.player);

  // Check for auto-play URL parameter
  useEffect(() => {
    const shouldAutoPlay = searchParams.get('play') === 'true';
    if (shouldAutoPlay && currentSong && !isPlaying) {
      dispatch(playPause());
    }
  }, [searchParams, currentSong, isPlaying, dispatch]);

  // Persistent audio management
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      dispatch(setDuration(audio.duration));
      
      // Auto-play if isPlaying is true (for song changes during playback)
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Auto-play failed:", error);
            dispatch(playPause());
          });
        }
      }
    };

    const handleTimeUpdate = () => {
      dispatch(setCurrentTime(audio.currentTime));
    };

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else  {
        dispatch(nextSong());
      } 
    };

    const handleCanPlay = () => {
      // Ensure audio can play and auto-play if needed
      if (isPlaying && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Can play auto-play failed:", error);
          });
        }
      }
    };

    // Only change source if it's a different song
    if (audio.src !== currentSong.downloadUrl?.[4]?.url) {
      audio.pause();
      audio.src = currentSong.downloadUrl?.[4]?.url;
      audio.currentTime = 0;
      dispatch(setCurrentTime(0));
      audio.load();
    }

    audio.volume = volume / 100;

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [currentSong?.id, dispatch, repeatMode, volume, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);
          dispatch(playPause());
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, dispatch]);

  // Context value with audio ref and queue management methods
  const contextValue = {
    audioRef,
    // Fixed: This should properly start a new playlist
    playPlaylist: (playlist, startIndex = 0, autoPlay = false) => {
      console.log('Playing playlist:', { playlist: playlist.length, startIndex, autoPlay });
      dispatch(startPlaylist({ songs: playlist, startIndex, autoPlay }));
    },
    updateQueue: (songs) => {
      dispatch(setQueue(songs));
    },
    addSongsToQueue: (songs) => {
      dispatch(addToQueue(songs));
    },
    playSpecificSong: (song) => {
      dispatch(playSong(song));
    },
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      {/* Render MusicPlayer UI if there's a current song */}
      {currentSong && <MusicPlayer audioRef={audioRef} />}
    </MusicPlayerContext.Provider>
  );
}
