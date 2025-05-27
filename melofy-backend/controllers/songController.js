const fs = require('fs');
const path = require('path');
const murmurhash3 = require('murmurhash3js');
const fourierTransform = require('fourier-transform');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);
const Song = require('../models/Song');

const SAMPLE_RATE = 44100;
const FFT_SIZE = 1024;
const WINDOW_SIZE = FFT_SIZE;
const HOP_SIZE = WINDOW_SIZE / 4;  // Increased overlap for finer time resolution
const HOP_SIZE_RECOGNITION = WINDOW_SIZE / 8; // Even finer resolution for recognition
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const MIN_FREQ = 300;      // Higher minimum to avoid bass noise
const MAX_FREQ = 2000;     // Lower maximum to focus on vocal/melodic range
const MIN_FREQ_IDX = Math.floor(MIN_FREQ * FFT_SIZE / SAMPLE_RATE);
const MAX_FREQ_IDX = Math.floor(MAX_FREQ * FFT_SIZE / SAMPLE_RATE);
const TARGET_PEAKS = 3;    // Fewer, more distinctive peaks
const FANOUT_FACTOR = 3;   // More fingerprints per anchor
const MIN_TIME_DELTA = 0.05; // Minimum time between anchor and target (50ms)
const MAX_TIME_DELTA = 2.0;  // Maximum time between anchor and target (2s)
const PEAK_SORT_SIZE = 10;   // Consider top 10 peaks per frame

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
function extractSpectralPeaks(audioData, hopSize = HOP_SIZE) {
  const { samples, duration } = audioData;
  
  // Improved Hann window function
  const hannWindow = new Float32Array(WINDOW_SIZE);
  for (let i = 0; i < WINDOW_SIZE; i++) {
    hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (WINDOW_SIZE - 1)));
  }
  
  const peaks = [];
  const totalFrames = Math.floor((samples.length - WINDOW_SIZE) / hopSize) + 1;
  console.log(`Processing ${totalFrames} frames for spectral analysis`);
  
  for (let windowStart = 0; windowStart + WINDOW_SIZE <= samples.length; windowStart += hopSize) {
    // Apply window and prepare FFT input
    const windowedSamples = new Float32Array(WINDOW_SIZE);
    for (let i = 0; i < WINDOW_SIZE; i++) {
      windowedSamples[i] = samples[windowStart + i] * hannWindow[i];
    }
    
    // Run FFT
    const magnitudes = fourierTransform(windowedSamples);
    
    // Improved peak finding with local maxima and magnitude threshold
    const timeOffset = windowStart / SAMPLE_RATE;
    const framePeaks = findImprovedPeaks(magnitudes, MIN_FREQ_IDX, MAX_FREQ_IDX, TARGET_PEAKS);
    
    // Add peaks with additional metadata
    framePeaks.forEach(peak => {
      peaks.push({
        freqBin: peak.bin,
        frequency: peak.bin * SAMPLE_RATE / FFT_SIZE,
        magnitude: peak.magnitude,
        timeOffset: Math.round(timeOffset * 1000) / 1000, // Round to ms precision
        frame: Math.floor(windowStart / hopSize)
      });
    });
  }
  
  console.log(`Extracted ${peaks.length} spectral peaks`);
  return peaks;
}

function findImprovedPeaks(magnitudes, minBin, maxBin, targetCount) {
  const candidates = [];
  
  // Find local maxima with minimum separation
  const MIN_PEAK_SEPARATION = 3; // Minimum bins between peaks
  
  for (let i = minBin + 2; i < maxBin - 2; i++) {
    // Check if this is a local maximum (compare with 2 neighbors on each side)
    if (magnitudes[i] > magnitudes[i-1] && magnitudes[i] > magnitudes[i+1] &&
        magnitudes[i] > magnitudes[i-2] && magnitudes[i] > magnitudes[i+2]) {
      
      // Calculate peak strength (magnitude relative to local average)
      const localAvg = (magnitudes[i-2] + magnitudes[i-1] + magnitudes[i+1] + magnitudes[i+2]) / 4;
      const peakStrength = magnitudes[i] / (localAvg + 1e-10); // Avoid division by zero
      
      candidates.push({
        bin: i,
        magnitude: magnitudes[i],
        strength: peakStrength
      });
    }
  }
  
  // Sort by peak strength first, then by magnitude
  candidates.sort((a, b) => {
    const strengthDiff = b.strength - a.strength;
    return strengthDiff !== 0 ? strengthDiff : b.magnitude - a.magnitude;
  });
  
  // Select peaks with minimum separation
  const selectedPeaks = [];
  for (const candidate of candidates) {
    if (selectedPeaks.length >= targetCount) break;
    
    // Check if this peak is far enough from already selected peaks
    const tooClose = selectedPeaks.some(peak => 
      Math.abs(peak.bin - candidate.bin) < MIN_PEAK_SEPARATION
    );
    
    if (!tooClose) {
      selectedPeaks.push(candidate);
    }
  }
  
  return selectedPeaks;
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
  const TIME_QUANTIZATION = 0.1; // 100ms time bins for better alignment
  
  // Sort peaks by time for efficient processing
  peaks.sort((a, b) => a.timeOffset - b.timeOffset);
  
  // Process each peak as an anchor
  for (let i = 0; i < peaks.length; i++) {
    const anchorPeak = peaks[i];
    const anchorTime = anchorPeak.timeOffset;
    
    // Find target peaks within time window
    const targetPeaks = [];
    
    for (let j = i + 1; j < peaks.length; j++) {
      const targetPeak = peaks[j];
      const timeDelta = targetPeak.timeOffset - anchorTime;
      
      if (timeDelta > MAX_TIME_DELTA) break; // Peaks are sorted by time
      if (timeDelta < MIN_TIME_DELTA) continue;
      
      targetPeaks.push({
        peak: targetPeak,
        timeDelta: timeDelta
      });
    }
    
    // Sort targets by time delta and take the best ones
    targetPeaks.sort((a, b) => a.timeDelta - b.timeDelta);
    const selectedTargets = targetPeaks.slice(0, FANOUT_FACTOR);
    
    // Create fingerprints for each anchor-target pair
    selectedTargets.forEach(target => {
      const freq1 = anchorPeak.freqBin;
      const freq2 = target.peak.freqBin;
      const timeDelta = target.timeDelta;
      
      // Quantize time delta for better matching stability
      const quantizedTimeDelta = Math.round(timeDelta / TIME_QUANTIZATION) * TIME_QUANTIZATION;
      
      // Create a more robust hash combining frequencies and time
      // Use frequency difference and ratio for better uniqueness
      const freqDiff = Math.abs(freq2 - freq1);
      const freqRatio = Math.round(Math.max(freq1, freq2) / Math.min(freq1, freq2) * 10);
      
      const hashString = `${Math.min(freq1, freq2)}-${Math.max(freq1, freq2)}-${Math.round(quantizedTimeDelta * 100)}-${freqRatio}`;
      const hash = murmurhash3.x86.hash32(hashString);
      
      fingerprints.push({
        hash,
        offset: Math.round(anchorTime * 1000), // Convert to milliseconds
        anchorFreq: freq1,
        targetFreq: freq2,
        timeDelta: quantizedTimeDelta,
        strength: (anchorPeak.magnitude + target.peak.magnitude) / 2
      });
    });
  }
  
  // Remove duplicate fingerprints (same hash and similar offset)
  const uniqueFingerprints = [];
  const seenHashes = new Map();
  
  fingerprints.forEach(fp => {
    const key = `${fp.hash}-${Math.floor(fp.offset / 100)}`; // Group by 100ms
    if (!seenHashes.has(key) || seenHashes.get(key).strength < fp.strength) {
      seenHashes.set(key, fp);
    }
  });
  
  uniqueFingerprints.push(...seenHashes.values());
  
  return uniqueFingerprints;
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
    
    // For recognition, we want more detail, so use smaller hop size
    const spectralPeaks = extractSpectralPeaks(audioData, HOP_SIZE_RECOGNITION);
    
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
    // Filter sample fingerprints by strength to focus on the most reliable ones
    const topFingerprints = sampleFingerprints
      .sort((a, b) => (b.strength || 0) - (a.strength || 0))
      .slice(0, Math.min(5000, sampleFingerprints.length)); // Limit to top 5000
    
    const sampleHashes = topFingerprints.map(fp => fp.hash);
    
    console.log(`Matching ${sampleHashes.length} top fingerprints against database`);
    
    // Find songs with matching fingerprints
    const matchedSongs = await Song.aggregate([
      { $match: { "fingerprints.hash": { $in: sampleHashes } }},
      { $unwind: "$fingerprints" },
      { $match: { "fingerprints.hash": { $in: sampleHashes } }},
      { $group: {
        _id: "$_id",
        title: { $first: "$title" },
        artist: { $first: "$artist" },
        duration: { $first: "$duration" },
        matchCount: { $sum: 1 },
        fingerprints: { $push: "$fingerprints" }
      }},
      { $match: { matchCount: { $gte: 10 } }}, // Pre-filter: at least 10 matches
      { $sort: { matchCount: -1 } }
    ]);
    
    console.log(`Found ${matchedSongs.length} songs with 10+ matching fingerprints`);
    
    const results = [];
    const OFFSET_TOLERANCE = 200; // 200ms tolerance for grouping offsets
    
    for (const song of matchedSongs) {
      // Build offset histogram with better precision
      const offsetCounts = new Map();
      const matchDetails = [];
      
      // Match fingerprints and calculate offsets
      for (const songFp of song.fingerprints) {
        const sampleFp = topFingerprints.find(fp => fp.hash === songFp.hash);
        if (!sampleFp) continue;
        
        const timeOffset = songFp.offset - sampleFp.offset;
        
        // Group similar offsets together
        const offsetKey = Math.round(timeOffset / OFFSET_TOLERANCE) * OFFSET_TOLERANCE;
        
        offsetCounts.set(offsetKey, (offsetCounts.get(offsetKey) || 0) + 1);
        matchDetails.push({
          songOffset: songFp.offset,
          sampleOffset: sampleFp.offset,
          timeOffset: timeOffset,
          groupedOffset: offsetKey,
          hash: songFp.hash
        });
      }
      
      // Find the best alignment (most common offset)
      let bestOffset = 0;
      let bestCount = 0;
      
      for (const [offset, count] of offsetCounts.entries()) {
        if (count > bestCount) {
          bestCount = count;
          bestOffset = offset;
        }
      }
      
      // Calculate more sophisticated confidence metrics
      const alignedMatches = bestCount;
      const totalSampleFingerprints = topFingerprints.length;
      const matchRatio = alignedMatches / totalSampleFingerprints;
      
      // Calculate temporal consistency (how well-distributed are the matches)
      const alignedDetails = matchDetails.filter(m => 
        Math.abs(m.groupedOffset - bestOffset) <= OFFSET_TOLERANCE
      );
      
      // Check temporal distribution
      const timeSpread = alignedDetails.length > 1 ? 
        Math.max(...alignedDetails.map(m => m.sampleOffset)) - 
        Math.min(...alignedDetails.map(m => m.sampleOffset)) : 0;
      
      // Confidence based on multiple factors
      const baseConfidence = Math.min(matchRatio * 2, 1.0); // Cap at 1.0
      const temporalBonus = Math.min(timeSpread / 5000, 0.2); // Bonus for temporal spread
      const alignmentBonus = alignedMatches > 30 ? 0.1 : 0; // Bonus for many aligned matches
      
      const finalConfidence = Math.min(baseConfidence + temporalBonus + alignmentBonus, 1.0);
      
      console.log(`Song: ${song.title}`);
      console.log(`  Total matches: ${song.matchCount}, Aligned: ${alignedMatches}`);
      console.log(`  Match ratio: ${matchRatio.toFixed(3)}, Time spread: ${timeSpread}ms`);
      console.log(`  Confidence: ${finalConfidence.toFixed(3)}`);
      
      // More stringent filtering criteria
      const MIN_ALIGNED_MATCHES = Math.max(15, totalSampleFingerprints * 0.01); // At least 1% match
      const MIN_CONFIDENCE = 0.15; // Minimum confidence threshold
      
      if (alignedMatches >= MIN_ALIGNED_MATCHES && finalConfidence >= MIN_CONFIDENCE) {
        results.push({
          songId: song._id,
          title: song.title,
          artist: song.artist,
          confidence: parseFloat(finalConfidence.toFixed(3)),
          alignedMatches,
          totalMatches: song.matchCount,
          matchRatio: parseFloat(matchRatio.toFixed(3)),
          timeSpread: Math.round(timeSpread),
          offset: bestOffset,
          songDuration: song.duration
        });
      }
    }
    
    // Sort by confidence, then by aligned matches
    results.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      return confidenceDiff !== 0 ? confidenceDiff : b.alignedMatches - a.alignedMatches;
    });
    
    // Further filter to prevent false positives
    if (results.length > 1) {
      const topResult = results[0];
      const significantResults = results.filter(r => 
        r.confidence >= topResult.confidence * 0.7 && // Within 70% of top confidence
        r.alignedMatches >= topResult.alignedMatches * 0.5 // At least 50% of top aligned matches
      );
      
      console.log(`Filtered from ${results.length} to ${significantResults.length} significant results`);
      return significantResults.slice(0, 3); // Return top 3 at most
    }
    
    console.log(`Final results: ${results.length} matches`);
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
    
    // Get sample duration for context
    let sampleDuration = 0;
    try {
      const { stdout } = await execPromise(
        `"${FFMPEG_PATH}" -i "${filePath}" -f null - 2>&1`
      );
      
      const durationMatch = stdout.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        sampleDuration = hours * 3600 + minutes * 60 + seconds;
      }
    } catch (err) {
      console.error('Error getting sample duration:', err);
    }
    
    console.log(`Sample duration: ${sampleDuration.toFixed(2)}s`);
    
    const sampleFingerprints = await processSample(filePath);
    
    console.log(`Extracted ${sampleFingerprints.length} fingerprints from sample for matching`);
    
    // Match the fingerprints against our database
    const matches = await matchFingerprints(sampleFingerprints);
    
    // Clean up the temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });
    
    // Enhanced response with more details
    const response = {
      results: matches,
      matchCount: matches.length,
      sampleDuration: Math.round(sampleDuration * 100) / 100,
      fingerprintCount: sampleFingerprints.length,
      processingInfo: {
        message: matches.length === 0 ? 
          "No confident matches found. This could mean the song is not in the database or the sample quality is too low." :
          matches.length === 1 ?
          "Single confident match found." :
          `${matches.length} potential matches found. Top result is most likely.`
      }
    };
    
    console.log(`Recognition complete: ${matches.length} matches returned`);
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error in recognizeSong:', error);
    return res.status(500).json({ 
      error: error.message,
      details: 'Audio recognition failed. Please ensure the audio file is valid and try again.'
    });
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