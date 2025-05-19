const mongoose = require('mongoose');

const FingerprintSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    index: true
  },
  offset: {
    type: Number,
    required: true
  },
  freq1: Number,
  freq2: Number,
  deltaTime: Number
});

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  album: {
    type: String
  },
  duration: {
    type: Number,
    required: true
  },
  releaseDate: {
    type: Date
  },
  filePath: {
    type: String,
    required: true
  },
  fingerprints: [FingerprintSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster fingerprint searches
SongSchema.index({ 'fingerprints.hash': 1, 'fingerprints.offset': 1 });

// Static method for finding matches
SongSchema.statics.findMatches = async function(fingerprints) {
  const hashList = fingerprints.map(fp => fp.hash);
  
  // Find all matching fingerprints in database
  const matches = await this.aggregate([
    { $unwind: '$fingerprints' },
    { $match: { 'fingerprints.hash': { $in: hashList } } },
    { $group: {
      _id: '$_id',
      title: { $first: '$title' },
      artist: { $first: '$artist' },
      matchCount: { $sum: 1 },
      offsetDeltas: {
        $push: {
          $subtract: [
            { $arrayElemAt: [
              fingerprints.map(fp => fp.offset),
              { $indexOfArray: [hashList, '$fingerprints.hash'] }
            ]},
            '$fingerprints.offset'
          ]
        }
      }
    }},
    { $sort: { matchCount: -1 } },
    { $limit: 10 }
  ]);

  return matches;
};

module.exports = mongoose.model('Song', SongSchema);