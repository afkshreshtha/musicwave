// utils/playlistDownload.ts
import JSZip from "jszip";
import { downloadMP4WithMetadata } from "@/utils/download";

interface Song {
  id: string;
  name: string;
  artists?: {
    primary?: Array<{ name: string }>;
  };
  album?: {
    name: string;
  };
  year?: string;
  url?: string;
  downloadUrl?: any;
  image?: Array<{ url: string }>;
  duration?: number;
}

interface PlaylistDownloadProgress {
  currentSong: number;
  totalSongs: number;
  currentSongProgress: number;
  currentSongStatus: string;
  overallProgress: number;
  currentSongName: string;
}

// Helper function to resolve song download info
function resolveSongDownload(song: Song) {
  const url = song.downloadUrl?.[4]?.url || song.url || song.streamUrl;
  const safeName = `${song.name || "track"} - ${
    song.artists?.primary?.[0]?.name || "unknown"
  }`.replace(/[^\w\-\s\.\(\)\[\]]/g, "_");

  return { url, filename: safeName };
}

// Download single song and return as buffer for ZIP
async function downloadSongAsBuffer(
  song: Song,
  onProgress?: (progress: number, status: string) => void
): Promise<{ buffer: Uint8Array; filename: string }> {
  const { url, filename } = resolveSongDownload(song);
  if (!url) throw new Error(`Download URL not available for ${song.name}`);

  return new Promise((resolve, reject) => {
    // Store the original createElement to restore later
    const originalCreateElement = document.createElement;
    let resolved = false;

    // Override createElement to intercept the download
    document.createElement = function (tagName: string) {
      const element = originalCreateElement.call(document, tagName);

      if (tagName.toLowerCase() === "a" && !resolved) {
        // Override the click method to capture the blob
        const originalClick = element.click;
        element.click = function () {
          if (element.href && element.href.startsWith("blob:") && !resolved) {
            resolved = true;

            // Fetch the blob data
            fetch(element.href)
              .then((response) => response.arrayBuffer())
              .then((buffer) => {
                const uint8Buffer = new Uint8Array(buffer);

                // Restore original createElement
                document.createElement = originalCreateElement;

                // Clean up the blob URL
                URL.revokeObjectURL(element.href);

                resolve({
                  buffer: uint8Buffer,
                  filename: `${filename}.mp3`,
                });
              })
              .catch((error) => {
                document.createElement = originalCreateElement;
                reject(error);
              });
          }
        };
      }

      return element;
    };

    // Call your existing download function
    downloadMP4WithMetadata(
      url,
      filename,
      {
        title: song.name || "Unknown Title",
        artist: song.artists?.primary?.[0]?.name || "Unknown Artist",
        album: song.album?.name,
        year: song.year,
        coverUrl: song.image?.[1]?.url || song.image?.[2]?.url,
      },
      onProgress
    ).catch((error) => {
      document.createElement = originalCreateElement;
      reject(error);
    });

    // Fallback timeout
    setTimeout(() => {
      if (!resolved) {
        document.createElement = originalCreateElement;
        reject(new Error("Download timeout"));
      }
    }, 60000); // 60 second timeout
  });
}

// Main function that creates ZIP file
export async function downloadPlaylistAsZip(
  songs: Song[],
  playlistName: string,
  onProgress?: (progress: PlaylistDownloadProgress) => void
) {
  if (!songs.length) throw new Error("No songs to download");

  const zip = new JSZip();
  const errors: Array<{ song: string; error: string }> = [];
  let successCount = 0;

  // Process each song
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    try {
      onProgress?.({
        currentSong: i + 1,
        totalSongs: songs.length,
        currentSongProgress: 0,
        currentSongStatus: "starting",
        overallProgress: (i / songs.length) * 100,
        currentSongName: song.name || "Unknown",
      });

      // Download song as buffer
      const { buffer, filename } = await downloadSongAsBuffer(
        song,
        (progress, status) => {
          onProgress?.({
            currentSong: i + 1,
            totalSongs: songs.length,
            currentSongProgress: progress,
            currentSongStatus: status,
            overallProgress: ((i + progress / 100) / songs.length) * 100,
            currentSongName: song.name || "Unknown",
          });
        }
      );

      // Ensure unique filenames in ZIP
      let uniqueFilename = filename;
      let counter = 1;
      while (zip.files[uniqueFilename]) {
        const name = filename.replace(".mp3", "");
        uniqueFilename = `${name}_${counter}.mp3`;
        counter++;
      }

      // Add to ZIP
      zip.file(uniqueFilename, buffer);
      successCount++;
    } catch (error) {
      console.error(`Failed to download ${song.name}:`, error);
      errors.push({
        song: song.name || "Unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (successCount === 0) {
    throw new Error("Failed to download any songs");
  }

  onProgress?.({
    currentSong: songs.length,
    totalSongs: songs.length,
    currentSongProgress: 100,
    currentSongStatus: "creating_zip",
    overallProgress: 95,
    currentSongName: "Creating ZIP file...",
  });

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "STORE", // No compression for already compressed audio
  });

  // Download the ZIP file
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(zipBlob);

  link.href = objectUrl;
  link.download = `${playlistName.replace(/[^\w\-\s\.\(\)\[\]]/g, "_")}.zip`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 100);

  onProgress?.({
    currentSong: songs.length,
    totalSongs: songs.length,
    currentSongProgress: 100,
    currentSongStatus: "complete",
    overallProgress: 100,
    currentSongName: `ZIP created! ${successCount}/${songs.length} songs included.`,
  });

  return { errors, successCount, totalCount: songs.length };
}

// Keep your existing functions for individual downloads
export async function downloadPlaylistSequentially(
  songs: Song[],
  playlistName: string,
  downloadSingleSong: (song: Song) => Promise<void>,
  onProgress?: (progress: PlaylistDownloadProgress) => void
) {
  // ... your existing code
}
