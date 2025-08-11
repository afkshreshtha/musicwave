import { useState } from "react";
import { cn } from "@/lib/utils";
import { Music, Zap, Guitar, Piano, Mic, Headphones, Sparkles } from "lucide-react";

const genres = [
  { name: "Pop", icon: Music, color: "from-pink-500 to-rose-500", bgColor: "bg-pink-500/10", shadowColor: "shadow-pink-500/25" },
  { name: "Classic", icon: Piano, color: "from-amber-500 to-orange-500", bgColor: "bg-amber-500/10", shadowColor: "shadow-amber-500/25" },
  { name: "Rock", icon: Guitar, color: "from-red-500 to-pink-500", bgColor: "bg-red-500/10", shadowColor: "shadow-red-500/25" },
  { name: "Jazz", icon: Piano, color: "from-purple-500 to-indigo-500", bgColor: "bg-purple-500/10", shadowColor: "shadow-purple-500/25" },
  { name: "Hip-Hop", icon: Mic, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10", shadowColor: "shadow-green-500/25" },
  { name: "Electronic", icon: Zap, color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-500/10", shadowColor: "shadow-blue-500/25" }
];

export default function GenreSelector({ onSelect }: { onSelect?: (genre: string) => void }) {
  const [activeGenre, setActiveGenre] = useState("Pop");

  const handleGenreClick = (genre: string) => {
    setActiveGenre(genre);
    // Only call onSelect if it's provided and is a function
    if (onSelect && typeof onSelect === 'function') {
      onSelect(genre);
    }
  };

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur-sm opacity-75"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
            <Headphones className="w-5 h-5 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose Your Vibe
        </h2>
      </div>

      {/* Genre Buttons */}
      <div className="flex gap-4 flex-wrap justify-center md:justify-start">
        {genres.map((genre) => {
          const Icon = genre.icon;
          const isActive = activeGenre === genre.name;
          
          return (
            <button
              key={genre.name}
              onClick={() => handleGenreClick(genre.name)}
              className={cn(
                "group relative px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1",
                "backdrop-blur-md border  0 border-gray-200/60 dark:border-white/10 shadow-sm dark:shadow-none",
                isActive 
                  ? "shadow-2xl shadow-purple-500/25 " 
                  : "hover:shadow-xl hover:shadow-purple-500/20"
              )}
              style={{
                background: isActive 
                  ? ` linear-gradient(135deg, ${genre.color.split(' ')[1]}, ${genre.color.split(' ')[3]})`
                  : undefined
              }}
            >
              {/* Background gradient for inactive state */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/50 dark:to-gray-700/50 rounded-2xl transition-opacity duration-300 group-hover:opacity-75"></div>
              )}
              
              {/* Animated gradient border on hover */}
              <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                `bg-gradient-to-r ${genre.color} p-[1px]`
              )}>
                <div className="w-full h-full bg-white dark:bg-background rounded-2xl"></div>
              </div>

              {/* Content */}
              <div className="relative flex items-center gap-2 z-10">
                <Icon className={cn(
                  "w-4 h-4 transition-all duration-300",
                  isActive 
                    ? "text-gray-500 dark:text-white" 
                    : "text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                )} />
                <span className={cn(
                  "text-sm transition-all duration-300",
                  isActive 
                    ? "text-gray-500 dark:text-white" 
                    : "text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                )}>
                  {genre.name}
                </span>
              </div>

              {/* Active state glow effect */}
              {isActive && (
                <div className={cn(
                  "absolute inset-0 rounded-2xl blur-xl opacity-30 transition-opacity duration-300",
                  `bg-gradient-to-r ${genre.color}`
                )}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Decorative elements */}
      <div className="relative mt-6">
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent blur-sm"></div>
      </div>
    </div>
  );
}
