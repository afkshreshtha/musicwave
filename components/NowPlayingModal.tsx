// components/NowPlayingModal.jsx
"use client";

import React from "react";
import {
  Heart,
  Share2,
  Download,
  MoreHorizontal,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Play,
  Pause,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  playPause,
  nextSong,
  previousSong,
  toggleShuffle,
  setRepeatMode,
} from "@/redux/features/musicPlayerSlice";
import Link from "next/link";

const NowPlayingModal = () => {
  const dispatch = useDispatch();
  const { currentSong, isPlaying, isShuffleOn, repeatMode } = useSelector(
    (state) => state.player
  );
  const artist = currentSong?.artists?.primary?.[0] || {};
  console.log(artist)

  if (!currentSong) return null;

  return (
    <div className="space-y-6">
      {/* Large Album Art */}
      <div className="flex justify-center">
        <div className="w-80 h-80 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={
              currentSong.image?.[3]?.url ||
              currentSong.image?.[2]?.url ||
              "/default-album.png"
            }
            alt={currentSong.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/default-album.png";
            }}
          />
        </div>
      </div>

      {/* Song Info */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentSong.name}
        </h1>
        <Link
          href={`/artist/${artist.name}/${artist.id}/false/0`}
          className="text-gray-600 dark:text-gray-400 hover:underline"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {artist.name||"Unknown Artist"}
          </p>
        </Link>

        {currentSong.album?.name && (
          <Link href={`/album/${currentSong.album.name}/${currentSong.album.id}/false/0`}>
            {" "}
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {currentSong.album.name}
            </p>
          </Link>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-6">
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Heart className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Share2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Download className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <MoreHorizontal className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={() => dispatch(toggleShuffle())}
            className={`p-3 rounded-full transition-colors ${
              isShuffleOn
                ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={() => dispatch(previousSong())}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipBack className="w-8 h-8" />
          </button>

          <button
            onClick={() => dispatch(playPause())}
            className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>

          <button
            onClick={() => dispatch(nextSong())}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipForward className="w-8 h-8" />
          </button>

          <button
            onClick={() => {
              const modes = ["off", "all", "one"];
              const currentIndex = modes.indexOf(repeatMode);
              const nextIndex = (currentIndex + 1) % modes.length;
              dispatch(setRepeatMode(modes[nextIndex]));
            }}
            className={`p-3 rounded-full transition-colors relative ${
              repeatMode !== "off"
                ? "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === "one" && (
              <span className="absolute -bottom-1 -right-1 text-xs text-blue-500 bg-white dark:bg-gray-900 rounded-full w-4 h-4 flex items-center justify-center border border-blue-500">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Additional Content */}
      <div className="space-y-4 pt-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Swipe down to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingModal;
