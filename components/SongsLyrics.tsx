"use client";
import React, { useState, useEffect, useRef } from "react";
import { Music2, Loader2, AlertCircle, ChevronDown, ChevronUp, Mic2 } from "lucide-react";
import { useGetLyricsQuery } from "@/redux/features/api/musicApi";

interface SongLyricsProps {
  artistName: string;
  songName: string;
  decodeHTMLString?: (str: string) => string;
}

const defaultDecode = (str: string) =>
  str
    ?.replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">") || "";

const SongLyrics: React.FC<SongLyricsProps> = ({
  artistName,
  songName,
  decodeHTMLString = defaultDecode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showGradient, setShowGradient] = useState(true);
  const lyricsRef = useRef<HTMLDivElement>(null);

  const cleanArtist = decodeHTMLString(artistName || "");
  const cleanSong = decodeHTMLString(songName || "");

  const { data, isLoading, isError, error } = useGetLyricsQuery(
    { artist: cleanArtist, song: cleanSong },
    { skip: !cleanArtist || !cleanSong }
  );
console.log(artistName)
  const lyrics: string = data?.lyrics || "";
  const source: string = data?.source || "";

  // Split into paragraphs (double newline = stanza break)
  const stanzas = lyrics
    ? lyrics.split(/\r?\n\r?\n/).map((stanza) =>
        stanza.split(/\r?\n/).filter(Boolean)
      )
    : [];

  useEffect(() => {
    if (expanded && lyricsRef.current) {
      const el = lyricsRef.current;
      setShowGradient(el.scrollHeight > el.clientHeight + 8);
    } else {
      setShowGradient(true);
    }
  }, [expanded, lyrics]);

  // ── States ──────────────────────────────────────────────────────────────

  if (!cleanArtist || !cleanSong) return null;

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-none">
        <LyricsHeader />
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            Fetching lyrics…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !lyrics) {
    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-none">
        <LyricsHeader />
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Lyrics not available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
            We couldnt find lyrics for this song right now.
          </p>
        </div>
      </div>
    );
  }

  // ── Full render ──────────────────────────────────────────────────────────

  const COLLAPSED_HEIGHT = 340; // px

  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-200/50 dark:border-white/10 shadow-xl dark:shadow-none">
      <LyricsHeader />

      {/* Lyrics body */}
      <div className="relative mt-2">
        {/* Scrollable / clipped area */}
        <div
          ref={lyricsRef}
          className="overflow-hidden transition-all duration-700 ease-in-out"
          style={{ maxHeight: expanded ? "9999px" : `${COLLAPSED_HEIGHT}px` }}
        >
          <div className="space-y-6 select-text">
            {stanzas.map((lines, si) => (
              <div key={si} className="space-y-1.5">
                {lines.map((line, li) => (
                  <p
                    key={li}
                    className={`leading-relaxed text-gray-800 dark:text-gray-200 font-medium transition-colors ${
                      line.trim() === ""
                        ? "h-4"
                        : "text-base md:text-lg tracking-wide"
                    }`}
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade gradient when collapsed */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-gray-900 via-white/80 dark:via-gray-900/80 to-transparent pointer-events-none rounded-b-2xl" />
        )}
      </div>

      {/* Show more / less */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="group flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300/70 dark:border-white/15 bg-gray-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              Show full lyrics
            </>
          )}
        </button>

        {/* Source attribution */}
        {source && (
          <p className="text-xs text-gray-400 dark:text-gray-600 capitalize tracking-wide">
            Source: {source.replace(/_/g, " ")}
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

const LyricsHeader = () => (
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
      <Mic2 className="w-5 h-5 text-white" />
    </div>
    Lyrics
  </h2>
);

export default SongLyrics;