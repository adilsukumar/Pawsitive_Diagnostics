import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Radio, Square, AlertTriangle, Bluetooth } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { addScanRecord } from "@/lib/scanHistory";
import { extractAudioFeatures } from "@/lib/audioFeatureExtractor";
import { classifyBarkWithML } from "@/lib/mlBarkClassifier";
import CurrentEmotionDisplay from "@/components/CurrentEmotionDisplay";
import EmotionTracker from "@/components/EmotionTracker";
import EmotionBreakdownChart from "@/components/EmotionBreakdownChart";
import WeeklyEmotionTrends from "@/components/WeeklyEmotionTrends";
import BarkHistory from "@/components/BarkHistory";
import { useContinuousListening, type EmotionKey } from "@/hooks/sensorHooks";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import LiveSensorPanel from "@/components/LiveSensorPanel";
import MLModelStatus from "@/components/MLModelStatus";
import SOSAlert from "@/components/SOSAlert";

const emotionMap: Record<string, EmotionKey> = {
  happy: "happy", excited: "happy", calm: "happy", playful: "happy", content: "happy",
  pain: "pain", distressed: "pain", hurt: "pain",
  sad: "sad", lonely: "sad", whimpering: "sad",
  afraid: "afraid", scared: "afraid", fearful: "afraid", anxious: "afraid", nervous: "afraid",
  angry: "angry", aggressive: "angry", territorial: "angry", frustrated: "angry",
};

const BarkSense = () => {
  const { toast } = useToast();
  const {
    listening, analyzing: autoAnalyzing, emotionLogs, sessionLogs, latestEmotion,
    latestConfidence, latestSeverity,
    secondsActive, startListening, stopListening, saveLog, setEmotionLogs, micError,
  } = useContinuousListening();
  const sensorData = useGlobalSensorData();

  const [manualMode, setManualMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // SOS Alert State
  const [showSOS, setShowSOS] = useState(false);
  const [sosEmotion, setSOSEmotion] = useState<EmotionKey | null>(null);
  const [sosConfidence, setSosConfidence] = useState(0);
  const lastSOSRef = useRef<number>(0);

  // SOS Detection - triggers on high confidence critical emotions
  useEffect(() => {
    if (!latestEmotion || !latestConfidence) return;
    
    const isCritical = ["pain", "sad", "angry"].includes(latestEmotion);
    const isHighAlert = ["afraid", "happy"].includes(latestEmotion);
    const threshold = isCritical ? 70 : 80;
    
    if (latestConfidence >= threshold && (isCritical || isHighAlert)) {
      const now = Date.now();
      // Prevent spam - only show SOS once every 30 seconds
      if (now - lastSOSRef.current > 30000) {
        lastSOSRef.current = now;
        setSOSEmotion(latestEmotion);
        setSosConfidence(latestConfidence);
        setShowSOS(true);
      }
    }
  }, [latestEmotion, latestConfidence]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleStartListening = () => {
    sensorData.startMonitoring();
    // Start mic recording (may fail silently in some browsers - collar sensors still work)
    startListening();
    toast({ title: "🎙️ 24/7 Collar Monitoring started", description: "Collar sensors active · Emotion analysis from bark spikes" });
  };

  // Show mic error as toast
  const prevMicError = useRef<string | null>(null);
  if (micError && micError !== prevMicError.current) {
    prevMicError.current = micError;
    toast({ title: "🎤 Microphone Error", description: micError + " Using collar sensors for emotion detection instead.", variant: "destructive" });
  }

  // --- Bark-spike triggered emotion analysis (ONLY when mic is NOT available) ---
  const lastSpikeAnalysisRef = useRef<number>(0);
  const spikeAnalyzingRef = useRef(false);

  const analyzeBarkSpike = useCallback(async (spikeLevel: number) => {
    if (spikeAnalyzingRef.current) return;
    spikeAnalyzingRef.current = true;
    try {
      // Simple rule-based classification for bark spikes
      let emotion: EmotionKey = 'normal';
      let confidence = 70;
      
      if (spikeLevel > 500) {
        emotion = 'pain';
        confidence = 85;
      } else if (spikeLevel > 400) {
        emotion = 'angry';
        confidence = 80;
      } else if (spikeLevel > 300) {
        emotion = 'afraid';
        confidence = 75;
      } else if (spikeLevel > 200) {
        emotion = 'happy';
        confidence = 70;
      }
      
      saveLog(emotion, confidence, `Bark spike: ${spikeLevel}`);
    } catch (e) {
      console.error("[BarkSense] Spike analysis failed:", e);
    } finally {
      spikeAnalyzingRef.current = false;
    }
  }, [saveLog]);

  // Watch collar bark spikes — ONLY trigger text-based analysis when mic is NOT listening
  // When mic is active, the audio-based analysis in useContinuousListening handles classification
  useEffect(() => {
    // Skip spike-based analysis entirely when microphone is active (audio analysis is more accurate)
    if (listening) return;

    if (!sensorData.connected || !sensorData.latest) return;
    const spike = sensorData.latest.bark_spike ?? 0;
    if (spike < 50) return;

    const now = Date.now();
    if (now - lastSpikeAnalysisRef.current < 10_000) return;
    lastSpikeAnalysisRef.current = now;

    analyzeBarkSpike(spike);
  }, [sensorData.latest, sensorData.connected, analyzeBarkSpike, listening]);

  const handleStopListening = () => {
    // Stop both sensor monitoring and continuous listening
    sensorData.stopMonitoring();
    stopListening();
    toast({ 
      title: "⏹️ All monitoring stopped", 
      description: `Monitored for ${formatTime(sensorData.secondsActive)}` 
    });
  };

  const notifyEmotion = (emotion: EmotionKey) => {
    const notifications: Record<EmotionKey, { title: string; description: string; variant?: "destructive" }> = {
      normal: { title: "🐕 Your dog is calm", description: "No significant vocalizations detected." },
      happy: { title: "🎉 Ooo la la! Doggy is having a happy day!", description: "Your pup is feeling great right now!" },
      pain: { title: "⚠️ Your dog may be in pain", description: "Check for injuries or discomfort immediately.", variant: "destructive" },
      sad: { title: "💙 Your dog seems a bit down", description: "Try some gentle play or cuddles." },
      afraid: { title: "😨 Your dog seems afraid", description: "Check for stressors and provide a safe space." },
      angry: { title: "😤 Your dog seems agitated", description: "Remove triggers and use calming techniques." },
    };
    toast(notifications[emotion]);
  };

  const startRecording = async () => {
    if (listening) stopListening();
    setManualMode(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      setResult(null);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const analyzeAudio = async () => {
    setAnalyzing(true);
    try {
      const features = audioBlob ? await extractAudioFeatures(audioBlob) : null;
      if (!features) throw new Error('Failed to extract audio features');
      
      const data = await classifyBarkWithML(features);
      setResult(data);

      const rawEmotion = (data.emotional_state || "").toLowerCase();
      const mapped = emotionMap[rawEmotion] || "happy";
      saveLog(mapped, data.confidence || 70, data.detailed_analysis?.slice(0, 80));
      notifyEmotion(mapped);

      addScanRecord({
        sensor_type: "bark",
        health_score: data.health_score ?? null,
        severity: data.severity ?? null,
        emotional_state: data.emotional_state ?? null,
        summary: data.summary ?? data.detailed_analysis?.slice(0, 100) ?? null,
      });
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setResult(null); setAudioBlob(null); setSeconds(0); setManualMode(false); };


  const handleTestSOS = () => {
    saveLog("pain", 90, "⚠️ TEST: Simulated severe pain detection");
    toast({ title: "🚨 SOS Test Triggered", description: "Simulating severe pain at 90% confidence", variant: "destructive" });
  };

  const emotionStyles: Record<string, { color: string }> = {
    happy: { color: "gradient-bark" },
    pain: { color: "gradient-skin" },
    sad: { color: "gradient-poop" },
    afraid: { color: "gradient-primary" },
    angry: { color: "bg-destructive" },
  };

  return (
    <AppLayout title="BarkSense" showBack>
      {/* SOS Alert Overlay */}
      <AnimatePresence>
        {showSOS && sosEmotion && (
          <SOSAlert
            emotion={sosEmotion}
            confidence={sosConfidence}
            onDismiss={() => setShowSOS(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5 min-h-full overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="text-center space-y-3"
        >
          <div className="w-16 h-16 rounded-2xl gradient-bark flex items-center justify-center mx-auto shadow-glow-sm">
            <Mic className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground tracking-tight">Bark Emotion Detector</h2>
          <p className="text-muted-foreground text-sm font-body">Continuous vocal analysis & mood detection</p>
        </motion.div>
        
        {/* ML Model Status Indicator */}
        {sensorData.bleConnected && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
            <MLModelStatus />
          </motion.div>
        )}
        
        {/* Collar Not Connected Gate */}
        {!sensorData.bleConnected && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 text-center space-y-4">
            <Bluetooth className="w-10 h-10 text-muted-foreground mx-auto" strokeWidth={1.5} />
            <div>
              <p className="font-display font-semibold text-foreground text-sm tracking-tight">Collar Not Connected</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Connect your ESP32-C3 Smart Collar via Bluetooth first to enable bark emotion detection.
              </p>
            </div>
            <Link to="/collar">
              <Button className="gradient-primary text-primary-foreground rounded-xl h-11 px-8 font-body shadow-glow-sm">
                <Bluetooth className="w-4 h-4 mr-2" /> Connect Collar
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Continuous Listening Toggle */}
        {sensorData.bleConnected && !manualMode && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
            <div className={`glass rounded-2xl p-5 text-center relative overflow-hidden ${sensorData.connected ? "ring-2 ring-primary/30" : ""}`}>
              {sensorData.connected && (
                <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at center, hsl(var(--primary) / 0.4), transparent 70%)" }} />
              )}
              <div className="relative z-10 space-y-4">
                {sensorData.connected ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-3 h-3 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-sm font-display font-semibold text-primary">Collar Live</span>
                      {sensorData.latest && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 text-primary">
                          {formatTime(sensorData.secondsActive)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-0.5 items-end h-6 justify-center">
                      {[...Array(12)].map((_, i) => (
                        <motion.div key={i} className="w-1 rounded-full bg-primary/60"
                          animate={{ height: [4, 16, 6, 20, 8, 14, 4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      Active for {formatTime(sensorData.secondsActive)} · ESP32 collar sensors
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleStopListening} variant="outline"
                        className="rounded-xl h-10 px-5 btn-squishy font-body border-destructive/30 text-destructive hover:bg-destructive/10">
                        <Square className="w-4 h-4 mr-2" /> Stop
                      </Button>
                      <Button onClick={handleTestSOS} variant="outline"
                        className="rounded-xl h-10 px-5 btn-squishy font-body border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Test SOS
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Radio className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm tracking-tight">Continuous Monitoring</p>
                      <p className="text-xs text-muted-foreground font-body mt-1">
                        Records & analyzes your dog's barks automatically every 8 seconds
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <Button onClick={handleStartListening}
                        className="gradient-bark text-white rounded-xl h-11 px-8 btn-squishy font-body shadow-glow-sm w-full max-w-xs">
                        <Mic className="w-4 h-4 mr-2" /> Start 24/7 Listening
                      </Button>
                      <div className="flex gap-2">
                        <button onClick={handleTestSOS}
                          className="text-xs text-rose-500 font-body underline underline-offset-2 hover:text-rose-400 transition-colors">
                          Test SOS
                        </button>
                        <span className="text-muted-foreground">·</span>
                        <button onClick={() => setManualMode(true)}
                          className="text-xs text-muted-foreground font-body underline underline-offset-2 hover:text-foreground transition-colors">
                          Manual mode
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Current Emotion - Big & Bold - shown right after listening controls */}
        {sensorData.bleConnected && !manualMode && (sensorData.connected || listening) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CurrentEmotionDisplay emotion={latestEmotion} confidence={latestConfidence} severity={latestSeverity} />
          </motion.div>
        )}

        {/* Live Emotion Breakdown Chart */}
        {sensorData.bleConnected && !manualMode && (sensorData.connected || listening) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <EmotionBreakdownChart logs={sessionLogs} listening={listening} analyzing={autoAnalyzing} />
          </motion.div>
        )}

        {/* Emotion Tracker (Timeline) - shown when monitoring */}
        {sensorData.bleConnected && !manualMode && (sensorData.connected || listening) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <EmotionTracker logs={emotionLogs} latestEmotion={latestEmotion} />
          </motion.div>
        )}

        {/* Manual Recording Mode - Same position as 24/7 listening */}
        <AnimatePresence mode="wait">
          {sensorData.bleConnected && manualMode && !audioBlob && !result && (
            <motion.div key="recorder" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }} className="space-y-6">
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  {recording && (
                    <>
                      <motion.div className="absolute inset-0 rounded-full border-2 border-glow-amber/40" animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                      <motion.div className="absolute inset-0 rounded-full border-2 border-glow-amber/30" animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
                    </>
                  )}
                  <motion.button onClick={recording ? stopRecording : startRecording} whileTap={{ scale: 0.92 }}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lifted ${recording ? "bg-destructive animate-glow-pulse" : "gradient-bark shadow-glow"}`}>
                    {recording ? <MicOff className="w-10 h-10 text-white" strokeWidth={2} /> : <Mic className="w-10 h-10 text-white" strokeWidth={2} />}
                  </motion.button>
                </div>
                <div className="text-center">
                  <p className="text-foreground font-display font-semibold text-lg tracking-tight">
                    {recording ? `Recording · ${seconds}s` : "Tap to Record"}
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-1">
                    {recording ? "Tap again to stop" : "Hold your device near your dog"}
                  </p>
                </div>
                {recording && (
                  <div className="flex gap-1 items-end h-8">
                    {[...Array(9)].map((_, i) => (
                      <motion.div key={i} className="w-1.5 rounded-full bg-glow-amber" animate={{ height: [6, 24, 10, 28, 14, 20, 8] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06 }} />
                    ))}
                  </div>
                )}
                {!recording && (
                  <button onClick={reset} className="text-xs text-muted-foreground font-body underline underline-offset-2 hover:text-foreground transition-colors">
                    Back to continuous mode
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {sensorData.bleConnected && manualMode && audioBlob && !result && !analyzing && (
            <motion.div key="preview" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }} className="space-y-4">
              <div className="glass rounded-2xl p-5 text-center">
                <p className="text-foreground font-display font-semibold mb-3 text-sm">Recording captured · {seconds}s</p>
                <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl flex-1 h-11 btn-squishy font-body border-border" onClick={reset}>Re-record</Button>
                <Button className="gradient-primary text-primary-foreground rounded-xl flex-1 h-11 btn-squishy font-body shadow-glow-sm" onClick={analyzeAudio}>Analyze</Button>
              </div>
            </motion.div>
          )}

          {analyzing && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <motion.div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                <motion.div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-glow-amber border-b-transparent border-l-transparent" animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary animate-pulse-soft" strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground tracking-tight">Analyzing audio patterns...</h3>
              <p className="text-muted-foreground text-sm font-body">ML is processing vocal signatures</p>
              <Progress value={65} className="max-w-xs mx-auto" />
            </motion.div>
          )}

          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }} className="space-y-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="glass rounded-2xl p-6 text-center space-y-3">
                <Badge className={`${emotionStyles[result.emotional_state?.toLowerCase()]?.color || "gradient-primary"} text-white text-base px-5 py-1.5 rounded-xl font-display shadow-glow-sm`}>
                  {result.emotional_state || "Unknown"}
                </Badge>
                {result.confidence && <p className="text-sm text-muted-foreground font-body">Confidence: {result.confidence}%</p>}
              </motion.div>
              <div className="glass rounded-2xl p-5">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 tracking-tight">Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{result.detailed_analysis || result.summary || "No detailed analysis available."}</p>
              </div>
              {result.health_score !== undefined && (
                <div className="glass rounded-2xl p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1 font-body uppercase tracking-wider">Health Score</p>
                  <span className="text-3xl font-display font-bold text-gradient">{result.health_score}</span>
                  <span className="text-lg text-muted-foreground font-display">/100</span>
                  <Progress value={result.health_score} className="mt-3" />
                </div>
              )}
              {result.recommendations?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="font-display font-semibold text-foreground text-sm mb-3 tracking-tight">Recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2 font-body"><span className="text-primary text-xs mt-1">●</span> {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={reset} className="w-full gradient-primary text-primary-foreground rounded-xl h-11 btn-squishy font-body shadow-glow-sm">New Recording</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Collar Sensor Data - shown inline when monitoring */}
        {sensorData.bleConnected && sensorData.connected && sensorData.latest && (
          <LiveSensorPanel
            connected={sensorData.connected}
            secondsActive={sensorData.secondsActive}
            latest={sensorData.latest}
            readings={sensorData.readings}
            onStart={sensorData.startMonitoring}
            onStop={sensorData.stopMonitoring}
            sensorType="bark"
            gradient="gradient-bark"
          />
        )}

        {/* Weekly Trends */}
        {sensorData.bleConnected && <WeeklyEmotionTrends logs={emotionLogs} />}

        {/* Bark History */}
        {sensorData.bleConnected && <BarkHistory logs={emotionLogs} />}
      </div>
    </AppLayout>
  );
};

export default BarkSense;
