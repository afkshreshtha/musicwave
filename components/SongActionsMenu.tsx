import { Download, Heart, List, MoreHorizontal, Share2, Users } from "lucide-react";
import DownloadProgress from "./DownloadProgress";
import { useEffect, useRef, useState } from "react";

// Add this component before your main PlaylistDetailsPage component
const SongActionsMenu = ({ 
  song, 
  onLike, 
  onDownload, 
  downloadState, 
  onCancelDownload 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      
      // Position menu to the left of the button to avoid overflow
      setMenuPosition({
        top: rect.bottom + scrollY + 5,
        left: rect.left - 200 + rect.width // Adjust to position menu to the left
      });
    }
    
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleMenuToggle}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Menu */}
          <div
            ref={menuRef}
            className="fixed z-50 bg-gray-900 border border-white/20 rounded-lg shadow-2xl shadow-black/50 py-2 min-w-[220px]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {/* Like Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Heart className="w-4 h-4 text-red-400" />
              <span>Like</span>
            </button>

            {/* Download Option */}
            {downloadState ? (
              <div className="px-4 py-2.5">
                <DownloadProgress
                  progress={downloadState.progress}
                  status={downloadState.status}
                  error={downloadState.error}
                  onCancel={onCancelDownload}
                  isMobile={false}
                />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span>Download</span>
              </button>
            )}

            <div className="border-t border-white/10 my-1"></div>

            {/* Share Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Implement share functionality
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Share</span>
            </button>

            {/* Add to Queue Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Implement add to queue functionality
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <List className="w-4 h-4 text-green-400" />
              <span>Add to Queue</span>
            </button>

            {/* Add to Playlist Option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Implement add to playlist functionality
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4 text-yellow-400" />
              <span>Add to Playlist</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SongActionsMenu;
