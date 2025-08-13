// components/NowPlayingModal.jsx
"use client";

import React from 'react';
import { Heart, Share2, Download, MoreHorizontal, Shuffle, Repeat, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { playPause, nextSong, previousSong, toggleShuffle, setRepeatMode } from '@/redux/features/musicPlayerSlice';

const NowPlayingModal = () => {
  const dispatch = useDispatch();
  const { currentSong, isPlaying, isShuffleOn, repeatMode } = useSelector((state) => state.player);

  if (!currentSong) return null;

  return (
    <div className="space-y-4 xs:space-y-5 sm:space-y-6">
      {/* Large Album Art - Responsive */}
      <div className="flex justify-center">
        <div className="w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 rounded-xl xs:rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={currentSong.image?.[3]?.url || currentSong.image?.[2]?.url || "/default-album.png"}
            alt={currentSong.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/default-album.png";
            }}
          />
        </div>
      </div>

      {/* Song Info - Responsive */}
      <div className="text-center space-y-1 xs:space-y-2 px-2">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
          {currentSong.name}
        </h1>
        <p className="text-base xs:text-lg text-gray-600 dark:text-gray-400">
          {currentSong.artists?.primary?.map(artist => artist.name).join(', ') || 'Unknown Artist'}
        </p>
        {currentSong.album?.name && (
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {currentSong.album.name}
          </p>
        )}
      </div>

      {/* Action Buttons - Responsive */}
      <div className="flex items-center justify-center space-x-4 xs:space-x-6 px-4">
        <button className="p-2 xs:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation">
          <Heart className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-2 xs:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation">
          <Share2 className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-2 xs:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation">
          <Download className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-2 xs:p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation">
          <MoreHorizontal className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Controls - Responsive */}
      <div className="space-y-3 xs:space-y-4">
        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 xs:space-x-6 sm:space-x-8 px-2">
          <button
            onClick={() => dispatch(toggleShuffle())}
            className={`p-2 xs:p-3 rounded-full transition-colors touch-manipulation ${
              isShuffleOn
                ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Shuffle className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>

          <button
            onClick={() => dispatch(previousSong())}
            className="p-2 xs:p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors touch-manipulation"
          >
            <SkipBack className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={() => dispatch(playPause())}
            className="p-3 xs:p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg touch-manipulation"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
            ) : (
              <Play className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 ml-0.5 xs:ml-1" />
            )}
          </button>

          <button
            onClick={() => dispatch(nextSong())}
            className="p-2 xs:p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors touch-manipulation"
          >
            <SkipForward className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8" />
          </button>

          <button
            onClick={() => {
              const modes = ["off", "all", "one"];
              const currentIndex = modes.indexOf(repeatMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              dispatch(setRepeatMode(modes[nextIndex]));
            }}
            className={`p-2 xs:p-3 rounded-full transition-colors relative touch-manipulation ${
              repeatMode !== "off"
                ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Repeat className="w-4 h-4 xs:w-5 xs:h-5" />
            {repeatMode === "one" && (
              <span className="absolute -bottom-0.5 xs:-bottom-1 -right-0.5 xs:-right-1 text-xs text-blue-500 bg-white dark:bg-gray-900 rounded-full w-3 h-3 xs:w-4 xs:h-4 flex items-center justify-center border border-blue-500">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Additional Content - Responsive */}
      <div className="space-y-3 xs:space-y-4 pt-2 xs:pt-4">
        <div className="text-center">
          <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-500">
            Swipe down to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingModal;
