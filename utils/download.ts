import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ID3Writer } from "browser-id3-writer";

interface SongMetadata {
  title: string;
  artist: string;
  album?: string;
  year?: string;
  coverUrl?: string;
}
// utils/download.ts
export async function downloadMP4WithMetadata(
  url: string,
  filename: string,
  metadata: SongMetadata,
  onProgress?: (progress: number, status: string) => void
) {
  try {
    onProgress?.(10, 'fetching');
    
    // 1. Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    ffmpeg.on("log", ({ message }) => {
      console.log("FFmpeg:", message);
    });

    // Track FFmpeg progress
    ffmpeg.on("progress", ({ progress }) => {
      // FFmpeg progress is 0-1, convert to 30-70% of total progress
      const convertProgress = 30 + (progress * 40);
      onProgress?.(convertProgress, 'converting');
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    onProgress?.(20, 'fetching');

    // 2. Fetch the MP4 file
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const mp4Data = await res.arrayBuffer();

    onProgress?.(30, 'converting');

    // 3. Convert MP4 to MP3 using FFmpeg
    await ffmpeg.writeFile("input.mp4", new Uint8Array(mp4Data));
    await ffmpeg.exec([
      "-i", "input.mp4",
      "-vn",
      "-acodec", "libmp3lame", 
      "-ab", "320k",
      "-ar", "44100",
      "-f", "mp3",
      "output.mp3"
    ]);

    onProgress?.(70, 'tagging');

    // 4. Get the converted MP3
    const mp3Data = await ffmpeg.readFile("output.mp3");
    const mp3Buffer = (mp3Data as Uint8Array).buffer;

    // 5. Apply ID3 metadata
    const writer = new ID3Writer(new Uint8Array(mp3Buffer));

    writer
      .setFrame("TIT2", metadata.title)
      .setFrame("TPE1", [metadata.artist])
      .setFrame("TALB", metadata.album || "")
      .setFrame("TYER", metadata.year || new Date().getFullYear().toString());

    onProgress?.(80, 'tagging');

    // 6. Add album art
    if (metadata.coverUrl) {
      try {
        const coverRes = await fetch(metadata.coverUrl, {
          mode: "cors",
          headers: { Accept: "image/*" },
        });

        if (coverRes.ok) {
          const coverBuffer = await coverRes.arrayBuffer();
          writer.setFrame("APIC", {
            type: 3,
            data: new Uint8Array(coverBuffer),
            description: "Cover",
            mimeType: "image/jpeg",
          });
        }
      } catch (coverError) {
        console.warn("Failed to add cover art:", coverError);
      }
    }

    onProgress?.(90, 'downloading');

    // 7. Finalize and download
    writer.addTag();
    const taggedBlob = writer.getBlob();
    
    onProgress?.(95, 'downloading');
    
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(taggedBlob);

    link.href = objectUrl;
    link.download = filename.replace(".mp3", "") + ".mp3";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    onProgress?.(100, 'complete');

    // 8. Cleanup
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp3");
  } catch (error) {
    console.error("Download with metadata failed:", error);
    throw error;
  }
}

