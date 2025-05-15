'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiHeartLine, RiHeartFill } from 'react-icons/ri';
import { RiPlayFill } from 'react-icons/ri';

export default function RecentlyRecognizedSection() {
  // Mock data for recently recognized songs
  const [songs, setSongs] = useState([
    {
      id: 1,
      title: "Blinding Lights",
      artist: "The Weeknd",
      coverUrl: "https://via.placeholder.com/100",
      recognizedAt: "2 hours ago",
      isFavorite: false
    },
    {
      id: 2,
      title: "Shape of You",
      artist: "Ed Sheeran",
      coverUrl: "https://via.placeholder.com/100",
      recognizedAt: "Yesterday",
      isFavorite: true
    },
    {
      id: 3,
      title: "Dance Monkey",
      artist: "Tones and I",
      coverUrl: "https://via.placeholder.com/100",
      recognizedAt: "2 days ago",
      isFavorite: false
    },
    {
      id: 4,
      title: "Bad Guy",
      artist: "Billie Eilish",
      coverUrl: "https://via.placeholder.com/100",
      recognizedAt: "3 days ago",
      isFavorite: true
    }
  ]);

  const toggleFavorite = (songId) => {
    setSongs(songs.map(song => 
      song.id === songId ? { ...song, isFavorite: !song.isFavorite } : song
    ));
  };

   return (
    <section className="w-full max-w-4xl mx-auto my-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-3 text-gradient">Recent Recognitions</h2>
        <p className="text-gray-400">Your musical journey history</p>
      </div>
      
      <div className="card glass-effect">
        <div className="p-6 space-y-4">
          <AnimatePresence>
            {songs.map((song) => (
              <motion.div
                key={song.id}
                className="group flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden">
                    <img src={song.coverUrl} className="w-full h-full object-cover" alt="Album cover" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{song.title}</h3>
                    <p className="text-gray-400">{song.artist}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleFavorite(song.id)}
                    className="text-2xl text-red-500 hover:text-red-400 transition-colors"
                  >
                    {song.isFavorite ? <RiHeartFill /> : <RiHeartLine />}
                  </button>
                  <button className="p-2 rounded-full bg-primary-500/20 hover:bg-primary-500/30 transition-colors">
                    <RiPlayFill className="w-6 h-6 text-primary-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button className="btn-secondary w-full">
            View Full History
          </button>
        </div>
      </div>
    </section>
  );
}