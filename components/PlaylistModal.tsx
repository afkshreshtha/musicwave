import React, { useState, useEffect } from 'react';
import { X, Plus, Music, Search } from 'lucide-react';
import { fetchUserPlaylists, createPlaylist, addSongToPlaylist, trackPlaylistCreation } from '@/lib/supabasefunctions';

const PlaylistModal = ({ 
  isOpen, 
  onClose, 
  onPlaylistCreated, // Callback when a playlist is created
  songId = null, // Make optional with default null
  songName = null, // Make optional with default null
  mode = 'add' // 'add' for adding song to playlist, 'create' for just creating playlist
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Determine if this is song-specific or just playlist creation
  const isAddingToPlaylist = songId && songName && mode === 'add';
  const isJustCreating = mode === 'create' || (!songId && !songName);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      // Auto-focus on create mode if no song provided
      if (isJustCreating) {
        setIsCreating(true);
      }
    }
  }, [isOpen, isJustCreating]);

  const loadPlaylists = async () => {
    setLoading(true);
    const userPlaylists = await fetchUserPlaylists();
    setPlaylists(userPlaylists);
    setLoading(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    
    setLoading(true);
    
    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      
      if (newPlaylist) {
        // Only add song if we have songId and this is add mode
        if (isAddingToPlaylist) {
          const added = await addSongToPlaylist(newPlaylist.id, songId);
          if (added) {
            alert(`Created "${newPlaylist.name}" and added "${songName}"`);
          }
        } else {
          alert(`Playlist "${newPlaylist.name}" created successfully!`);
        }
        
        // 🔥 Call the optimistic update callback with playlist data
        if (onPlaylistCreated) {
          onPlaylistCreated({
            id: newPlaylist.id,
            name: newPlaylist.name,
            description: newPlaylist.description || '',
            // Pass any other relevant data
          });
        } else {
          onClose();
        }
        
        trackPlaylistCreation();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist');
      // Don't call onPlaylistCreated if there was an error
      onClose();
    }
    
    setLoading(false);
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    if (!isAddingToPlaylist) return; // Can't add song if no song provided
    
    setLoading(true);
    const added = await addSongToPlaylist(playlistId, songId);
    
    if (added) {
      onClose();
      alert(`Added "${songName}" to "${playlistName}"`);
    } else {
      alert('Song is already in this playlist or an error occurred');
    }
    
    setLoading(false);
  };

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {isAddingToPlaylist ? 'Add to Playlist' : 'Create Playlist'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Song Info - Only show if adding song */}
        {isAddingToPlaylist && (
          <div className="p-6 border-b border-white/10">
            <p className="text-sm text-gray-400 mb-1">Adding song:</p>
            <p className="text-white font-medium truncate">{songName}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Search Bar - Only show if we have existing playlists and adding song */}
          {isAddingToPlaylist && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search playlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              />
            </div>
          )}

          {/* Create New Playlist Button/Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl transition-colors mb-4"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Playlist</span>
            </button>
          ) : (
            /* Create Playlist Form */
            <div className="mb-4 p-4 bg-gray-800 rounded-xl">
              <input
                type="text"
                placeholder="Enter playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full mb-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || loading}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
                >
                  {loading ? 'Creating...' : 'Create Playlist'}
                </button>
                {!isJustCreating && (
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewPlaylistName('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Existing Playlists - Only show if adding song to playlist */}
          {isAddingToPlaylist && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Or choose existing playlist:
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredPlaylists.length > 0 ? (
                filteredPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{playlist.name}</p>
                      <p className="text-xs text-gray-400">
                        {playlist.trackCount || 0} songs • {new Date(playlist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? 'No playlists found' : 'No playlists yet'}
                  <p className="text-sm mt-1">Create your first playlist above</p>
                </div>
              )}
            </div>
          )}

          {/* Just Creating Mode Message */}
          {isJustCreating && !isCreating && (
            <div className="text-center py-4 text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Create a new playlist to organize your music</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;
