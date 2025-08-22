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
export async function downloadMP4WithMetadata(
  url: string,
  filename: string,
  metadata: SongMetadata
) {
  try {
    // 1. Initialize FFmpeg
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    // 2. Fetch the MP4 file
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const mp4Data = await res.arrayBuffer();

    // 3. Convert MP4 to MP3 using FFmpeg
    await ffmpeg.writeFile("input.mp4", new Uint8Array(mp4Data));
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "320k",
      "output.mp3",
    ]);

    // 4. Get the converted MP3
    const mp3Data = await ffmpeg.readFile("output.mp3");
    const mp3Buffer = (mp3Data as Uint8Array).buffer;

    // 5. Now apply your existing ID3 metadata code
    const writer = new ID3Writer(new Uint8Array(mp3Buffer));

    writer
      .setFrame("TIT2", metadata.title)
      .setFrame("TPE1", [metadata.artist])
      .setFrame("TALB", metadata.album || "")
      .setFrame("TYER", metadata.year || new Date().getFullYear().toString());

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

    // 7. Finalize and download
    writer.addTag();

    const taggedBlob = writer.getBlob();
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(taggedBlob);

    link.href = objectUrl;
    link.download = filename.replace(".mp3", "") + ".mp3"; // Ensure .mp3 extension
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    // 8. Cleanup
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp3");
  } catch (error) {
    console.error("Download with metadata failed:", error);
    throw error;
  }
}
