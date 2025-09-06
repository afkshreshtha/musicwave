import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create admin client with service_role key - THIS IS THE KEY FIX
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function DELETE(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Starting deletion process for user: ${userId}`);

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ 
        error: 'Server configuration error - service role key missing' 
      }, { status: 500 });
    }

    // Step 1: Delete user's files from storage using admin client
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('avatars')
        .list(`${userId}/`);

      if (!listError && files && files.length > 0) {
        const filesToDelete = files.map(file => `${userId}/${file.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filesToDelete);
        console.log('Deleted user files from storage');
      }
    } catch (storageError) {
      console.warn('Storage deletion failed:', storageError);
    }

    // Step 2: Delete all user-related data from database tables using admin client
    const deletionPromises = [
      supabaseAdmin.from('user_listening_history').delete().eq('user_id', userId),
      supabaseAdmin.from('playlist_songs').delete().eq('user_id', userId),
      supabaseAdmin.from('user_liked_songs').delete().eq('user_id', userId),
      supabaseAdmin.from('user_playlists').delete().eq('user_id', userId),
      supabaseAdmin.from('user_stats').delete().eq('user_id', userId),
    ];

    const results = await Promise.allSettled(deletionPromises);
    
    // Log any failures but continue
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Failed to delete from table ${index}:`, result.reason);
      }
    });

    console.log('Deleted user data from database tables');

    // Step 3: Delete user from auth.users table using ADMIN CLIENT
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Failed to delete user from auth:', authError);
      return NextResponse.json({ 
        error: 'Failed to delete user account',
        details: authError.message 
      }, { status: 500 });
    }

    console.log(`Successfully deleted user: ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'User account and all associated data deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
