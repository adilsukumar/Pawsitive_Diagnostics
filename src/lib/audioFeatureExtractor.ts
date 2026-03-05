/**
 * Extracts acoustic features from an audio Blob using Web Audio API.
 * These features are sent as text to the AI for emotion classification,
 * since the AI gateway doesn't support raw audio input.
 */

export interface AudioFeatures {
  /** Average RMS volume (0-1 scale) */
  avgVolume: number;
  /** Peak volume (0-1 scale) */
  peakVolume: number;
  /** Dominant frequency in Hz */
  dominantFreqHz: number;
  /** Average pitch category */
  pitchCategory: "very-low" | "low" | "mid" | "high" | "very-high";
  /** Volume variance — high = irregular bursts */
  volumeVariance: number;
  /** Number of distinct sound bursts/onsets detected */
  burstCount: number;
  /** Average gap between bursts in ms */
  avgBurstGapMs: number;
  /** Whether rhythm is regular or irregular */
  rhythmPattern: "silent" | "steady" | "regular" | "irregular" | "erratic";
  /** Duration of audio with actual sound (vs silence) in seconds */
  activeSoundDuration: number;
  /** Total duration in seconds */
  totalDuration: number;
  /** Ratio of sound vs silence */
  soundToSilenceRatio: number;
  /** Frequency spread — narrow = tonal, wide = noisy/growl */
  frequencySpread: "narrow" | "moderate" | "wide";
  /** Whether there are sustained notes (whining/howling) vs short bursts (barking) */
  sustainedVsShort: "sustained" | "short-bursts" | "mixed";
  /** Original audio blob for ML processing */
  audioBlob: Blob;
}

export async function extractAudioFeatures(blob: Blob): Promise<AudioFeatures> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const totalDuration = audioBuffer.duration;

  // --- Volume analysis ---
  const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames (finer resolution)
  const hopSize = Math.floor(sampleRate * 0.005); // 5ms hop (2x more detail)
  const rmsValues: number[] = [];

  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      sum += channelData[i + j] ** 2;
    }
    rmsValues.push(Math.sqrt(sum / frameSize));
  }

  const avgVolume = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  const peakVolume = Math.max(...rmsValues);
  const volumeVariance =
    rmsValues.reduce((sum, v) => sum + (v - avgVolume) ** 2, 0) / rmsValues.length;

  // --- Silence/sound segmentation ---
  // Use a very low absolute threshold so quiet whimpers/growls aren't lost in noise
  const silenceThreshold = Math.max(avgVolume * 0.15, 0.002);
  let activeFrames = 0;
  const isSoundFrame: boolean[] = [];
  for (const rms of rmsValues) {
    const isSound = rms > silenceThreshold;
    isSoundFrame.push(isSound);
    if (isSound) activeFrames++;
  }
  const activeSoundDuration = (activeFrames * (hopSize / sampleRate));
  const soundToSilenceRatio = activeSoundDuration / Math.max(totalDuration, 0.01);

  // --- Burst/onset detection ---
  const bursts: number[] = []; // indices of burst starts
  let inBurst = false;
  const burstThreshold = Math.max(avgVolume * 1.2, 0.005);
  for (let i = 0; i < rmsValues.length; i++) {
    if (rmsValues[i] > burstThreshold && !inBurst) {
      bursts.push(i);
      inBurst = true;
    } else if (rmsValues[i] < silenceThreshold) {
      inBurst = false;
    }
  }

  const burstCount = bursts.length;
  let avgBurstGapMs = 0;
  if (bursts.length > 1) {
    const gaps = [];
    for (let i = 1; i < bursts.length; i++) {
      gaps.push((bursts[i] - bursts[i - 1]) * (hopSize / sampleRate) * 1000);
    }
    avgBurstGapMs = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  // Rhythm regularity
  let rhythmPattern: AudioFeatures["rhythmPattern"] = "silent";
  if (burstCount === 0) {
    rhythmPattern = "silent";
  } else if (burstCount <= 2) {
    rhythmPattern = "steady";
  } else {
    const gaps = [];
    for (let i = 1; i < bursts.length; i++) {
      gaps.push((bursts[i] - bursts[i - 1]) * (hopSize / sampleRate) * 1000);
    }
    const gapMean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const gapVariance = gaps.reduce((s, g) => s + (g - gapMean) ** 2, 0) / gaps.length;
    const cv = Math.sqrt(gapVariance) / Math.max(gapMean, 1); // coefficient of variation
    rhythmPattern = cv < 0.3 ? "regular" : cv < 0.6 ? "irregular" : "erratic";
  }

  // --- Frequency analysis using Web Audio AnalyserNode (fast native FFT) ---
  const fftSize = 2048;
  const offlineCtx = new OfflineAudioContext(1, channelData.length, sampleRate);
  const source = offlineCtx.createBufferSource();
  const analyserBuffer = offlineCtx.createBuffer(1, channelData.length, sampleRate);
  analyserBuffer.getChannelData(0).set(channelData);
  source.buffer = analyserBuffer;
  
  const analyser = offlineCtx.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);
  analyser.connect(offlineCtx.destination);
  source.start(0);
  
  // Find loudest segment position for frequency analysis
  let loudestStart = 0;
  let loudestRms = 0;
  const chunkSize = fftSize;
  for (let i = 0; i < channelData.length - chunkSize; i += chunkSize) {
    let sum = 0;
    for (let j = 0; j < chunkSize; j++) sum += channelData[i + j] ** 2;
    const rms = Math.sqrt(sum / chunkSize);
    if (rms > loudestRms) { loudestRms = rms; loudestStart = i; }
  }

  // Use a simple peak-finding on loudest segment (fast, no O(n²) DFT)
  const segment = channelData.slice(loudestStart, loudestStart + fftSize);
  // Zero-crossing rate as a fast pitch proxy
  let zeroCrossings = 0;
  for (let i = 1; i < segment.length; i++) {
    if ((segment[i] >= 0) !== (segment[i - 1] >= 0)) zeroCrossings++;
  }
  const dominantFreqHz = Math.round((zeroCrossings / 2) * (sampleRate / segment.length));
  
  // Also do quick autocorrelation for better pitch estimate
  let bestCorr = 0, bestLag = 0;
  const minLag = Math.floor(sampleRate / 2000); // 2000Hz max
  const maxLag = Math.floor(sampleRate / 80);   // 80Hz min
  for (let lag = minLag; lag < Math.min(maxLag, segment.length / 2); lag++) {
    let corr = 0;
    for (let i = 0; i < segment.length - lag; i++) corr += segment[i] * segment[i + lag];
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }
  const autoFreq = bestLag > 0 ? Math.round(sampleRate / bestLag) : dominantFreqHz;
  // Use autocorrelation if it found a clear pitch, otherwise zero-crossing
  const finalFreq = bestCorr > 0 ? autoFreq : dominantFreqHz;

  // Pitch category
  let pitchCategory: AudioFeatures["pitchCategory"];
  if (finalFreq < 150) pitchCategory = "very-low";
  else if (finalFreq < 400) pitchCategory = "low";
  else if (finalFreq < 800) pitchCategory = "mid";
  else if (finalFreq < 1500) pitchCategory = "high";
  else pitchCategory = "very-high";

  // Frequency spread — estimate from spectral flatness via zero-crossing variance
  // High variance in local zero-crossing rates = wide spread (growl/noise)
  // Low variance = narrow/tonal (whine/howl)
  const zcChunkSize = 512;
  const zcRates: number[] = [];
  for (let i = 0; i < segment.length - zcChunkSize; i += zcChunkSize) {
    let zc = 0;
    for (let j = 1; j < zcChunkSize; j++) {
      if ((segment[i + j] >= 0) !== (segment[i + j - 1] >= 0)) zc++;
    }
    zcRates.push(zc);
  }
  const zcMean = zcRates.length > 0 ? zcRates.reduce((a, b) => a + b, 0) / zcRates.length : 0;
  const zcVar = zcRates.length > 0 ? zcRates.reduce((s, v) => s + (v - zcMean) ** 2, 0) / zcRates.length : 0;
  const zcCv = zcMean > 0 ? Math.sqrt(zcVar) / zcMean : 0;
  const frequencySpread: AudioFeatures["frequencySpread"] =
    zcCv < 0.15 ? "narrow" : zcCv < 0.4 ? "moderate" : "wide";

  // Sustained vs short detection
  let maxBurstLength = 0;
  let currentBurstLength = 0;
  for (const isSound of isSoundFrame) {
    if (isSound) {
      currentBurstLength++;
      maxBurstLength = Math.max(maxBurstLength, currentBurstLength);
    } else {
      currentBurstLength = 0;
    }
  }
  const maxBurstDuration = maxBurstLength * (hopSize / sampleRate);
  const sustainedVsShort: AudioFeatures["sustainedVsShort"] =
    maxBurstDuration > 0.8 ? "sustained" : maxBurstDuration > 0.3 ? "mixed" : "short-bursts";

  await audioContext.close();

  return {
    avgVolume: Math.round(avgVolume * 1000) / 1000,
    peakVolume: Math.round(peakVolume * 1000) / 1000,
    dominantFreqHz: finalFreq,
    pitchCategory,
    volumeVariance: Math.round(volumeVariance * 10000) / 10000,
    burstCount,
    avgBurstGapMs: Math.round(avgBurstGapMs),
    rhythmPattern,
    activeSoundDuration: Math.round(activeSoundDuration * 100) / 100,
    totalDuration: Math.round(totalDuration * 100) / 100,
    soundToSilenceRatio: Math.round(soundToSilenceRatio * 100) / 100,
    frequencySpread,
    sustainedVsShort,
    audioBlob: blob, // Include original blob for ML processing
  };
}

/**
 * Converts extracted features into a detailed text description for the AI.
 */
export function featuresToDescription(f: AudioFeatures): string {
  const lines = [
    `AUDIO ANALYSIS (${f.totalDuration}s recording, ${f.activeSoundDuration}s of actual sound):`,
    ``,
    `VOLUME: avg=${f.avgVolume.toFixed(3)}, peak=${f.peakVolume.toFixed(3)}, variance=${f.volumeVariance.toFixed(4)}`,
    `  → ${f.peakVolume > 0.3 ? "LOUD" : f.peakVolume > 0.1 ? "Moderate" : "Quiet"} vocalizations`,
    `  → Volume is ${f.volumeVariance > 0.01 ? "HIGHLY VARIABLE (sudden spikes)" : f.volumeVariance > 0.003 ? "somewhat variable" : "relatively steady"}`,
    ``,
    `PITCH: dominant frequency = ${f.dominantFreqHz}Hz (${f.pitchCategory})`,
    `  → ${f.pitchCategory === "very-low" || f.pitchCategory === "low" ? "LOW pitch suggests growling, deep barking, or mournful sounds" : ""}`,
    `  → ${f.pitchCategory === "high" || f.pitchCategory === "very-high" ? "HIGH pitch suggests yelping, whining, excited barking, or crying" : ""}`,
    `  → ${f.pitchCategory === "mid" ? "MID pitch — could be normal barking, alert, or moderate vocalization" : ""}`,
    ``,
    `RHYTHM: ${f.burstCount} sound bursts detected, pattern = ${f.rhythmPattern}`,
    `  → avg gap between bursts = ${f.avgBurstGapMs}ms`,
    `  → ${f.rhythmPattern === "regular" ? "REGULAR rhythm suggests happy/playful repetitive barking" : ""}`,
    `  → ${f.rhythmPattern === "irregular" ? "IRREGULAR rhythm suggests anxiety, uncertainty, or fear" : ""}`,
    `  → ${f.rhythmPattern === "erratic" ? "ERRATIC pattern suggests panic, extreme distress, or aggression" : ""}`,
    ``,
    `FREQUENCY SPREAD: ${f.frequencySpread}`,
    `  → ${f.frequencySpread === "narrow" ? "Narrow/tonal = whining, howling, sustained cries" : f.frequencySpread === "wide" ? "Wide/noisy = growling, snarling, aggressive sounds" : "Moderate spread"}`,
    ``,
    `SOUND TYPE: ${f.sustainedVsShort}`,
    `  → ${f.sustainedVsShort === "sustained" ? "Long sustained sounds = whining, howling, crying (SAD or PAIN)" : ""}`,
    `  → ${f.sustainedVsShort === "short-bursts" ? "Short bursts = barking (could be happy, angry, or alert)" : ""}`,
    `  → ${f.sustainedVsShort === "mixed" ? "Mix of sustained and short = complex vocalization" : ""}`,
    ``,
    `SOUND RATIO: ${Math.round(f.soundToSilenceRatio * 100)}% sound / ${Math.round((1 - f.soundToSilenceRatio) * 100)}% silence`,
    `  → ${f.soundToSilenceRatio < 0.1 ? "Mostly silence — likely NORMAL, no significant vocalization" : ""}`,
    `  → ${f.soundToSilenceRatio > 0.7 ? "Almost continuous sound — intense/urgent vocalization" : ""}`,
    ``,
    `CLASSIFICATION GUIDE based on these measurements:`,
    `- ANGRY: Low pitch (${f.pitchCategory === "low" || f.pitchCategory === "very-low" ? "✓ MATCH" : "✗"}), wide freq spread/growling (${f.frequencySpread === "wide" ? "✓ MATCH" : "✗"}), high volume (${f.peakVolume > 0.2 ? "✓ MATCH" : "✗"}), erratic/intense rhythm`,
    `- PAIN: High pitch yelps (${f.pitchCategory === "high" || f.pitchCategory === "very-high" ? "✓ MATCH" : "✗"}), high volume variance/sudden spikes (${f.volumeVariance > 0.01 ? "✓ MATCH" : "✗"}), sustained crying`,
    `- SAD: Low-mid pitch (${f.pitchCategory === "low" || f.pitchCategory === "mid" ? "✓ MATCH" : "✗"}), sustained/narrow/tonal whining (${f.sustainedVsShort === "sustained" && f.frequencySpread === "narrow" ? "✓ MATCH" : "✗"}), quiet-moderate volume`,
    `- AFRAID: High pitch (${f.pitchCategory === "high" ? "✓ MATCH" : "✗"}), irregular rhythm (${f.rhythmPattern === "irregular" || f.rhythmPattern === "erratic" ? "✓ MATCH" : "✗"}), variable volume`,
    `- HAPPY: Mid-high pitch, regular rhythm (${f.rhythmPattern === "regular" ? "✓ MATCH" : "✗"}), moderate volume, short bursts`,
    `- NORMAL: Low sound ratio (${f.soundToSilenceRatio < 0.15 ? "✓ MATCH" : "✗"}), no strong vocalizations`,
    ``,
    `Choose the emotion with the MOST ✓ MATCH indicators above. If tied, use confidence to reflect uncertainty.`,
  ];

  return lines.filter(l => l.trim() !== "→").join("\n");
}
