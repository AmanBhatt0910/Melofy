'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiPlayFill, RiPauseFill, RiSkipForwardFill, RiSkipBackFill, RiVolumeMuteFill, RiVolumeUpFill } from 'react-icons/ri';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  const progressInterval = useRef(null);
  
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.2;
        });
      }, 100);
    } else {
      clearInterval(progressInterval.current);
    }
    
    return () => clearInterval(progressInterval.current);
  }, [isPlaying]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 backdrop-blur-md border-t border-white/10 py-3 px-4 md:py-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex items-center space-x-4 w-full md:w-auto mb-4 md:mb-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden">
              <motion.div
                animate={{ 
                  scale: isPlaying ? [1, 1.05, 1] : 1,
                }}
                transition={{ 
                  repeat: isPlaying ? Infinity : 0, 
                  duration: 2
                }}
              >
                <span className="text-xl">🎵</span>
              </motion.div>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-white truncate">
                Currently Playing
              </h3>

              <p className="text-gray-300 text-sm truncate">
                Song Title - Artist
              </p>
            </div>
          </div>

          <div className="flex flex-col w-full">
            <div className="flex items-center justify-center space-x-6 mb-2">
              <button className="text-gray-300 hover:text-white transition-colors">
                <RiSkipBackFill className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-3 text-white shadow-lg shadow-indigo-500/20"
              >
                {isPlaying ? (
                  <RiPauseFill className="w-6 h-6" />
                ) : (
                  <RiPlayFill className="w-6 h-6" />
                )}
              </motion.button>
              <button className="text-gray-300 hover:text-white transition-colors">
                <RiSkipForwardFill className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 px-4">
              <span className="text-xs text-gray-400 w-10 text-right">
                {Math.floor(progress / 100 * 3 * 60)}:{String(Math.floor((progress / 100 * 3 * 60) % 60)).padStart(2, '0')}
              </span>
              <div className="relative w-full h-1 bg-gray-700 rounded-full">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-10">
                3:00
              </span>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-300 hover:text-white ml-2"
              >
                {isMuted ? (
                  <RiVolumeMuteFill className="w-5 h-5" />
                ) : (
                  <RiVolumeUpFill className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}