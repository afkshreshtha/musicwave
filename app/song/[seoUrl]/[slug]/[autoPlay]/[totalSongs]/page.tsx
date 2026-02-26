"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Heart,
  Share2,
  Download,
  MoreHorizontal,
  ArrowLeft,
  Album,
  Plus,
  Check,
  Clock,
  Users,
  Calendar,
  Headphones,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { playPause, playSong } from "@/redux/features/musicPlayerSlice";
import { useGetSongByIdQuery } from "@/redux/features/api/musicApi";

import Image from "next/image";
import Link from "next/link";
import { RootState } from "@/redux/store";
import {
  deductUserCredits,
  fetchUserLikes,
  getUserSubscription,
  toggleSongLike,
} from "@/lib/supabasefunctions";
import { supabase } from "@/lib/supabase";
import { downloadMP4WithMetadata } from "@/utils/download";
import { useDownloadProgress } from "@/hooks/useDownloadProgress";
import DownloadProgress from "@/components/DownloadProgress";
import LikedSongs from "@/components/likedSongs";
import PlaylistModal from "@/components/PlaylistModal";
import SongLyrics from "@/components/SongsLyrics"; // 👈 NEW

const SongDetailPage = () => {
  const { slug, autoPlay } = useParams();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const headerRef = useRef(null);
  const dispatch = useDispatch();
  const params = useParams();
  const {
    startDownload,
    updateProgress,
    completeDownload,
    cancelDownload,
    getDownloadState,
    clearDownloadState,
  } = useDownloadProgress();

  const {
    data: songData,
    isLoading: songLoading,
    error: songError,
  } = useGetSongByIdQuery({ id: slug });

  const song = songData?.data || {};

  const { isPlaying, currentSong } = useSelector(
    (state: RootState) => state.player
  );
  const songName = params.seoUrl;
  const songId = params.slug;

  const decodeHTMLString = (str) => {
    return (
      str
        ?.replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">") || ""
    );
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const subscription = await getUserSubscription();
        setCurrentSubscription(subscription);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        setScrolled(window.scrollY > 300);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const shouldAutoPlay = autoPlay === "true";
    if (shouldAutoPlay && song.id) {
      handlePlaySong(true);
      router.replace(`/song/${songName}/${songId}/false/0`);
    }
  }, [song.id, autoPlay]);

  const handlePlaySong = (autoPlay = false) => {
    if (song.id) {
      dispatch(playSong(song));
      if (autoPlay && !isPlaying) {
        dispatch(playPause());
      }
    }
  };

  const handlePlayPause = () => {
    if (currentSong?.id === song.id) {
      dispatch(playPause());
    } else {
      handlePlaySong(true);
    }
  };

  useEffect(() => {
    const loadLikedSongs = async () => {
      const liked = await fetchUserLikes();
      setLikedSongs(new Set(liked));
    };
    loadLikedSongs();
  }, []);

  const handleLike = async () => {
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: song.name || song.title,
        text: `Listen to ${song.name || song.title} by ${song.artists?.primary
          ?.map((a) => a.name)
          .join(", ")}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownloadSong = async () => {
    if (!user) {
      alert("Please login to download songs.");
      return;
    }
    if (!song.id) {
      alert("Song data not available.");
      return;
    }
    try {
      const result = await deductUserCredits(user.id, 1, "song");
      if (result.remainingCredits !== "unlimited") {
        setCurrentSubscription((prev) => ({
          ...prev,
          credits_remaining: result.remainingCredits,
        }));
      }
      const downloadUrl =
        song.downloadUrl?.[4]?.url || song.streamUrl || song.url;
      if (!downloadUrl) throw new Error("Download URL not available");

      const safeName = `${song.name || song.title || "track"} - ${
        song.artists?.primary?.[0]?.name || "unknown"
      }`.replace(/[^\w\-\s\.\(\)\[\]]/g, "_");

      startDownload(song.id);
      await downloadMP4WithMetadata(
        downloadUrl,
        safeName,
        {
          title: song.name || song.title || "Unknown Title",
          artist: song.artists?.primary?.[0]?.name || "Unknown Artist",
          album: song.album?.name || "Unknown Album",
          year: song.year,
          coverUrl: song.image?.[2]?.url || "/placeholder-album.jpg",
        },
        (progress, status) => {
          updateProgress(song.id, progress, status);
        }
      );
      completeDownload(song.id);
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(error.message || "Failed to download song");
    }
  };

  const isCurrentSong = currentSong?.id === song.id;

  // ── Primary artist name for lyrics (first primary artist) ──────────────
  const primaryArtistName =
    song.artists?.primary?.[0]?.name || "";

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-blue-500/5 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-blue-900/20 pointer-events-none"></div>
      <div className="relative pt-16 md:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-8">
            <div className="w-80 h-80 md:w-96 md:h-96 bg-gray-300 dark:bg-gray-700 rounded-3xl animate-pulse shadow-2xl"></div>
            <div className="text-center space-y-4 w-full max-w-2xl">
              <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-xl w-3/4 mx-auto animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mx-auto animate-pulse"></div>
              <div className="flex justify-center gap-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (songLoading) return <LoadingSkeleton />;

  if (!song.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white flex items-center justify-center px-4">
        <div className="text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-700/60 p-8 shadow-2xl max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-lg md:text-xl text-red-600 dark:text-red-400 mb-4 font-semibold">
            Song not found
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The song you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 hover:scale-105 font-medium shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black text-gray-900 dark:text-white relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-blue-500/5 dark:from-purple-900/20 dark:via-pink-900/10 dark:to-blue-900/20 pointer-events-none"></div>

        {/* Mobile Navigation Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {scrolled && (
              <>
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={song.image?.[2]?.url || "/placeholder-song.jpg"}
                    alt={decodeHTMLString(song.name || song.title)}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold truncate">
                    {decodeHTMLString(song.name || song.title)}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {song.artists?.primary?.map((artist) => artist.name).join(", ")}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {isPlaying && isCurrentSong ? (
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
              ? "bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 py-3"
              : "bg-transparent py-6 top-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {scrolled && (
              <>
                <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-purple-500/30 shadow-lg">
                  <Image
                    src={song.image?.[2]?.url || "/placeholder-song.jpg"}
                    alt={decodeHTMLString(song.name || song.title)}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {decodeHTMLString(song.name || song.title)}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {song.artists?.primary?.map((artist) => artist.name).join(", ")}
                  </p>
                </div>
              </>
            )}
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                {isPlaying && isCurrentSong ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative pt-16 md:pt-20 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center gap-8 md:gap-12">
              {/* Cover Art */}
              <div className="relative group">
                <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-gray-500/20 dark:shadow-black/50">
                  <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 dark:from-purple-500/30 dark:via-pink-500/30 dark:to-blue-500/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-full h-full">
                    <Image
                      src={song.image?.[2]?.url || "/placeholder-song.jpg"}
                      alt={decodeHTMLString(song.name || song.title)}
                      width={384}
                      height={384}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={handlePlayPause}
                        className="w-20 h-20 bg-white/25 dark:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/35 dark:hover:bg-white/30 transition-colors duration-300 shadow-xl"
                      >
                        {isPlaying && isCurrentSong ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>
                    {isPlaying && isCurrentSong && (
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-2 bg-black/60 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                          <div className="flex gap-0.5">
                            <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-1 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                          <span className="text-xs text-white font-medium">Now Playing</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div className="text-center space-y-6 max-w-4xl">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent leading-tight">
                    {decodeHTMLString(song.name || song.title)}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6">
                    <span>by</span>
                    {song.artists?.primary?.map((artist, index) => (
                      <React.Fragment key={artist.id}>
                        <Link
                          href={`/artist/${artist.name}/${artist.id}/false/0`}
                          className="group flex items-center gap-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                        >
                          {artist.image && (
                            <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover:ring-purple-500/60 transition-all duration-200 shadow-md">
                              <Image
                                src={artist.image[0]?.url || "/placeholder-artist.jpg"}
                                alt={artist.name}
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="font-semibold group-hover:underline underline-offset-4 decoration-purple-500/50">
                            {artist.name}
                          </span>
                        </Link>
                        {index < song.artists.primary.length - 1 && (
                          <span className="text-gray-400 dark:text-gray-500 mx-1">,</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8">
                    {song.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(song.duration)}</span>
                      </div>
                    )}
                    {song.playCount && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(song.playCount)} plays</span>
                      </div>
                    )}
                    {song.year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{song.year}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handlePlayPause}
                    className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25 text-white"
                  >
                    {isPlaying && isCurrentSong ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                    {isPlaying && isCurrentSong ? "Pause" : "Play Song"}
                  </button>

                  <button
                    onClick={() => handleAddToPlaylist(song)}
                    className={`px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 border ${
                      isInPlaylist
                        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/25"
                        : "bg-transparent border-gray-300 dark:border-white/20 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    }`}
                  >
                    {isInPlaylist ? (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Added
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add to Playlist
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLike}
                      className={`p-3 rounded-full transition-all duration-300 group ${
                        likedSongs.has(songId)
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-gray-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-900/20"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${likedSongs ? "fill-current" : "group-hover:text-red-500"}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors duration-300"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
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
                        onClick={handleDownloadSong}
                        disabled={
                          !currentSubscription?.is_unlimited &&
                          currentSubscription?.credits_remaining < 1
                        }
                        className={`p-3 rounded-full transition-all duration-300 ${
                          !currentSubscription?.is_unlimited &&
                          currentSubscription?.credits_remaining < 1
                            ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-50"
                            : "bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20"
                        }`}
                        title={
                          !currentSubscription?.is_unlimited &&
                          currentSubscription?.credits_remaining < 1
                            ? "Need 1 credit to download song"
                            : "Download song (1 credit)"
                        }
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-3 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors duration-300">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32 space-y-8">

          {/* ── Song Info ── */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-none">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Album className="w-5 h-5 text-white" />
              </div>
              Song Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {song.album && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-200">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Album:</span>
                  <Link
                    href={`/album/${song.album.name}/${song.album.id}/false/0`}
                    className="text-gray-900 dark:text-white font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    {song.album.name}
                  </Link>
                </div>
              )}
              {song.language && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Language:</span>
                  <span className="text-gray-900 dark:text-white font-semibold capitalize">{song.language}</span>
                </div>
              )}
              {song.playCount && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Plays:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{formatNumber(song.playCount)}</span>
                </div>
              )}
              {song.year && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Year:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{song.year}</span>
                </div>
              )}
              {song.duration && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Duration:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{formatDuration(song.duration)}</span>
                </div>
              )}
              {song.bitrate && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Quality:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{song.bitrate} kbps</span>
                </div>
              )}
              {song.label && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                  <span className="text-gray-500 dark:text-gray-400 w-20 font-medium">Label:</span>
                  <span className="text-gray-900 dark:text-white font-semibold">{song.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Lyrics ── */}
          <SongLyrics
            artistName={primaryArtistName}
            songName={decodeHTMLString(song.name || song.title)}
            decodeHTMLString={decodeHTMLString}
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
      </div>
    </>
  );
};

export default SongDetailPage;