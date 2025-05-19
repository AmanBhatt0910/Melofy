const FFT = require('fft.js');
const PitchFinder = require('pitchfinder');
const { murmurhash3_32_gc } = require('murmurhash3js');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { AudioContext } = require('web-audio-api');

const readFile = promisify(fs.readFile);

class AudioProcessor {
  constructor() {
    this.detectPitch = PitchFinder.YIN({ sampleRate: 44100 });
    this.supportedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
    this.audioContext = new AudioContext();
    this.fftSize = 2048; // Optimal for music analysis
  }

  async loadAudioFile(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported format: ${ext}`);
      }

      const fileBuffer = await readFile(filePath);
      const audioBuffer = await this.decodeAudioData(fileBuffer.buffer);
      
      return {
        channelData: audioBuffer.getChannelData(0),
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration
      };
    } catch (error) {
      console.error('Audio loading failed:', error.message);
      throw error;
    }
  }

  decodeAudioData(buffer) {
    return new Promise((resolve, reject) => {
      this.audioContext.decodeAudioData(buffer, resolve, reject);
    });
  }

  async processAudio(filePath) {
    try {
      console.log(`Processing: ${path.basename(filePath)}`);
      const { channelData, sampleRate } = await this.loadAudioFile(filePath);
      
      // Initialize FFT with optimal size
      const fft = new FFT(this.fftSize);
      const peaks = [];
      const windowSize = this.fftSize;
      const hopSize = Math.floor(windowSize / 4);

      for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
        const window = channelData.slice(i, i + windowSize);
        const out = fft.createComplexArray();
        
        // Apply Hanning window
        const windowed = this.applyWindow(window);
        
        // Perform FFT
        fft.realTransform(out, windowed);
        
        // Find peaks in this window
        const windowPeaks = this.findPeaks(out, i / sampleRate);
        peaks.push(...windowPeaks);
      }

      const fingerprints = this.generateFingerprints(peaks);
      console.log(`Generated ${fingerprints.length} fingerprints`);
      return fingerprints;
    } catch (error) {
      console.error('Processing failed:', error.message);
      throw error;
    }
  }

  applyWindow(samples) {
    const windowed = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const multiplier = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
      windowed[i] = multiplier * samples[i];
    }
    return windowed;
  }

  findPeaks(fftData, timestamp) {
    const peaks = [];
    const magnitude = new Float32Array(fftData.length / 2);
    
    // Calculate magnitudes
    for (let i = 0; i < magnitude.length; i++) {
      magnitude[i] = Math.sqrt(fftData[i*2]**2 + fftData[i*2+1]**2);
    }

    // Find local maxima
    for (let i = 1; i < magnitude.length - 1; i++) {
      if (magnitude[i] > magnitude[i-1] && magnitude[i] > magnitude[i+1]) {
        peaks.push({
          time: timestamp,
          freq: i * (this.audioContext.sampleRate / this.fftSize),
          amplitude: magnitude[i]
        });
      }
    }

    return peaks.sort((a, b) => b.amplitude - a.amplitude).slice(0, 10);
  }

  generateFingerprints(peaks) {
    const fingerprints = [];
    const maxTimeDelta = 0.5; // 500ms
    
    for (let i = 0; i < peaks.length; i++) {
      for (let j = i + 1; j < Math.min(i + 20, peaks.length); j++) {
        const delta = peaks[j].time - peaks[i].time;
        if (delta > maxTimeDelta) continue;
        
        const hash = murmurhash3_32_gc(
          `${Math.round(peaks[i].freq)}:${Math.round(peaks[j].freq)}:${delta.toFixed(3)}`
        );
        
        fingerprints.push({
          hash,
          time: peaks[i].time,
          freq1: peaks[i].freq,
          freq2: peaks[j].freq,
          deltaTime: delta
        });
      }
    }
    
    return fingerprints;
  }
}

module.exports = new AudioProcessor();