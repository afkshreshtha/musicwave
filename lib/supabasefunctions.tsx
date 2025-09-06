import { supabase } from "./supabase";

// Initialize user stats (run once when user signs up)
export const initializeUserStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  // Use upsert instead of insert to handle existing records
  const { error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: user.id,
      total_songs_played: 0,
      total_listening_hours: 0,
      total_playlists_created: 0
    }, {
      onConflict: 'user_id' // Specify the conflict column
    });
    
  if (error) {
    console.error('Error initializing stats:', error);
  } else {
    console.log('User stats initialized successfully');
  }
};

// Track when user plays a song
export const trackSongPlay = async (songDuration) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  const { error } = await supabase.rpc('increment_user_stats', {
    p_user_id: user.id,
    p_songs_increment: 1,
    p_hours_increment: songDuration / 3600 // Convert seconds to hours
  });
  
  if (error) {
    console.error('Error tracking song play:', error);
  }
};

// Track when user creates a playlist
export const trackPlaylistCreation = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  const { error } = await supabase.rpc('increment_playlist_count', {
    p_user_id: user.id
  });
  
  if (error) {
    console.error('Error tracking playlist creation:', error);
  }
};

// Fetch user stats for display
export const fetchUserStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle no results
    
  if (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
  
  // If no stats exist, initialize them
  if (!data) {
    await initializeUserStats();
    return {
      songsPlayed: 0,
      hoursListened: 0,
      playlistsCreated: 0
    };
  }
  
  return {
    songsPlayed: data.total_songs_played || 0,
    hoursListened: parseFloat(data.total_listening_hours) || 0,
    playlistsCreated: data.total_playlists_created || 0
  };
};

// Fetch user's liked songs
export const fetchUserLikes = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_likes')
    .select('song_id')
    .eq('user_id', user.id);
    
  if (error) {
    console.error('Error fetching likes:', error);
    return [];
  }
  
  return data.map(item => item.song_id);
};

// Toggle like for a song
export const toggleSongLike = async (songId, isCurrentlyLiked) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return false;
  }
  
  if (isCurrentlyLiked) {
    // Unlike the song
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('song_id', songId);
      
    if (error) {
      console.error('Error unliking song:', error);
      return false;
    }
    
    return false; // Now unliked
  } else {
    // Like the song
    const { error } = await supabase
      .from('user_likes')
      .insert({
        user_id: user.id,
        song_id: songId
      });
      
    if (error) {
      console.error('Error liking song:', error);
      return false;
    }
    
    return true; // Now liked
  }
};

// Fetch user playlists
export const fetchUserPlaylists = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return [];
  }
  
  const { data, error } = await supabase
    .from('user_playlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
  
  return data || [];
};

// Create new playlist
export const createPlaylist = async (name, description = '') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_playlists')
    .insert({
      user_id: user.id,
      name: name,
      description: description
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating playlist:', error);
    return null;
  }
  
  return data;
};

// Add song to playlist
export const addSongToPlaylist = async (playlistId, songId) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user logged in');
    return false;
  }
  
  const { error } = await supabase
    .from('playlist_songs')
    .insert({
      playlist_id: playlistId,
      song_id: songId,
      user_id: user.id
    });
    
  if (error) {
    console.error('Error adding song to playlist:', error);
    return false;
  }
  
  return true;
};

// Function to like/save entire playlist to user's account
export const handleLikePlaylist = async (playlist, allSongs) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login to save playlists');
      return false;
    }

    // Check if playlist already exists for user
    const { data: existingPlaylist } = await supabase
      .from('user_playlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', playlist.name)
      .single();

    if (existingPlaylist) {
      alert(`Playlist "${playlist.name}" is already in your library!`);
      return false;
    }

    // Create new playlist for user
    const { data: newPlaylist, error: createError } = await supabase
      .from('user_playlists')
      .insert([{
        user_id: user.id,
        name: playlist.name,
        description: playlist.description || `Saved from ${playlist.name}`,
        is_public: false,
        image_url: playlist.image?.[2]?.url || playlist.image?.[1]?.url || playlist.image?.[0]?.url
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating playlist:', createError);
      alert('Failed to save playlist: ' + createError.message);
      return false;
    }

    // Prepare songs to add to the new playlist
    if (allSongs && allSongs.length > 0) {
      const songsToInsert = allSongs.map((song, index) => ({
        playlist_id: newPlaylist.id,
        song_id: song.id,
        user_id: user.id,
        position: index + 1,
        added_at: new Date().toISOString()
      }));

      // Insert songs into playlist
      const { error: insertError } = await supabase
        .from('playlist_songs')
        .insert(songsToInsert);

      if (insertError) {
        console.error('Error adding songs to playlist:', insertError);
        // Delete the created playlist if songs couldn't be added
        await supabase
          .from('user_playlists')
          .delete()
          .eq('id', newPlaylist.id);
        
        alert('Failed to save songs to playlist: ' + insertError.message);
        return false;
      }
    }

    // Update playlist creation stats
    await trackPlaylistCreation();

    alert(`Playlist "${playlist.name}" saved to your library with ${allSongs?.length || 0} songs!`);
    return true;

  } catch (error) {
    console.error('Error saving playlist:', error);
    alert('An unexpected error occurred while saving the playlist');
    return false;
  }
};

// Enhanced version with better error handling and data validation
export const saveToListeningHistory = async (song) => {
  try {
    // Validate song object
    if (!song || !song.id) {
      console.error('Invalid song object provided');
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not logged in');
      return false;
    }

    // Check if this exact song was recently played (within last minute) to avoid duplicates
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    
    const { data: recentPlay } = await supabase
      .from('user_listening_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_id', song.id)
      .gte('played_at', oneMinuteAgo)
      .limit(1);

    if (recentPlay && recentPlay.length > 0) {
      console.log('Song was played recently, skipping duplicate entry');
      return true; // Not an error, just avoiding duplicate
    }

    const { error } = await supabase
      .from('user_listening_history')
      .insert({
        user_id: user.id,
        song_id: song.id,
        song_title: song.name || 'Unknown Title',
        artist_name: song.artists?.primary?.map(artist => artist.name).join(', ') || 'Unknown Artist',
        album_name: song.album?.name || 'Unknown Album',
        duration_seconds: song.duration || 0,
        played_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving listening history:', error);
      return false;
    }

    console.log('✅ Saved to listening history:', song.name);
    return true;
  } catch (error) {
    console.error('Unexpected error saving listening history:', error);
    return false;
  }
};

// Function to fetch all songs from user playlists
export const fetchUserPlaylistSongs = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not logged in');
      return [];
    }

    // Fetch all song IDs from user's playlists with playlist info
    const { data: playlistSongs, error } = await supabase
      .from('playlist_songs')
      .select(`
        song_id,
        added_at,
        position,
        user_playlists (
          id,
          name,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching playlist songs:', error);
      return [];
    }

    return playlistSongs || [];
  } catch (error) {
    console.error('Unexpected error fetching playlist songs:', error);
    return [];
  }
};

// Function to get songs by playlist ID
export const fetchPlaylistSongsById = async (playlistId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User not logged in');
      return [];
    }

    const { data: playlistSongs, error } = await supabase
      .from('playlist_songs')
      .select(`
        song_id,
        added_at,
        position,
        user_playlists (
          id,
          name,
          image_url,
          description
        )
      `)
      .eq('playlist_id', playlistId)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching playlist songs:', error);
      return [];
    }

    return playlistSongs || [];
  } catch (error) {
    console.error('Unexpected error fetching playlist songs:', error);
    return [];
  }
};

// Function to delete user account (requires custom backend implementation)
export const deleteUserAccount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Delete user data from your tables
    await Promise.all([
      supabase.from('user_stats').delete().eq('user_id', user.id),
      supabase.from('user_playlists').delete().eq('user_id', user.id), 
      supabase.from('user_liked_songs').delete().eq('user_id', user.id),
      supabase.from('user_listening_history').delete().eq('user_id', user.id),
      supabase.from('playlist_songs').delete().eq('user_id', user.id)
    ]);

    // Sign out user
    await supabase.auth.signOut();
    
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return false;
  }
};

export const getUserSubscription = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // ✅ INSTANT expiry check in frontend
    if (subscription && subscription.current_period_end) {
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      
      if (now >= endDate && subscription.plan_type !== 'free') {
        console.log('🕐 Subscription expired, deleting...');
        
        // Delete expired subscription immediately
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('plan_type', subscription.plan_type);
          
        return null; // No subscription
      }
    }

    return subscription;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

export const createOrUpdateSubscription = async (subscriptionData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        ...subscriptionData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const deductCredits = async (creditsToDeduct) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const subscription = await getUserSubscription();
    if (!subscription) {
      // Create free tier subscription
      await createOrUpdateSubscription({
        plan_type: 'free',
        credits_remaining: 10 - creditsToDeduct,
        total_credits: 10,
        is_unlimited: false,
        status: 'active'
      });
      return true;
    }

    if (subscription.is_unlimited) return true;

    if (subscription.credits_remaining < creditsToDeduct) {
      throw new Error('Insufficient credits');
    }

    await createOrUpdateSubscription({
      ...subscription,
      credits_remaining: subscription.credits_remaining - creditsToDeduct
    });

    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};

export const userHasActiveSubscription = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id, plan_type, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('plan_type', ['monthly', 'yearly'])
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

export const incrementUserCredits = async (userId, creditsToAdd) => {
  try {
    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentCredits = currentSub?.credits_remaining || 0;
    const newCredits = currentCredits + creditsToAdd;

    // Update or create subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_type: 'basic', // or keep existing plan type
        credits_remaining: newCredits,
        total_credits: (currentSub?.total_credits || 0) + creditsToAdd,
        is_unlimited: false,
        status: 'active',
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error incrementing credits:', error);
    throw error;
  }
};

export const checkAndUpdateExpiredSubscriptions = async () => {
  try {
    const now = new Date().toISOString();
    
    // Update expired subscriptions to free plan
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_type: 'free',
        credits_remaining: 10, // Reset to free tier credits
        total_credits: 10,
        is_unlimited: false,
        status: 'expired'
      })
      .lt('current_period_end', now)
      .eq('status', 'active')
      .in('plan_type', ['monthly', 'yearly']);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating expired subscriptions:', error);
  }
};

export const isSubscriptionActive = (subscription) => {
  if (!subscription || !subscription.current_period_end) {
    return false;
  }

  const now = new Date();
  const periodEnd = new Date(subscription.current_period_end);

  // Active only if status is 'active' AND date hasn't passed
  return subscription.status === 'active' && now < periodEnd;
};

// Check if user has sufficient credits and deduct them
export const deductUserCredits = async (userId, creditsNeeded, downloadType) => {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscription) {
      throw new Error('Subscription not found. Please check your account.');
    }

    // Check if user has unlimited downloads
    if (subscription.is_unlimited) {
      return { success: true, remainingCredits: 'unlimited' };
    }

    // Check if user has sufficient credits
    if (subscription.credits_remaining < creditsNeeded) {
      throw new Error(`Insufficient credits. You need ${creditsNeeded} credit${creditsNeeded > 1 ? 's' : ''} to download this ${downloadType}, but you only have ${subscription.credits_remaining}.`);
    }

    // Deduct credits
    const newCredits = subscription.credits_remaining - creditsNeeded;
    
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        credits_remaining: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error('Failed to update credits. Please try again.');
    }

    return { 
      success: true, 
      remainingCredits: newCredits,
      deductedCredits: creditsNeeded
    };

  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};


