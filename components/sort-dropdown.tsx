"use client"
import React from 'react';
import { ChevronDown } from 'lucide-react';

const SortDropdown = ({ sortBy, sortOrder, onSortChange, type = 'songs' }) => {
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'latest', label: 'Latest' },
    { value: 'alphabetical', label: 'A-Z' },
  ];

  const handleSortByChange = (newSortBy) => {
    onSortChange({ sortBy: newSortBy, sortOrder });
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange({ sortBy, sortOrder: newOrder });
  };

  const getSortOrderLabel = () => {
    if (sortBy === 'alphabetical') {
      return sortOrder === 'asc' ? 'A-Z' : 'Z-A';
    }
    if (sortBy === 'latest') {
      return sortOrder === 'asc' ? 'Oldest First' : 'Newest First';
    }
    return sortOrder === 'asc' ? 'Low to High' : 'High to Low';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sort By Dropdown */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => handleSortByChange(e.target.value)}
          className="appearance-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-8 text-white text-sm hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-800 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Sort Order Toggle */}
      <button
        onClick={handleSortOrderToggle}
        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
      >
        {getSortOrderLabel()}
      </button>
    </div>
  );
};

export default SortDropdown;
