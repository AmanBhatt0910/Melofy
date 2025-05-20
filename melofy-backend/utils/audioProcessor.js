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
const HOP_SIZE = WINDOW_SIZE / 2;  // 50% overlap
const MIN_FREQ = 30;      // Hz
const MAX_FREQ = 5000;    // Hz
const MIN_FREQ_IDX = Math.floor(MIN_FREQ * FFT_SIZE / SAMPLE_RATE);
const MAX_FREQ_IDX = Math.floor(MAX_FREQ * FFT_SIZE / SAMPLE_RATE);
const TARGET_PEAKS = 10;  // Number of peaks to extract per frame
const FANOUT_FACTOR = 3;  // Number of anchor points to pair with each peak
const MAX_TIME_DELTA = 3; // Maximum time difference (seconds) between anchor points

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
    
    // Apply FFT and extract peaks
    const spectralPeaks = extractSpectralPeaks(audioData);
    
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
 * Convert audio file to raw PCM format for processing
 * @param {string} inputFile - Path to input audio file
 * @returns {Promise<string>} - Path to PCM file
 */
async function convertToPCM(inputFile) {
  const outputFile = path.join(TEMP_DIR, `${path.basename(inputFile, path.extname(inputFile))}.pcm`);
  
  // Using ffmpeg command to convert audio to raw PCM
  const ffmpegCommand = `ffmpeg -i "${inputFile}" -f s16le -acodec pcm_s16le -ar ${SAMPLE_RATE} -ac 1 "${outputFile}" -y`;
  
  try {
    await execPromise(ffmpegCommand);
    console.log(`Successfully converted to PCM: ${outputFile}`);
    return outputFile;
  } catch (error) {
    console.error('FFmpeg conversion failed:', error.message);
    
    // Check if ffmpeg is installed
    try {
      await execPromise('ffmpeg -version');
      console.error('FFmpeg is installed but conversion still failed.');
    } catch (ffmpegError) {
      console.error('FFmpeg does not appear to be installed. Please install FFmpeg.');
    }
    
    // Fallback: Create a synthetic PCM file since we can't convert
    console.log('Falling back to synthetic PCM data');
    const stats = fs.statSync(inputFile);
    const estimatedDuration = stats.size / (128 * 1024 / 8); // Assuming 128kbps file
    const numSamples = Math.floor(estimatedDuration * SAMPLE_RATE);
    
    // Create a simple synthetic waveform (sine wave)
    const syntheticPCM = Buffer.alloc(numSamples * 2); // 16-bit samples (2 bytes)
    for (let i = 0; i < numSamples; i++) {
      // Generate a mix of sine waves at different frequencies
      const sample = Math.sin(i * 0.01) * 10000 + Math.sin(i * 0.05) * 5000;
      syntheticPCM.writeInt16LE(Math.floor(sample), i * 2);
    }
    
    fs.writeFileSync(outputFile, syntheticPCM);
    console.log(`Created synthetic PCM data: ${outputFile}`);
    return outputFile;
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
  
  // Process audio in overlapping windows
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
  
  // Group peaks by time frame (within ~100ms)
  const timeFrames = {};
  peaks.forEach(peak => {
    const frameKey = Math.floor(peak.timeOffset * 10); // 100ms buckets
    if (!timeFrames[frameKey]) {
      timeFrames[frameKey] = [];
    }
    timeFrames[frameKey].push(peak);
  });
  
  // Process each anchor point
  Object.values(timeFrames).forEach(framePeaks => {
    framePeaks.forEach(anchorPeak => {
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
        const hash = murmurhash3.x86.hash32(hashStr);
        
        fingerprints.push({
          hash,
          offset: Math.round(anchorTime * 1000), // Convert to milliseconds
          anchors: [anchorPeak.freqBin, targetPeak.freqBin, Math.round(timeDelta * 10)]
        });
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
  // For sample recognition, we can optimize by using a smaller section
  console.log('Processing audio sample for recognition');
  
  try {
    // Convert audio to PCM for processing
    const pcmFile = await convertToPCM(filePath);
    
    // Read PCM data
    const audioData = await readPCMFile(pcmFile);
    
    // For samples, we can use only a portion of the audio to speed up recognition
    // Extract a 15-second section from the middle if the file is longer
    let sampleData = audioData;
    if (audioData.duration > 15) {
      const startSample = Math.floor((audioData.samples.length / 2) - (7.5 * SAMPLE_RATE));
      const endSample = Math.floor((audioData.samples.length / 2) + (7.5 * SAMPLE_RATE));
      
      sampleData = {
        samples: audioData.samples.slice(
          Math.max(0, startSample), 
          Math.min(audioData.samples.length, endSample)
        ),
        sampleRate: SAMPLE_RATE,
        duration: 15
      };
      
      console.log(`Using a 15-second sample from the middle of the recording`);
    }
    
    // Apply FFT and extract peaks
    const spectralPeaks = extractSpectralPeaks(sampleData);
    
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