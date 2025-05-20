const fs = require('fs');
const path = require('path');
const murmurhash3 = require('murmurhash3js');
const fourierTransform = require('fourier-transform');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);
const Song = require('../models/Song');

// Constants for audio processing
const SAMPLE_RATE = 44100;
const FFT_SIZE = 1024;
const WINDOW_SIZE = FFT_SIZE;
const HOP_SIZE = WINDOW_SIZE / 2;  // 50% overlap for better time resolution
const MIN_FREQ = 40;      // Hz - slightly lower for better bass detection
const MAX_FREQ = 4000;    // Hz
const MIN_FREQ_IDX = Math.floor(MIN_FREQ * FFT_SIZE / SAMPLE_RATE);
const MAX_FREQ_IDX = Math.floor(MAX_FREQ * FFT_SIZE / SAMPLE_RATE);
const TARGET_PEAKS = 5;   // More peaks for robustness
const FANOUT_FACTOR = 2;  // More fingerprints for better matching
const MAX_TIME_DELTA = 3; // Slightly larger time delta
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';

// Temporary directory for processing
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Process an audio file to generate audio fingerprints
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Array>} - Array of fingerprints
 */
async function processAudio(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);
  try {
    // Convert audio to PCM for processing
    const pcmFile = await convertToPCM(filePath);
    
    // Read PCM data
    const audioData = await readPCMFile(pcmFile);
    
    // Extract multiple segments for more complete coverage
    const sampleData = reduceAudioSample(audioData);
    
    // Apply FFT and extract peaks
    const spectralPeaks = extractSpectralPeaks(sampleData);
    
    // Generate fingerprints from peaks
    const fingerprints = generateFingerprintsFromPeaks(spectralPeaks);
    
    // Clean up temp file
    if (fs.existsSync(pcmFile)) {
      fs.unlinkSync(pcmFile);
    }
    
    console.log(`Generated ${fingerprints.length} fingerprints`);
    return fingerprints;
  } catch (error) {
    console.log(`Processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Reduce audio sample size to process less data
 * @param {object} audioData - Full audio data
 * @returns {object} - Reduced audio data
 */
function reduceAudioSample(audioData) {
  const { samples, duration } = audioData;
  
  // Max duration to process (in seconds)
  const MAX_DURATION = 30;
  
  // If short enough, use the entire audio
  if (duration <= MAX_DURATION) {
    console.log(`Using all ${duration.toFixed(2)}s of audio`);
    return audioData;
  }
  
  // For longer tracks, take sections from beginning, middle, and end
  const samplesPerSecond = SAMPLE_RATE;
  const totalSamplesToTake = MAX_DURATION * samplesPerSecond;
  
  // Take 10 seconds from beginning, 10 from middle, 10 from end
  const beginSamples = samples.slice(0, 10 * samplesPerSecond);
  
  const middleStart = Math.floor(samples.length / 2) - 5 * samplesPerSecond;
  const middleSamples = samples.slice(middleStart, middleStart + 10 * samplesPerSecond);
  
  const endStart = Math.max(0, samples.length - 10 * samplesPerSecond);
  const endSamples = samples.slice(endStart);
  
  // Combine all segments
  const reducedSamples = new Float32Array(totalSamplesToTake);
  reducedSamples.set(beginSamples, 0);
  reducedSamples.set(middleSamples, 10 * samplesPerSecond);
  reducedSamples.set(endSamples, 20 * samplesPerSecond);
  
  console.log(`Reduced audio from ${duration.toFixed(2)}s to ${MAX_DURATION.toFixed(2)}s for processing`);
  
  return {
    samples: reducedSamples,
    sampleRate: SAMPLE_RATE,
    duration: MAX_DURATION
  };
}

/**
 * Convert audio file to raw PCM format for processing
 * @param {string} inputFile - Path to input audio file
 * @returns {Promise<string>} - Path to PCM file
 */
async function convertToPCM(inputFile) {
  const outputFile = path.join(TEMP_DIR, `${path.basename(inputFile, path.extname(inputFile))}.pcm`);
  
  // Verify FFmpeg path exists
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  if (!fs.existsSync(ffmpegPath)) {
    throw new Error(`FFmpeg not found at: ${ffmpegPath}`);
  }

  // Use proper path escaping for Windows
  const cmd = [
    `"${ffmpegPath}"`,
    `-i "${inputFile}"`,
    `-f s16le`,
    `-acodec pcm_s16le`,
    `-ar ${SAMPLE_RATE}`,
    `-ac 1`,
    `"${outputFile}"`,
    `-y`
  ].join(' ');

  try {
    console.log(`Executing FFmpeg command: ${cmd}`);
    await execPromise(cmd, { shell: true });
    console.log(`Successfully converted to PCM: ${outputFile}`);
    return outputFile;
  } catch (error) {
    console.error('FFmpeg conversion failed:', error.message);
    throw new Error(`FFmpeg failed: ${error.message}`);
  }
}

/**
 * Read PCM file into a Float32Array for processing
 * @param {string} pcmFile - Path to PCM file
 * @returns {Promise<object>} - Audio data object with samples and duration
 */
async function readPCMFile(pcmFile) {
  const buffer = fs.readFileSync(pcmFile);
  const numSamples = Math.floor(buffer.length / 2); // 16-bit samples (2 bytes)
  const samples = new Float32Array(numSamples);
  
  // Convert Int16 PCM to Float32 (normalized to -1.0 to 1.0)
  for (let i = 0; i < numSamples; i++) {
    samples[i] = buffer.readInt16LE(i * 2) / 32768.0;
  }
  
  const duration = numSamples / SAMPLE_RATE;
  console.log(`PCM file read: ${numSamples} samples, ${duration.toFixed(2)}s duration`);
  
  return {
    samples,
    sampleRate: SAMPLE_RATE,
    duration,
  };
}

/**
 * Extract spectral peaks from audio data using FFT
 * @param {object} audioData - Audio data object with samples
 * @returns {Array} - Array of spectral peaks
 */
function extractSpectralPeaks(audioData) {
  const { samples, duration } = audioData;
  
  // Prepare Hann window function for better FFT results
  const hannWindow = new Float32Array(WINDOW_SIZE);
  for (let i = 0; i < WINDOW_SIZE; i++) {
    hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_SIZE - 1)));
  }
  
  const peaks = [];
  const totalFrames = Math.floor((samples.length - WINDOW_SIZE) / HOP_SIZE) + 1;
  console.log(`Processing ${totalFrames} frames for spectral analysis`);
  
  // Process audio in windows with hop size
  for (let windowStart = 0; windowStart + WINDOW_SIZE <= samples.length; windowStart += HOP_SIZE) {
    // Apply Hann window and prepare FFT input
    const windowedSamples = new Float32Array(WINDOW_SIZE);
    for (let i = 0; i < WINDOW_SIZE; i++) {
      windowedSamples[i] = samples[windowStart + i] * hannWindow[i];
    }
    
    // Run FFT using fourier-transform library
    const magnitudes = fourierTransform(windowedSamples);
    
    // Find peaks in the spectrum (focus on relevant frequency range)
    const timeOffset = windowStart / SAMPLE_RATE;
    const framePeaks = findPeaks(magnitudes, MIN_FREQ_IDX, MAX_FREQ_IDX, TARGET_PEAKS);
    
    // Add peaks to overall collection
    framePeaks.forEach(peak => {
      peaks.push({
        freqBin: peak,
        frequency: peak * SAMPLE_RATE / FFT_SIZE,
        magnitude: magnitudes[peak],
        timeOffset
      });
    });
  }
  
  console.log(`Extracted ${peaks.length} spectral peaks`);
  return peaks;
}

/**
 * Find the strongest peaks in a magnitude spectrum
 * @param {Float32Array} magnitudes - Magnitude spectrum
 * @param {number} minBin - Minimum frequency bin
 * @param {number} maxBin - Maximum frequency bin
 * @param {number} targetCount - Target number of peaks
 * @returns {Array} - Array of peak frequency bins
 */
function findPeaks(magnitudes, minBin, maxBin, targetCount) {
  const peaks = [];
  
  // Simple local maximum detection
  for (let i = minBin + 1; i < maxBin - 1; i++) {
    if (magnitudes[i] > magnitudes[i-1] && magnitudes[i] > magnitudes[i+1]) {
      peaks.push({
        bin: i,
        magnitude: magnitudes[i]
      });
    }
  }
  
  // Sort by magnitude (descending)
  peaks.sort((a, b) => b.magnitude - a.magnitude);
  
  // Return top N peaks
  return peaks.slice(0, targetCount).map(peak => peak.bin);
}

/**
 * Generate fingerprints from spectral peaks
 * @param {Array} peaks - Array of spectral peaks
 * @returns {Array} - Array of fingerprints
 */
function generateFingerprintsFromPeaks(peaks) {
  const fingerprints = [];
  
  // Process each anchor point
  peaks.forEach(anchorPeak => {
    // Find target zones (future time frames within MAX_TIME_DELTA)
    const anchorTime = anchorPeak.timeOffset;
    
    // Find peaks in future time frames to pair with the anchor
    const targetPeaks = peaks.filter(p => 
      p.timeOffset > anchorTime && 
      p.timeOffset <= anchorTime + MAX_TIME_DELTA
    );
    
    // Sort by time difference ascending
    targetPeaks.sort((a, b) => a.timeOffset - b.timeOffset);
    
    // Take the top FANOUT_FACTOR peaks or all if fewer
    const pairingPeaks = targetPeaks.slice(0, FANOUT_FACTOR);
    
    // Create a fingerprint for each anchor-target pair
    pairingPeaks.forEach(targetPeak => {
      const timeDelta = targetPeak.timeOffset - anchorTime;
      
      // Create a hash combining both frequencies and the time delta
      // Format: [anchor_freq, target_freq, delta_time]
      const hashStr = `${anchorPeak.freqBin},${targetPeak.freqBin},${Math.round(timeDelta * 10)}`;
      const hash = murmurhash3.x86.hash32(
        `${hashStr}-${Math.round(anchorPeak.magnitude * 100)}`
      );
      
      fingerprints.push({
        hash,
        offset: Math.round(anchorTime * 1000), // Convert to milliseconds
        anchors: [anchorPeak.freqBin, targetPeak.freqBin, Math.round(timeDelta * 10)]
      });
    });
  });
  
  return fingerprints;
}

/**
 * Process an audio sample for recognition
 * @param {string} filePath - Path to the audio sample
 * @returns {Promise<Array>} - Array of fingerprints
 */
async function processSample(filePath) {
  console.log('Processing audio sample for recognition');
  
  try {
    // Convert audio to PCM for processing
    const pcmFile = await convertToPCM(filePath);
    
    // Read PCM data
    const audioData = await readPCMFile(pcmFile);
    
    // Process the full sample - don't truncate recognition samples
    // Use smaller HOP_SIZE for sample to capture more detail
    const spectralPeaks = extractSpectralPeaks(audioData);
    
    // Generate fingerprints from peaks
    const fingerprints = generateFingerprintsFromPeaks(spectralPeaks);
    
    // Clean up temp file
    if (fs.existsSync(pcmFile)) {
      fs.unlinkSync(pcmFile);
    }
    
    console.log(`Generated ${fingerprints.length} fingerprints for sample`);
    return fingerprints;
  } catch (error) {
    console.log(`Sample processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Match sample fingerprints against the database
 * @param {Array} sampleFingerprints - Fingerprints from the audio sample
 * @returns {Promise<Array>} - Array of potential matches with confidence scores
 */
async function matchFingerprints(sampleFingerprints) {
  try {
    // Extract just the hashes for efficient lookup
    const sampleHashes = sampleFingerprints.map(fp => fp.hash);
    
    console.log(`Matching ${sampleHashes.length} fingerprints against database`);
    
    // Find all songs with matching fingerprints
    // This assumes you have a Song model with fingerprints stored
    const matchedSongs = await Song.aggregate([
      // Match songs that have any fingerprints matching our sample
      { $match: { 
        "fingerprints.hash": { $in: sampleHashes } 
      }},
      // Unwind the fingerprints array to work with individual fingerprints
      { $unwind: "$fingerprints" },
      // Only keep fingerprints that match our sample
      { $match: { 
        "fingerprints.hash": { $in: sampleHashes } 
      }},
      // Group by song and count matches
      { $group: {
        _id: "$_id",
        title: { $first: "$title" },
        artist: { $first: "$artist" },
        matchCount: { $sum: 1 },
        fingerprints: { $push: "$fingerprints" }
      }},
      // Sort by match count (most matches first)
      { $sort: { matchCount: -1 } }
    ]);
    
    console.log(`Found ${matchedSongs.length} songs with any matching fingerprints`);
    
    // For very short samples, lower the threshold
    const MIN_MATCHES = sampleFingerprints.length < 1000 ? 5 : 15;
    
    // Calculate time offset histogram for each potential match
    const results = [];
    
    // Loop through each potential match
    for (const song of matchedSongs) {
      // Skip songs with too few matches (under threshold is likely noise)
      if (song.matchCount < MIN_MATCHES) continue;
      
      // Create a histogram of time offsets
      const offsetHistogram = {};
      const matchedPairs = [];
      
      // For each matching hash, find the corresponding sample fingerprint
      for (const songFp of song.fingerprints) {
        const sampleFp = sampleFingerprints.find(fp => fp.hash === songFp.hash);
        if (!sampleFp) continue;
        
        // Calculate time offset between song and sample
        // This is the key to alignment - consistent time delta means a match
        const timeOffset = songFp.offset - sampleFp.offset;
        
        // Add to histogram
        offsetHistogram[timeOffset] = (offsetHistogram[timeOffset] || 0) + 1;
        
        matchedPairs.push({
          songOffset: songFp.offset,
          sampleOffset: sampleFp.offset,
          delta: timeOffset
        });
      }
      
      // Find the most common time offset (the peak in histogram)
      let bestOffset = 0;
      let bestCount = 0;
      
      Object.entries(offsetHistogram).forEach(([offset, count]) => {
        if (count > bestCount) {
          bestCount = count;
          bestOffset = parseInt(offset);
        }
      });
      
      // Get the alignment confidence (matched pairs at best offset / total fingerprints in sample)
      const confidenceScore = bestCount / sampleFingerprints.length;
      const alignedMatches = bestCount;
      
      // For debugging
      console.log(`Song: ${song.title}, Total matches: ${song.matchCount}, Aligned matches: ${alignedMatches}, Confidence: ${confidenceScore.toFixed(2)}`);
      
      // Only include if we have enough aligned matches
      if (alignedMatches >= MIN_MATCHES) {
        results.push({
          songId: song._id,
          title: song.title,
          artist: song.artist,
          confidence: confidenceScore.toFixed(2),
          alignedMatches,
          totalMatches: song.matchCount,
          offset: bestOffset, // Time in the original song where the sample starts (ms)
        });
      }
    }
    
    console.log(`Found ${results.length} potential matches after alignment filtering`);
    return results;
  } catch (error) {
    console.error('Error in matchFingerprints:', error);
    throw error;
  }
}

/**
 * Add a new song with fingerprints to the database
 */
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
    
    // Get duration using FFmpeg
    let duration = 0;
    try {
      const { stdout } = await execPromise(
        `"${FFMPEG_PATH}" -i "${filePath}" -f null - 2>&1`
      );
      
      const durationMatch = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        duration = hours * 3600 + minutes * 60 + seconds;
      }
    } catch (err) {
      console.error('Error getting duration:', err);
      // Default to 3 minutes if we can't determine duration
      duration = 180;
    }
    
    // Create and save the song record
    const song = new Song({
      title,
      artist,
      album: album || 'Unknown Album',
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
 * Get all songs in the database
 */
async function listSongs(req, res) {
  try {
    const songs = await Song.find({}, 'title artist album duration filename dateAdded');
    return res.json(songs);
  } catch (error) {
    console.error('Error in listSongs:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get a single song by ID
 */
async function getSong(req, res) {
  try {
    const song = await Song.findById(req.params.id, 'title artist album duration filename dateAdded');
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    return res.json(song);
  } catch (error) {
    console.error('Error in getSong:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Delete a song by ID
 */
async function deleteSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Delete the associated audio file
    const filePath = path.join(__dirname, '../uploads', song.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await song.remove();
    
    return res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSong:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get fingerprints for a song by ID
 */
async function getFingerprints(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    return res.json({
      count: song.fingerprints.length,
      fingerprints: song.fingerprints.slice(0, 100) // Return first 100 for preview
    });
  } catch (error) {
    console.error('Error in getFingerprints:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Recognize a song from an audio sample
 */
async function recognizeSong(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    console.log(`Recognition request received for file: ${req.file.filename}`);
    
    // Process the sample file to extract fingerprints
    const filePath = req.file.path;
    const sampleFingerprints = await processSample(filePath);
    
    console.log(`Extracted ${sampleFingerprints.length} fingerprints from sample for matching`);
    
    // Match the fingerprints against our database
    const matches = await matchFingerprints(sampleFingerprints);
    
    // Clean up the temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });
    
    // Return the results
    return res.json({
      results: matches,
      matchCount: matches.length
    });
  } catch (error) {
    console.error('Error in recognizeSong:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  processAudio,
  processSample,
  matchFingerprints,
  addSong,
  listSongs,
  getSong,
  deleteSong,
  getFingerprints,
  recognizeSong
};