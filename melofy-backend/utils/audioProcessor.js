const fs = require('fs');
const path = require('path');
const murmurhash3 = require('murmurhash3js');
const fourierTransform = require('fourier-transform');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

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

module.exports = {
  processAudio,
  processSample
};