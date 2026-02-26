"use client";
export const dynamic = "force-dynamic";
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
  Loader,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useGetTracksByIdQuery } from "@/redux/features/api/musicApi";
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
import Queue from "@/components/queue";
import { RootState } from "@/redux/store";
import { downloadMP4WithMetadata } from "@/utils/download";
import { useDownloadProgress } from "@/hooks/useDownloadProgress";
import DownloadProgress from "@/components/DownloadProgress";
import { downloadPlaylistAsZip } from "@/utils/playlistDownload";
import PlaylistDownloadProgress from "@/components/playlistDownloadProgress";
import {
  deductUserCredits,
  getUserSubscription,
} from "@/lib/supabasefunctions";
import {
  fetchUserLikes,
  saveToListeningHistory,
  toggleSongLike,
  trackSongPlay,
} from "@/lib/supabasefunctions";
import PlaylistModal from "@/components/PlaylistModal";
import { handleLikePlaylist } from "@/lib/supabasefunctions";
import { createClient } from "@/lib/supabase";
interface Song {
  id: string;
  name: string;
  artist: string;
  album?: string;
  year?: string;
  url?: string;
  downloadUrl?: string;
  image?: string;
  duration?: number;
}

// Add this component inside your PlaylistDetailsPage or as a separate file
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

const PlaylistDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [isPlaylistLiked, setIsPlaylistLiked] = useState(false);
  const [playedSongsInSession, setPlayedSongsInSession] = useState(new Set());
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const headerRef = useRef(null);
  const observerRef = useRef(null);
  const dispatch = useDispatch();
  const {
    startDownload,
    updateProgress,
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
  const supabase = createClient();

  useEffect(() => {
    if (playlistDownload.isDownloading && !showProgressDialog) {
      setShowProgressDialog(true);
    }
  }, [playlistDownload.isDownloading]);
  // Fetch data with current page
  const {
    data: playlist,
    isLoading: loadingPlaylists,
    isFetching,
    error,
  } = useGetTracksByIdQuery(
    { id: params.slug, page: currentPage },
    {
      refetchOnMountOrArgChange: true,
      skip: !params.slug,
    }
  );
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (user) {
        const subscription = await getUserSubscription();
        setCurrentSubscription(subscription);
      }
    };

    fetchUserSubscription();
  }, [user]);
  const { isPlaying, currentSong, queue, showQueue, isShuffleOn, repeatMode } =
    useSelector((state: RootState) => state.player);

  const totalSongs = params.totalSongs;
  const playlistName = params.seoUrl; // "best-of-indipop-hindi"
  const playlistId = params.slug; // "940775963"
  const autoPlay = params.autoPlay;

  // Reset pagination when playlist changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [params.slug]);
  useEffect(() => {
    const loadLikedSongs = async () => {
      const liked = await fetchUserLikes();
      setLikedSongs(new Set(liked));
    };

    loadLikedSongs();
  }, []);
  // Check if we have more pages to load
  useEffect(() => {
    if (playlist) {
      const currentResults = playlist.songs?.length || 0;
      const total = totalSongs || 0;
      setHasMore(currentResults < total && currentResults >= 10);
    }
  }, [playlist, totalSongs]);
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
    if (!user) {
      alert("Please login to download songs.");
      return;
    }

    try {
      console.log("🔍 Checking credits for song download...");

      // Check and deduct 1 credit for song download
      const result = await deductUserCredits(user.id, 1, "song");

      console.log("✅ Credit deducted:", result);

      // Update local subscription state
      if (result.remainingCredits !== "unlimited") {
        setCurrentSubscription((prev) => ({
          ...prev,
          credits_remaining: result.remainingCredits,
        }));
      }

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

      // Show success message with remaining credits
      if (result.remainingCredits === "unlimited") {
        console.log("✅ Song downloaded (Unlimited plan)");
      } else {
        console.log(
          `✅ Song downloaded! ${result.remainingCredits} credits remaining`
        );
      }
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(error.message || "Failed to download song");
    }
  };

  const handleDownloadPlaylist = async () => {
    if (!user) {
      alert("Please login to download playlists.");
      return;
    }

    if (!allSongs.length) {
      alert("No songs available to download.");
      return;
    }

    try {
      console.log("🔍 Checking credits for playlist download...");

      // Check and deduct 2 credits for playlist download
      const result = await deductUserCredits(user.id, 2, "playlist");

      console.log("✅ Credits deducted:", result);

      // Update local subscription state
      if (result.remainingCredits !== "unlimited") {
        setCurrentSubscription((prev) => ({
          ...prev,
          credits_remaining: result.remainingCredits,
        }));
      }

      console.log("🚀 Starting playlist download...");
      startPlaylistDownload();
      setShowProgressDialog(true);

      const { errors } = await downloadPlaylistAsZip(
        allSongs,
        playlist?.name || "Playlist",
        (progress) => {
          updatePlaylistProgress({
            ...progress,
            isDownloading: true,
          });
        }
      );

      completePlaylistDownload(errors);

      // Show success message with remaining credits
      if (result.remainingCredits === "unlimited") {
        console.log("✅ Playlist downloaded (Unlimited plan)");
      } else {
        console.log(
          `✅ Playlist downloaded! ${result.remainingCredits} credits remaining`
        );
      }
    } catch (error) {
      console.error("❌ Playlist download failed:", error);
      alert(error.message || "Failed to download playlist");
      cancelPlaylistDownload();
      setShowProgressDialog(false);
    }
  };
  const handleLikeCurrentPlaylist = async () => {
    const success = await handleLikePlaylist(playlist, allSongs);
    if (success) {
      setIsPlaylistLiked(true);
      // Optional: Add visual feedback or refresh user playlists
    }
  };
  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(
    (node) => {
      if (loadingPlaylists || isFetching) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setCurrentPage((prevPage) => prevPage + 1);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [loadingPlaylists, isFetching, hasMore]
  );

  // Memoize all songs for better performance
  const allSongs = useMemo(() => {
    return playlist?.songs || [];
  }, [playlist?.songs]);

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
  }, [allSongs, dispatch]);
  useEffect(() => {
    const checkIfPlaylistLiked = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !playlist) return;

      const { data } = await supabase
        .from("user_playlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", playlist.name)
        .single();

      setIsPlaylistLiked(!!data);
    };

    if (playlist) {
      checkIfPlaylistLiked();
    }
  }, [playlist]);
  // Check for auto-play on mount

  useEffect(() => {
    const shouldAutoPlay = autoPlay === "true";
    if (shouldAutoPlay && allSongs.length > 0) {
      handlePlayPlaylist(true);

      // Update URL to set autoPlay to false
      // You'll need to navigate to a new URL since these are route params
      router.replace(
        `/songs/${playlistName}/${playlistId}/false/${totalSongs}`
      );
    }
  }, [allSongs.length, autoPlay, playlistName, playlistId, totalSongs]);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // if (!user) {
      //   router.push("/auth");
      //   return;
      // }

      setUser(user);
      const userSubscription = await getUserSubscription();
      setSubscription(userSubscription);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollTop = window.scrollY;
        setScrolled(scrollTop > 200); // Reduced for mobile
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

          // 🔒 Only track play count if song hasn't been played in this session
          if (!playedSongsInSession.has(songId)) {
            console.log("Tracking play for first time:", songToPlay.name);
            trackSongPlay(songToPlay?.duration);
            saveToListeningHistory(songToPlay);
            setPlayedSongsInSession((prev) => new Set(prev).add(songId));
          } else {
            console.log(
              "Song already played in this session, not tracking again"
            );
          }
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

  const handleToggleLike = async (songId) => {
    const isCurrentlyLiked = likedSongs.has(songId);
    const newLikeStatus = await toggleSongLike(songId, isCurrentlyLiked);

    setLikedSongs((prev) => {
      const newSet = new Set(prev);
      if (newLikeStatus) {
        newSet.add(songId);
      } else {
        newSet.delete(songId);
      }
      return newSet;
    });
  };
  const handleAddToPlaylist = (song) => {
    setSelectedSong(song);
    setPlaylistModalOpen(true);
  };
  const handleFollow = () => {
    // Implement follow functionality
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

  // Show initial loading for first page
  if (loadingPlaylists && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
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
                <img
                  src={playlist?.image?.[2]?.url}
                  alt={playlist?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold truncate">{playlist?.name}</h1>
                <p className="text-xs text-gray-400">{allSongs.length} songs</p>
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
            ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-3"
            : "bg-transparent py-6 top-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
          {scrolled && (
            <>
              <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-purple-500/30">
                <Image
                  src={playlist?.image?.[2]?.url || "/placeholder-album.jpg"}
                  alt={playlist?.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">{playlist?.name}</h1>
                <p className="text-sm text-gray-400">
                  {allSongs.length} songs
                  {isFetching && currentPage > 1 && (
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
                  <img
                    src={playlist?.image?.[2]?.url}
                    alt={playlist?.name}
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
                  {playlist?.name}
                </h1>
                <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0">
                  {playlist?.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{playlist?.followerCount || 0} followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {allSongs.length} songs
                    {hasMore && (
                      <span className="text-purple-400 ml-1">
                        (More available)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated recently</span>
                </div>
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
                  {isPlaying && isCurrentPlaylist ? "Pause" : "Play"}
                </button>

                <button
                  onClick={handleFollow}
                  className="px-4 md:px-6 py-2.5 md:py-3 rounded-full font-semibold text-sm md:text-base transition-all duration-300 bg-transparent border border-white/20 hover:border-white/40"
                >
                  Follow
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLikeCurrentPlaylist}
                    disabled={isPlaylistLiked}
                    className={`p-2 md:p-3 rounded-full transition-colors duration-300 group ${
                      isPlaylistLiked
                        ? "bg-red-600/20 text-red-500"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    title={
                      isPlaylistLiked
                        ? "Already in your library"
                        : "Save to your library"
                    }
                  >
                    <Heart
                      className={`w-4 h-4 md:w-5 md:h-5 ${
                        isPlaylistLiked
                          ? "fill-current text-red-500"
                          : "group-hover:text-red-400"
                      }`}
                    />
                  </button>

                  <button className="p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <button
                    onClick={handleDownloadPlaylist}
                    disabled={
                      playlistDownload.isDownloading ||
                      allSongs.length === 0 ||
                      (!currentSubscription?.is_unlimited &&
                        currentSubscription?.credits_remaining < 2)
                    }
                    className={`
          relative flex items-center justify-center gap-2 md:gap-3 
          px-4 md:px-6 py-3 md:py-3.5 
          rounded-full font-semibold text-sm md:text-base 
          transition-all duration-300 
          min-w-[140px] md:min-w-[160px]
          ${
            playlistDownload.isDownloading
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 cursor-not-allowed"
              : !currentSubscription?.is_unlimited &&
                currentSubscription?.credits_remaining < 2
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:scale-105"
          }
          shadow-lg shadow-green-500/25
          active:scale-95 md:active:scale-105
          touch-manipulation
        `}
                    title={
                      !currentSubscription?.is_unlimited &&
                      currentSubscription?.credits_remaining < 2
                        ? "Need 2 credits to download playlist"
                        : "Download entire playlist"
                    }
                  >
                    {playlistDownload.isDownloading ? (
                      <>
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="font-medium">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Download All</span>
                        {!currentSubscription?.is_unlimited && (
                          <span className="text-xs opacity-75 bg-black/30 px-2 py-1 rounded">
                            2 credits
                          </span>
                        )}
                        {allSongs.length > 0 && (
                          <span className="text-xs opacity-75">
                            ({allSongs.length})
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  <PlaylistDownloadProgress
                    isVisible={
                      showProgressDialog && playlistDownload.isDownloading
                    }
                    currentSong={playlistDownload.currentSong || 0}
                    totalSongs={playlistDownload.totalSongs || 0}
                    currentSongProgress={
                      playlistDownload.currentSongProgress || 0
                    }
                    currentSongStatus={playlistDownload.currentSongStatus || ""}
                    overallProgress={playlistDownload.overallProgress || 0}
                    currentSongName={playlistDownload.currentSongName || ""}
                    errors={playlistDownload.errors || []}
                    onClose={() => setShowProgressDialog(false)} // Just minimize
                    onCancel={() => {
                      cancelPlaylistDownload();
                      setShowProgressDialog(false);
                    }} // Actually cancel
                  />
                  <MinimizedProgressIndicator
                    playlistDownload={playlistDownload}
                    onExpand={() => setShowProgressDialog(true)}
                    onCancel={() => {
                      cancelPlaylistDownload();
                      setShowProgressDialog(false);
                    }}
                  />

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
              Songs ({allSongs.length}
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
            <div className="col-span-3">Album</div>
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
                key={song.id}
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
                    <img
                      src={song.image?.[2]?.url}
                      alt={song.name}
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
                      className={`font-semibold text-sm truncate cursor-pointer ${
                        currentSong?.id === song.id
                          ? "text-purple-400"
                          : "text-white"
                      }`}
                      onClick={() => handlePlayPause(song.id)}
                    >
                      {song.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {song.artists?.primary
                        ?.map((artist) => artist.name)
                        .join(", ") || "Unknown Artist"}
                    </p>
                  </div>

                  {/* Mobile Layout - Update the download section */}
                  <div className="flex items-center gap-1">
                    {/* Duration */}
                    <span className="text-xs text-gray-400 mr-2">
                      {song.duration
                        ? Math.floor(song.duration / 60) +
                          ":" +
                          String(song.duration % 60).padStart(2, "0")
                        : "--:--"}
                    </span>

                    {/* Heart Button */}
                    <button
                      onClick={() => handleToggleLike(song.id)}
                      className={`p-2 rounded-full transition-colors ${
                        likedSongs.has(song.id)
                          ? "text-red-500 hover:text-red-400"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                      title={
                        likedSongs.has(song.id) ? "Unlike song" : "Like song"
                      }
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedSongs.has(song.id) ? "fill-current" : ""
                        }`}
                      />
                    </button>

                    {/* Add to Playlist Button */}
                    <button
                      onClick={() => handleAddToPlaylist(song)}
                      className="p-2 rounded-full text-gray-400 hover:text-purple-400 transition-colors"
                      title="Add to playlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Download Button */}
                    <div className="min-w-[90px] flex justify-end">
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
                      <img
                        src={song.image?.[2]?.url}
                        alt={song.name}
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
                    <div>
                      <h3
                        className={`font-semibold cursor-pointer ${
                          currentSong?.id === song.id
                            ? "text-purple-400"
                            : "text-white"
                        }`}
                        onClick={() => handlePlayPause(song.id)}
                      >
                        {song.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {song.artists?.primary
                          ?.map((artist) => artist.name)
                          .join(", ") || "Unknown Artist"}
                      </p>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="col-span-3 text-sm text-gray-400">
                    {song.album?.name || "Unknown Album"}
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 text-sm text-gray-400">
                    {song.duration
                      ? Math.floor(song.duration / 60) +
                        ":" +
                        String(song.duration % 60).padStart(2, "0")
                      : "--:--"}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <div className="flex items-center gap-2">
                      {/* Heart Button */}
                      <button
                        onClick={() => handleToggleLike(song.id)}
                        className={`p-2 rounded-full transition-colors ${
                          likedSongs.has(song.id)
                            ? "text-red-500 hover:text-red-400"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                        title={
                          likedSongs.has(song.id) ? "Unlike song" : "Like song"
                        }
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            likedSongs.has(song.id) ? "fill-current" : ""
                          }`}
                        />
                      </button>

                      {/* Add to Playlist Button */}
                      <button
                        onClick={() => handleAddToPlaylist(song)}
                        className="p-2 rounded-full text-gray-400 hover:text-purple-400 transition-colors"
                        title="Add to playlist"
                      >
                        <Plus className="w-4 h-4" />
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
                          onClick={() => handleDownloadSong(song)}
                          disabled={
                            !currentSubscription?.is_unlimited &&
                            currentSubscription?.credits_remaining < 1
                          }
                          className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center ${
                            !currentSubscription?.is_unlimited &&
                            currentSubscription?.credits_remaining < 1
                              ? "bg-gray-600 cursor-not-allowed opacity-50 text-gray-400"
                              : "bg-white/10 hover:bg-white/20 active:bg-white/30 text-gray-300 hover:text-white"
                          }`}
                          title={
                            !currentSubscription?.is_unlimited &&
                            currentSubscription?.credits_remaining < 1
                              ? "Need 1 credit to download song"
                              : "Download song (1 credit)"
                          }
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show infinite loading indicator */}
          {isFetching && currentPage > 1 && hasMore && (
            <InfiniteLoadingIndicator />
          )}
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

      <Queue
        isVisible={showQueue}
        onClose={() => dispatch(setShowQueue(false))}
        showNowPlaying={true}
        allowPlayFromQueue={true}
        allowRemoveFromQueue={true}
      />
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => {
          setPlaylistModalOpen(false);
          setSelectedSong(null);
        }}
        songId={selectedSong?.id}
        songName={selectedSong?.name}
      />
    </div>
  );
};

export default PlaylistDetailsPage;
