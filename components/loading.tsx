import React from 'react'

const Loading = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-12">
      {[...Array(10)].map((_, index) => (
        <div
          key={index}
          className="group relative"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Main card skeleton with glassmorphism */}
          <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-gray-200/40 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-none animate-pulse">
            
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10 dark:from-purple-500/20 dark:via-pink-500/10 dark:to-blue-500/20 animate-pulse"></div>
            
            {/* Floating glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-3xl blur-lg opacity-50 animate-pulse"></div>

            <div className="relative p-4">
              {/* Album artwork skeleton */}
              <div className="relative mb-4">
                {/* Image skeleton with music visualizer effect */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 aspect-square">
                  
                  {/* Music visualizer bars */}
                  <div className="absolute inset-0 flex items-end justify-center gap-1 p-4">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-purple-500/80 to-pink-500/80 rounded-sm animate-bounce"
                        style={{
                          width: '6px',
                          height: `${Math.random() * 40 + 20}%`,
                          animationDelay: `${i * 200}ms`,
                          animationDuration: `${Math.random() * 500 + 800}ms`
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Pulsing music note overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full p-3 animate-pulse">
                      <svg 
                        className="w-6 h-6 text-purple-500 dark:text-purple-400" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Animated wave effect */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse"></div>
                    <div className="absolute inset-x-0 bottom-1 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" style={{ animationDelay: '500ms' }}></div>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent animate-shimmer"></div>
                </div>

                {/* Corner pulsing dot */}
                <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping"></div>
              </div>

              {/* Content skeleton */}
              <div className="text-center space-y-3">
                {/* Title skeleton */}
                <div className="space-y-2">
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-full w-3/4 mx-auto animate-pulse" style={{ animationDelay: '200ms' }}></div>
                </div>

                {/* Artist skeleton */}
                <div className="h-2.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-1/2 mx-auto animate-pulse" style={{ animationDelay: '400ms' }}></div>

                {/* Rating skeleton */}
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-yellow-400/50 to-orange-500/50 animate-pulse"
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
            <div className="absolute top-4 left-4 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: `${index * 150}ms` }}></div>
            <div className="absolute top-8 right-6 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: `${300 + index * 150}ms` }}></div>
            <div className="absolute bottom-12 left-6 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: `${600 + index * 150}ms` }}></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Loading