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
  MoreHorizontal,
  Users,
  Calendar,
  Music,
  Disc,
  ArrowLeft,
  UserPlus,
  UserCheck,
  Shuffle,
  ExternalLink,
  MapPin,
  Award,
  TrendingUp,
  Volume2,
  Loader,
  List,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  playPause,
  playSong,
  setQueue,
  startPlaylist,
} from "@/redux/features/musicPlayerSlice";
import {
  useGetArtistByIdQuery,
  useGetArtistSongsByIdQuery,
  useGetArtistAlbumsByIdQuery,
} from "@/redux/features/api/musicApi";
import Navbar from "@/components/navbar";

import Image from "next/image";
import SortDropdown from "@/components/sort-dropdown";
import useQueue from "@/hooks/useQueue";
import Queue from "@/components/queue";
import { RootState } from "@/redux/store";

const ArtistDetailPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [songCurrentPage, setSongCurrentPage] = useState(1);
  const [albumCurrentPage, setAlbumCurrentPage] = useState(1);
  const [songHasMore, setSongHasMore] = useState(true);
  const [albumHasMore, setAlbumHasMore] = useState(true);
  const [songSort, setSongSort] = useState({
    sortBy: "popularity",
    sortOrder: "desc",
  });
  const [albumSort, setAlbumSort] = useState({
    sortBy: "popularity",
    sortOrder: "desc",
  });

  const headerRef = useRef(null);
  const dispatch = useDispatch();

  // Intersection Observer refs for infinite loading
  const songsObserver = useRef();
  const albumsObserver = useRef();

  // Get artist data using RTK Query
  const {
    data: artistData,
    isLoading: artistLoading,
    error: artistError,
  } = useGetArtistByIdQuery({ id: slug });

  // Get artist songs with pagination
  const {
    data: songsData,
    isLoading: songsLoading,
    isFetching: songsFetching,
  } = useGetArtistSongsByIdQuery({
    id: slug,
    page: songCurrentPage,
    sortBy: songSort.sortBy,
    sortOrder: songSort.sortOrder,
  });

  const {
    data: albumsData,
    isLoading: albumsLoading,
    isFetching: albumsFetching,
  } = useGetArtistAlbumsByIdQuery({
    id: slug,
    page: albumCurrentPage,
    sortBy: albumSort.sortBy,
    sortOrder: albumSort.sortOrder,
  });

  // Handle sort changes
  const handleSongSortChange = (newSort) => {
    setSongSort(newSort);
    setSongCurrentPage(1); // Reset to first page
    setSongHasMore(true);
  };

  const handleAlbumSortChange = (newSort) => {
    setAlbumSort(newSort);
    setAlbumCurrentPage(1); // Reset to first page
    setAlbumHasMore(true);
  };

  const artist = artistData?.data || {};
  const songs = songsData;
  const albums = albumsData; // Note: albums are in 'songs' property based on your API

  console.log("Songs data:", songs);
  console.log("Albums data:", albums);
  console.log("Artist data:", artist);

  const { isPlaying, currentSong, queue } = useSelector(
    (state:RootState) => state.player
  );
  useEffect(() => {
    setSongCurrentPage(1);
    setSongHasMore(true);
  }, [activeTab]);
  useEffect(() => {
    setAlbumCurrentPage(1);
    setAlbumHasMore(true);
  }, [activeTab]);

  useEffect(() => {
    if (songs) {
      const currentResults = songs.songs?.length || 0;
      const total = songs?.total || 0;
      setSongHasMore(currentResults < total && currentResults >= 10);
    }
  }, [songs]);

  useEffect(() => {
    if (albums) {
      const currentResults = albums.albums?.length || 0;
      const total = albums?.total || 0;
      setAlbumHasMore(currentResults < total && currentResults >= 10);
    }
  }, [albums]);

  // Utility functions (keeping your existing ones)
  const decodeHTMLString = (str) => {
    return (
      str
        ?.replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">") || ""
    );
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const isValidImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    if (
      url.includes("<!doctype html>") ||
      url.includes("<html") ||
      url.includes("Internal Server Error")
    ) {
      return false;
    }
    return url.startsWith("http");
  };

  const getBestImageUrl = (imageArray) => {
    if (!imageArray || !Array.isArray(imageArray)) return null;
    const validImages = imageArray.filter(
      (img) => img?.url && isValidImageUrl(img.url)
    );
    if (validImages.length === 0) return null;
    return validImages[validImages.length - 1]?.url || null;
  };

  // Infinite scroll callback for songs
  const lastSongElementRef = useCallback(
    (node) => {
      if (songsLoading || songsFetching) return;

      if (songsObserver.current) songsObserver.current.disconnect();

      songsObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && songHasMore) {
          console.log("Loading more songs, current page:", songCurrentPage);
          setSongCurrentPage((prevPage) => prevPage + 1);
        }
      });

      if (node) songsObserver.current.observe(node);
    },
    [songsLoading, songsFetching, songHasMore, songCurrentPage]
  );

  // Infinite scroll callback for albums
  const lastAlbumElementRef = useCallback(
    (node) => {
      if (albumsLoading || albumsFetching) return;

      if (albumsObserver.current) albumsObserver.current.disconnect();

      albumsObserver.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && albumHasMore) {
          console.log("Loading more albums, current page:", albumCurrentPage);
          setAlbumCurrentPage((prevPage) => prevPage + 1);
        }
      });

      if (node) albumsObserver.current.observe(node);
    },
    [albumsLoading, albumsFetching, albumHasMore, albumCurrentPage]
  );

  // Reset pagination when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "songs") {
      setSongCurrentPage(1);
    } else if (tab === "albums") {
      setAlbumCurrentPage(1);
    }
  };

  // Your existing useEffect hooks...
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollTop = window.scrollY;
        setScrolled(scrollTop > 400);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const shouldAutoPlay = searchParams.get("play") === "true";
    if (shouldAutoPlay && songs?.songs?.length > 0) {
      handlePlayArtistSongs(true);

      const params = new URLSearchParams(searchParams);
      params.delete("play");

      const queryString = params.toString();
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      router.replace(newUrl, { scroll: false });
    }
  }, [songs?.length, searchParams, router]);

  // Your existing handler functions...
  const handlePlayArtistSongs = (autoPlay = false) => {
    if (songs.songs.length > 0) {
      console.log("Playing artist songs", {
        autoPlay,
        songsCount: songs.songs.length,
      });
      dispatch(
        startPlaylist({
          songs: songs.songs,
          startIndex: 0,
          autoPlay,
        })
      );
    }
  };

  const handlePlayPause = (songId = null) => {
    if (songId) {
      const songToPlay = songs.songs.find((s) => s.id === songId);
      if (songToPlay) {
        if (currentSong?.id === songId) {
          dispatch(playPause());
        } else {
          dispatch(setQueue(songs.songs));
          dispatch(playSong(songToPlay));
        }
      }
    } else {
      if (!currentSong && songs.songs.length > 0) {
        handlePlayArtistSongs(true);
      } else {
        dispatch(playPause());
      }
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    console.log(isFollowing ? "Unfollowed" : "Followed", artist.name);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artist.name,
        text: `Check out ${artist.name} on our music app!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const isCurrentArtist =
    queue.length > 0 &&
    songs?.songs?.some((song) =>
      queue.some((queueSong) => queueSong.id === song.id)
    );

  // Loading Components
  const LoadingSkeleton = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 pointer-events-none"></div>

        <div className="relative pt-16 md:pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="w-80 h-80 bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="h-16 bg-gray-600 rounded w-3/4 mx-auto md:mx-0 animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto md:mx-0 animate-pulse"></div>
                <div className="flex justify-center md:justify-start gap-4">
                  <div className="w-32 h-12 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="w-24 h-12 bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InfiniteLoadingIndicator = () => (
    <div className="flex justify-center items-center py-8">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading more...</span>
      </div>
    </div>
  );

  const SongLoadingSkeleton = ({ count = 5 }) => (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
          <div className="w-8 h-4 bg-gray-600 rounded"></div>
          <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const AlbumLoadingSkeleton = ({ count = 5 }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-3 animate-pulse">
          <div className="w-full aspect-square bg-gray-600 rounded-xl"></div>
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
  const { showQueue, toggleQueueVisibility, queueStats } = useQueue();
  // Show loading state
  if (artistLoading) {
    return (
      <>
        <Navbar />
        <LoadingSkeleton />
      </>
    );
  }

  // Show error state
  if (artistError || !artist.id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-lg md:text-xl text-red-400 mb-4">
              Artist not found
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

  const artistImageUrl = getBestImageUrl(artist.image);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 pointer-events-none"></div>

        {/* Your existing mobile and desktop headers... */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center  gap-4 p-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {scrolled && (
              <>
                <div className="w-8 h-8 rounded-full  overflow-hidden">
                  {artistImageUrl ? (
                    <Image
                      src={artistImageUrl}
                      alt={decodeHTMLString(artist.name)}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold truncate">
                    {decodeHTMLString(artist.name)}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {formatNumber(artist.followerCount || 0)} followers
                  </p>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayPause()}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300"
              >
                {isPlaying && isCurrentArtist ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div
          ref={headerRef}
          className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
              ? "bg-black/90 backdrop-blur-xl border-b border-white/10 py-3"
              : "bg-transparent py-6"
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
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30">
                  {artistImageUrl ? (
                    <Image
                      src={artistImageUrl}
                      alt={decodeHTMLString(artist.name)}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    {decodeHTMLString(artist.name)}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {formatNumber(artist.followerCount || 0)} followers
                  </p>
                </div>
              </>
            )}

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={toggleQueueVisibility}
                className={`p-3 w-12 h-12 rounded-full transition-colors ${
                  showQueue
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <Queue
                isVisible={showQueue}
                onClose={``}
                showNowPlaying={true}
                allowPlayFromQueue={true}
                allowRemoveFromQueue={false} // Don't allow removing from queue in album view
                className="custom-album-queue" // Custom styling if needed
              />
              <button
                onClick={() => handlePlayPause()}
                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                {isPlaying && isCurrentArtist ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Your existing Hero Section... */}
        <div className="relative pt-16 md:pt-20 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
              <div className="relative group flex-shrink-0">
                <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl shadow-black/50">
                  <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative w-full h-full">
                    {artistImageUrl ? (
                      <Image
                        src={artistImageUrl}
                        alt={decodeHTMLString(artist.name)}
                        width={384}
                        height={384}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Users className="w-24 h-24 text-white/80" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={() => handlePlayPause()}
                        className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                      >
                        {isPlaying && isCurrentArtist ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>

                    {isPlaying && isCurrentArtist && (
                      <div className="absolute top-4 right-4">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-white">Playing</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {artist.isVerified && (
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left space-y-6">
                <div>
                  <p className="text-sm md:text-base font-semibold text-purple-400 uppercase tracking-wider mb-2">
                    Artist
                  </p>
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                    {decodeHTMLString(artist.name)}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      {formatNumber(artist.followerCount || 0)} followers
                    </span>
                  </div>
                  {artist.fanCount && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{formatNumber(artist.fanCount)} fans</span>
                    </div>
                  )}
                  {artist.dominantType && (
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <span className="capitalize">{artist.dominantType}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                  <button
                    onClick={() => handlePlayPause()}
                    className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
                  >
                    {isPlaying && isCurrentArtist ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                    {isPlaying && isCurrentArtist ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-3 rounded-full font-semibold text-base transition-all duration-300 border ${
                      isFollowing
                        ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
                        : "bg-transparent border-white/20 hover:border-white/40"
                    }`}
                  >
                    {isFollowing ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Following
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        songs.songs.length > 0 &&
                        dispatch(
                          startPlaylist({
                            songs: songs.songs,
                            startIndex: 0,
                            autoPlay: true,
                            shuffle: true,
                          })
                        )
                      }
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300 group"
                      disabled={songs?.songs?.length === 0}
                    >
                      <Shuffle className="w-5 h-5 group-hover:text-purple-400" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300"
                    >
                      <Share2 className="w-5 h-5" />
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

        {/* Content Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="sticky top-16 md:top-32 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-xl -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-8 border-b border-white/10 z-40">
            <div className="flex items-center gap-8 overflow-x-auto">
              {["overview", "songs", "albums"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-purple-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="pb-32">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-12">
                {/* Popular Songs */}
                {artist.topSongs && (
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-8">
                      Popular Songs
                    </h2>
                    <div className="space-y-2">
                      {artist.topSongs.slice(0, 10).map((song, index) => (
                        <div
                          key={song.id}
                          className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
                          onClick={() => dispatch(playSong(song))}
                        >
                          <div className="flex items-center justify-center w-8">
                            <span
                              className={`text-sm font-medium group-hover:opacity-0 transition-opacity ${
                                currentSong?.id === song.id
                                  ? "text-purple-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {index + 1}
                            </span>
                            <button className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center">
                              {currentSong?.id === song.id && isPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-white ml-0.5" />
                              )}
                            </button>
                          </div>

                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0">
                            {getBestImageUrl(song.image) ? (
                              <Image
                                src={getBestImageUrl(song.image)}
                                alt={song.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-semibold truncate ${
                                currentSong?.id === song.id
                                  ? "text-purple-400"
                                  : "text-white"
                              }`}
                            >
                              {decodeHTMLString(song.name)}
                            </h3>
                            <p className="text-sm text-gray-400 truncate">
                              {song.album?.name || "Single"}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            {song.playCount && (
                              <span className="text-sm text-gray-400">
                                {formatNumber(song.playCount)}
                              </span>
                            )}
                            <button className="p-2 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <Heart className="w-4 h-4 text-gray-400 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {artist.topSongs.length >= 5 && (
                      <button
                        onClick={() => handleTabChange("songs")}
                        className="mt-6 text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Show all {songs?.total || "songs"}
                      </button>
                    )}
                  </div>
                )}

                {/* Top Albums */}
                {artist.topAlbums && artist.topAlbums.length > 0 && (
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-8">
                      Top Albums
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      {artist.topAlbums.slice(0, 10).map((album) => (
                        <div
                          key={album.id}
                          className="group bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                          onClick={() => router.push(`/album/${album.id}`)}
                        >
                          <div className="relative mb-4">
                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600">
                              {getBestImageUrl(album.image) ? (
                                <Image
                                  src={getBestImageUrl(album.image)}
                                  alt={album.name}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Disc className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle album play
                              }}
                              className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                            >
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </button>
                          </div>

                          <div>
                            <h3 className="font-semibold text-sm truncate text-white mb-1">
                              {decodeHTMLString(album.name)}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {album.year} • {album.songCount || 0} songs
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {artist.topAlbums.length > 5 && (
                      <button
                        onClick={() => handleTabChange("albums")}
                        className="mt-6 text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Show all {albums?.total} albums
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Songs Tab with Infinite Scroll */}
            {activeTab === "songs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">All Songs</h2>
                  {songs.total > 0 && (
                    <span className="text-sm text-gray-400">
                      {songs.songs.length} of {songs.total}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <SortDropdown
                    sortBy={songSort.sortBy}
                    sortOrder={songSort.sortOrder}
                    onSortChange={handleSongSortChange}
                    type="songs"
                  />
                </div>
                {songsLoading && songsPage === 1 ? (
                  <SongLoadingSkeleton count={20} />
                ) : (
                  <>
                    <div className="space-y-2">
                      {songs.songs.map((song, index) => {
                        const isLastElement = index === songs.songs.length - 1;
                        return (
                          <div
                            key={`${song.id}-${index}`}
                            ref={isLastElement ? lastSongElementRef : null}
                            className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            onClick={() => handlePlayPause(song.id)}
                          >
                            <div className="flex items-center justify-center w-8">
                              <span
                                className={`text-sm font-medium group-hover:opacity-0 transition-opacity ${
                                  currentSong?.id === song.id
                                    ? "text-purple-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <button className="absolute opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center">
                                {currentSong?.id === song.id && isPlaying ? (
                                  <Pause className="w-4 h-4 text-white" />
                                ) : (
                                  <Play className="w-4 h-4 text-white ml-0.5" />
                                )}
                              </button>
                            </div>

                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0">
                              {getBestImageUrl(song.image) ? (
                                <Image
                                  src={getBestImageUrl(song.image)}
                                  alt={song.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold truncate ${
                                  currentSong?.id === song.id
                                    ? "text-purple-400"
                                    : "text-white"
                                }`}
                              >
                                {decodeHTMLString(song.name)}
                              </h3>
                              <p className="text-sm text-gray-400 truncate">
                                {song.album?.name || "Single"}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              {song.playCount && (
                                <span className="text-sm text-gray-400">
                                  {formatNumber(song.playCount)}
                                </span>
                              )}
                              <button className="p-2 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <Heart className="w-4 h-4 text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Loading indicator for infinite scroll */}
                    {songsFetching && songCurrentPage > 1 && songHasMore && (
                      <InfiniteLoadingIndicator />
                    )}

                    {/* End of results message */}
                    {!songHasMore && songs.songs.length > 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>
                          You&apos;ve reached the end of{" "}
                          {decodeHTMLString(artist.name)}&apos;s songs!
                        </p>
                      </div>
                    )}

                    {/* No songs message */}
                    {songs.songs.length === 0 && !songsLoading && (
                      <div className="text-center py-12 text-gray-400">
                        <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No songs found for this artist.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Albums Tab with Infinite Scroll */}
            {activeTab === "albums" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">Albums</h2>
                  {albums.total > 0 && (
                    <span className="text-sm text-gray-400">
                      {albums.albums.length} of {albums.total}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Sort by:</span>
                    <SortDropdown
                      sortBy={albumSort.sortBy}
                      sortOrder={albumSort.sortOrder}
                      onSortChange={handleAlbumSortChange}
                      type="albums"
                    />
                  </div>
                </div>

                {albumsLoading && albumCurrentPage === 1 ? (
                  <AlbumLoadingSkeleton count={20} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      {albums.albums.map((album, index) => {
                        const isLastElement =
                          index === albums.albums.length - 1;
                        return (
                          <div
                            key={`${album.id}-${index}`}
                            ref={isLastElement ? lastAlbumElementRef : null}
                            className="group bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                            onClick={() =>
                              router.push(`/album/${album.name}/${album.id}`)
                            }
                          >
                            <div className="relative mb-4">
                              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-600">
                                {getBestImageUrl(album.image) ? (
                                  <Image
                                    src={getBestImageUrl(album.image)}
                                    alt={album.name}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Disc className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle album play
                                }}
                                className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                              >
                                <Play className="w-4 h-4 text-white ml-0.5" />
                              </button>
                            </div>

                            <div>
                              <h3 className="font-semibold text-sm truncate text-white mb-1">
                                {decodeHTMLString(album.name)}
                              </h3>
                              <p className="text-xs text-gray-400 truncate">
                                {album.year} • {album.songCount || 0} songs
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Loading indicator for infinite scroll */}
                    {albumsFetching && albumCurrentPage > 1 && albumHasMore && (
                      <InfiniteLoadingIndicator />
                    )}

                    {/* End of results message */}
                    {!albumHasMore && albums.albums.length > 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Disc className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>
                          You&apos;ve reached the end of{" "}
                          {decodeHTMLString(artist.name)}&apos;s albums!
                        </p>
                      </div>
                    )}

                    {/* No albums message */}
                    {albums.albums.length === 0 && !albumsLoading && (
                      <div className="text-center py-12 text-gray-400">
                        <Disc className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No albums found for this artist.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtistDetailPage;
