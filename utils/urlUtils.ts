
export function createMusicSlug(songName, artistName) {
  if (!songName) return '';
  
  const combined = artistName ? `${songName}-${artistName}` : songName;
  
  return combined
    .toLowerCase()
    .normalize('NFD') // Handle accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple consecutive hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 80); // Limit length for SEO
}

export function createPlaylistSlug(playlistName, genre) {
  const combined = genre ? `${genre}-${playlistName}` : playlistName;
  return createMusicSlug(combined);
}

// Parse slug back to get song info
export function parseSlug(slug) {
  const parts = slug.split('-');
  // This would require additional logic based on your data structure
  // You might need to store the slug mapping in your database
  return {
    slug,
    searchTerms: parts.join(' ')
  };
}