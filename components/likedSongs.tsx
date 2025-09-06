import React, { useState, useEffect } from 'react';
import { Music, Heart, Play, Pause, Download, Clock } from 'lucide-react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { playSong, playPause, setQueue } from '@/redux/features/musicPlayerSlice';
import { useGetSongsByIdsQuery } from '@/redux/features/api/musicApi';
import { toggleSongLike, saveToListeningHistory, trackSongPlay } from '@/lib/supabasefunctions';
import { downloadMP4WithMetadata } from '@/utils/download';
import { useDownloadProgress } from '@/hooks/useDownloadProgress';
import DownloadProgress from '@/components/DownloadProgress';

const LikedSongs = ({ likedSongIds, onLikedSongsChange }) => {
  const dispatch = useDispatch();
  const { currentSong, isPlaying } = useSelector(state => state.player);
  const [localLikedSongs, setLocalLikedSongs] = useState(new Set(likedSongIds));
  const [playedSongsInSession, setPlayedSongsInSession] = useState(new Set());
  
  const { 
    data: likedSongs = [], 
    error, 
    isLoading,
    isFetching 
  } = useGetSongsByIdsQuery(Array.from(likedSongIds), {
    skip: likedSongIds.size === 0
  });

  const {
    startDownload,
    updateProgress,
    setError,
    completeDownload,
    cancelDownload,
    getDownloadState,
    clearDownloadState,
  } = useDownloadProgress();

  // Update local state when parent likedSongIds changes
  useEffect(() => {
    setLocalLikedSongs(new Set(likedSongIds));
  }, [likedSongIds]);

  // Handle song play with session tracking
  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) {
      dispatch(playPause());
    } else {
      dispatch(setQueue(likedSongs));
      dispatch(playSong(song));
      
      // Track play only once per session
      if (!playedSongsInSession.has(song.id)) {
        trackSongPlay(song.duration);
        saveToListeningHistory(song);
        setPlayedSongsInSession(prev => new Set(prev).add(song.id));
      }
    }
  };

  // Handle heart button click to toggle like status
  const handleToggleLike = async (e, songId) => {
    e.stopPropagation(); // Prevent triggering row click
    const isCurrentlyLiked = localLikedSongs.has(songId);
    
    try {
      const newLikeStatus = await toggleSongLike(songId, isCurrentlyLiked);
      
      // Update local state
      setLocalLikedSongs((prev) => {
        const newSet = new Set(prev);
        if (newLikeStatus) {
          newSet.add(songId);
        } else {
          newSet.delete(songId);
        }
        return newSet;
      });

      // Notify parent component of change
      if (onLikedSongsChange) {
        const newLikedSet = new Set(localLikedSongs);
        if (newLikeStatus) {
          newLikedSet.add(songId);
        } else {
          newLikedSet.delete(songId);
        }
        onLikedSongsChange(newLikedSet);
      }
    } catch (error) {
      console.error('Failed to toggle like status:', error);
    }
  };

  // Handle song download
  const handleDownloadSong = async (e, song) => {
    e.stopPropagation(); // Prevent triggering row click
    
    try {
      const url = song.downloadUrl?.[4]?.url || song.url;
      if (!url) throw new Error("Download URL not available");

      const safeName = `${song.name || "track"} - ${
        song.artists?.primary?.[0]?.name || "unknown"
      }`.replace(/[^\w\-\s\.\(\)\[\]]/g, "_");

      startDownload(song.id);

      await downloadMP4WithMetadata(
        url,
        safeName,
        {
          title: song.name || "Unknown Title",
          artist: song.artists?.primary?.[0]?.name || "Unknown Artist",
          album: song.album?.name || "Unknown Album",
          year: song.year,
          coverUrl: song.image?.[1]?.url || "/placeholder-album.jpg",
        },
        (progress, status) => {
          updateProgress(song.id, progress, status);
        }
      );

      completeDownload(song.id);
    } catch (error) {
      console.error('Download failed:', error);
      setError(song.id, error.message || "Failed to download track");
    }
  };

  if (likedSongIds.size === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No liked songs yet</p>
        <p className="text-sm">Like songs to see them in this collection</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
            </div>
            <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-lg">Error loading liked songs</p>
        <p className="text-sm">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liked Songs</h2>
            <p className="text-gray-500 dark:text-gray-400">{likedSongs.length} songs</p>
          </div>
        </div>
        
        {likedSongs.length > 0 && (
          <button
            onClick={() => {
              dispatch(setQueue(likedSongs));
              dispatch(playSong(likedSongs[0]));
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5" />
            Play All
          </button>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="col-span-1">#</div>
        <div className="col-span-5">Title</div>
        <div className="col-span-3">Album</div>
        <div className="col-span-1">
          <Clock className="w-4 h-4" />
        </div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* Songs List */}
      {likedSongs.map((song, index) => (
        <div
          key={song.id}
          onClick={() => handlePlaySong(song)}
          className={`group rounded-xl transition-all duration-300 cursor-pointer ${
            currentSong?.id === song.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
          } hover:bg-gray-50 dark:hover:bg-gray-800/50`}
        >
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center gap-3 p-4">
            <div className="relative flex items-center justify-center w-8">
              <span className={`text-sm font-medium group-hover:opacity-0 transition-opacity ${
                currentSong?.id === song.id ? 'text-purple-500' : 'text-gray-400'
              }`}>
                {index + 1}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlaySong(song);
                }}
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center"
              >
                {currentSong?.id === song.id && isPlaying ? (
                  <Pause className="w-4 h-4 text-purple-500" />
                ) : (
                  <Play className="w-4 h-4 text-purple-500 ml-0.5" />
                )}
              </button>
            </div>

            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {song.image?.[1] ? (
                <Image
                  src={song.image[1].url}
                  alt={song.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              {/* Playing indicator */}
              {currentSong?.id === song.id && isPlaying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
                    <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "80%", animationDelay: "150ms" }} />
                    <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm truncate ${
                currentSong?.id === song.id ? 'text-purple-500' : 'text-gray-900 dark:text-white'
              }`}>
                {song.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {song.artists?.primary?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 mr-2">
                {song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : '--:--'}
              </span>
              
              {/* Heart Button */}
              <button
                onClick={(e) => handleToggleLike(e, song.id)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Remove from liked songs"
              >
                <Heart className="w-4 h-4 text-red-500 fill-current" />
              </button>

              {/* Download Button */}
              <div className="min-w-[32px]">
                {getDownloadState(song.id) ? (
                  <DownloadProgress
                    progress={getDownloadState(song.id).progress}
                    status={getDownloadState(song.id).status}
                    error={getDownloadState(song.id).error}
                    onCancel={() => cancelDownload(song.id)}
                    onComplete={() => clearDownloadState(song.id)}
                    isMobile={true}
                  />
                ) : (
                  <button
                    onClick={(e) => handleDownloadSong(e, song)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Download song"
                  >
                    <Download className="w-4 h-4 text-gray-400 hover:text-purple-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-12 gap-4 items-center p-4">
            <div className="col-span-1">
              <div className="relative flex items-center justify-center">
                <span className={`text-sm font-medium group-hover:opacity-0 transition-opacity ${
                  currentSong?.id === song.id ? 'text-purple-500' : 'text-gray-400'
                }`}>
                  {index + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlaySong(song);
                  }}
                  className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center"
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <Pause className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Play className="w-4 h-4 text-purple-500 ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="col-span-5 flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {song.image?.[1] ? (
                  <Image
                    src={song.image[1].url}
                    alt={song.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                {/* Playing indicator */}
                {currentSong?.id === song.id && isPlaying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex gap-0.5">
                      <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
                      <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "80%", animationDelay: "150ms" }} />
                      <div className="w-1 bg-purple-400 rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className={`font-semibold ${
                  currentSong?.id === song.id ? 'text-purple-500' : 'text-gray-900 dark:text-white'
                }`}>
                  {song.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {song.artists?.primary?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
                </p>
              </div>
            </div>

            <div className="col-span-3 text-sm text-gray-500 dark:text-gray-400">
              {song.album?.name || 'Unknown Album'}
            </div>

            <div className="col-span-1 text-sm text-gray-400">
              {song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : '--:--'}
            </div>

            <div className="col-span-2 flex items-center gap-3">
              {/* Heart Button */}
              <button
                onClick={(e) => handleToggleLike(e, song.id)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Remove from liked songs"
              >
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </button>

              {/* Download Button */}
              {getDownloadState(song.id) ? (
                <DownloadProgress
                  progress={getDownloadState(song.id).progress}
                  status={getDownloadState(song.id).status}
                  error={getDownloadState(song.id).error}
                  onCancel={() => cancelDownload(song.id)}
                  onComplete={() => clearDownloadState(song.id)}
                  isMobile={false}
                />
              ) : (
                <button
                  onClick={(e) => handleDownloadSong(e, song)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Download song"
                >
                  <Download className="w-5 h-5 text-gray-400 hover:text-purple-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {isFetching && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading songs...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikedSongs;
