// app/search/[query]/page.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useGetSearchResultQuery } from "@/redux/features/api/musicApi";
import {
  Music,
  User,
  Disc,
  List,
  Heart,
  MoreHorizontal,
  Play,
  Pause,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  playSong,
  setQueue,
  playPause,
  startPlaylist,
} from "@/redux/features/musicPlayerSlice";
import Navbar from "@/components/navbar";
import { cn } from "@/lib/utils";

const formatNumber = (num) => {
  if (!num || num === 0) return "0";

  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else if (num < 1000000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
};

const formatNumberWithCommas = (num) => {
  if (!num || num === 0) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDuration = (seconds) => {
  if (!seconds) return "";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Keep your existing utility functions
const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  if (
    url.includes("<!doctype html>") ||
    url.includes("<html") ||
    url.includes("Internal Server Error") ||
    url.includes("<title>")
  ) {
    return false;
  }

  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  const hasImageExtension = imageExtensions.test(url);
  const isHttpUrl = url.startsWith("http");

  return (
    isHttpUrl &&
    (hasImageExtension || url.includes("saavn") || url.includes("jiosaavn"))
  );
};

const getBestImageUrl = (imageArray) => {
  if (!imageArray || !Array.isArray(imageArray)) return null;

  const validImages = imageArray.filter(
    (img) => img?.url && isValidImageUrl(img.url)
  );

  if (validImages.length === 0) return null;
  return validImages[validImages.length - 1]?.url || null;
};

const getIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "song":
    case "songs":
      return <Music className="w-4 h-4" />;
    case "artist":
    case "artists":
      return <User className="w-4 h-4" />;
    case "album":
    case "albums":
      return <Disc className="w-4 h-4" />;
    case "playlist":
    case "playlists":
      return <List className="w-4 h-4" />;
    default:
      return <Music className="w-4 h-4" />;
  }
};

// Updated Tab Component with theme support
const Tab = ({ active, onClick, children, icon, count }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 group",
      active
        ? "bg-primary text-primary-foreground shadow-lg"
        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105"
    )}
  >
    <span
      className={cn(
        "transition-transform duration-300",
        active ? "rotate-12" : "group-hover:rotate-12"
      )}
    >
      {icon}
    </span>
    <span className="whitespace-nowrap">{children}</span>
    {count > 0 && (
      <span
        className={cn(
          "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
          active 
            ? "bg-primary-foreground/20 text-primary-foreground" 
            : "bg-primary/20 text-primary"
        )}
        title={formatNumberWithCommas(count)}
      >
        {formatNumber(count)}
      </span>
    )}
    {active && (
      <div className="absolute inset-0 rounded-xl bg-primary/10 blur-xl"></div>
    )}
  </button>
);

// Updated Song Result Component with theme support
const SongResult = ({ item, index, allSongs }) => {
  const imageUrl = getBestImageUrl(item.image);
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentSong, isPlaying } = useSelector((state) => state.player);
  const isCurrentSong = currentSong?.id === item.id;

  const handleNavigation = () => {
    const slug = item.slug || item.title?.toLowerCase().replace(/\s+/g, "-");
    router.push(`/song/${slug}/${item.id}/false/0`);
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();

    if (isCurrentSong) {
      dispatch(playPause());
    } else {
      dispatch(setQueue(allSongs));
      dispatch(playSong(item));
    }
  };

  const handleSongClick = () => {
    if (window.innerWidth < 768) {
      handlePlayPause({ stopPropagation: () => {} });
    } else {
      handleNavigation();
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer",
        isCurrentSong
          ? "bg-primary/10 shadow-lg border border-primary/20"
          : "hover:bg-accent/50"
      )}
    >
      {/* Index Number */}
      <div className="w-8 text-center">
        <span
          className={cn(
            "text-sm font-medium transition-all duration-200 font-mono",
            isCurrentSong
              ? "text-primary"
              : "text-muted-foreground group-hover:opacity-0"
          )}
        >
          {(index + 1).toString().padStart(2, "0")}
        </span>
        <button
          onClick={handlePlayPause}
          className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 w-8 h-6 flex items-center justify-center"
        >
          {isCurrentSong && isPlaying ? (
            <Pause className="w-4 h-4 text-foreground" />
          ) : (
            <Play className="w-4 h-4 text-foreground ml-0.5" />
          )}
        </button>
      </div>

      {/* Album Art with Play Button */}
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-lg">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name || item.title || "Song"}
            width={56}
            height={56}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300",
            isCurrentSong ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <button
            onClick={handlePlayPause}
            className="w-8 h-8 bg-background/90 rounded-full flex items-center justify-center hover:bg-background transition-all duration-200 hover:scale-110 shadow-lg"
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-4 h-4 text-foreground" />
            ) : (
              <Play className="w-4 h-4 text-foreground ml-0.5" />
            )}
          </button>
        </div>

        {/* Now Playing Indicator */}
        {isCurrentSong && isPlaying && (
          <div className="absolute bottom-1 right-1">
            <div className="flex gap-0.5">
              <div
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{ height: "8px", animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{ height: "12px", animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{ height: "6px", animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0" onClick={handleSongClick}>
        <h4
          className={cn(
            "font-semibold truncate transition-colors duration-300",
            isCurrentSong
              ? "text-primary"
              : "text-foreground group-hover:text-primary"
          )}
        >
          {item.name || item.title}
        </h4>
        {(item.singers || item.artist) && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.singers || item.artist}
          </p>
        )}
      </div>

      {/* Duration */}
      {item.duration && (
        <span className="text-sm text-muted-foreground flex-shrink-0 font-medium font-mono">
          {typeof item.duration === "number"
            ? formatDuration(item.duration)
            : item.duration}
        </span>
      )}

      {/* Action Buttons */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button className="p-2 rounded-full hover:bg-destructive/10 transition-colors group/heart">
          <Heart className="w-4 h-4 text-muted-foreground group-hover/heart:text-destructive transition-colors" />
        </button>
        <button className="p-2 rounded-full hover:bg-accent transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

// Updated Album/Artist Result Component with theme support
const AlbumArtistResult = ({ item, type }) => {
  const imageUrl = getBestImageUrl(item.image);
  const router = useRouter();

  const handleNavigation = () => {
    const routeType = type === "artists" ? "artist" : type.slice(0, -1);
    const slug =
      item.slug ||
      (item.name || item.title)?.toLowerCase().replace(/\s+/g, "-");
    router.push(`/${routeType}/${slug}/${item.id}/false/0`);
  };

  return (
    <div
      onClick={handleNavigation}
      className="group flex items-center gap-4 p-4 rounded-xl hover:bg-accent transition-all duration-300 cursor-pointer hover:scale-[1.02]"
    >
      {/* Image */}
      <div
        className={cn(
          "w-16 h-16 overflow-hidden bg-muted flex-shrink-0 shadow-lg",
          type === "artists" ? "rounded-full" : "rounded-xl"
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name || item.title || type}
            width={64}
            height={64}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getIcon(type)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">
          {item.name || item.title}
        </h4>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.description}
          </p>
        )}
        {item.artist && type === "albums" && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            by {item.artist}
          </p>
        )}
        {item.followers && type === "artists" && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(item.followers)} followers
          </p>
        )}
        {item.songCount && type === "albums" && (
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(item.songCount)} songs
          </p>
        )}
      </div>

      {/* Type Badge */}
      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide rounded-full border border-primary/20">
          {type.slice(0, -1)}
        </span>
      </div>
    </div>
  );
};

// Updated Loading Skeleton with theme support
const LoadingSkeleton = ({ type = "song" }) => (
  <div className="space-y-4">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 rounded-xl bg-accent/30 animate-pulse"
      >
        {type === "song" && <div className="w-6 h-4 bg-muted rounded"></div>}
        <div
          className={cn(
            "w-16 h-16 bg-muted",
            type === "artists" ? "rounded-full" : "rounded-xl"
          )}
        ></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
        <div className="w-12 h-4 bg-muted rounded"></div>
      </div>
    ))}
  </div>
);

// Main Search Page Component with theme support
export default function SearchPage() {
  const params = useParams();
  const query = decodeURIComponent(params.query);
  const [activeTab, setActiveTab] = useState("songs");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [tabCounts, setTabCounts] = useState({});
  const observerRef = useRef(null);
  const dispatch = useDispatch();

  // API call with current activeTab
  const {
    data: searchResult,
    isLoading,
    isFetching,
  } = useGetSearchResultQuery(
    {
      query,
      page,
      activeTab,
    },
    {
      skip: !query,
    }
  );

  // Reset page and counts when query changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setTabCounts({});
  }, [query]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [activeTab]);

  // Store tab count when search results come in
  useEffect(() => {
    if (searchResult) {
      const currentResults = searchResult.results?.length || 0;
      const total = searchResult?.total || 0;

      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: total,
      }));

      setHasMore(currentResults < total);
    }
  }, [searchResult, activeTab]);

  useEffect(() => {
    if (searchResult) {
      const currentResults = searchResult.results?.length || 0;
      const total = searchResult?.total || 0;
      setHasMore(currentResults < total);
    }
  }, [searchResult]);

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading || isFetching) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setPage((prevPage) => prevPage + 1);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "100px",
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetching, hasMore]
  );

  const tabs = [
    { id: "songs", label: "Songs", icon: <Music className="w-4 h-4" /> },
    { id: "artists", label: "Artists", icon: <User className="w-4 h-4" /> },
    { id: "albums", label: "Albums", icon: <Disc className="w-4 h-4" /> },
    { id: "playlists", label: "Playlists", icon: <List className="w-4 h-4" /> },
  ];

  const handlePlayAll = () => {
    const results = searchResult?.results || [];
    if (results.length > 0 && activeTab === "songs") {
      dispatch(
        startPlaylist({
          songs: results,
          startIndex: 0,
          autoPlay: true,
        })
      );
    }
  };

  const getTabContent = () => {
    const results = searchResult?.results || [];

    if (results.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            No {activeTab} found
          </h3>
          <p className="text-center max-w-md">
            We couldn&apos;t find any {activeTab} matching&apos;
            <span className="font-medium text-primary">{query}</span>&apos;. Try
            different keywords or browse other categories.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Play All Button for Songs */}
        {activeTab === "songs" && results.length > 0 && (
          <div className="flex items-center justify-between mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div>
              <h3 className="font-semibold text-foreground">
                Found{" "}
                {formatNumberWithCommas(tabCounts[activeTab] || results.length)}{" "}
                songs
              </h3>
              <p className="text-sm text-muted-foreground">
                {tabCounts[activeTab] > results.length
                  ? `Showing ${results.length} of ${formatNumber(
                      tabCounts[activeTab]
                    )}`
                  : "Play all search results"}
              </p>
            </div>
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg"
            >
              <Play className="w-4 h-4 ml-0.5" />
              Play All
            </button>
          </div>
        )}

        {results.map((item, index) => {
          const isLast = index === results.length - 1;

          return (
            <div key={item.id || index} ref={isLast ? lastElementRef : null}>
              {activeTab === "songs" ? (
                <SongResult item={item} index={index} allSongs={results} />
              ) : (
                <AlbumArtistResult item={item} type={activeTab} />
              )}
            </div>
          );
        })}

        {/* Loading indicator for infinite scroll */}
        {isFetching && page > 1 && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-accent/50 backdrop-blur-xl rounded-full border border-border">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
              <span className="text-primary font-medium">
                Loading more {activeTab}...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-xl rounded-full mb-4 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Search Results
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
              Results for &quot;{query}&quot;
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing {activeTab} that match your search. Click to play
              or explore more details.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 p-2 bg-card backdrop-blur-xl rounded-2xl shadow-lg border border-border">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={tab.icon}
                count={tabCounts[tab.id] || 0}
              >
                {tab.label}
              </Tab>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card backdrop-blur-xl rounded-3xl shadow-2xl border border-border overflow-hidden">
            {isLoading && page === 1 ? (
              <div className="p-8">
                <LoadingSkeleton type={activeTab} />
              </div>
            ) : (
              <div className="p-6">{getTabContent()}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
