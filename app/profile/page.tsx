"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  initializeUserStats,
  trackPlaylistCreation,
  fetchUserLikes,
  fetchUserStats,
} from "@/lib/supabasefunctions";
import {
  User,
  Music,
  Heart,
  Clock,
  Play,
  Headphones,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import LikedSongs from "@/components/likedSongs";
import PlaylistModal from "@/components/PlaylistModal";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    avatar: null,
  });

  const [recentHistory, setRecentHistory] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [playlistSongs, setPlaylistSongs] = useState({});
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchAllUserData();
    fetchUserStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      setProfileData({
        displayName: user.user_metadata?.full_name || user.email.split("@")[0],
        bio: user.user_metadata?.bio || "",
        avatar: user.user_metadata?.avatar_url || null,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user:", error);
      setLoading(false);
    }
  };

  const fetchAllUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const stats = await fetchUserStats();
      if (stats) {
        setUserStats(stats);
      }

      const { data: history, error: historyError } = await supabase
        .from("user_listening_history")
        .select("*")
        .eq("user_id", user.id)
        .order("played_at", { ascending: false })
        .limit(50);

      if (!historyError && history) {
        setRecentHistory(
          history.map((item) => ({
            id: item.id,
            title: item.song_title,
            artist: item.artist_name,
            album: item.album_name,
            image: "/placeholder-song.jpg",
            playedAt: new Date(item.played_at).toLocaleDateString(),
            songId: item.song_id,
            duration: item.duration_seconds,
          }))
        );
      }

      const { data: playlists, error: playlistsError } = await supabase
        .from("user_playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!playlistsError && playlists) {
        const playlistsWithSongCount = await Promise.all(
          playlists.map(async (playlist) => {
            const { count } = await supabase
              .from("playlist_songs")
              .select("*", { count: "exact" })
              .eq("playlist_id", playlist.id);

            const { data: songs } = await supabase
              .from("playlist_songs")
              .select("song_id, added_at")
              .eq("playlist_id", playlist.id)
              .order("added_at", { ascending: false });

            return {
              id: playlist.id,
              name: playlist.name,
              description: playlist.description,
              isPublic: playlist.is_public,
              trackCount: count || 0,
              image: playlist.image_url,
              createdAt: playlist.created_at,
              songs: songs || [],
            };
          })
        );

        setUserPlaylists(playlistsWithSongCount);

        const playlistSongsMap = {};
        playlistsWithSongCount.forEach((playlist) => {
          playlistSongsMap[playlist.id] = playlist.songs;
        });
        setPlaylistSongs(playlistSongsMap);
      }

      const likedSongIds = await fetchUserLikes();
      setLikedSongs(new Set(likedSongIds));
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handlePlaylistCreatedOptimistic = (newPlaylistData) => {
    // Add the new playlist to local state immediately
    const optimisticPlaylist = {
      id: newPlaylistData.id || Date.now(), // temporary ID
      name: newPlaylistData.name,
      description: newPlaylistData.description || "",
      isPublic: false,
      trackCount: 0,
      image: null,
      createdAt: new Date().toISOString(),
      songs: [],
    };

    // Update local state immediately
    setUserPlaylists((prev) => [optimisticPlaylist, ...prev]);

    // Update user stats immediately
    setUserStats((prev) => ({
      ...prev,
      playlistsCreated: (prev.playlistsCreated || 0) + 1,
    }));

    // Close modal
    setPlaylistModalOpen(false);

    // Optionally refresh data in background to sync with server
    setTimeout(() => {
      fetchAllUserData();
    }, 1000);
  };

  const deletePlaylist = async (playlistId, playlistName) => {
    if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Delete playlist songs first
      await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId);

      // Delete the playlist
      const { error } = await supabase
        .from("user_playlists")
        .delete()
        .eq("id", playlistId)
        .eq("user_id", user.id);

      if (!error) {
        // 🔥 UPDATE USER STATS - Decrease playlist count
        const { data: statsData, error: statsError } = await supabase
          .from("user_stats")
          .select("total_playlists_created")
          .eq("user_id", user.id)
          .single();

        if (!statsError && statsData) {
          const newCount = Math.max(
            0,
            (statsData.total_playlists_created || 0) - 1
          );

          const { error: updateError } = await supabase
            .from("user_stats")
            .update({ total_playlists_created: newCount })
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Failed to update user stats:", updateError);
          }
        }

        fetchAllUserData();
        alert(`Playlist "${playlistName}" deleted successfully!`);
      } else {
        alert("Error deleting playlist: " + error.message);
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Failed to delete playlist");
    }
  };

  const handleAddToPlaylist = () => {
    setPlaylistModalOpen(true);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "history", label: "History", icon: Clock },
    { id: "playlists", label: "Playlists", icon: Music },
    { id: "liked", label: "Liked Songs", icon: Heart },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-black pb-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Profile Header */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/60 dark:border-slate-700/60 p-4 sm:p-6 lg:p-8 shadow-2xl shadow-black/5 dark:shadow-black/20 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
            {/* Avatar Section */}
            <div className="relative group mx-auto lg:mx-0">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 shadow-2xl shadow-purple-500/25 dark:shadow-purple-500/20">
                {profileData.avatar ? (
                  <Image
                    src={profileData.avatar}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                    {profileData.displayName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm sm:text-base">
                    {user?.email}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl text-sm sm:text-base leading-relaxed">
                    {profileData.bio ||
                      "Music enthusiast exploring different genres and artists."}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl sm:rounded-2xl border border-purple-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-center mb-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 mr-1 sm:mr-2" />
                    <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {userStats?.songsPlayed?.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Songs Played
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl sm:rounded-2xl border border-pink-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-center mb-2">
                    <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400 mr-1 sm:mr-2" />
                    <p className="text-lg sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {userStats?.hoursListened?.toFixed(1)}h
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Hours Listened
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl sm:rounded-2xl border border-blue-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-center mb-2">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mr-1 sm:mr-2" />
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {userStats?.playlistsCreated}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Playlists Created
                  </p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl sm:rounded-2xl border border-red-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 mr-1 sm:mr-2" />
                    <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {likedSongs.size}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Liked Songs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-slate-700/60 mb-6 sm:mb-8 overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 min-w-fit whitespace-nowrap transition-all duration-300 font-medium ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-slate-700/60 p-4 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/20">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  Music Overview
                </h2>

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Recent Activity ({recentHistory.length})
                    </h3>
                    <div className="space-y-3">
                      {recentHistory.slice(0, 5).map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors border border-gray-200/50 dark:border-slate-600/30"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                              {song.title}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">
                              {song.playedAt}
                            </span>
                            {song.duration && (
                              <p className="text-xs text-gray-500">
                                {Math.floor(song.duration / 60)}:
                                {String(song.duration % 60).padStart(2, "0")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {recentHistory.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm sm:text-base">
                            No listening history yet
                          </p>
                          <p className="text-xs sm:text-sm">
                            Start playing some songs!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Playlists */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5 text-purple-600" />
                      My Playlists ({userPlaylists.length})
                    </h3>
                    <div className="space-y-3">
                      {userPlaylists.slice(0, 5).map((playlist) => (
                        <div
                          key={playlist.id}
                          className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-slate-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border border-gray-200/50 dark:border-slate-600/30"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                              {playlist.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {playlist.trackCount} songs
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {playlist.isPublic ? (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-700">
                                Public
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                                Private
                              </span>
                            )}
                            <Play className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                      {userPlaylists.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm sm:text-base">
                            No playlists yet
                          </p>
                          <button
                            onClick={() => setActiveTab("playlists")}
                            className="text-xs sm:text-sm text-purple-500 hover:text-purple-400 mt-2 font-medium"
                          >
                            Create your first playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Listening History ({recentHistory.length})
              </h2>
              <div className="space-y-2">
                {recentHistory.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 rounded-xl transition-colors group border border-transparent hover:border-gray-200/50 dark:hover:border-slate-600/30"
                  >
                    <span className="text-gray-400 w-6 sm:w-8 text-center text-sm">
                      {index + 1}
                    </span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
                        {song.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        {song.artist} • {song.album}
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-sm text-gray-400">
                        {song.playedAt}
                      </span>
                      {song.duration && (
                        <p className="text-xs text-gray-500">
                          {Math.floor(song.duration / 60)}:
                          {String(song.duration % 60).padStart(2, "0")}
                        </p>
                      )}
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-all">
                      <Play className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                ))}
                {recentHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg">No listening history</p>
                    <p className="text-sm">
                      Your played songs will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === "playlists" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  My Playlists ({userPlaylists.length})
                </h2>
                <button
                  onClick={handleAddToPlaylist}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Create Playlist</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {userPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => router.push(`/userplaylist/${playlist.id}`)}
                    className="group cursor-pointer"
                  >
                    <div className="relative mb-3 sm:mb-4">
                      <div className="aspect-square rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-slate-700/50">
                        {playlist.image ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={playlist.image}
                              alt={playlist.name}
                              fill
                              style={{ objectFit: "cover" }}
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              className="transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                            <div className="hidden w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
                              <Music className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Music className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Play playlist:", playlist.name);
                              }}
                              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                              <Play className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white ml-0.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlaylist(playlist.id, playlist.name);
                              }}
                              className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Playlist Info */}
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                      {playlist.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {playlist.trackCount} songs
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {userPlaylists.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base sm:text-lg">No playlists yet</p>
                    <p className="text-sm mb-4">
                      Create your first playlist to organize your music
                    </p>
                    <button
                      onClick={() => {
                     handleAddToPlaylist()
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 font-medium"
                    >
                      Create First Playlist
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liked Songs Tab */}
          {activeTab === "liked" && (
            <div>
              <LikedSongs likedSongIds={likedSongs} onLikedSongsChange={setLikedSongs}  />
            </div>
          )}
        </div>
      </div>

      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => {
          setPlaylistModalOpen(false);
        }}
        onPlaylistCreated={handlePlaylistCreatedOptimistic}
      />
    </div>
  );
}
