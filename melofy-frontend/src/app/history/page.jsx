'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiHistoryLine, 
  RiDeleteBin6Line, 
  RiPlayFill,
  RiHeartLine, 
  RiHeartFill,
  RiMoreLine,
  RiSpotifyFill,
  RiYoutubeFill, 
  RiSearchLine,
  RiFilterLine,
  RiCalendarEventLine,
  RiCloseLine
} from 'react-icons/ri';
import { RiMicFill } from 'react-icons/ri';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('newest');
  const [visibleContextMenu, setVisibleContextMenu] = useState(null);
  
  // Sample history data - in a real app, this would come from your backend
  const [historyItems, setHistoryItems] = useState([
    {
      id: 1,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      coverUrl: "/api/placeholder/300/300?text=Queen",
      timestamp: "2025-05-15T14:30:00",
      favorite: true,
    },
    {
      id: 2,
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      coverUrl: "/api/placeholder/300/300?text=Weeknd",
      timestamp: "2025-05-14T21:15:00",
      favorite: false,
    },
    {
      id: 3,
      title: "Shape of You",
      artist: "Ed Sheeran",
      album: "÷ (Divide)",
      coverUrl: "/api/placeholder/300/300?text=Sheeran",
      timestamp: "2025-05-14T18:45:00",
      favorite: true,
    },
    {
      id: 4,
      title: "Bad Guy",
      artist: "Billie Eilish",
      album: "When We All Fall Asleep, Where Do We Go?",
      coverUrl: "/api/placeholder/300/300?text=Eilish",
      timestamp: "2025-05-13T20:20:00",
      favorite: false,
    },
    {
      id: 5,
      title: "Dance Monkey",
      artist: "Tones and I",
      album: "The Kids Are Coming",
      coverUrl: "/api/placeholder/300/300?text=Tones",
      timestamp: "2025-05-13T12:10:00",
      favorite: false,
    },
    {
      id: 6,
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      album: "Uptown Special",
      coverUrl: "/api/placeholder/300/300?text=Ronson",
      timestamp: "2025-05-12T09:30:00",
      favorite: true,
    },
    {
      id: 7,
      title: "Watermelon Sugar",
      artist: "Harry Styles",
      album: "Fine Line",
      coverUrl: "/api/placeholder/300/300?text=Styles",
      timestamp: "2025-05-11T15:45:00",
      favorite: false,
    },
    {
      id: 8,
      title: "Don't Start Now",
      artist: "Dua Lipa",
      album: "Future Nostalgia",
      coverUrl: "/api/placeholder/300/300?text=Lipa",
      timestamp: "2025-05-10T22:15:00",
      favorite: false,
    }
  ]);

  // Filter history based on active tab, search query, and date filter
  const filteredHistory = historyItems
    .filter(item => {
      // Filter by tab
      if (activeTab === 'favorites' && !item.favorite) return false;
      
      // Filter by search query
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !item.artist.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on selected filter
      if (selectedFilter === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (selectedFilter === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else {
        // Alphabetical by title
        return a.title.localeCompare(b.title);
      }
    });

  // Group history items by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(item);
    return groups;
  }, {});

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Toggle favorite status
  const toggleFavorite = (id) => {
    setHistoryItems(historyItems.map(item => 
      item.id === id ? { ...item, favorite: !item.favorite } : item
    ));
    setVisibleContextMenu(null);
  };

  // Delete history item
  const deleteItem = (id) => {
    setHistoryItems(historyItems.filter(item => item.id !== id));
    setVisibleContextMenu(null);
  };

  // Close any open context menu when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => setVisibleContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-indigo-950/30 pb-24">
      {/* Header with Blur Effect */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <RiHistoryLine className="w-6 h-6 text-indigo-400 mr-3" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Listening History
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <RiSearchLine className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="bg-white/5 border border-white/10 text-gray-200 text-sm rounded-xl block w-full pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none"
              placeholder="Search artists or songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                onClick={() => setSearchQuery('')}
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl 
              ${isFilterOpen 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsFilterOpen(!isFilterOpen);
            }}
          >
            <RiFilterLine className="w-5 h-5" />
            <span className="hidden sm:inline">Filter</span>
            
            {/* Filter Dropdown */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-gray-900 shadow-xl border border-white/10 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-gray-400">SORT BY</div>
                    {['newest', 'oldest', 'alphabetical'].map((filter) => (
                      <button
                        key={filter}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                          selectedFilter === filter
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'hover:bg-white/5 text-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedFilter(filter);
                          setIsFilterOpen(false);
                        }}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Filter Tabs */}
        <div className="flex mb-8 border-b border-white/10">
          {['all', 'favorites'].map((tab) => (
            <button
              key={tab}
              className={`px-6 py-3 text-sm font-medium relative ${
                activeTab === tab
                  ? 'text-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400"
                  initial={false}
                />
              )}
            </button>
          ))}
        </div>

        {/* History List */}
        <div>
          {Object.keys(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date} className="mb-8">
                {/* Date Header */}
                <div className="flex items-center mb-4">
                  <RiCalendarEventLine className="w-5 h-5 text-indigo-400 mr-2" />
                  <h2 className="text-gray-300 font-medium">{date}</h2>
                </div>
                
                {/* Items for this date */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center p-3 sm:p-4">
                        {/* Album Art */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 mr-4 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
                          <img 
                            src={item.coverUrl} 
                            alt={`${item.album} cover`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                            >
                              <RiPlayFill className="w-5 h-5 text-white" />
                            </motion.button>
                          </div>
                        </div>
                        
                        {/* Song Info */}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-gray-100 font-medium truncate">{item.title}</h3>
                          <p className="text-gray-400 text-sm truncate">{item.artist}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
                            <div className="flex ml-2 gap-1">
                              <RiSpotifyFill className="w-4 h-4 text-green-500" />
                              <RiYoutubeFill className="w-4 h-4 text-red-500" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className={`p-2 rounded-full ${
                              item.favorite 
                                ? 'text-pink-500' 
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                          >
                            {item.favorite ? (
                              <RiHeartFill className="w-5 h-5" />
                            ) : (
                              <RiHeartLine className="w-5 h-5" />
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVisibleContextMenu(visibleContextMenu === item.id ? null : item.id);
                            }}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-300"
                          >
                            <RiMoreLine className="w-5 h-5" />
                          </motion.button>
                          
                          {/* Context Menu */}
                          <AnimatePresence>
                            {visibleContextMenu === item.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-2 top-full mt-1 z-50 w-48 py-2 bg-gray-900 rounded-xl shadow-xl border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300"
                                  onClick={() => toggleFavorite(item.id)}
                                >
                                  {item.favorite ? (
                                    <>
                                      <RiHeartFill className="w-4 h-4 mr-3 text-pink-500" />
                                      Remove from Favorites
                                    </>
                                  ) : (
                                    <>
                                      <RiHeartLine className="w-4 h-4 mr-3" />
                                      Add to Favorites
                                    </>
                                  )}
                                </button>
                                <button
                                  className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-300"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <RiDeleteBin6Line className="w-4 h-4 mr-3" />
                                  Remove from History
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                <RiHistoryLine className="w-10 h-10 text-indigo-400/60" />
              </div>
              <h3 className="text-xl font-medium text-gray-300 mb-2">No history found</h3>
              <p className="text-gray-500 max-w-md">
                {searchQuery 
                  ? `No results found for "${searchQuery}"` 
                  : activeTab === 'favorites'
                    ? "You haven't added any favorites yet"
                    : "Start identifying songs to build your history"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center z-50 md:hidden"
      >
        <RiMicFill className="w-6 h-6 text-white" />
      </motion.button>
      
      {/* Stats Panel */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Listening Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-indigo-400">{historyItems.length}</div>
                <div className="text-gray-400 text-sm">Total Identifications</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-400">{historyItems.filter(item => item.favorite).length}</div>
                <div className="text-gray-400 text-sm">Favorites</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-pink-400">7</div>
                <div className="text-gray-400 text-sm">Days Active</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-indigo-400">5</div>
                <div className="text-gray-400 text-sm">Top Artist Tracks</div>
              </div>
            </div>
          </div>
          
          {/* Latest Activity Chart (simplified for demo) */}
          <div className="px-6 pb-6">
            <div className="h-24 w-full flex items-end justify-between gap-1">
              {[35, 20, 45, 30, 50, 25, 40, 15, 55, 30, 45, 60, 35, 25].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="bg-gradient-to-t from-indigo-500 to-purple-500 w-full rounded-t-sm opacity-80"
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>May 3</span>
              <span>May 10</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}