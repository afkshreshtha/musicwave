"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const MusicWaveform = ({ bars = 50, isPlaying = false }) => {
  const [heights, setHeights] = useState([]);

  useEffect(() => {
    const generateHeights = () => {
      return Array.from({ length: bars }, () => Math.random() * 60 + 20);
    };

    setHeights(generateHeights());

    if (isPlaying) {
      const interval = setInterval(() => {
        setHeights(generateHeights());
      }, 300);

      return () => clearInterval(interval);
    }
  }, [bars, isPlaying]);

  return (
    <div className="flex items-end justify-center gap-1 h-20 w-full max-w-md mx-auto">
      {heights.map((height, index) => (
        <div
          key={index}
          className={`bg-gradient-to-t from-purple-500 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 rounded-full transition-all duration-300 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            width: '3px',
            height: `${height}%`,
            animationDelay: `${index * 50}ms`,
            opacity: 0.3 + (index % 3) * 0.3,
          }}
        />
      ))}
    </div>
  );
};

const FloatingVinyl = ({ delay = 0, size = 'w-16 h-16' }) => {
  return (
    <div
      className={`absolute ${size} animate-bounce opacity-20 dark:opacity-40`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '3s',
      }}
    >
      <div className="relative w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 animate-spin">
        <div className="absolute inset-2 bg-gray-900 dark:bg-gray-100 rounded-full"></div>
        <div className="absolute inset-6 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white dark:bg-gray-900 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </div>
  );
};

const GlitchText = ({ children, className = "" }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`transition-all duration-200 ${
          isGlitching
            ? 'transform translate-x-1 text-red-500 dark:text-red-400'
            : ''
        }`}
      >
        {children}
      </div>
      {isGlitching && (
        <>
          <div className="absolute inset-0 text-cyan-500 dark:text-cyan-400 transform -translate-x-1 opacity-70 animate-ping">
            {children}
          </div>
          <div className="absolute inset-0 text-yellow-500 dark:text-yellow-400 transform translate-x-0.5 opacity-50 animate-pulse">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

const Page = () => {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Dynamic gradient orbs */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-400/30 dark:to-pink-400/30 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 10,
            top: mousePosition.y / 10,
            transition: 'all 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-72 h-72 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-400/30 dark:to-purple-400/30 rounded-full blur-3xl animate-pulse"
          style={{
            right: mousePosition.x / 15,
            bottom: mousePosition.y / 15,
            transition: 'all 0.5s ease-out',
            animationDelay: '1s',
          }}
        />
        
        {/* Floating vinyl records */}
        <FloatingVinyl delay={0} size="w-12 h-12" />
        <FloatingVinyl delay={1000} size="w-8 h-8" />
        <FloatingVinyl delay={2000} size="w-20 h-20" />
        
        {/* Additional floating elements */}
        <div className="absolute top-20 left-20 animate-float opacity-30">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full animate-ping"></div>
        </div>
        <div className="absolute top-1/3 right-20 animate-float opacity-20" style={{ animationDelay: '2s' }}>
          <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-blue-500 dark:from-pink-400 dark:to-blue-400 rounded-full animate-pulse"></div>
        </div>
        <div className="absolute bottom-1/4 left-1/4 animate-float opacity-25" style={{ animationDelay: '1.5s' }}>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 rounded-full animate-bounce"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Glassmorphism Container */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-12 md:p-16 shadow-2xl dark:shadow-purple-500/10">
            {/* 404 Number with Glitch Effect */}
            <GlitchText className="text-8xl sm:text-9xl md:text-[12rem] font-black mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
                404
              </span>
            </GlitchText>

            {/* Broken Record Icon */}
            <div className="relative mb-8 flex justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 relative">
                {/* Main vinyl record */}
                <div className="w-full h-full rounded-full bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 shadow-2xl">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-2 rounded-full border-2 border-gray-600 dark:border-gray-400 opacity-30"></div>
                  <div className="absolute inset-6 rounded-full border-2 border-gray-600 dark:border-gray-400 opacity-20"></div>
                  <div className="absolute inset-10 rounded-full border-2 border-gray-600 dark:border-gray-400 opacity-10"></div>
                  
                  {/* Center label */}
                  <div className="absolute inset-12 bg-gradient-to-r from-red-500 to-pink-500 dark:from-red-400 dark:to-pink-400 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white dark:bg-gray-900 rounded-full"></div>
                  </div>

                  {/* Crack effect */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-red-500 to-transparent transform -translate-x-1/2 rotate-45 opacity-80"></div>
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent transform -translate-y-1/2 -rotate-12 opacity-60"></div>
                </div>

                {/* Floating fragments */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 transform rotate-45 animate-float opacity-70" style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}></div>
                <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 transform -rotate-12 animate-float opacity-50" style={{ borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%', animationDelay: '1s' }}></div>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Track Not Found
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Looks like this beat dropped off the map! The page you&apos;re looking for has gone silent. 
              Let&apos;s get you back to the music.
            </p>

            {/* Music Waveform */}
            <div className="mb-8">
              <MusicWaveform bars={40} isPlaying={isPlaying} />
            </div>

            {/* Interactive Play Button */}
            <button
              onClick={handlePlayPause}
              className="group relative mb-8 mx-auto block"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 dark:hover:shadow-purple-400/30 transition-all duration-300 hover:scale-110 active:scale-95">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                {isPlaying ? (
                  <div className="flex gap-1 relative z-10">
                    <div className="w-1.5 h-6 bg-white rounded-full"></div>
                    <div className="w-1.5 h-6 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1 relative z-10"></div>
                )}
              </div>
            </button>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                href="/"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-500 dark:hover:to-pink-500 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Home
                </span>
              </Link>

              <button
                onClick={() => router.back()}
                className="group relative px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-white font-semibold rounded-2xl border border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L3 11.414A1.99 1.99 0 013 10a1.99 1.99 0 010-1.414L6.293 5.293a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Go Back
                </span>
              </button>
            </div>

            {/* Fun Music Facts */}
            <div className="mt-12 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                🎵 Fun fact: While you&apos;re here, over 65,000 songs are being streamed worldwide every second!
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(5deg);
          }
          66% {
            transform: translateY(-5px) rotate(-3deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Page;
