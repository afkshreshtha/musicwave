// components/SlideUpModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { useModalAnimation } from "@/hooks/useModalAnimation";

const SlideUpModal = ({ isOpen, onClose, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { isVisible, isAnimating } = useModalAnimation(isOpen, 300);

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = currentY - startY;
    // Adjust swipe threshold for smaller screens
    const threshold = window.innerHeight < 600 ? 60 : 100;
    if (diff > threshold) {
      onClose();
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const translateY = isDragging ? Math.max(0, currentY - startY) : 0;

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      {/* Animated Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isAnimating ? "opacity-50" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Animated Modal Content - Responsive */}
      <div
        className={`relative w-full bg-white dark:bg-gray-900 rounded-t-2xl xs:rounded-t-3xl shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] 
          max-h-[95vh] xs:max-h-[92vh] sm:max-h-[90vh] md:max-h-[85vh]
          overflow-hidden ${
          isAnimating 
            ? "translate-y-0 scale-100" 
            : "translate-y-full scale-95"
        }`}
        style={{
          transform: isAnimating
            ? `translateY(${translateY}px) scale(1)`
            : "translateY(100%) scale(0.95)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle Bar - Responsive */}
        <div className="flex justify-center pt-2 xs:pt-3 pb-1 xs:pb-2">
          <div className="w-8 h-0.5 xs:w-10 xs:h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header - Responsive */}
        <div className="flex items-center justify-between px-3 xs:px-4 pb-2 xs:pb-4">
          <button
            onClick={onClose}
            className="p-1.5 xs:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
          >
            <ChevronDown className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
          </button>
          
          <h2 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white truncate px-2">
            Now Playing
          </h2>
          
          <button
            onClick={onClose}
            className="p-1.5 xs:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content - Responsive */}
        <div className="px-3 xs:px-4 pb-3 xs:pb-4 overflow-y-auto 
          max-h-[calc(95vh-80px)] xs:max-h-[calc(92vh-90px)] sm:max-h-[calc(90vh-100px)] md:max-h-[calc(85vh-100px)]">
          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideUpModal;
