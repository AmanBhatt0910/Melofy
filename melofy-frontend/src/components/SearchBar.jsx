'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiSearchLine, RiCloseLine, RiFilterLine } from 'react-icons/ri';

export default function SearchBar({ onSearch, onFilter, filterActive = false }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 mb-6">
      <motion.div 
        className={`relative flex-1 group ${isFocused ? 'z-10' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg blur-md transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`}
        ></div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="bg-blue-900/30 border border-white/10 w-full py-3 px-11 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
          />
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <RiCloseLine className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        
        {query && isFocused && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-blue-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-10"
          >
            <div className="py-2 px-3 text-sm text-gray-400">
              Search suggestions:
            </div>
            <div className="border-t border-white/5">
              <SearchSuggestion query={query} text="Songs with" />
              <SearchSuggestion query={query} text="Albums by" />
              <SearchSuggestion query={query} text="Artists like" />
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {onFilter && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onFilter}
          className={`${filterActive 
            ? 'bg-indigo-500 text-white' 
            : 'bg-blue-900/30 border border-white/10 text-gray-300 hover:text-white'} 
            rounded-lg px-4 py-2 md:py-0 flex items-center justify-center space-x-2 transition-colors duration-300`}
        >
          <RiFilterLine className="w-5 h-5" />
          <span className="font-medium">Favorites</span>
        </motion.button>
      )}
    </div>
  );
}

function SearchSuggestion({ query, text }) {
  return (
    <button className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center space-x-3 group transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
        <RiSearchLine className="w-4 h-4 text-indigo-400" />
      </div>
      <div>
        <span className="text-gray-300 group-hover:text-white transition-colors">{text} </span>
        <span className="text-indigo-400 font-medium">"{query}"</span>
      </div>
    </button>
  );
}