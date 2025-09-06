"use client";
import { ModeToggle } from "@/components/mode-toogle";
import Link from "next/link";
import { Heart, User, Waves, LogOut, Settings, Shield, CreditCard } from "lucide-react";
import SearchBar from "./search-br";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import CreditsDisplay from "./creaditDisplay";
import Image from "next/image";

export default function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Scroll handling logic (same as before)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          setIsAtTop(currentScrollY < 10);

          if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state management
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleLogin = () => {
    router.push("/auth");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Enhanced background with scroll-dependent opacity */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isAtTop
            ? "bg-gradient-to-r from-purple-600/5 via-pink-500/5 to-blue-600/5 backdrop-blur-sm"
            : "bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50"
        } border-b border-gray-200/30 dark:border-white/10`}
      />

      <nav className="relative flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-6 lg:px-12 py-2 xs:py-3 sm:py-4 max-w-7xl mx-auto gap-1 xs:gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-1 xs:gap-2 sm:gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0 min-w-0"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-1 xs:p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40">
              <Waves className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
            <span className="hidden lg:inline">MusicWave</span>
            <span className="lg:hidden">Wave</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 min-w-0 max-w-md mx-1 xs:mx-2 sm:mx-4">
          <SearchBar />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 flex-shrink-0">
          {/* Favorites */}
          <Link
            href="/favorites"
            className="group relative p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 touch-manipulation"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg xs:rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Heart className="relative w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white/80 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:scale-110 transition-all duration-300" />
            <span className="sr-only">Favorites</span>
          </Link>

          {/* User Profile / Auth */}
          <div className="relative" ref={menuRef}>
            {isLoading ? (
              <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : user ? (
              <>
                {/* User Avatar/Icon */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="group relative p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg xs:rounded-xl sm:rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 touch-manipulation"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg xs:rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={`${user?.user_metadata?.avatar_url}`}
                      alt="Profile"
                      width={50}
                      height={50}
                      className="relative w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="relative w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-white/80 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300" />
                  )}
                  
                  {/* Online indicator */}
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 xs:w-2.5 xs:h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center gap-3">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user?.user_metadata.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.user_metadata?.full_name || user.user_metadata?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <Link
                        href="/premium"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Upgrade Premium
                      </Link>
                      <Link
                        href="/manage-subscription"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Manage Subscription
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Login Button */
              <button
                onClick={handleLogin}
                className="group relative px-3 xs:px-4 sm:px-6 py-1.5 xs:py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg xs:rounded-xl sm:rounded-2xl transition-all duration-300 touch-manipulation hover:scale-105 shadow-lg shadow-purple-500/25"
              >
                <span className="relative text-xs xs:text-sm font-semibold text-white">
                  Login
                </span>
              </button>
            )}
          </div>
          <CreditsDisplay/>

          {/* Mode Toggle */}
          <div className="relative scale-75 xs:scale-90 sm:scale-100 origin-center">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Enhanced animated bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-purple-500/60 via-pink-500/60 to-transparent animate-pulse"></div>
      </div>
    </header>
  );
}
