// Create this file as models/Song.js if you don't already have it

const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fingerprints: [
    {
      hash: Number,
      offset: Number,
      anchors: [Number]
    }
  ],
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Add index on the hash field for faster lookup
SongSchema.index({ 'fingerprints.hash': 1 });

module.exports = mongoose.model('Song', SongSchema);

// And in your songController.js, make sure to include:
const Song = require('../models/Song');

// Then update your addSong function to store fingerprints:
async function addSong(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    const { title, artist, album } = req.body;
    
    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }
    
    console.log(`Processing audio file: ${req.file.filename}`);
    
    // Generate fingerprints from the audio file
    const filePath = req.file.path;
    const fingerprints = await processAudio(filePath);
    
    // Get duration (in seconds)
    const duration = await getAudioDuration(filePath);
    
    // Create and save the song record
    const song = new Song({
      title,
      artist,
      album,
      duration,
      filename: req.file.filename,
      fingerprints
    });
    
    await song.save();
    
    return res.status(201).json({
      message: 'Song added successfully',
      song: {
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        fingerprintCount: fingerprints.length
      }
    });
  } catch (error) {
    console.error('Error in addSong:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get the duration of an audio file using FFmpeg
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<number>} - Duration in seconds
 */
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execPromise(
      `"${FFMPEG_PATH}" -i "${filePath}" -f null -`
    );
    
    // Parse the duration from FFmpeg output
    const durationMatch = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseFloat(durationMatch[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting duration:', error);
    return 0;
  }
}