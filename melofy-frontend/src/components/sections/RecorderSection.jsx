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
  RiShareForwardLine,
  RiErrorWarningLine
} from 'react-icons/ri';

export default function MusicIdentifier() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [songResult, setSongResult] = useState(null);
  const [soundWaves, setSoundWaves] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [recentSongs, setRecentSongs] = useState([]);
  
  // Refs
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const startRecording = async () => {
    setError(null);
    setSongResult(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = async () => {
        // Process recording
        await processRecording();
        
        // Stop all tracks in the stream
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

const processRecording = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus'
      });
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send to API
      const response = await fetch('https://melofy-1cw1.onrender.com/api/recognize', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0 && data.matchCount > 0) {
        const recognizedSong = data.results[0];
        
        const confidenceFloat = parseFloat(recognizedSong.confidence);
        const confidencePercentage = Math.round(confidenceFloat * 100);
        
        const songData = {
          title: recognizedSong.title || "Unknown Title",
          artist: recognizedSong.artist === "Unknown Artist" ? "Unknown Artist" : recognizedSong.artist,
          album: "Unknown Album",
          year: "Unknown",
          coverUrl: `/api/placeholder/300/300?text=${encodeURIComponent(recognizedSong.title || 'Unknown')}`,
          duration: recognizedSong.songDuration ? `${Math.floor(recognizedSong.songDuration / 60)}:${String(Math.floor(recognizedSong.songDuration % 60)).padStart(2, '0')}` : "Unknown",
          plays: `${confidencePercentage}% match`,
          genre: "Unknown",
          confidence: confidenceFloat,
          songId: recognizedSong.songId,
          alignedMatches: recognizedSong.alignedMatches,
          totalMatches: recognizedSong.totalMatches,
          matchRatio: recognizedSong.matchRatio,
          timeSpread: recognizedSong.timeSpread,
          offset: recognizedSong.offset,
          alternativeResults: data.results.slice(1).map(alt => ({
            title: alt.title || "Unknown Title",
            artist: alt.artist === "Unknown Artist" ? "Unknown Artist" : alt.artist,
            confidence: parseFloat(alt.confidence),
            songId: alt.songId,
            alignedMatches: alt.alignedMatches,
            matchRatio: alt.matchRatio
          })),
          processingInfo: data.processingInfo,
          sampleDuration: data.sampleDuration,
          fingerprintCount: data.fingerprintCount
        };
        
        setSongResult(songData);
        
        // Add to recently recognized songs (avoid duplicates by songId)
        setRecentSongs(prev => {
          const filtered = prev.filter(song => song.songId !== songData.songId);
          return [songData, ...filtered.slice(0, 4)];
        });
      } else {
        setError("No song match found. Please try again with a clearer audio sample.");
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      if (err.message.includes('API error: 500')) {
        setError('Server error occurred. Please try again later.');
      } else if (err.message.includes('API error: 400')) {
        setError('Invalid audio format. Please try recording again.');
      } else {
        setError('Failed to identify song. Please check your connection and try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const resetIdentifier = () => {
    setSongResult(null);
    setRecordingTime(0);
    setError(null);
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
          
          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center"
            >
              <RiErrorWarningLine className="text-red-400 w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}
          
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
            {!isRecording && !isProcessing && !songResult && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full w-full absolute inset-0"
              >
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="text-indigo-400 opacity-50 mb-4 flex items-center justify-center"
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                  </svg>
                </motion.div>
                <p className="text-gray-300 text-center text-lg font-medium">
                  Tap to identify music
                </p>
                <p className="text-gray-400 text-sm mt-2 text-center">
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
                    <span>ID: {songResult.songId.slice(-8)}</span>
                  </p>
                  
                  {/* Match quality indicator */}
                  <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(songResult.confidence * 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={`h-full rounded-full ${
                            songResult.confidence > 0.7 ? 'bg-green-500' :
                            songResult.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <span className="text-sm text-gray-300">
                        {Math.round(songResult.confidence * 100)}% match
                      </span>
                    </div>
                  </div>
                  
                  {/* Technical details for debugging/info */}
                  <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start text-xs">
                    <span className="py-1 px-3 rounded-full bg-white/10 text-gray-400">
                      {songResult.alignedMatches} aligned matches
                    </span>
                    <span className="py-1 px-3 rounded-full bg-white/10 text-gray-400">
                      {songResult.totalMatches} total matches
                    </span>
                    <span className="py-1 px-3 rounded-full bg-white/10 text-gray-400">
                      Offset: {Math.round(songResult.offset / 1000)}s
                    </span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(songResult.title + ' ' + songResult.artist)}`, '_blank')}
                      className="btn flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium shadow-lg shadow-green-500/20"
                    >
                      <RiSpotifyFill className="w-5 h-5" />
                      <span>Spotify</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`https://music.apple.com/search?term=${encodeURIComponent(songResult.title + ' ' + songResult.artist)}`, '_blank')}
                      className="btn flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium shadow-lg shadow-purple-500/20"
                    >
                      <RiAppleFill className="w-5 h-5" />
                      <span>Apple Music</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(songResult.title + ' ' + songResult.artist)}`, '_blank')}
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
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `${songResult.title} by ${songResult.artist}`,
                            text: `I found this song using SoundFinder: ${songResult.title} by ${songResult.artist}`,
                            url: window.location.href
                          });
                        } else {
                          navigator.clipboard.writeText(`${songResult.title} by ${songResult.artist}`);
                          // You could add a toast notification here
                        }
                      }}
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
              
              {/* Recently identified songs section remains the same */}
              <div className="w-full mt-12 pt-8 border-t border-white/10">
                <h4 className="text-gray-300 text-sm font-medium mb-4">RECENTLY IDENTIFIED</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {recentSongs.length > 0 ? (
                    recentSongs.map((song, index) => (
                      <motion.div 
                        key={`${song.songId}-${index}`}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 rounded-lg overflow-hidden cursor-pointer group"
                      >
                        <div className="aspect-square relative">
                          <img 
                            src={song.coverUrl}
                            alt={`${song.title} by ${song.artist}`}
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
                          <h5 className="text-gray-200 text-sm font-medium truncate">{song.title}</h5>
                          <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                          <p className="text-gray-500 text-xs">
                            {Math.round(song.confidence * 100)}% match
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5].map(index => (
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
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}