'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiMicFill, 
  RiMicOffFill, 
  RiPlayFill, 
  RiLoader4Line, 
  RiSpotifyFill,
  RiAppleFill,
  RiYoutubeFill,
  RiShareForwardLine
} from 'react-icons/ri';

export default function MusicIdentifier() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResult, setSongResult] = useState(null);
  const [soundWaves, setSoundWaves] = useState([]);
  const intervalRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // Generate initial sound waves
  useEffect(() => {
    setSoundWaves(Array.from({ length: 60 }, () => Math.random() * 30 + 5));
  }, []);

  // Handle recording animation and timer
  useEffect(() => {
    if (isRecording) {
      // Animate sound waves
      intervalRef.current = setInterval(() => {
        setSoundWaves(prev => 
          prev.map(() => Math.random() * 80 + 10)
        );
      }, 100);
      
      // Handle recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setSongResult(null);
    setRecordingTime(0);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate API call to identify song
    setTimeout(() => {
      setIsProcessing(false);
      setSongResult({
        title: "Bohemian Rhapsody",
        artist: "Queen",
        album: "A Night at the Opera",
        year: "1975",
        coverUrl: "/api/placeholder/300/300",
        duration: "5:55",
        plays: "1.2B",
        genre: "Rock"
      });
    }, 2000);
  };

  const resetIdentifier = () => {
    setSongResult(null);
    setRecordingTime(0);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="card backdrop-blur-xl bg-black/30 rounded-3xl shadow-2xl relative overflow-hidden border border-white/10">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_50%,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />
        
        {/* Inner container */}
        <div className="relative z-10 flex flex-col items-center p-8 md:p-12">
          {/* App name/title */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent mb-2">
              SoundFinder
            </h2>
            <p className="text-gray-400 text-sm">Identify any music in seconds</p>
          </div>
          
          {/* Visualization area */}
          <div className="h-48 md:h-64 w-full mb-8 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence>
              {/* Sound waves visualization when recording */}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full absolute inset-0 flex items-center justify-center gap-[2px] px-4"
                >
                  {soundWaves.map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ 
                        scaleY: 1,
                        height: `${height}%`,
                        backgroundColor: i % 3 === 0 
                          ? 'rgb(129, 140, 248)' 
                          : i % 3 === 1 
                            ? 'rgb(192, 132, 252)' 
                            : 'rgb(244, 114, 182)'
                      }}
                      className="w-1 md:w-2 rounded-full"
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Initial state message */}
            {!isRecording && !isProcessing && !songResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="text-indigo-400 opacity-50 mb-4"
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                  </svg>
                </motion.div>
                <p className="text-gray-300 text-center text-lg font-medium">
                  Tap to identify music
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Hold your device near the sound source
                </p>
              </motion.div>
            )}

            {/* Loading spinner when processing */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 360 }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500/30 animate-spin w-16 h-16" />
                  <div className="absolute inset-0 rounded-full border-4 border-l-transparent border-r-transparent border-indigo-400/40 animate-ping w-16 h-16" style={{ animationDuration: '2s' }} />
                  <RiLoader4Line className="w-16 h-16 text-indigo-400" />
                </motion.div>
                <p className="text-gray-300 text-center animate-pulse">
                  Finding your song...
                </p>
              </div>
            )}

            {/* Timer when recording */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-0 left-0 right-0 text-center text-gray-300"
              >
                <span className="px-4 py-1 rounded-full bg-black/50 text-sm font-mono">
                  {formatTime(recordingTime)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Record button (when not showing results) */}
          {!songResult && (
            <motion.div 
              className="relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500/30' : 'bg-indigo-500/30'} blur-xl`} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRecordToggle}
                disabled={isProcessing}
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-lg transition-all
                  ${isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/30'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <RiMicOffFill className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </motion.div>
                ) : (
                  <RiMicFill className="w-10 h-10 md:w-12 md:h-12 text-white" />
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Song result display */}
          {songResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full flex flex-col md:flex-row items-center gap-8">
                {/* Album cover with animated pulse */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative overflow-hidden rounded-2xl w-40 h-40 md:w-48 md:h-48 shadow-xl group"
                >
                  <img 
                    src={songResult.coverUrl} 
                    className="w-full h-full object-cover" 
                    alt={`${songResult.album} by ${songResult.artist}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
                    >
                      <RiPlayFill className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>
                  
                  {/* Animated vinyl effect */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-white/10 opacity-0 group-hover:opacity-100"
                  />
                </motion.div>
                
                {/* Song details */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {songResult.title}
                  </h3>
                  <p className="text-xl text-gray-300 mt-2">{songResult.artist}</p>
                  <p className="text-gray-400 mt-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span>{songResult.album}</span>
                    <span className="inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                    <span>{songResult.year}</span>
                    <span className="inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                    <span>{songResult.duration}</span>
                  </p>
                  
                  {/* Additional metadata badges */}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                    <span className="text-xs py-1 px-3 rounded-full bg-white/10 text-gray-300">
                      {songResult.genre}
                    </span>
                    <span className="text-xs py-1 px-3 rounded-full bg-white/10 text-gray-300">
                      {songResult.plays} plays
                    </span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium shadow-lg shadow-green-500/20"
                    >
                      <RiSpotifyFill className="w-5 h-5" />
                      <span>Spotify</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium shadow-lg shadow-purple-500/20"
                    >
                      <RiAppleFill className="w-5 h-5" />
                      <span>Apple Music</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium shadow-lg shadow-red-500/20"
                    >
                      <RiYoutubeFill className="w-5 h-5" />
                      <span>YouTube</span>
                    </motion.button>
                  </div>

                  {/* Secondary actions */}
                  <div className="mt-4 flex gap-3 justify-center md:justify-start">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium"
                    >
                      <RiShareForwardLine className="w-5 h-5" />
                      <span>Share</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium"
                      onClick={resetIdentifier}
                    >
                      <RiMicFill className="w-5 h-5" />
                      <span>Listen Again</span>
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Recently identified songs (optional) */}
              <div className="w-full mt-12 pt-8 border-t border-white/10">
                <h4 className="text-gray-300 text-sm font-medium mb-4">RECENTLY IDENTIFIED</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(index => (
                    <motion.div 
                      key={index}
                      whileHover={{ y: -5 }}
                      className="bg-white/5 rounded-lg overflow-hidden cursor-pointer group"
                    >
                      <div className="aspect-square relative">
                        <img 
                          src={`/api/placeholder/150/150?text=${index}`} 
                          alt="Recent song" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="p-2 rounded-full bg-white/20"
                          >
                            <RiPlayFill className="w-6 h-6 text-white" />
                          </motion.div>
                        </div>
                      </div>
                      <div className="p-2">
                        <h5 className="text-gray-200 text-sm font-medium truncate">Track {index}</h5>
                        <p className="text-gray-400 text-xs truncate">Artist {index}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
