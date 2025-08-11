import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toogle";
import Image from "next/image";
import Link from "next/link";
import { Heart, User, Search, Waves } from "lucide-react";
import SearchBar from "./search-br";

export default function Navbar() {
  return (
    <header className="relative">
      {/* Background with gradient and blur effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-blue-600/10 backdrop-blur-lg border-b border-white/10 dark:border-white/10 border-gray-200/50"></div>

      <nav className="relative flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-12 py-3 sm:py-4 max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Logo with mobile-responsive styling */}
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
              <Waves className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
            <span className="hidden sm:inline">MusicWave</span>
            <span className="sm:hidden">Wave</span>
          </span>
        </Link>

        {/* Mobile-responsive Search Bar */}
        <SearchBar />

        {/* Action Icons with mobile-responsive styling */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Favorites */}
          <Link
            href="/favorites"
            className="group relative p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Heart className="relative w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white/80 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:scale-110 transition-all duration-300" />
          </Link>

          {/* User Profile */}
          <Link
            href="/account"
            className="group relative p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <User className="relative w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white/80 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300" />
          </Link>

          {/* Mode Toggle with mobile-responsive styling */}
          <div className="relative">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Animated bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
      </div>
    </header>
  );
}
