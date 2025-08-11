'use client'

import React from 'react'
import {
  X,
  List,
  Trash2,
  Play,
  Pause,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setShowQueue,
  removeFromQueue,
  playSong,
  playPause,
} from '@/redux/features/musicPlayerSlice'
import Image from 'next/image'

const Queue = ({ 
  isVisible = false,
  onClose,
  className = "",
  showNowPlaying = true,
  allowPlayFromQueue = true,
  allowRemoveFromQueue = true,
}) => {
  const dispatch = useDispatch()
  const { 
    currentSong, 
    currentSongIndex, 
    queue, 
    isPlaying 
  } = useSelector((state) => state.player)

  // Utility function to decode HTML strings
  const decodeHTMLString = (str) => {
    return str?.replace(/&amp;quot;/g, '"')?.replace(/&quot;/g, '"') || ''
  }

  // Handle playing song from queue
  const handlePlayFromQueue = (song, queueIndex) => {
    if (!allowPlayFromQueue) return
    
    const actualQueueIndex = currentSongIndex + 1 + queueIndex
    dispatch(playSong(song))
    
    console.log('Playing from queue:', song.name, 'at index:', actualQueueIndex)
  }

  // Handle removing song from queue
  const handleRemoveFromQueue = (songId) => {
    if (!allowRemoveFromQueue) return
    dispatch(removeFromQueue(songId))
  }

  // Handle close
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      dispatch(setShowQueue(false))
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Mobile Queue Overlay */}
      <div className={`md:hidden fixed inset-0 bg-black/95 backdrop-blur-xl z-50 overflow-y-auto ${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Queue</h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Now Playing */}
            {showNowPlaying && currentSong && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Now Playing
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={currentSong.image?.[2]?.url || '/placeholder-song.jpg'}
                      alt={currentSong.name || 'Song'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate text-purple-400">
                      {decodeHTMLString(currentSong.name) || 'Unknown Song'}
                    </h5>
                    <p className="text-sm text-gray-400 truncate">
                      {currentSong.artists?.primary?.map(artist => artist.name).join(', ') || 'Various Artists'}
                    </p>
                  </div>
                  {isPlaying && (
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-purple-400 rounded animate-pulse"></div>
                      <div className="w-1 h-4 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-2 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Queue */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Next in Queue ({Math.max(0, queue.length - (currentSongIndex + 1))} songs)
              </h4>
              <div className="space-y-2">
                {queue.slice(currentSongIndex + 1).map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
                  >
                    {/* Clickable play area */}
                    <button
                      onClick={() => handlePlayFromQueue(song, index)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors duration-200"
                      disabled={!allowPlayFromQueue}
                    >
                      {/* Play button overlay on image */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden group/play">
                        <Image
                          src={song.image?.[2]?.url || '/placeholder-song.jpg'}
                          alt={song.name || 'Song'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                        {allowPlayFromQueue && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/play:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate group-hover:text-purple-400 transition-colors duration-200">
                          {decodeHTMLString(song.name) || 'Unknown Song'}
                        </h5>
                        <p className="text-xs text-gray-400 truncate">
                          {song.artists?.primary?.map(artist => artist.name).join(', ') || 'Various Artists'}
                        </p>
                      </div>
                    </button>
                    
                    {allowRemoveFromQueue && (
                      <button
                        onClick={() => handleRemoveFromQueue(song.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                
                {queue.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No songs in queue</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Queue Sidebar */}
      <div className={`hidden md:block fixed right-0 top-0 bottom-0 w-96 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Queue</h3>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Now Playing */}
            {showNowPlaying && currentSong && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Now Playing
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={currentSong.image?.[2]?.url || '/placeholder-song.jpg'}
                      alt={currentSong.name || 'Song'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium truncate text-purple-400">
                      {decodeHTMLString(currentSong.name) || 'Unknown Song'}
                    </h5>
                    <p className="text-sm text-gray-400 truncate">
                      {currentSong.artists?.primary?.map(artist => artist.name).join(', ') || 'Various Artists'}
                    </p>
                  </div>
                  {isPlaying && (
                    <div className="flex gap-1">
                      <div className="w-1 h-3 bg-purple-400 rounded animate-pulse"></div>
                      <div className="w-1 h-4 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-2 bg-purple-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Queue */}
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Next in Queue ({Math.max(0, queue.length - (currentSongIndex + 1))} songs)
              </h4>
              <div className="space-y-2">
                {queue.slice(currentSongIndex + 1).map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
                  >
                    {/* Queue position indicator */}
                    <div className="text-xs text-gray-500 w-4 text-center">
                      {index + 1}
                    </div>
                    
                    {/* Clickable play area */}
                    <button
                      onClick={() => handlePlayFromQueue(song, index)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-white/5 rounded-lg p-1 -m-1 transition-colors duration-200"
                      disabled={!allowPlayFromQueue}
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden group/play">
                        <Image
                          src={song.image?.[2]?.url || '/placeholder-song.jpg'}
                          alt={song.name || 'Song'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                        {allowPlayFromQueue && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/play:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate group-hover:text-purple-400 transition-colors duration-200">
                          {decodeHTMLString(song.name) || 'Unknown Song'}
                        </h5>
                        <p className="text-xs text-gray-400 truncate">
                          {song.artists?.primary?.map(artist => artist.name).join(', ') || 'Various Artists'}
                        </p>
                      </div>
                    </button>
                    
                    {allowRemoveFromQueue && (
                      <button
                        onClick={() => handleRemoveFromQueue(song.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                
                {queue.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No songs in queue</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Queue
