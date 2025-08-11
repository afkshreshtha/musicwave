import { useDispatch, useSelector } from 'react-redux'
import {
  setShowQueue,
  toggleQueue,
  removeFromQueue,
  playSong,
  playPause,
} from '@/redux/features/musicPlayerSlice'

const useQueue = () => {
  const dispatch = useDispatch()
  const { 
    showQueue,
    currentSong, 
    currentSongIndex, 
    queue, 
    isPlaying 
  } = useSelector((state) => state.player)

  const openQueue = () => dispatch(setShowQueue(true))
  const closeQueue = () => dispatch(setShowQueue(false))
  const toggleQueueVisibility = () => dispatch(toggleQueue())

  const playFromQueue = (song, queueIndex) => {
    const actualQueueIndex = currentSongIndex + 1 + queueIndex
    dispatch(playSong(song))
    console.log('Playing from queue:', song.name, 'at index:', actualQueueIndex)
  }

  const removeFromQueueById = (songId) => {
    dispatch(removeFromQueue(songId))
  }

  const getQueueStats = () => ({
    total: queue.length,
    remaining: Math.max(0, queue.length - (currentSongIndex + 1)),
    currentIndex: currentSongIndex,
  })

  return {
    // State
    showQueue,
    currentSong,
    currentSongIndex,
    queue,
    isPlaying,
    
    // Actions
    openQueue,
    closeQueue,
    toggleQueueVisibility,
    playFromQueue,
    removeFromQueueById,
    
    // Computed
    queueStats: getQueueStats(),
    upcomingSongs: queue.slice(currentSongIndex + 1),
  }
}

export default useQueue
