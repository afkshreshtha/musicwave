"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Music,
  User,
  Disc,
  List,
  TrendingUp,
  Play,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import { useGetGlobalSearchResultsQuery } from "@/redux/features/api/musicApi";
import Image from "next/image";
import { useRouter } from "next/navigation";

const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  // Check if URL contains HTML error content
  if (
    url.includes("<!doctype html>") ||
    url.includes("<html") ||
    url.includes("Internal Server Error") ||
    url.includes("<title>")
  ) {
    return false;
  }

  // Check if URL looks like a proper image URL
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
  const hasImageExtension = imageExtensions.test(url);
  const isHttpUrl = url.startsWith("http");

  return (
    isHttpUrl &&
    (hasImageExtension || url.includes("saavn") || url.includes("jiosaavn"))
  );
};

// Get the best available image URL from the image array
const getBestImageUrl = (imageArray) => {
  if (!imageArray || !Array.isArray(imageArray)) return null;

  // Try to find a valid image URL, preferring higher quality
  const validImages = imageArray.filter(
    (img) => img?.url && isValidImageUrl(img.url)
  );

  if (validImages.length === 0) return null;

  // Return highest quality available (usually the last one)
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
    case "topquery":
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <Music className="w-4 h-4" />;
  }
};

const getSectionTitle = (key) => {
  const titles = {
    topQuery: "Top Result",
    songs: "Songs",
    albums: "Albums",
    artists: "Artists",
    playlists: "Playlists",
  };
  return titles[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

// Search Result Components
const TopQueryResult = ({ item, onNavigate }) => {
  const imageUrl = getBestImageUrl(item.image);
  const router = useRouter()


  return (
    <div
      className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl p-6 hover:from-purple-500/20 hover:to-pink-500/20 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all duration-300 cursor-pointer"
      onClick={() => onNavigate(item)}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title || "Music item"}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide the image and show icon fallback
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className={`w-full h-full flex items-center justify-center ${
              imageUrl ? "hidden" : "flex"
            }`}
            style={{ display: imageUrl ? "none" : "flex" }}
          >
            {getIcon(item.type)}
          </div>
        </div>
        {/* Rest of your component remains the same */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 truncate">
            {item.title}
          </h3>
          {item.artist && (
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {item.artist}
            </p>
          )}
          <div className="flex items-center gap-2">
            {getIcon(item.type)}
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400 capitalize">
              {item.type}
            </span>
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
           router.push(`/${item.type}/${item.title}/${item.id}/true/0`);
            // Handle play action
          }}
        >
          <Play className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

const SongResult = ({ item, index, onNavigation }) => {
  const imageUrl = getBestImageUrl(item.image);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer animate-item-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onNavigation(item)}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title || "Song"}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${
            imageUrl ? "hidden" : "flex"
          }`}
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          <Music className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      {/* Rest of component remains the same */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {item.title}
        </h4>
        {item.singers && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.singers}
          </p>
        )}
      </div>
      {item.duration && (
        <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          {item.duration}
        </span>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
        <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          <Heart className="w-4 h-4 text-gray-500" />
        </button>
        <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

const AlbumArtistResult = ({ item, type, index, onNavigation }) => {
  const imageUrl = getBestImageUrl(item.image);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer animate-item-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onNavigation(item)}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title || type}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${
            imageUrl ? "hidden" : "flex"
          }`}
          style={{ display: imageUrl ? "none" : "flex" }}
        >
          {getIcon(type)}
        </div>
      </div>
      {/* Rest of component remains the same */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {item.title}
        </h4>
        {item.artist && type === "albums" && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {item.description}
          </p>
        )}
        {item.followers && type === "artists" && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.followers} followers
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
          {type.slice(0, -1)}
        </span>
      </div>
    </div>
  );
};

// Utility function to check if URL is a valid image URL

export default function SearchBar() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const router = useRouter();

  const { data: searchResult } = useGetGlobalSearchResultsQuery(
    { query },
    {
      skip: !query || query.length < 2,
    }
  );
const handleKeyPress = (e) => {
  if (e.key === 'Enter' && query.trim()) {
    // Close search and redirect to search page
    setExpanded(false);
    router.push(`/search/${encodeURIComponent(query.trim())}`);
  }
};
  const handleNavigation = (item, type = null) => {
    const itemType = type || item.type?.toLowerCase();

    // Close search first
    setExpanded(false);

    // Navigate based on type
    switch (itemType) {
      case "song":
      case "songs":
        // Navigate to song/track page
        router.push(`/song/${item.title}/${item.id}/false/0`);
        break;
      case "artist":
      case "artists":
        // Navigate to artist page
        router.push(`/artist/${item.title}/${item.id}/false/0`);
        break;
      case "album":
      case "albums":
        // Navigate to album page
        router.push(`/album/${item.title}/${item.id}/false/0`);
        break;
      case "playlist":
      case "playlists":
        // Navigate to playlist page
        router.push(`/playlist/${item.title}/${item.id}/false/0`);
        break;
      default:
        // Fallback navigation
        router.push(`/${itemType}/${item.title}/${item.id}/false/0`);
    }
  };
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setExpanded(false);
      }
    };

    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [expanded]);

  // Autofocus input on expand
  useEffect(() => {
    if (expanded && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 150);
    }
    if (!expanded) {
      setQuery("");
      setShowResults(false);
    }
  }, [expanded]);

  // Show results with delay when expanded
  useEffect(() => {
    if (expanded && query && searchResult) {
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!query) {
      setShowResults(false);
    }
  }, [expanded, query, searchResult]);

  // Close on esc
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  // Prevent body scroll on expand (for mobile)
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  // Process and sort search results by position
  const processedResults = searchResult
    ? Object.entries(searchResult)
        .filter(
          ([key, value]) => value && value.results && value.results.length > 0
        )
        .sort(([, a], [, b]) => (a.position || 0) - (b.position || 0))
        .map(([key, value]) => ({
          type: key,
          ...value,
        }))
    : [];

  // ----- Compact state -----
  if (!expanded) {
    return (
      <div className="flex flex-1 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-1 sm:mx-2 md:mx-4">
        <button
          className="group flex items-center w-full bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200/40 dark:border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 text-gray-900 dark:text-white hover:bg-white/90 dark:hover:bg-white/15 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl hover:shadow-purple-500/10"
          aria-label="Open search"
          onClick={() => setExpanded(true)}
        >
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Search className="relative w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 mr-2 sm:mr-3 group-hover:text-purple-500 transition-colors duration-300" />
          </div>
          <span className="flex-1 text-left text-sm sm:text-base text-gray-600 dark:text-gray-300 select-none group-hover:text-gray-800 dark:group-hover:text-white transition-colors duration-300 truncate">
            <span className="hidden sm:inline">
              Search songs, artists, albums...
            </span>
            <span className="sm:hidden">Search music...</span>
          </span>
        </button>
      </div>
    );
  }

  // ----- Expanded state -----
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md animate-fade-in"
        onClick={() => setExpanded(false)}
        aria-label="Close search overlay"
      />

      {/* Expanded search container */}
      <div className="fixed left-0 right-0 top-0 z-50 flex justify-center px-4">
        <div
          ref={searchContainerRef}
          className="mt-4 sm:mt-8 w-full max-w-4xl animate-expand-down"
        >
          {/* Main search box with glassmorphism */}
          <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            {/* Gradient background overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-blue-500/5 dark:from-purple-500/10 dark:via-pink-500/10 dark:to-blue-500/10"></div>

            {/* Floating glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-lg opacity-60"></div>

            {/* Search input row */}
            <div className="relative flex items-center px-6 sm:px-8 py-5 sm:py-6 gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-full">
                  <Search className="w-5 h-5 text-white" />
                </div>
              </div>
              <Input
                ref={inputRef}
                type="text"
                value={query}
                autoFocus
                placeholder="Search songs, artists, albums..."
                className="flex-1 border-none outline-none ring-0 bg-transparent text-lg sm:text-xl font-medium dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-0 focus:ring-0 focus-visible:ring-0"
                onChange={(e) => setQuery(e.target.value)}
                onKeyUp={handleKeyPress}
              />
              <button
                aria-label="Close search"
                onClick={() => setExpanded(false)}
                className="group relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 flex-shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <X className="relative w-5 h-5 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200" />
              </button>
            </div>

            {/* Results dropdown */}
            {(query || showResults) && (
              <div className="relative border-t border-gray-200/50 dark:border-white/10 animate-slide-down">
                <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
                  {query === "" ? (
                    <div className="p-6 sm:p-8 text-gray-500 dark:text-gray-400 text-center text-base sm:text-lg animate-fade-up">
                      Start typing to search your music library...
                    </div>
                  ) : processedResults.length > 0 ? (
                    <div className="space-y-6">
                      {processedResults.map((section, sectionIndex) => (
                        <div
                          key={section.type}
                          className="animate-fade-up"
                          style={{ animationDelay: `${sectionIndex * 100}ms` }}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            {getIcon(section.type)}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {getSectionTitle(section.type)}
                            </h3>
                          </div>

                          {/* Top Query - Special Layout */}
                          {section.type === "topQuery" && (
                            <div className="mb-6">
                              {section.results
                                .slice(0, 1)
                                .map((item, index) => (
                                  <TopQueryResult
                                    key={item.id || index}
                                    item={item}
                                    onNavigate={handleNavigation}
                                  />
                                ))}
                            </div>
                          )}

                          {/* Songs - List Layout */}
                          {section.type === "songs" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {section.results
                                .slice(0, 6)
                                .map((item, index) => (
                                  <SongResult
                                    key={item.id || index}
                                    item={item}
                                    index={index}
                                    onNavigation={handleNavigation}
                                  />
                                ))}
                            </div>
                          )}

                          {/* Albums & Artists - Grid Layout */}
                          {(section.type === "albums" ||
                            section.type === "artists") && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {section.results
                                .slice(0, 6)
                                .map((item, index) => (
                                  <AlbumArtistResult
                                    key={item.id || index}
                                    item={item}
                                    type={section.type}
                                    index={index}
                                    onNavigation={handleNavigation}
                                  />
                                ))}
                            </div>
                          )}

                          {/* Playlists - List Layout */}
                          {section.type === "playlists" && (
                            <div className="space-y-2">
                              {section.results
                                .slice(0, 4)
                                .map((item, index) => (
                                  <AlbumArtistResult
                                    key={item.id || index}
                                    item={item}
                                    type={section.type}
                                    index={index}
                                    onNavigation={handleNavigation}
                                  />
                                ))}
                            </div>
                          )}

                          {/* Show More Button */}
                          {section.results.length > 6 && (
                            <button className="w-full mt-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200 text-sm font-medium">
                              Show {section.results.length - 6} more{" "}
                              {section.type}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : query.length >= 2 ? (
                    <div className="p-6 sm:p-8 text-gray-500 dark:text-gray-400 text-center text-base sm:text-lg animate-fade-up">
                      <div className="mb-2">🎵</div>
                      No results found for &ldquo;{query}&rdquo;
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        @keyframes expand-down {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          60% {
            opacity: 1;
            transform: translateY(4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-expand-down {
          animation: expand-down 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-15px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 70vh;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.3s ease-out both;
        }

        @keyframes item-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-item-up {
          animation: item-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </>
  );
}
