"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Play,
  Pause,
  Heart,
  Share2,
  Download,
  Clock,
  Users,
  Calendar,
  MoreHorizontal,
  Shuffle,
  Repeat,
  List,
  X,
  Trash2,
  Loader,
  ArrowLeft,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useGetPlaylistByIdQuery } from "@/redux/features/api/musicApi";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  playSong,
  setQueue,
  toggleQueue,
  setShowQueue,
  removeFromQueue,
  toggleShuffle,
  setRepeatMode,
  startPlaylist,
} from "@/redux/features/musicPlayerSlice";
import Navbar from "@/components/navbar";
import Image from "next/image";
import usePlaylist from "@/hooks/usePlaylist";
import useQueue from "@/hooks/useQueue";
import Queue from "@/components/queue";
import { RootState } from "@/redux/store";

const SongDetails = () => {
  const { slug, songcount,autoPlay } = useParams();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [page, setPage] = useState(1);

  const headerRef = useRef(null);
  const dispatch = useDispatch();
  const id = slug;

  // Fixed: Added proper query structure and error handling
  const { songs, hasMore, loading, error } = usePlaylist(id, page);

  // Get playlist data using RTK Query
  const {
    data: playlistData,
    isLoading: playlistLoading,
    error: playlistError,
  } = useGetPlaylistByIdQuery({ id });

  // Extract playlist info from the data
  const playlist = playlistData?.data || {};

  const {
    isPlaying,
    currentSong,
    currentSongIndex,
    queue,
    isShuffleOn,
    repeatMode,
  } = useSelector((state:RootState) => state.player);

  // Utility function to decode HTML strings
  const decodeHTMLString = (str) => {
    const decodedString = str?.replace(/&quot;/g, '"');
    return decodedString;
  };
const { showQueue, toggleQueueVisibility } = useQueue()
  // Fixed: Renamed lastBookElementRef to lastElementRef for consistency
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Memoize all songs for better performance
  const allSongs = useMemo(() => {
    return songs || [];
  }, [songs]);

  // Decode playlist name
  const playlistName = useMemo(() => {
    return decodeHTMLString(playlist?.name) || "Unknown Playlist";
  }, [playlist?.name]);

  // Update queue whenever new songs are loaded
  useEffect(() => {
    if (allSongs.length > 0) {
      const isCurrentPlaylist =
        queue.length > 0 &&
        allSongs.some((song) =>
          queue.some((queueSong) => queueSong.id === song.id)
        );

      if (isCurrentPlaylist || queue.length === 0) {
        dispatch(setQueue(allSongs));
      }
    }
  }, [allSongs, dispatch, queue.length]);

  // Check for auto-play on mount
  useEffect(() => {
    const shouldAutoPlay = autoPlay === "true";
    if (shouldAutoPlay && allSongs.length > 0) {
    
      handlePlayPlaylist(true);

    }
  }, [allSongs.length,autoPlay, router]);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollTop = window.scrollY;
        setScrolled(scrollTop > 200);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fixed: Renamed function to match convention
  const handlePlayPlaylist = (autoPlay = false) => {
    if (allSongs.length > 0) {

      dispatch(
        startPlaylist({
          songs: allSongs,
          startIndex: 0,
          autoPlay,
        })
      );
    }
  };

  const handlePlayPause = (songId = null) => {
    if (songId) {
      const songToPlay = allSongs.find((s) => s.id === songId);
      if (songToPlay) {
        if (currentSong?.id === songId) {
          dispatch(playPause());
        } else {
          dispatch(setQueue(allSongs));
          dispatch(playSong(songToPlay));
        }
      }
    } else {
      if (!currentSong && allSongs.length > 0) {
        handlePlayPlaylist(true);
      } else {
        dispatch(playPause());
      }
    }
  };

  const handleLike = (songId) => {
    // Implement like functionality
  
  };

  const handleRemoveFromQueue = (songId) => {
    dispatch(removeFromQueue(songId));
  };

  const handleShuffleToggle = () => {
    dispatch(toggleShuffle());
  };
  // Add this new function in your component
  const handlePlayFromQueue = (song, queueIndex) => {
    // Find the actual index in the queue array
    const actualQueueIndex = currentSongIndex + 1 + queueIndex;

    // Dispatch to play the selected song and update the current song index
    dispatch(playSong(song));

    // You might need to add a new action to set the current song index
    // dispatch(setCurrentSongIndex(actualQueueIndex));


  };

  const handleRepeatToggle = () => {
    const modes = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    dispatch(setRepeatMode(nextMode));
  };

  // Check if the current queue is from this playlist
  const isCurrentPlaylist =
    queue.length > 0 &&
    allSongs.some((song) =>
      queue.some((queueSong) => queueSong.id === song.id)
    );

  // Simple Loading Component
  const SongLoadingSkeleton = ({ count = 10 }) => {
    return (
      <div className="space-y-2">
        {[...Array(count)].map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse"
          >
            <div className="w-8 h-4 bg-gray-600 rounded flex-shrink-0"></div>
            <div className="w-12 h-12 bg-gray-600 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-3 bg-gray-700 rounded flex-shrink-0"></div>
          </div>
        ))}
      </div>
    );
  };

  // Simple Infinite Loading Indicator
  const InfiniteLoadingIndicator = () => {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading more songs...</span>
        </div>
      </div>
    );
  };

  // Show initial loading for first page
  if ((loading && page === 1) || playlistLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 pointer-events-none"></div>

          {/* Mobile Loading Header */}
          <div className="flex items-center gap-4 p-4 md:hidden">
            <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-600 rounded w-32 animate-pulse"></div>
          </div>

          <div className="relative pt-4 md:pt-20 pb-8">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <div className="flex flex-col items-center md:flex-row md:items-start lg:items-end gap-6 md:gap-8">
                <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-700 rounded-3xl animate-pulse"></div>
                <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                  <div className="space-y-3 md:space-y-4">
                    <div className="h-3 md:h-4 bg-gray-600 rounded w-16 md:w-20 mx-auto md:mx-0"></div>
                    <div className="h-8 md:h-16 bg-gray-600 rounded w-full md:w-3/4 mx-auto md:mx-0"></div>
                    <div className="h-4 md:h-6 bg-gray-700 rounded w-full mx-auto md:mx-0"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32">
            <div className="mb-6 md:mb-8">
              <div className="h-6 md:h-8 bg-gray-600 rounded w-32 md:w-48 mb-4"></div>
            </div>
            <SongLoadingSkeleton count={20} />
          </div>
        </div>
      </>
    );
  }

  // Fixed: Changed Error to error (lowercase)
  if (error || playlistError) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg md:text-xl text-red-400 mb-4">
              Error loading playlist
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 pointer-events-none"></div>

        {/* Mobile Navigation Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {scrolled && (
              <>
                <div className="w-8 h-8 rounded overflow-hidden">
                  <Image
                    src={
                      playlist?.image?.[2]?.url || "/placeholder-playlist.jpg"
                    }
                    alt={playlistName}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold truncate">{playlistName}</h1>
                  <p className="text-xs text-gray-400">
                    {songcount || allSongs.length} songs
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(toggleQueue())}
                className={`p-2 rounded-full transition-colors ${
                  showQueue
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePlayPause()}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300"
              >
                {isPlaying && isCurrentPlaylist ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sticky Header */}
        <div
          ref={headerRef}
          className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
              ? "bg-black/90 backdrop-blur-xl  border-b border-white/10 py-3"
              : "bg-transparent py-6 top-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            {scrolled && (
              <>
                <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-purple-500/30">
                  <Image
                    src={
                      playlist?.image?.[2]?.url || "/placeholder-playlist.jpg"
                    }
                    alt={playlistName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{playlistName}</h1>
                  <p className="text-sm text-gray-400">
                    {songcount || allSongs.length} songs
                    {loading && page > 1 && (
                      <span className="ml-1 text-purple-400">
                        • Loading more...
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={() => dispatch(toggleQueue())}
                className={`p-3 rounded-full transition-colors duration-300 ${
                  showQueue
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <List className="w-5 h-5" />
              </button>

              <button
                onClick={() => handlePlayPause()}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                {isPlaying && isCurrentPlaylist ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative pt-16 md:pt-20 pb-6 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center md:flex-row md:items-start lg:items-end gap-6 md:gap-8">
              {/* Cover Art */}
              <div className="relative group">
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative w-full h-full">
                    <Image
                      src={
                        playlist?.image?.[2]?.url || "/placeholder-playlist.jpg"
                      }
                      alt={playlistName}
                      width={320}
                      height={320}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handlePlayPause()}
                        className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                      >
                        {isPlaying && isCurrentPlaylist ? (
                          <Pause className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        ) : (
                          <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playlist Info */}
              <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    Playlist
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-6xl font-black mb-3 md:mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                    {playlistName}
                  </h1>
                  <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0">
                    By{" "}
                    {playlist?.artists?.length > 0
                      ? playlist.artists
                          .slice(0, 3)
                          .map((artist) => artist.name)
                          .join(", ")
                      : "Various Artists"}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{playlist?.year || "Unknown Year"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {songcount || allSongs.length} songs
                      {hasMore && (
                        <span className="text-purple-400 ml-1">
                          (More available)
                        </span>
                      )}
                    </span>
                  </div>
                  {playlist?.artists?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{playlist.artists.length} artists</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 pt-2 md:pt-4">
                  <button
                    onClick={() => handlePlayPlaylist(true)}
                    className="group flex items-center gap-2 md:gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-6 md:px-8 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
                  >
                    {isPlaying && isCurrentPlaylist ? (
                      <Pause className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                    )}
                    {isPlaying && isCurrentPlaylist ? "Pause" : "Play Playlist"}
                  </button>

                  <button className="px-4 md:px-6 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base transition-all duration-300 bg-transparent border border-white/20 hover:border-white/40">
                    Save
                  </button>

                  <div className="flex items-center gap-2">
                    <button className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300 group">
                      <Heart className="w-4 h-4 md:w-5 md:h-5 group-hover:text-purple-400" />
                    </button>

                    <button className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                      <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                      <Download className="w-4 h-4 md:w-5 md:h-5" />
                    </button>

                    <button className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                      <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32">
          {/* List Header */}
          <div
            className={`sticky bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-3 md:py-4 mb-3 md:mb-4 border-b border-white/10 z-40 ${
              scrolled ? "top-16 md:top-32" : "top-16 md:top-32"
            }`}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-xl md:text-2xl font-bold">
                Songs ({songcount || allSongs.length}
                {hasMore && <span className="text-purple-400">+</span>})
              </h2>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleShuffleToggle}
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isShuffleOn
                      ? "text-purple-400 bg-white/10"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRepeatToggle}
                  className={`p-2 rounded-full transition-colors duration-300 relative ${
                    repeatMode !== "off"
                      ? "text-purple-400 bg-white/10"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                  {repeatMode === "one" && (
                    <span className="absolute -bottom-1 -right-1 text-xs text-purple-400 bg-black rounded-full w-4 h-4 flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-3">Artist</div>
              <div className="col-span-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>

          {/* Songs */}
          <div className="space-y-1 md:space-y-2">
            {allSongs.map((song, index) => {
              const isLastElement = index === allSongs.length - 1;

              return (
                <div
                  key={`${song.id}-${index}`}
                  ref={isLastElement ? lastElementRef : null}
                  className={`group rounded-xl transition-all duration-300 ${
                    currentSong?.id === song.id ? "bg-white/10" : ""
                  } hover:bg-white/5`}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden flex items-center gap-3 p-3">
                    {/* Track Number / Play Button */}
                    <div className="relative flex items-center justify-center w-8">
                      <span
                        className={`text-sm font-medium group-hover:opacity-0 transition-opacity duration-200 ${
                          currentSong?.id === song.id
                            ? "text-purple-400"
                            : "text-gray-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handlePlayPause(song.id)}
                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 flex items-center justify-center"
                      >
                        {currentSong?.id === song.id && isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Song Art */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0">
                      <Image
                        src={song.image?.[2]?.url || "/placeholder-song.jpg"}
                        alt={song.name || "Song"}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                      {currentSong?.id === song.id && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <div
                              className="w-1 bg-purple-400 rounded-full animate-pulse"
                              style={{ height: "60%", animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-1 bg-purple-400 rounded-full animate-pulse"
                              style={{ height: "80%", animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-1 bg-purple-400 rounded-full animate-pulse"
                              style={{ height: "40%", animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-sm truncate ${
                          currentSong?.id === song.id
                            ? "text-purple-400"
                            : "text-white"
                        }`}
                        onClick={() => handlePlayPause(song.id)}
                      >
                        {decodeHTMLString(song.name) || "Unknown Song"}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {song.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(", ") ||
                          song.primaryArtists ||
                          "Various Artists"}
                      </p>
                    </div>

                    {/* Duration & Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {song.duration
                          ? Math.floor(song.duration / 60) +
                            ":" +
                            String(song.duration % 60).padStart(2, "0")
                          : "--:--"}
                      </span>
                       <button
                         onClick={() => handleLike(song.id)}
                         className="p-1.5 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-400 hover:text-white opacity-100 md:opacity-0 md:group-hover:opacity-100"
                       >
                         <Heart className="w-4 h-4" />
                       </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center p-3">
                    {/* Track Number / Play Button */}
                    <div className="col-span-1">
                      <div className="relative flex items-center justify-center">
                        <span
                          className={`text-sm font-medium group-hover:opacity-0 transition-opacity duration-200 ${
                            currentSong?.id === song.id
                              ? "text-purple-400"
                              : "text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <button
                          onClick={() => handlePlayPause(song.id)}
                          className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 flex items-center justify-center"
                        >
                          {currentSong?.id === song.id && isPlaying ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="col-span-6 flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0">
                        <Image
                          src={song.image?.[2]?.url || "/placeholder-song.jpg"}
                          alt={song.name || "Song"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                        {currentSong?.id === song.id && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex gap-0.5">
                              <div
                                className="w-1 bg-purple-400 rounded-full animate-pulse"
                                style={{ height: "60%", animationDelay: "0ms" }}
                              ></div>
                              <div
                                className="w-1 bg-purple-400 rounded-full animate-pulse"
                                style={{
                                  height: "80%",
                                  animationDelay: "150ms",
                                }}
                              ></div>
                              <div
                                className="w-1 bg-purple-400 rounded-full animate-pulse"
                                style={{
                                  height: "40%",
                                  animationDelay: "300ms",
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-semibold cursor-pointer ${
                            currentSong?.id === song.id
                              ? "text-purple-400"
                              : "text-white"
                          }`}
                          onClick={() => handlePlayPause(song.id)}
                        >
                          {decodeHTMLString(song.name) || "Unknown Song"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {song.artists?.primary
                            ?.map((artist) => artist.name)
                            .join(", ") ||
                            song.primaryArtists ||
                            "Various Artists"}
                        </p>
                      </div>
                    </div>

                    {/* Artist */}
                    <div className="col-span-3 text-sm text-gray-400">
                      {song.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ") || "Various Artists"}
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 text-sm text-gray-400">
                      {song.duration
                        ? Math.floor(song.duration / 60) +
                          ":" +
                          String(song.duration % 60).padStart(2, "0")
                        : "--:--"}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleLike(song.id)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-400 hover:text-white"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 text-gray-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show infinite loading indicator */}
            {loading && page > 1 && hasMore && <InfiniteLoadingIndicator />}
          </div>

          {/* No more results */}
          {!hasMore && allSongs.length > 0 && (
            <div className="text-center py-8 md:py-12">
              <div className="text-gray-400 text-sm md:text-base">
                🎵 You&apos;ve reached the end of the playlist!
              </div>
            </div>
          )}
        </div>

        {/* Queue Overlay (Mobile & Desktop) */}
        <Queue
          isVisible={showQueue}
          onClose={() => dispatch(setShowQueue(false))}
          showNowPlaying={true}
          allowPlayFromQueue={true}
          allowRemoveFromQueue={true}
        />
      </div>
    </>
  );
};

export default SongDetails;
