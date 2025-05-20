const Song = require('../models/Song');
const audioProcessor = require('../utils/audioProcessor');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Add a new song
  async addSong(req, res) {
    try {
      const { title, artist, album, duration } = req.body;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      // Process the audio file to generate fingerprints
      console.log(`Processing audio file: ${audioFile.filename}`);
      const fingerprints = await audioProcessor.processAudio(audioFile.path);
      console.log(`Generated ${fingerprints.length} fingerprints`);

      // Create the song document
      const song = new Song({
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        album: album || '',
        duration: duration || 0,
        filePath: audioFile.path,
        fingerprints
      });

      // Save to database
      await song.save();
      res.status(201).json({
        message: 'Song added successfully',
        songId: song._id,
        fingerprintCount: fingerprints.length,
        title: song.title,
        artist: song.artist
      });
    } catch (error) {
      console.error('Error adding song:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // List all songs
  async listSongs(req, res) {
    try {
      const songs = await Song.find({});
      const songsWithFingerprintCount = songs.map(song => {
        const songObj = song.toObject();
        songObj.fingerprintCount = song.fingerprints ? song.fingerprints.length : 0;
        delete songObj.fingerprints; // Remove the full fingerprint array to keep response size smaller
        return songObj;
      });
      res.json(songsWithFingerprintCount);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get song details
  async getSong(req, res) {
    try {
      const song = await Song.findById(req.params.id);
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      
      // Don't send all fingerprints in the response to keep it lightweight
      const songResponse = song.toObject();
      songResponse.fingerprintCount = song.fingerprints.length;
      songResponse.fingerprints = song.fingerprints.slice(0, 5); // Just send the first 5 as sample
      
      res.json(songResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete a song
  async deleteSong(req, res) {
    try {
      const song = await Song.findByIdAndDelete(req.params.id);
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      
      // Delete the audio file
      if (fs.existsSync(song.filePath)) {
        fs.unlinkSync(song.filePath);
      }
      
      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get song fingerprints
  async getFingerprints(req, res) {
    try {
      const song = await Song.findById(req.params.id, 'fingerprints');
      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }
      res.json({
        count: song.fingerprints.length,
        sample: song.fingerprints.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Recognize a song
  async recognizeSong(req, res) {
    try {
      const audioFile = req.file;
      if (!audioFile) {
        return res.status(400).json({ error: 'Audio sample is required' });
      }

      // Process the sample to extract fingerprints
      const sampleFingerprints = await audioProcessor.processSample(audioFile.path);
      
      if (sampleFingerprints.length === 0) {
        return res.status(400).json({ error: 'Could not extract fingerprints from sample' });
      }
      
      // Extract hashes for matching
      const sampleHashes = sampleFingerprints.map(f => f.hash);

      // Find songs with matching fingerprints
      const songs = await Song.find({
        'fingerprints.hash': { $in: sampleHashes }
      });

      if (songs.length === 0) {
        // Clean up the sample file
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
        }
        
        return res.json({
          success: false,
          message: 'No matching songs found in the database'
        });
      }

      // Process match details
      const matches = await Promise.all(songs.map(async (song) => {
        // Count matching fingerprints
        const matchingFingerprints = song.fingerprints.filter(
          fp => sampleHashes.includes(fp.hash)
        );
        
        // Calculate match quality
        const matchCount = matchingFingerprints.length;
        const matchQuality = (matchCount / sampleHashes.length) * 100;
        
        return {
          _id: song._id,
          title: song.title,
          artist: song.artist,
          album: song.album,
          matchCount,
          matchQuality
        };
      }));
      
      // Sort by match quality
      matches.sort((a, b) => b.matchQuality - a.matchQuality);
      
      // Clean up the sample file
      if (fs.existsSync(audioFile.path)) {
        fs.unlinkSync(audioFile.path);
      }

      // Determine if we have a strong enough match (5% threshold)
      if (matches.length > 0 && matches[0].matchQuality > 5) {
        res.json({
          success: true,
          match: {
            title: matches[0].title,
            artist: matches[0].artist,
            album: matches[0].album,
            confidence: `${Math.round(matches[0].matchQuality)}%`,
            matchCount: matches[0].matchCount
          }
        });
      } else {
        res.json({
          success: false,
          message: 'No confident match found',
          possibleMatches: matches.slice(0, 5).map(m => ({
            title: m.title,
            artist: m.artist,
            confidence: `${Math.round(m.matchQuality)}%`
          }))
        });
      }
    } catch (error) {
      console.error('Recognition error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};