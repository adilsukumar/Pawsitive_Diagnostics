import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractAudioFeatures, featuresToDescription } from "@/lib/audioFeatureExtractor";
import { classifyBarkWithML } from "@/lib/mlBarkClassifier";

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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useContinuousListening() {
  const [listening, setListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [emotionLogs, setEmotionLogs] = useState<EmotionLog[]>([]);
  const [sessionLogs, setSessionLogs] = useState<EmotionLog[]>([]);
  const [latestEmotion, setLatestEmotion] = useState<EmotionKey | null>(null);
  const [latestConfidence, setLatestConfidence] = useState<number>(0);
  const [latestSeverity, setLatestSeverity] = useState<string>("normal");
  const [secondsActive, setSecondsActive] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("emotion_logs");
    if (stored) {
      try { setEmotionLogs(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const saveLog = useCallback((emotion: EmotionKey, confidence: number, note?: string) => {
    const log: EmotionLog = { emotion, confidence, note, created_at: new Date().toISOString() };
    setEmotionLogs((prev) => {
      const updated = [log, ...prev];
      localStorage.setItem("emotion_logs", JSON.stringify(updated));
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
    if (!streamRef.current || !activeRef.current) {
      console.log("[BarkSense] Cannot start chunk: stream=", !!streamRef.current, "active=", activeRef.current);
      return;
    }
    console.log("[BarkSense] Starting 4s chunk recording...");
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      if (!activeRef.current) return;
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      console.log("[BarkSense] Chunk recorded, size:", blob.size, "bytes");
      analyzeChunk(blob, CHUNK_DURATION / 1000);
      // Schedule next chunk with a small delay to prevent infinite recursion
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

  const [micError, setMicError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    setMicError(null);
    try {
      console.log("[BarkSense] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 } 
      });
      console.log("[BarkSense] Microphone access granted, tracks:", stream.getAudioTracks().length);
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
      console.error("[BarkSense] Microphone access failed:", err);
      const msg = err?.name === "NotAllowedError" 
        ? "Microphone permission denied. Please allow mic access and try again."
        : err?.name === "NotFoundError"
        ? "No microphone found on this device."
        : `Microphone error: ${err?.message || "Unknown"}`;
      setMicError(msg);
    }
  }, [startChunkRecording]);

  const stopListening = useCallback(() => {
    console.log("[BarkSense] Stopping listening...");
    activeRef.current = false;
    setListening(false);
    
    // Stop current recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("[BarkSense] Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    console.log("[BarkSense] Listening stopped successfully");
  }, []);

  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { listening, analyzing, emotionLogs, sessionLogs, latestEmotion, latestConfidence, latestSeverity, secondsActive, startListening, stopListening, saveLog, setEmotionLogs, micError };
}
