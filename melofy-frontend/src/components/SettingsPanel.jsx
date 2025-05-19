'use client';

import { useState } from 'react';
import { RiSunLine, RiMoonLine, RiVolumeUpLine, RiNotification3Line } from 'react-icons/ri';

export default function SettingsPanel() {
  const [darkMode, setDarkMode] = useState(true);
  const [volume, setVolume] = useState(80);

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {darkMode ? (
            <RiMoonLine className="w-5 h-5" />
          ) : (
            <RiSunLine className="w-5 h-5" />
          )}
          <span>Dark Mode</span>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${
            darkMode ? 'bg-primary' : 'bg-gray-600'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full transition-transform ${
              darkMode ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <RiVolumeUpLine className="w-5 h-5" />
          <span>Volume</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full accent-primary"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiNotification3Line className="w-5 h-5" />
          <span>Notifications</span>
        </div>
        <button className="text-primary text-sm">Manage</button>
      </div>
    </div>
  );
}