import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { extractAudioFeatures } from "@/lib/audioFeatureExtractor";
import { classifyBarkWithML } from "@/lib/mlBarkClassifier";
import { DogDataManager } from "@/lib/dogDataManager";

export type EmotionKey = "normal" | "happy" | "pain" | "sad" | "afraid" | "angry";

const emotionMap: Record<string, EmotionKey> = {
  normal: "normal", none: "normal", silence: "normal", quiet: "normal", idle: "normal", neutral: "normal", resting: "normal", sleeping: "normal",
  happy: "happy", excited: "happy", playful: "happy", content: "happy", joyful: "happy", cheerful: "happy",
  pain: "pain", distressed: "pain", hurt: "pain", uncomfortable: "pain", suffering: "pain", crying: "pain", yelping: "pain",
  sad: "sad", lonely: "sad", whimpering: "sad", depressed: "sad", mournful: "sad", melancholy: "sad", sorrowful: "sad", unhappy: "sad", low: "sad", whining: "sad",
  afraid: "afraid", scared: "afraid", fearful: "afraid", anxious: "afraid", nervous: "afraid", trembling: "afraid",
  angry: "angry", aggressive: "angry", territorial: "angry", frustrated: "angry", alert: "angry", growling: "angry",
};

export interface EmotionLog {
  emotion: EmotionKey;
  confidence: number;
  note?: string;
  created_at: string;
}

const CHUNK_DURATION = 4_000;

export interface SensorReading {
  id: string;
  bark_spike: number | null;
  ammonia_ppm: number | null;
  methane_ppm: number | null;
  co2_ppm: number | null;
  scratch_intensity: number | null;
  diagnosis: string | null;
  skin_status: string | null;
  device_timestamp: number | null;
  created_at: string;
}

// Live Sensor Data Hook
export function useLiveSensorData() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [connected, setConnected] = useState(false);
  const [secondsActive, setSecondsActive] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const fetchRecent = useCallback(async () => {
    // Get dog-specific sensor data
    const dogData = DogDataManager.getDogData("sensor_readings") || [];
    if (dogData.length > 0) {
      setReadings(dogData);
      setLatest(dogData[0]);
    }
  }, []);

  const startMonitoring = useCallback(() => {
    fetchRecent();
    setConnected(true);
    setSecondsActive(0);
    timerRef.current = setInterval(() => setSecondsActive((s) => s + 1), 1000);

    const channel = supabase
      .channel(`sensor_readings_${DogDataManager.getActiveDogId()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          const newReading = payload.new as SensorReading;
          setLatest(newReading);
          const updatedReadings = [newReading, ...readings].slice(0, 50);
          setReadings(updatedReadings);
          // Store in dog-specific storage
          DogDataManager.setDogData("sensor_readings", updatedReadings);
        }
      )
      .subscribe();
    channelRef.current = channel;
  }, [fetchRecent, readings]);

  const stopMonitoring = useCallback(() => {
    setConnected(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { readings, latest, connected, secondsActive, startMonitoring, stopMonitoring };
}

// BLE Collar Hook
export function useBleCollar() {
  const [connected, setConnected] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [secondsActive, setSecondsActive] = useState(0);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const { toast } = useToast();

  const deviceRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      toast({
        title: "❌ Bluetooth Not Supported",
        description: "Web Bluetooth requires Chrome/Edge browser.",
        variant: "destructive",
      });
      return;
    }

    setPairing(true);
    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["12345678-1234-1234-1234-123456789012"],
      });

      deviceRef.current = device;
      setDeviceName(device.name ?? "Pawsitive Collar");
      setConnected(true);
      setPairing(false);
      setSecondsActive(0);
      timerRef.current = setInterval(() => setSecondsActive((s) => s + 1), 1000);

      toast({
        title: "✅ Connected!",
        description: `Paired with ${device.name ?? "Pawsitive Collar"}`,
      });
    } catch (err: any) {
      setPairing(false);
      toast({
        title: "❌ Connection Failed",
        description: err?.message || "Failed to connect to device.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopMonitoring = useCallback(() => {
    setConnected(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
  }, []);

  return {
    connected,
    pairing,
    latest,
    readings,
    secondsActive,
    deviceName,
    startMonitoring,
    stopMonitoring,
  };
}

// Continuous Listening Hook
export function useContinuousListening() {
  const [listening, setListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);
  const [sessionLogs, setSessionLogs] = useState<EmotionLog[]>([]);
  const [latestEmotion, setLatestEmotion] = useState<EmotionKey | null>(null);
  const [latestConfidence, setLatestConfidence] = useState<number>(0);
  const [latestSeverity, setLatestSeverity] = useState<string>("normal");
  const [secondsActive, setSecondsActive] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const stored = DogDataManager.getDogData("emotion_logs");
    if (stored) {
      setEmotionLogs(stored);
    }
  }, []);

  const saveLog = useCallback((emotion: EmotionKey, confidence: number, note?: string) => {
    const log: EmotionLog = { emotion, confidence, note, created_at: new Date().toISOString() };
    setEmotionLogs((prev) => {
      const updated = [log, ...prev];
      DogDataManager.setDogData("emotion_logs", updated);
      return updated;
    });
    setSessionLogs((prev) => [log, ...prev]);
    setLatestEmotion(emotion);
    setLatestConfidence(confidence);
    return { emotion, log };
  }, []);

  const analyzeChunk = useCallback(async (blob: Blob, duration: number) => {
    if (blob.size < 500) return null;
    setAnalyzing(true);
    try {
      const features = await extractAudioFeatures(blob);
      const data = await classifyBarkWithML(features);

      const rawEmotion = (data.emotional_state || "").toLowerCase();
      const mapped = emotionMap[rawEmotion] || "normal";
      const conf = data.confidence || 70;
      const sev = data.severity || "normal";
      const result = saveLog(mapped, conf, data.detailed_analysis?.slice(0, 80));
      setLatestConfidence(conf);
      setLatestSeverity(sev);
      return { ...data, mappedEmotion: result.emotion };
    } catch (e) {
      console.error("Auto-analysis failed:", e);
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, [saveLog]);

  const startChunkRecording = useCallback(() => {
    if (!streamRef.current || !activeRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      if (!activeRef.current) return;
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      analyzeChunk(blob, CHUNK_DURATION / 1000);
      if (activeRef.current) {
        setTimeout(() => {
          if (activeRef.current) startChunkRecording();
        }, 100);
      }
    };
    mediaRecorder.start();
    setTimeout(() => {
      if (mediaRecorder.state === "recording" && activeRef.current) mediaRecorder.stop();
    }, CHUNK_DURATION);
  }, [analyzeChunk]);

  const startListening = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } 
      });
      streamRef.current = stream;
      activeRef.current = true;
      setListening(true);
      setSecondsActive(0);
      setSessionLogs([]);
      setLatestEmotion(null);
      setLatestConfidence(0);
      setLatestSeverity("normal");
      timerRef.current = setInterval(() => setSecondsActive((s) => s + 1), 1000);
      startChunkRecording();
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError" 
        ? "Microphone permission denied. Please allow mic access and try again."
        : "Microphone error occurred.";
      setMicError(msg);
    }
  }, [startChunkRecording]);

  const stopListening = useCallback(() => {
    activeRef.current = false;
    setListening(false);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    if (streamRef.current) { 
      streamRef.current.getTracks().forEach((t) => t.stop()); 
      streamRef.current = null; 
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  return { 
    listening, 
    analyzing, 
    emotionLogs,
    sessionLogs,
    latestEmotion, 
    latestConfidence,
    latestSeverity,
    secondsActive, 
    startListening, 
    stopListening,
    saveLog,
    setEmotionLogs,
    micError 
  };
}