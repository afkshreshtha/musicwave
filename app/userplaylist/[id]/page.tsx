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
  Music,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  useGetPlaylistByIdQuery,
  useGetSongByIdQuery,
  useGetSongsByIdsQuery,
} from "@/redux/features/api/musicApi";
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

import Image from "next/image";
import usePlaylist from "@/hooks/usePlaylist";
import useQueue from "@/hooks/useQueue";
import Queue from "@/components/queue";
import { RootState } from "@/redux/store";
import { useDownloadProgress } from "@/hooks/useDownloadProgress";
import { downloadPlaylistAsZip } from "@/utils/playlistDownload";
import { downloadMP4WithMetadata } from "@/utils/download";
import PlaylistDownloadProgress from "@/components/playlistDownloadProgress";
import DownloadProgress from "@/components/DownloadProgress";
import { fetchPlaylistSongsById, trackSongPlay } from "@/lib/supabasefunctions";
const MinimizedProgressIndicator = ({ playlistDownload, onExpand }) => {
  if (!playlistDownload.isDownloading) return null;

  return (
    <div className="fixed top-20  md:top-20 right-4 z-50">
      {" "}
      {/* Fixed positioning too */}
      <div className="bg-gray-900 border border-white/20 rounded-2xl shadow-2xl p-4 min-w-[280px] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Progress Circle */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-gray-600"
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                strokeWidth="2"
              />
              <path
                className="stroke-purple-500"
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                strokeWidth="2"
                strokeDasharray={`${playlistDownload.overallProgress}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <Download className="w-5 h-5 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Progress Info */}
          <div className="flex-1 min-w-0" onClick={onExpand}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-white text-sm font-medium cursor-pointer">
                Downloading Playlist
              </p>
              <span className="text-xs text-purple-400 bg-purple-600/20 px-2 py-1 rounded-full">
                {playlistDownload.currentSong}/{playlistDownload.totalSongs}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 truncate cursor-pointer">
                {playlistDownload.currentSongName || "Processing..."}
              </p>
              <span className="text-xs text-gray-400">
                {Math.round(playlistDownload.overallProgress)}%
              </span>
            </div>
          </div>

          {/* Close Button - ADD THIS! */}
        </div>
      </div>
    </div>
  );
};
const SongDetails = () => {
  const { slug, songcount, autoPlay } = useParams();
  const params = useParams();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [page, setPage] = useState(1);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [playlistData, setPlaylistData] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
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
  const headerRef = useRef(null);
  const dispatch = useDispatch();
  const id = slug;

  // Fixed: Added proper query structure and error handling
  //   const { songs, hasMore, loading, error } = usePlaylist(id, page);
  const songIds = playlistData.map((item) => item.song_id);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  // Get playlist data using RTK Query
  const {
    data: s = [],
    error: songsError,
    isLoading: songsLoading,
  } = useGetSongsByIdsQuery(songIds, {
    skip: songIds.length === 0,
  });

  // Extract playlist info from the data
  const playlist = s?.data || {};

  const {
    isPlaying,
    currentSong,
    currentSongIndex,
    queue,
    isShuffleOn,
    repeatMode,
  } = useSelector((state: RootState) => state.player);

  // Utility function to decode HTML strings
  const decodeHTMLString = (str) => {
    const decodedString = str?.replace(/&quot;/g, '"');
    return decodedString;
  };
  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!params.id) return;

      const data = await fetchPlaylistSongsById(params.id);

      if (data.length > 0) {
        setPlaylistData(data);
        setPlaylistInfo(data[0].user_playlists);
      }
    };

    fetchPlaylistData();
  }, [params.id]);
  const { showQueue, toggleQueueVisibility } = useQueue();
  // Fixed: Renamed lastBookElementRef to lastElementRef for consistency

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

  const handleDownloadPlaylist = async () => {
    console.log("🎯 handleDownloadPlaylist called");
    console.log("🎵 allSongs.length:", allSongs.length);

    if (!allSongs.length) return;

    try {
      console.log("🚀 About to call startPlaylistDownload");
      startPlaylistDownload();
      setShowProgressDialog(true); // Show dialog when starting
      console.log("✅ startPlaylistDownload called");

      const { errors } = await downloadPlaylistAsZip(
        allSongs,
        playlist?.name || "Playlist",
        (progress) => {
          console.log("📊 Progress callback received:", progress);
          updatePlaylistProgress({
            ...progress,
            isDownloading: true,
          });
        }
      );

      completePlaylistDownload(errors);
      // Don't auto-close dialog, let user close it
    } catch (error) {
      console.error("Playlist download failed:", error);
      cancelPlaylistDownload();
      setShowProgressDialog(false);
    }
  };

  // Memoize all songs for better performance
  const allSongs = useMemo(() => {
    return s || [];
  }, [s]);

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
  }, [allSongs.length, autoPlay, router]);

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
        console.log(songToPlay);
      }
      console.log(songToPlay);
      trackSongPlay(songToPlay?.duration);
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

  const handleShuffleToggle = () => {
    dispatch(toggleShuffle());
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

  return (
    <>
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden flex-shrink-0">
                  {playlistInfo?.image_url ? (
                    <Image
                      src={playlistInfo.image_url}
                      alt={playlistInfo.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold truncate text-sm sm:text-base">
                    {playlistInfo?.name || "My Playlist"}
                  </h1>
                  <p className="text-xs text-gray-400 truncate">
                    {allSongs.length} songs
                    {playlistInfo?.created_at && (
                      <span>
                        {" "}
                        • {new Date(playlistInfo.created_at).getFullYear()}
                      </span>
                    )}
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
                  {playlistInfo?.image_url ? (
                    <Image
                      src={playlistInfo.image_url}
                      alt={playlistInfo.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg xl:text-xl font-bold">
                    {playlistInfo?.name || "My Playlist"}
                  </h1>
                  <p className="text-xs xl:text-sm text-gray-400">
                    {allSongs.length} songs
                    {playlistInfo?.created_at && (
                      <span>
                        {" "}
                        • Created{" "}
                        {new Date(playlistInfo.created_at).getFullYear()}
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
              {/* Cover Art - UPDATED */}
              <div className="relative group mx-auto md:mx-0">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                  <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-2xl sm:rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative w-full h-full">
                    {/* Use playlist image if available, otherwise show default */}
                    {playlistInfo?.image_url ? (
                      <Image
                        src={playlistInfo.image_url}
                        alt={playlistInfo.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 192px, (max-width: 768px) 224px, (max-width: 1024px) 256px, 320px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Music className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 text-white" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handlePlayPause()}
                        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                      >
                        {isPlaying && isCurrentPlaylist ? (
                          <Pause className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                        ) : (
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playlist Info */}
              {/* Playlist Info - UPDATED */}
              <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                <div>
                  <p className="text-xs md:text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    My Playlist
                  </p>

                  {/* Playlist Name */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 md:mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                    {playlistInfo?.name || "My Playlist"}
                  </h1>

                  {/* Description - Only show if available */}
                  {playlistInfo?.description && (
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0 mb-3">
                      {playlistInfo.description}
                    </p>
                  )}

                  {/* Created by info */}
                  <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                    Created by you
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm md:text-base text-gray-400">
                  {/* Creation Year - Only show if available */}
                  {playlistInfo?.created_at && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>
                        Created{" "}
                        {new Date(playlistInfo.created_at).getFullYear()}
                      </span>
                    </div>
                  )}

                  {/* Song Count */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{allSongs.length} songs</span>
                  </div>

                  {/* Last Updated - Only show if available */}
                  {playlistInfo?.updated_at &&
                    playlistInfo.updated_at !== playlistInfo.created_at && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>
                          Updated{" "}
                          {new Date(
                            playlistInfo.updated_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                </div>

                {/* Action Buttons - Keep your existing buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 md:gap-4 pt-2 md:pt-4">
                  {/* Your existing action buttons go here */}
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
                Songs ({songcount || allSongs.length})
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
              return (
                <div
                  key={`${song.id}-${index}`}
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
                    <div className="flex items-center gap-1">
                      {/* Duration */}
                      <span className="text-xs text-gray-400 mr-1">
                        {song.duration
                          ? Math.floor(song.duration / 60) +
                            ":" +
                            String(song.duration % 60).padStart(2, "0")
                          : "--:--"}
                      </span>

                      {/* Download Button - Always Visible */}
                      {/* Mobile Layout - Update the download section */}
                      <div className="min-w-[90px] flex justify-end">
                        {getDownloadState(song.id) ? (
                          <DownloadProgress
                            progress={getDownloadState(song.id).progress}
                            status={getDownloadState(song.id).status}
                            error={getDownloadState(song.id).error}
                            onCancel={() => cancelDownload(song.id)}
                            onComplete={() => clearDownloadState(song.id)} // Add this
                            isMobile={true}
                          />
                        ) : (
                          <button
                            onClick={() => handleDownloadSong(song)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all duration-200 flex items-center justify-center text-gray-300 hover:text-white"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                    <div className="col-span-1 flex justify-center">
                      <div className="min-w-[100px] flex justify-center">
                        {getDownloadState(song.id) ? (
                          <DownloadProgress
                            progress={getDownloadState(song.id).progress}
                            status={getDownloadState(song.id).status}
                            error={getDownloadState(song.id).error}
                            onCancel={() => cancelDownload(song.id)}
                            onComplete={() => clearDownloadState(song.id)} // Add this
                            isMobile={false}
                          />
                        ) : (
                          <button
                            onClick={() => handleDownloadSong(song)}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-gray-300 hover:text-white"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show infinite loading indicator */}
          </div>
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
