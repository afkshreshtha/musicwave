"use client";
export const dynamic = "force-dynamic";
import GenreSelector from "@/components/genreselector";
import Navbar from "@/components/navbar";
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
          {/* Main card skeleton with glassmorphism */}
          <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/40 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-none animate-pulse">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 dark:from-purple-500/20 dark:via-pink-500/10 dark:to-blue-500/20 animate-pulse"></div>

            {/* Floating glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-2xl sm:rounded-3xl blur-lg opacity-50 animate-pulse"></div>

            <div className="relative p-2 sm:p-3 md:p-4">
              {/* Album artwork skeleton */}
              <div className="relative mb-3 sm:mb-4">
                {/* Image skeleton with music visualizer effect */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 aspect-square">
                  {/* Music visualizer bars */}
                  <div className="absolute inset-0 flex items-end justify-center gap-1 p-2 sm:p-3 md:p-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-purple-500/80 to-pink-500/80 rounded-sm animate-bounce"
                        style={{
                          width: "4px",
                          height: `${Math.random() * 30 + 15}%`,
                          animationDelay: `${i * 200}ms`,
                          animationDuration: `${Math.random() * 500 + 800}ms`,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Pulsing music note overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full p-2 sm:p-3 animate-pulse">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  </div>

                  {/* Animated wave effect */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse"></div>
                    <div
                      className="absolute inset-x-0 bottom-1 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"
                      style={{ animationDelay: "500ms" }}
                    ></div>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-shimmer"></div>
                </div>

                {/* Corner pulsing dot */}
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping"></div>
              </div>

              {/* Content skeleton */}
              <div className="text-center space-y-2 sm:space-y-3">
                {/* Title skeleton */}
                <div className="space-y-1 sm:space-y-2">
                  <div className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full animate-pulse"></div>
                  <div
                    className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full w-3/4 mx-auto animate-pulse"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                </div>

                {/* Artist skeleton */}
                <div
                  className="h-2 sm:h-2.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/2 mx-auto animate-pulse"
                  style={{ animationDelay: "400ms" }}
                ></div>

                {/* Rating skeleton */}
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-gradient-to-r from-yellow-400/50 to-orange-500/50 animate-pulse"
                      style={{ animationDelay: `${600 + i * 100}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom animated line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse"></div>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-2 left-2 sm:top-4 sm:left-4 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-400 rounded-full animate-ping"
              style={{ animationDelay: `${index * 150}ms` }}
            ></div>
            <div
              className="absolute top-4 right-3 sm:top-8 sm:right-6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-pink-400 rounded-full animate-ping"
              style={{ animationDelay: `${300 + index * 150}ms` }}
            ></div>
            <div
              className="absolute bottom-6 left-3 sm:bottom-12 sm:left-6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-400 rounded-full animate-ping"
              style={{ animationDelay: `${600 + index * 150}ms` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Infinite Scroll Loading Indicator
const InfiniteLoadingIndicator = () => {
  return (
    <div className="col-span-full flex justify-center items-center py-6 sm:py-8">
      <div className="relative">
        {/* Spinning vinyl record */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-spin relative">
          <div className="absolute inset-1.5 sm:inset-2 bg-black rounded-full"></div>
          <div className="absolute inset-4 sm:inset-5 md:inset-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Loading text */}
        <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
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
  const [loadingCount,setLoadingCount] = useState(12)

  useEffect(()=>{
    const updateLoadingCount = () =>{
      setLoadingCount(window.innerWidth < 640 ? 12 : 20)
    }
    updateLoadingCount();
    window.addEventListener('resize', updateLoadingCount)
    return () => window.removeEventListener('resize', updateLoadingCount);
  },[])

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
          rootMargin: "50px", // Reduced for mobile
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
        <Navbar />
        <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-24">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Discover Music
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Choose your genre and vibe with the best tracks
            </p>
            <GenreSelector onSelect={handleGenreChange} />
            <div className="mt-6 sm:mt-8 md:mt-12">
              <MusicLoadingAnimation count={loadingCount} />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
            Discover Music
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Choose your genre and vibe with the best tracks
          </p>

          <GenreSelector onSelect={handleGenreChange} />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12">
            {playlists?.results?.map((item, index) => {
              const isLastElement = index === playlists.results.length - 1;

              return (
                <div
                  key={`${item.id}-${index}`}
                  ref={isLastElement ? lastElementRef : null}
                  className="group relative cursor-pointer touch-manipulation"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card container with glassmorphism */}
                  <div className="relative bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/60 dark:border-white/10 overflow-hidden transition-all duration-300 sm:duration-500 hover:scale-105 active:scale-95 sm:hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl sm:hover:shadow-2xl hover:shadow-purple-500/20 shadow-md sm:shadow-lg dark:shadow-none">
                    {/* Gradient background overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-blue-500/5 dark:from-purple-500/10 dark:via-pink-500/5 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:duration-500"></div>

                    {/* Floating glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-blue-500/20 rounded-2xl sm:rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:duration-500"></div>

                    <div className="relative p-2 sm:p-3 md:p-4">
                      {/* Album artwork container */}
                      <div className="relative mb-3 sm:mb-4 group/image">
                        {/* Image glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 to-pink-500/15 dark:from-purple-500/30 dark:to-pink-500/30 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300 sm:duration-500"></div>

                        {/* Main image */}
                        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
                          <Image
                            src={
                              item?.image?.[2]?.url || "/placeholder-album.jpg"
                            }
                            alt={item.name}
                            width={200}
                            height={200}
                            className="w-full aspect-square object-cover transition-all duration-300 sm:duration-500 group-hover:scale-110"
                            loading="lazy"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                          />

                          {/* Play button overlay */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`${item.seoUrl}/${item.id}?play=true&totalSong=${item.songCount}`);
                            }} 
                            className="absolute inset-0 bg-black/50 dark:bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 sm:duration-300 flex items-center justify-center tap-highlight-transparent"
                          >
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 md:p-4 transform scale-75 group-hover:scale-100 active:scale-90 transition-transform duration-200 sm:duration-300">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white ml-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 sm:duration-1000 ease-out"></div>
                        </div>

                        {/* Corner accent */}
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                      </div>

                      {/* Content section */}
                      <div className="text-center space-y-1 sm:space-y-2">
                        {/* Title */}
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300 line-clamp-2 leading-tight">
                          <Link 
                            href={`${item.seoUrl}/${item.id}?totalSong=${item.songCount}`}
                            className="block tap-highlight-transparent"
                          >
                            {item.name}
                          </Link>
                        </h3>

                        {/* Artist name placeholder */}
                        <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors duration-300">
                          Various Artists
                        </p>

                        {/* Rating or popularity indicator */}
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 ${
                                i < 4
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                  : "bg-gray-200 dark:bg-gray-600"
                              }`}
                              style={{ animationDelay: `${i * 100}ms` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 sm:duration-500 origin-left"></div>
                  </div>

                  {/* Floating particles on hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:duration-500">
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-purple-400 rounded-full animate-ping delay-100"></div>
                    <div className="absolute top-4 right-3 sm:top-8 sm:right-6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-pink-400 rounded-full animate-ping delay-300"></div>
                    <div className="absolute bottom-6 left-3 sm:bottom-12 sm:left-6 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-400 rounded-full animate-ping delay-500"></div>
                  </div>
                </div>
              );
            })}
            
            {/* Show infinite loading indicator */}
            {isFetching && currentPage > 1 && hasMore && (
              <InfiniteLoadingIndicator />
            )}
          </div>

          {/* Error state */}
          {isError && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-red-500 mb-3 sm:mb-4 text-sm sm:text-base">
                Failed to load tracks
              </div>
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 active:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No more results */}
          {!hasMore && playlists?.results?.length > 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                🎵 You&apos;ve reached the end of {selectedGenre} tracks!
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
