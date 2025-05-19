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

      const fingerprints = await audioProcessor.processAudio(audioFile.path);
      const song = new Song({
        title,
        artist,
        album,
        duration,
        filePath: audioFile.path,
        fingerprints
      });

      await song.save();
      res.status(201).json({
        message: 'Song added successfully',
        songId: song._id,
        fingerprintCount: fingerprints.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // List all songs
  async listSongs(req, res) {
    try {
      const songs = await Song.find({}, 'title artist album duration');
      res.json(songs);
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
      res.json(song);
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
        sample: song.fingerprints.slice(0, 5)
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

      const fingerprints = await audioProcessor.processAudio(audioFile.path);
      const matches = await Song.aggregate([
        { $unwind: '$fingerprints' },
        { $match: { 'fingerprints.hash': { $in: fingerprints.map(f => f.hash) } } },
        { $group: {
          _id: '$_id',
          title: { $first: '$title' },
          artist: { $first: '$artist' },
          matchCount: { $sum: 1 }
        }},
        { $sort: { matchCount: -1 } },
        { $limit: 5 }
      ]);

      if (matches.length > 0 && matches[0].matchCount > 10) {
        res.json({
          success: true,
          match: matches[0]
        });
      } else {
        res.json({
          success: false,
          message: 'No matching song found'
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};