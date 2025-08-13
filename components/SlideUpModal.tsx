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
  // Animation states


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
    if (diff > 100) {
      // Swipe down threshold
      onClose();
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const translateY = isDragging ? Math.max(0, currentY - startY) : 0;
 if (!isVisible) return null;


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

      {/* Animated Modal Content */}
      <div
        className={`relative w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] max-h-[90vh] overflow-hidden ${
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
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Now Playing
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(90vh-100px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlideUpModal;
