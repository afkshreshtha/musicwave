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
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { playPause, playSong } from "@/redux/features/musicPlayerSlice";
import { useGetSongByIdQuery } from "@/redux/features/api/musicApi";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Link from "next/link";
import { RootState } from "@/redux/store";

const SongDetailPage = () => {
  const { slug,autoPlay } = useParams();
  const router = useRouter();
 
  const [scrolled, setScrolled] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isInPlaylist, setIsInPlaylist] = useState(false);

  const headerRef = useRef(null);
  const dispatch = useDispatch();
  const params = useParams()
 

  // Get song data using RTK Query
  const {
    data: songData,
    isLoading: songLoading,
    error: songError,
  } = useGetSongByIdQuery({ id: slug });

  const song = songData?.data || {};


  const { isPlaying, currentSong } = useSelector((state:RootState) => state.player);
  const songName = params.seoUrl; // "best-of-indipop-hindi"
  const songId = params.slug; // "940775963"
  // Utility function to decode HTML strings
  const decodeHTMLString = (str) => {
    return (
      str
        ?.replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">") || ""
    );
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format number (for play counts, etc.)
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollTop = window.scrollY;
        setScrolled(scrollTop > 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for auto-play on mount
  useEffect(() => {
    const shouldAutoPlay =  autoPlay=== "true";
    if (shouldAutoPlay && song.id) {
      handlePlaySong(true);
      router.replace(
        `/song/${songName}/${songId}/false/0`
      );
    }
  }, [song.id,  autoPlay]);

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    // Implement actual like API call here

  };

  const handleAddToPlaylist = () => {
    setIsInPlaylist(!isInPlaylist);
    // Implement add to playlist functionality
 
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
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isCurrentSong = currentSong?.id === song.id;

  // Simple Loading Component
  const LoadingSkeleton = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 pointer-events-none"></div>

        <div className="relative pt-16 md:pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center gap-8">
              <div className="w-80 h-80 md:w-96 md:h-96 bg-gray-700 rounded-3xl animate-pulse"></div>
              <div className="text-center space-y-4 w-full max-w-2xl">
                <div className="h-12 bg-gray-600 rounded w-3/4 mx-auto animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto animate-pulse"></div>
                <div className="flex justify-center gap-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-16 h-16 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-16 h-16 bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (songLoading) {
    return (
      <>
        <Navbar />
        <LoadingSkeleton />
      </>
    );
  }

  // Show error state
  if (!song.id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg md:text-xl text-red-400 mb-4">
              Song not found
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go Back
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
                  <p className="text-xs text-gray-400">
                    {song.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ")}
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300"
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
              ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-3"
              : "bg-transparent py-6 top-20"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {scrolled && (
              <>
                <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-purple-500/30">
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
                  <p className="text-sm text-gray-400">
                    {song.artists?.primary
                      ?.map((artist) => artist.name)
                      .join(", ")}
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
              {/* Song Cover Art */}
              <div className="relative group">
                <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                  <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

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
                        className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                      >
                        {isPlaying && isCurrentSong ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Playing Animation */}
                    {isPlaying && isCurrentSong && (
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                          <div className="flex gap-0.5">
                            <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                            <div
                              className="w-1 h-4 bg-purple-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-1 h-2 bg-purple-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                          <span className="text-xs text-white ml-2">
                            Now Playing
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div className="text-center space-y-6 max-w-4xl">
                {/* Enhanced version with artist images */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-lg md:text-xl text-gray-300">
                  <span>by</span>
                  {song.artists?.primary?.map((artist, index) => (
                    <React.Fragment key={artist.id}>
                      <Link
                        href={`/artist/${artist.name}/${artist.id}/false/0`}
                        className="group flex items-center gap-2 hover:text-purple-400 transition-colors duration-200"
                      >
                        {artist.image && (
                          <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover:ring-purple-400/50 transition-all duration-200">
                            <Image
                              src={
                                artist.image[0]?.url ||
                                "/placeholder-artist.jpg"
                              }
                              alt={artist.name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="font-medium group-hover:underline underline-offset-4 decoration-purple-400/50">
                          {artist.name}
                        </span>
                      </Link>
                      {index < song.artists.primary.length - 1 && (
                        <span className="text-gray-500 mx-1">,</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handlePlayPause}
                    className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
                  >
                    {isPlaying && isCurrentSong ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                    {isPlaying && isCurrentSong ? "Pause" : "Play Song"}
                  </button>

                  <button
                    onClick={handleAddToPlaylist}
                    className={`px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 border ${
                      isInPlaylist
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-transparent border-white/20 hover:border-white/40"
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
                      className={`p-3 rounded-full transition-colors duration-300 group ${
                        isLiked
                          ? "bg-red-500 text-white"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isLiked ? "fill-current" : "group-hover:text-red-400"
                        }`}
                      />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>

                    <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                      <Download className="w-5 h-5" />
                    </button>

                    <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32 space-y-12">
          {/* Song Info Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Album className="w-6 h-6 text-purple-400" />
              Song Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {song.album && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Album:</span>
                  <span className="text-white font-medium">
                   <Link href={`/album/${song.album.name}/${song.album.id}/false/0`}>
                      {song.album.name}
                   </Link>
                 
                  </span>
                </div>
              )}

              {song.language && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Language:</span>
                  <span className="text-white font-medium">
                    {song.language}
                  </span>
                </div>
              )}
              {song.playCount && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Listeners:</span>
                  <span className="text-white font-medium">
                    {formatNumber(song.playCount)}
                  </span>
                </div>
              )}

              {song.year && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Year:</span>
                  <span className="text-white font-medium">{song.year}</span>
                </div>
              )}

              {song.duration && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Duration:</span>
                  <span className="text-white font-medium">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              )}

              {song.bitrate && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Quality:</span>
                  <span className="text-white font-medium">
                    {song.bitrate} kbps
                  </span>
                </div>
              )}

              {song.label && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-20">Label:</span>
                  <span className="text-white font-medium">{song.label}</span>
                </div>
              )}
              {/* Enhanced version with artist images */}
            </div>
          </div>

          {/* Comments Section (Placeholder) */}
        </div>
      </div>
    </>
  );
};

export default SongDetailPage;
