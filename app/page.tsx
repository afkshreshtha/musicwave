"use client";

import GenreSelector from "@/components/genreselector";

import { useGetTracksByGenreQuery } from "@/redux/features/api/musicApi";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";

// Modern Music Loading Component
const MusicLoadingAnimation = ({ count = 10 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="group relative"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Fixed aspect ratio for consistent sizing */}
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-xl dark:shadow-2xl dark:shadow-purple-500/10 animate-pulse aspect-square">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 dark:from-purple-500/20 dark:via-pink-500/15 dark:to-blue-500/20 animate-pulse"></div>

            {/* Enhanced glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 dark:from-purple-400/30 dark:via-pink-400/30 dark:to-blue-400/30 rounded-3xl blur-xl opacity-60 animate-pulse"></div>

            <div className="relative p-3 sm:p-4 md:p-5 flex flex-col justify-between h-full">
              {/* Album artwork skeleton - takes up most space */}
              <div className="relative mb-3 sm:mb-4 flex-grow">
                {/* Image skeleton with enhanced music visualizer */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 aspect-square shadow-inner">
                  {/* Enhanced music visualizer bars */}
                  <div className="absolute inset-0 flex items-end justify-center gap-1 p-4 sm:p-5">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 rounded-sm animate-bounce shadow-sm"
                        style={{
                          width: "3px",
                          height: `${Math.random() * 40 + 20}%`,
                          animationDelay: `${i * 150}ms`,
                          animationDuration: `${Math.random() * 600 + 700}ms`,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Enhanced pulsing music note overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-md rounded-full p-3 sm:p-4 animate-pulse shadow-lg">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-purple-600 dark:text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  </div>

                  {/* Enhanced wave effects */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 animate-pulse rounded-t"></div>
                    <div
                      className="absolute inset-x-0 bottom-1.5 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-pulse rounded-t opacity-70"
                      style={{ animationDelay: "500ms" }}
                    ></div>
                  </div>

                  {/* Enhanced shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-gray-300/20 to-transparent animate-shimmer"></div>
                </div>

                {/* Enhanced corner indicator */}
                <div className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full animate-ping shadow-lg"></div>
              </div>

              {/* Content skeleton - fixed height */}
              <div className="text-center space-y-2 sm:space-y-3">
                {/* Title skeleton */}
                <div className="space-y-1.5">
                  <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full animate-pulse"></div>
                  <div
                    className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full w-3/4 mx-auto animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                </div>

                {/* Artist skeleton */}
                <div
                  className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/2 mx-auto animate-pulse"
                  style={{ animationDelay: "400ms" }}
                ></div>

                {/* Enhanced rating skeleton */}
                <div className="flex items-center justify-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-r from-yellow-400/60 to-orange-500/60 dark:from-yellow-300/50 dark:to-orange-400/50 animate-pulse"
                      style={{ animationDelay: `${600 + i * 100}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced bottom animated line */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 animate-pulse"></div>
          </div>

          {/* Enhanced floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-3 left-3 sm:top-5 sm:left-5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400 dark:bg-purple-300 rounded-full animate-ping"
              style={{ animationDelay: `${index * 150}ms` }}
            ></div>
            <div
              className="absolute top-6 right-4 sm:top-10 sm:right-7 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-pink-400 dark:bg-pink-300 rounded-full animate-ping"
              style={{ animationDelay: `${300 + index * 150}ms` }}
            ></div>
            <div
              className="absolute bottom-8 left-4 sm:bottom-14 sm:left-7 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 dark:bg-blue-300 rounded-full animate-ping"
              style={{ animationDelay: `${600 + index * 150}ms` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Infinite Scroll Loading Indicator
const InfiniteLoadingIndicator = () => {
  return (
    <div className="col-span-full flex justify-center items-center py-8 sm:py-10">
      <div className="relative">
        {/* Enhanced spinning vinyl record */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 animate-spin relative shadow-xl">
          <div className="absolute inset-2 bg-gray-900 dark:bg-gray-100 rounded-full shadow-inner"></div>
          <div className="absolute inset-5 sm:inset-6 md:inset-7 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white dark:bg-gray-900 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm"></div>
        </div>

        {/* Enhanced loading text */}
        <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
            Loading more tracks...
          </span>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState("Pop");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const { currentSong } = useSelector((state) => state.player);
  const [loadingCount, setLoadingCount] = useState(12);

  useEffect(() => {
    const updateLoadingCount = () => {
      setLoadingCount(window.innerWidth < 640 ? 12 : 20);
    };
    updateLoadingCount();
    window.addEventListener("resize", updateLoadingCount);
    return () => window.removeEventListener("resize", updateLoadingCount);
  }, []);

  // Get tracks with pagination
  const {
    data: playlists,
    isLoading: playlistsLoading,
    isFetching,
    isError,
  } = useGetTracksByGenreQuery(
    { genre: selectedGenre, page: currentPage },
    { skip: !selectedGenre }
  );

  // Reset pagination when genre changes
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
  }, [selectedGenre]);

  // Check if we have more pages to load
  useEffect(() => {
    if (playlists) {
      const currentResults = playlists.results?.length || 0;
      setHasMore(currentResults >= 10);
    }
  }, [playlists]);

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(
    (node) => {
      if (playlistsLoading || isFetching) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetching) {
            setCurrentPage((prevPage) => prevPage + 1);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [playlistsLoading, isFetching, hasMore]
  );

  const handleGenreChange = (genre) => {
    setSelectedGenre(genre);
  };

  // Show initial loading for first page
  if (playlistsLoading && currentPage === 1) {
    return (
      <>
       
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 sm:mb-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                Discover Music
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
                Choose your genre and vibe with the best tracks
              </p>
            </div>
            <GenreSelector onSelect={handleGenreChange} />
            <div className="mt-8 sm:mt-10 md:mt-12">
              <MusicLoadingAnimation count={loadingCount} />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
   
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
              Discover Music
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              Choose your genre and vibe with the best tracks
            </p>
          </div>

          <GenreSelector onSelect={handleGenreChange} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6 mt-8 sm:mt-10 md:mt-12">
            {playlists?.results?.map((item, index) => {
              const isLastElement = index === playlists.results.length - 1;

              return (
                <div
                  key={`${item.id}-${index}`}
                  ref={isLastElement ? lastElementRef : null}
                  className="group relative cursor-pointer touch-manipulation"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Fixed aspect-square for equal sizing */}
                  <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 sm:hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/25 dark:hover:shadow-purple-400/20 shadow-lg dark:shadow-xl dark:shadow-gray-900/50 aspect-auto">
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-pink-500/5 to-blue-500/8 dark:from-purple-500/15 dark:via-pink-500/10 dark:to-blue-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Enhanced glow effect */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-blue-500/15 dark:from-purple-400/25 dark:via-pink-400/25 dark:to-blue-400/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative p-3 sm:p-4 md:p-5 flex flex-col justify-between h-full">
                      {/* Enhanced album artwork container - takes most space */}
                      <div className="relative mb-3 sm:mb-4 group/image flex-grow">
                        {/* Enhanced image glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-400/30 dark:to-pink-400/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>

                        {/* Enhanced main image container - square aspect ratio */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 ring-1 ring-gray-200/60 dark:ring-gray-600/60 shadow-inner aspect-square ">
                          <Image
                            src={
                              item?.image?.[2]?.url || "/placeholder-album.jpg"
                            }
                            alt={item.name}
                            fill
                            className="object-cover transition-all duration-500 group-hover:scale-110"
                            loading="lazy"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          />

                          {/* Enhanced play button overlay */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `${item.seoUrl}/${item.id}/true/${item.songCount}`
                              );
                            }}
                            className="absolute inset-0 bg-black/60 dark:bg-black/50 opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-300 flex items-center justify-center tap-highlight-transparent"
                          >
                            <div className="bg-white/25 dark:bg-gray-800/40 backdrop-blur-md rounded-full p-3 sm:p-4 md:p-5 transform scale-75 group-hover:scale-100 active:scale-90 transition-transform duration-300 shadow-xl">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                                <svg
                                  className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white ml-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-gray-300/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                        </div>

                        {/* Enhanced corner accent */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse shadow-lg"></div>
                      </div>

                      {/* Enhanced content section - fixed height at bottom */}
                      <div className="text-center space-y-1.5 sm:space-y-2">
                        {/* Enhanced title - limited to 2 lines */}
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 dark:group-hover:from-purple-400 dark:group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2 leading-tight min-h-[2.5rem] sm:min-h-[3rem]">
                          <Link
                            href={`${item.seoUrl}/${item.id}/false/${item.songCount}`}
                            className="block tap-highlight-transparent"
                          >
                            {item.name}
                          </Link>
                        </h3>
                      </div>
                    </div>

                    {/* Enhanced bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left shadow-sm"></div>
                  </div>

                  {/* Enhanced floating particles */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 dark:bg-purple-300 rounded-full animate-ping delay-100 shadow-sm"></div>
                    <div className="absolute top-6 right-4 sm:top-10 sm:right-7 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-400 dark:bg-pink-300 rounded-full animate-ping delay-300 shadow-sm"></div>
                    <div className="absolute bottom-8 left-4 sm:bottom-14 sm:left-7 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 dark:bg-blue-300 rounded-full animate-ping delay-500 shadow-sm"></div>
                  </div>
                </div>
              );
            })}

            {/* Show infinite loading indicator */}
            {isFetching && currentPage > 1 && hasMore && (
              <InfiniteLoadingIndicator />
            )}
          </div>

          {/* Enhanced error state */}
          {isError && (
            <div className="text-center py-12 sm:py-16">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 max-w-md mx-auto shadow-xl">
                <div className="text-red-500 dark:text-red-400 mb-4 text-base sm:text-lg font-medium">
                  Failed to load tracks
                </div>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 active:scale-95 transition-all duration-300 font-medium shadow-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Enhanced no more results */}
          {!hasMore && playlists?.results?.length > 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 max-w-md mx-auto shadow-xl">
                <div className="text-gray-600 dark:text-gray-300 text-base sm:text-lg font-medium">
                  🎵 You've reached the end of {selectedGenre} tracks!
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .tap-highlight-transparent {
          -webkit-tap-highlight-color: transparent;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </>
  );
}
