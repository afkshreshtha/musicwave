import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentSong: null,
  currentSongIndex: 0,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isShuffleOn: false,
  repeatMode: "off", // 'off', 'all', 'one'
  showQueue: false,
};

const musicPlayerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setQueue: (state, action) => {
      state.queue = action.payload;
    },
    startPlaylist: (state, action) => {
      // Fixed: Properly destructure the payload and set the current song
      const { songs, startIndex = 0, autoPlay = false } = action.payload;
      console.log('StartPlaylist reducer:', { songs: songs.length, startIndex, autoPlay });
      
      state.queue = songs;
      state.currentSongIndex = startIndex;
      state.currentSong = songs[startIndex] || null;
      state.currentTime = 0;
      state.isPlaying = autoPlay;
    },
    addToQueue: (state, action) => {
      state.queue = [...state.queue, ...action.payload];
    },
    playPause: (state) => {
      state.isPlaying = !state.isPlaying;
    },
playSong: (state, action) => {
  const song = action.payload;
  const songIndex = state.queue.findIndex(
    (queueSong) => queueSong.id === song.id
  );
  
  if (songIndex !== -1) {
    // Song is already in queue, just play it
    const isDifferentSong = state.currentSong?.id !== song.id;
    state.currentSongIndex = songIndex;
    state.currentSong = state.queue[songIndex];
    state.isPlaying = true;
    if (isDifferentSong) {
      state.currentTime = 0;
    }
  } else {
    // Song is not in queue, add it and play it
    state.queue = [song]; // Replace queue with single song
    state.currentSongIndex = 0;
    state.currentSong = song;
    state.isPlaying = true;
    state.currentTime = 0;
  }
},
    nextSong: (state) => {
      if (state.queue.length === 0) return;

      if (state.repeatMode === "one") {
        state.currentTime = 0;
        state.isPlaying = true;
        return;
      }

      if (state.isShuffleOn) {
        const nextIndex = Math.floor(Math.random() * state.queue.length);
        state.currentSongIndex = nextIndex;
      } else {
        const nextIndex = (state.currentSongIndex + 1) % state.queue.length;
        state.currentSongIndex = nextIndex;
      }

      state.currentSong = state.queue[state.currentSongIndex];
      state.currentTime = 0;
      state.isPlaying = true;
    },
    previousSong: (state) => {
      if (state.queue.length === 0) return;

      if (state.currentTime > 3) {
        state.currentTime = 0;
        return;
      }

      let prevIndex = state.currentSongIndex - 1;
      if (prevIndex < 0) {
        prevIndex = state.queue.length - 1;
      }

      state.currentSongIndex = prevIndex;
      state.currentSong = state.queue[prevIndex];
      state.currentTime = 0;
      state.isPlaying = true;
    },
    setCurrentTime: (state, action) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action) => {
      state.duration = action.payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    toggleShuffle: (state) => {
      state.isShuffleOn = !state.isShuffleOn;
    },
    setRepeatMode: (state, action) => {
      state.repeatMode = action.payload;
    },
    toggleQueue: (state) => {
      state.showQueue = !state.showQueue;
    },
    setShowQueue: (state, action) => {
      state.showQueue = action.payload;
    },
    removeFromQueue: (state, action) => {
      const songId = action.payload;
      const songIndex = state.queue.findIndex(song => song.id === songId);
      
      if (songIndex !== -1) {
        if (songIndex === state.currentSongIndex) {
          if (state.queue.length > 1) {
            const nextIndex = songIndex < state.queue.length - 1 ? songIndex : 0;
            state.currentSong = state.queue[nextIndex === songIndex ? 0 : nextIndex];
            state.currentSongIndex = nextIndex === songIndex ? 0 : nextIndex;
          } else {
            state.currentSong = null;
            state.currentSongIndex = 0;
            state.isPlaying = false;
          }
        } else if (songIndex < state.currentSongIndex) {
          state.currentSongIndex -= 1;
        }
        
        state.queue.splice(songIndex, 1);
      }
    },
    songEnded: (state) => {
      if (state.repeatMode === "one") {
        state.currentTime = 0;
        state.isPlaying = true;
      } else if (state.repeatMode === "all") {
        const nextIndex = (state.currentSongIndex + 1) % state.queue.length;
        state.currentSongIndex = nextIndex;
        state.currentSong = state.queue[nextIndex];
        state.currentTime = 0;
        state.isPlaying = true;
      } else {
        state.isPlaying = false;
      }
    },
  },
});

export const {
  setQueue,
  playPause,
  playSong,
  nextSong,
  previousSong,
  setCurrentTime,
  setDuration,
  setVolume,
  toggleShuffle,
  setRepeatMode,
  songEnded,
  addToQueue,
  startPlaylist,
  toggleQueue,
  setShowQueue,
  removeFromQueue,
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;
