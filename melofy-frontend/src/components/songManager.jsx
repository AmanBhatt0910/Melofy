'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiAddFill,
  RiUploadFill,
  RiDeleteBinFill,
  RiPlayFill,
  RiPauseFill,
  RiLoader4Line,
  RiMusicFill,
  RiSearchLine,
  RiRefreshLine,
  RiErrorWarningLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeFill,
  RiDownloadFill,
  RiVolumeUpFill,
  RiVolumeMuteFill
} from 'react-icons/ri';

export default function SongManager() {
  // State management
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  
  // Form state
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    audio: null
  });
  
  // Refs
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Helper function to normalize song data from API
  const normalizeSongData = (song) => ({
    id: song._id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    filename: song.filename,
    uploadDate: song.dateAdded,
    fileSize: song.fileSize // This might not be in your API response yet
  });

  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load songs on component mount
  useEffect(() => {
    loadSongs();
  }, []);

  // Audio volume control
  useEffect(() => {
    if (playingAudio) {
      playingAudio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, playingAudio]);

  // Load all songs
  const loadSongs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/songs');
      
      if (!response.ok) {
        throw new Error(`Failed to load songs: ${response.status}`);
      }
      
      const data = await response.json();
      // Handle both array response and object with songs property
      const songsArray = Array.isArray(data) ? data : (data.songs || []);
      const normalizedSongs = songsArray.map(normalizeSongData);
      setSongs(normalizedSongs);
    } catch (err) {
      console.error('Error loading songs:', err);
      setError('Failed to load songs. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new song
  const addSong = async () => {
    if (!newSong.title.trim() || !newSong.artist.trim() || !newSong.audio) {
      setError('Please fill in all fields and select an audio file.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', newSong.title.trim());
      formData.append('artist', newSong.artist.trim());
      formData.append('audio', newSong.audio);

      const response = await fetch('http://localhost:5000/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      setSuccess(`"${newSong.title}" by ${newSong.artist} uploaded successfully!`);
      setNewSong({ title: '', artist: '', audio: null });
      setShowAddModal(false);
      
      // Reload songs list
      await loadSongs();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error uploading song:', err);
      setError(err.message || 'Failed to upload song. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete song
  const deleteSong = async (songId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/songs/${songId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setSuccess(`"${title}" deleted successfully!`);
      
      // Remove from local state
      setSongs(prev => prev.filter(song => song.id !== songId));
      
      // If this song was selected, clear selection
      if (selectedSong?.id === songId) {
        setSelectedSong(null);
      }
      
      // Stop audio if playing
      if (currentlyPlaying === songId) {
        stopAudio();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error deleting song:', err);
      setError('Failed to delete song. Please try again.');
    }
  };

  // Get single song details
  const getSongDetails = async (songId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${songId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get song details: ${response.status}`);
      }
      
      const songData = await response.json();
      const normalizedSong = normalizeSongData(songData);
      setSelectedSong(normalizedSong);
      
    } catch (err) {
      console.error('Error getting song details:', err);
      setError('Failed to load song details.');
    }
  };

  // Audio playback controls
  const playAudio = async (songId, title) => {
    try {
      // Stop current audio if playing
      if (playingAudio) {
        playingAudio.pause();
        setPlayingAudio(null);
        setCurrentlyPlaying(null);
      }

      // Create new audio instance
      const audio = new Audio(`http://localhost:5000/api/songs/${songId}/stream`);
      audio.volume = isMuted ? 0 : volume;
      
      audio.onended = () => {
        setCurrentlyPlaying(null);
        setPlayingAudio(null);
      };
      
      audio.onerror = () => {
        setError(`Failed to play "${title}"`);
        setCurrentlyPlaying(null);
        setPlayingAudio(null);
      };

      await audio.play();
      setPlayingAudio(audio);
      setCurrentlyPlaying(songId);
      
    } catch (err) {
      console.error('Error playing audio:', err);
      setError(`Failed to play "${title}"`);
    }
  };

  const stopAudio = () => {
    if (playingAudio) {
      playingAudio.pause();
      setPlayingAudio(null);
      setCurrentlyPlaying(null);
    }
  };

  // File handling
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file.');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size too large. Please select a file under 50MB.');
        return;
      }
      
      setNewSong(prev => ({ ...prev, audio: file }));
      setError(null);
    }
  };

  // Filter songs based on search term
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-400 bg-clip-text text-transparent mb-2">
          Song Library Manager
        </h1>
        <p className="text-gray-400">Upload, manage, and play your music collection</p>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl border flex items-center ${
              error 
                ? 'bg-red-500/20 border-red-500/30 text-red-200' 
                : 'bg-green-500/20 border-green-500/30 text-green-200'
            }`}
          >
            {error ? (
              <RiErrorWarningLine className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <RiCheckLine className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <p className="text-sm">{error || success}</p>
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
              }}
              className="ml-auto text-current hover:opacity-70"
            >
              <RiCloseLine className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search songs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent backdrop-blur-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadSongs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium backdrop-blur-sm border border-white/20 disabled:opacity-50"
          >
            <RiRefreshLine className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white font-medium shadow-lg"
          >
            <RiAddFill className="w-5 h-5" />
            <span>Add Song</span>
          </motion.button>
        </div>
      </div>

      {/* Volume Control */}
      {playingAudio && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white hover:text-indigo-400 transition-colors"
            >
              {isMuted ? <RiVolumeMuteFill className="w-6 h-6" /> : <RiVolumeUpFill className="w-6 h-6" />}
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm text-gray-400">0</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-400">100</span>
            </div>
            <span className="text-sm text-gray-300">{Math.round(volume * 100)}%</span>
          </div>
        </motion.div>
      )}

      {/* Songs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white/10 rounded-xl p-6 animate-pulse">
              <div className="aspect-square bg-white/20 rounded-lg mb-4"></div>
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-2/3"></div>
            </div>
          ))
        ) : filteredSongs.length > 0 ? (
          // Song cards
          filteredSongs.map((song) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all group"
            >
              {/* Song Cover */}
              <div className="aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group">
                <RiMusicFill className="w-12 h-12 text-white/50" />
                
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      if (currentlyPlaying === song.id) {
                        stopAudio();
                      } else {
                        playAudio(song.id, song.title);
                      }
                    }}
                    className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                  >
                    {currentlyPlaying === song.id ? (
                      <RiPauseFill className="w-6 h-6 text-white" />
                    ) : (
                      <RiPlayFill className="w-6 h-6 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Song Info */}
              <h3 className="text-white font-semibold mb-1 truncate">{song.title}</h3>
              <p className="text-gray-400 text-sm mb-1 truncate">{song.artist}</p>
              {song.duration && (
                <p className="text-gray-500 text-xs mb-4">{formatDuration(song.duration)}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => getSongDetails(song.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg text-indigo-400 text-sm transition-colors"
                >
                  <RiEyeFill className="w-4 h-4" />
                  <span>View</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteSong(song.id, song.title)}
                  className="flex items-center justify-center p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <RiDeleteBinFill className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))
        ) : (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <RiMusicFill className="w-16 h-16 text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No songs found</h3>
            <p className="text-gray-400 text-center mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first song to the library'}
            </p>
            {!searchTerm && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white font-medium shadow-lg"
              >
                <RiAddFill className="w-5 h-5" />
                <span>Add Your First Song</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Add Song Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-20 fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Song</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <RiCloseLine className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Song Title</label>
                  <input
                    type="text"
                    value={newSong.title}
                    onChange={(e) => setNewSong(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter song title"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                  />
                </div>

                {/* Artist Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Artist</label>
                  <input
                    type="text"
                    value={newSong.artist}
                    onChange={(e) => setNewSong(prev => ({ ...prev, artist: e.target.value }))}
                    placeholder="Enter artist name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Audio File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-6 bg-white/10 border-2 border-dashed border-white/30 rounded-xl text-gray-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all"
                  >
                    <RiUploadFill className="w-6 h-6" />
                    <div className="text-center">
                      {newSong.audio ? (
                        <div>
                          <p className="font-medium">{newSong.audio.name}</p>
                          <p className="text-sm text-gray-400">
                            {(newSong.audio.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">Click to select audio file</p>
                          <p className="text-sm text-gray-400">MP3, WAV, M4A, etc.</p>
                        </div>
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addSong}
                  disabled={isUploading || !newSong.title.trim() || !newSong.artist.trim() || !newSong.audio}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <RiLoader4Line className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <RiUploadFill className="w-5 h-5" />
                      <span>Upload Song</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song Details Modal */}
      <AnimatePresence>
        {selectedSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setSelectedSong(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-lg border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Song Details</h2>
                <button
                  onClick={() => setSelectedSong(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <RiCloseLine className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <p className="text-lg text-white">{selectedSong.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Artist</label>
                  <p className="text-lg text-white">{selectedSong.artist}</p>
                </div>
                
                {selectedSong.album && selectedSong.album !== 'Unknown Album' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Album</label>
                    <p className="text-white">{selectedSong.album}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Song ID</label>
                  <p className="text-sm text-gray-300 font-mono">{selectedSong.id}</p>
                </div>
                
                {selectedSong.duration && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                    <p className="text-white">{formatDuration(selectedSong.duration)}</p>
                  </div>
                )}
                
                {selectedSong.fileSize && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">File Size</label>
                    <p className="text-white">{selectedSong.fileSize}</p>
                  </div>
                )}
                
                {selectedSong.uploadDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Upload Date</label>
                    <p className="text-white">{new Date(selectedSong.uploadDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {selectedSong.filename && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Filename</label>
                    <p className="text-sm text-gray-300">{selectedSong.filename}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8"></div>
                            <div className="flex gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    window.open(
                      `http://localhost:5000/api/songs/${selectedSong.id}/download`,
                      '_blank'
                    );
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl text-indigo-400 transition-colors"
                >
                  <RiDownloadFill className="w-5 h-5" />
                  <span>Download</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSong(null)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}