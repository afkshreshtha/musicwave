"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Heart,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Share2,
  Download,
  Loader2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  playPause,
  nextSong,
  previousSong,
  setCurrentTime,
  setVolume,
  toggleShuffle,
  setRepeatMode,
} from "@/redux/features/musicPlayerSlice";
import Link from "next/link";
import { useMediaSession } from "@/hooks/useMediaSession";
import SlideUpModal from "./SlideUpModal";
import NowPlayingModal from "./NowPlayingModal";
import DownloadProgress from "./DownloadProgress";
import { useDownloadProgress } from "@/hooks/useDownloadProgress";
import { downloadMP4WithMetadata } from "@/utils/download";

const MusicPlayer = ({ audioRef }) => {
  const dispatch = useDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(50);
  const [isTouching, setIsTouching] = useState(false);
  const [showNowPlayingModal, setShowNowPlayingModal] = useState(false);
  const handleSongNameClick = useCallback(() => {
    setShowNowPlayingModal(true);
  }, []);
  useMediaSession();
  useEffect(() => {
    if (audioRef.current) {
      window.audioElement = audioRef.current;
    }
  }, [audioRef]);
  useEffect(() => {
    const audio = audioRef.current;

    if (audio) {
      // Store reference globally for Media Session
      window.audioElement = audio;

      // Update Media Session position as audio plays
      const updatePosition = () => {
        if (
          "mediaSession" in navigator &&
          "setPositionState" in navigator.mediaSession
        ) {
          navigator.mediaSession.setPositionState({
            duration: audio.duration || 0,
            playbackRate: audio.paused ? 0 : 1.0,
            position: audio.currentTime || 0,
          });
        }
      };

      audio.addEventListener("timeupdate", updatePosition);
      audio.addEventListener("durationchange", updatePosition);
      audio.addEventListener("play", updatePosition);
      audio.addEventListener("pause", updatePosition);

      return () => {
        audio.removeEventListener("timeupdate", updatePosition);
        audio.removeEventListener("durationchange", updatePosition);
        audio.removeEventListener("play", updatePosition);
        audio.removeEventListener("pause", updatePosition);
      };
    }
  }, [audioRef]);
  const progressRef = useRef(null);
  const topProgressRef = useRef(null); // Add ref for top progress bar

  // Get player state from Redux
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffleOn,
    repeatMode,
  } = useSelector((state) => state.player);
  const {
    startDownload,
    updateProgress,
    setError,
    completeDownload,
    cancelDownload,
    getDownloadState,
    completePlaylistDownload,
    startPlaylistDownload,
    cancelPlaylistDownload,
    updatePlaylistProgress,
    playlistDownload,
    clearDownloadState,
  } = useDownloadProgress();
  // Time formatting
  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  // Progress calculation
  const progressPercentage = useCallback(() => {
    if (!duration || duration === 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  // Play/pause handler
  const handlePlayPause = useCallback(async () => {
    setIsLoading(true);
    dispatch(playPause());
    setTimeout(() => setIsLoading(false), 200);
  }, [dispatch]);

  // Next/Previous handlers
  const handleNext = useCallback(() => {
    dispatch(nextSong());
  }, [dispatch]);

  const handlePrevious = useCallback(() => {
    dispatch(previousSong());
  }, [dispatch]);

  // Enhanced progress handling that works with both desktop and mobile progress bars
  const handleProgressChange = useCallback(
    (e, isTopBar = false) => {
      const targetRef = isTopBar ? topProgressRef : progressRef;
      if (!targetRef.current || !duration) return;

      const rect = targetRef.current.getBoundingClientRect();
      let clientX;

      // Handle both mouse and touch events
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const newTime = percent * duration;

      dispatch(setCurrentTime(newTime));

      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    },
    [dispatch, duration, audioRef]
  );

  // Touch handlers for top progress bar
  const handleTopProgressTouchStart = useCallback(
    (e) => {
      e.preventDefault();
      setIsTouching(true);
      handleProgressChange(e, true);
    },
    [handleProgressChange]
  );

  const handleTopProgressTouchMove = useCallback(
    (e) => {
      if (isTouching) {
        e.preventDefault();
        handleProgressChange(e, true);
      }
    },
    [isTouching, handleProgressChange]
  );

  const handleTopProgressTouchEnd = useCallback((e) => {
    e.preventDefault();
    setIsTouching(false);
  }, []);

  // Click handler for top progress bar
  const handleTopProgressClick = useCallback(
    (e) => {
      handleProgressChange(e, true);
    },
    [handleProgressChange]
  );

  // Volume control
  const handleVolumeChange = useCallback(
    (newVolume) => {
      dispatch(setVolume(newVolume));
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
    },
    [dispatch, audioRef]
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPreviousVolume(volume);
      handleVolumeChange(0);
    } else {
      handleVolumeChange(previousVolume);
    }
  }, [volume, previousVolume, handleVolumeChange]);

  // Control handlers
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handleRepeat = useCallback(() => {
    const modes = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    dispatch(setRepeatMode(modes[nextIndex]));
  }, [dispatch, repeatMode]);

  // Mouse events for desktop progress dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressChange(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleProgressChange]);

  // Touch events for top progress bar
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (isTouching) {
        handleTopProgressTouchMove(e);
      }
    };

    const handleTouchEnd = (e) => {
      if (isTouching) {
        handleTopProgressTouchEnd(e);
      }
    };

    if (isTouching) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isTouching, handleTopProgressTouchMove, handleTopProgressTouchEnd]);
  function getFileExtension(url) {
    if (!url || typeof url !== "string") return "mp4";

    // Remove query params and hash fragments
    const cleanUrl = url.split(/[?#]/)[0];

    // Get the last path segment (filename)
    const filename = cleanUrl.split("/").pop();

    // Extract extension
    if (!filename || !filename.includes(".")) return "mp4";

    return filename.split(".").pop() || "mp4";
  }

  const resolveSongDownload = (song: Song) => {
    // adapt to your API shape: pick the highest quality or first valid URL
    const url = song.downloadUrl?.[4]?.url || song.url || song.streamUrl;
    const safeName = `${song.name || "track"} - ${
      song.artists?.primary?.[0]?.name || "unknown"
    }`.replace(/[^\w\-\s\.\(\)\[\]]/g, "_");
    console.log(safeName);
    const ext = getFileExtension(url);
    const filename = `${safeName}`;

    return { url, filename };
  };

  const handleDownloadSong = async (song: Song) => {
    try {
      const { url, filename } = resolveSongDownload(song);
      if (!url) throw new Error("Download URL not available");

      // Start the download progress tracking
      startDownload(song.id);

      await downloadMP4WithMetadata(
        url,
        filename,
        {
          title: song.name || "Unknown Title",
          artist: song.artists?.primary?.[0]?.name || "Unknown Artist",
          album: song?.album?.name,
          year: song?.year,
          coverUrl: song.image?.[1]?.url || "/placeholder-album.jpg",
        },
        // Add progress callback
        (progress, status) => {
          updateProgress(song.id, progress, status);
        }
      );

      // Mark as complete
      completeDownload(song.id);
    } catch (e) {
      console.error(e);
      setError(song.id, e.message || "Failed to download track");
    }
  };
  if (!currentSong) return null;

  return (
    <>
      {" "}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Interactive Top Progress Bar */}
        <div
          ref={topProgressRef}
          className="h-1 w-full bg-gray-200 dark:bg-gray-800 cursor-pointer touch-none"
          onClick={handleTopProgressClick}
          onTouchStart={handleTopProgressTouchStart}
          style={{ touchAction: "none" }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 pointer-events-none"
            style={{ width: `${progressPercentage()}%` }}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
          {/* Mobile Layout */}
          <div className="flex md:hidden items-center justify-between p-4">
            {/* Song Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={currentSong.image?.[2]?.url || "/default-album.png"}
                  alt="Now Playing"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-album.png";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  className="font-medium text-gray-900 dark:text-white truncate text-sm cursor-pointer hover:underline"
                  onClick={handleSongNameClick}
                >
                  {currentSong.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentSong.artists?.primary
                    ?.map((artist) => artist.name)
                    .join(", ") || "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                disabled={isLoading}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="grid grid-cols-3 items-center gap-8">
                {/* Song Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={currentSong.image?.[2]?.url || "/default-album.png"}
                      alt="Now Playing"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/default-album.png";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      <Link
                        href={`/song/${currentSong.name}/${currentSong.id}/false/0`}
                        className="hover:underline"
                      >
                        {currentSong.name}
                      </Link>
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {currentSong.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ") || "Unknown Artist"}
                    </p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                {/* Player Controls */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={handleShuffle}
                      className={`p-2 rounded-full transition-colors ${
                        isShuffleOn
                          ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handlePrevious}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handlePlayPause}
                      disabled={isLoading}
                      className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleRepeat}
                      className={`p-2 rounded-full transition-colors relative ${
                        repeatMode !== "off"
                          ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                    >
                      <Repeat className="w-4 h-4" />
                      {repeatMode === "one" && (
                        <span className="absolute -bottom-1 -right-1 text-xs text-blue-500 bg-white dark:bg-gray-900 rounded-full w-4 h-4 flex items-center justify-center border border-blue-500">
                          1
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-lg">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-10 text-right">
                        {formatTime(currentTime)}
                      </span>
                      <div
                        ref={progressRef}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
                        onMouseDown={(e) => {
                          setIsDragging(true);
                          handleProgressChange(e);
                        }}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-100"
                          style={{ width: `${progressPercentage()}%` }}
                        />
                      </div>
                      <span className="w-10">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Volume & Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>

            
                    <div className="min-w-[100px] flex justify-center">
                      {getDownloadState(currentSong.id) ? (
                        <DownloadProgress
                          progress={getDownloadState(currentSong.id).progress}
                          status={getDownloadState(currentSong.id).status}
                          error={getDownloadState(currentSong.id).error}
                          onCancel={() => cancelDownload(currentSong.id)}
                          onComplete={() => clearDownloadState(currentSong.id)} // Add this
                          isMobile={false}
                        />
                      ) : (
                        <button
                          onClick={() => handleDownloadSong(currentSong)}
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-gray-300 hover:text-white"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
               

                  {/* Simple Volume Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>

                    {showVolumeSlider && (
                      <div
                        className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative"
                        onMouseLeave={() => setShowVolumeSlider(false)}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${volume}%` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={volume}
                          onChange={(e) =>
                            handleVolumeChange(parseFloat(e.target.value))
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SlideUpModal
        isOpen={showNowPlayingModal}
        onClose={() => setShowNowPlayingModal(false)}
      >
        <NowPlayingModal />
      </SlideUpModal>
    </>
  );
};

export default MusicPlayer;
