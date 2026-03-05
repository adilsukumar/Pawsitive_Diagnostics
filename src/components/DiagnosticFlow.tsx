import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, AlertTriangle, Camera, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { addScanRecord } from "@/lib/scanHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { classifyBarkEmotion } from "@/lib/mlBarkClassifier";
import { analyzeSkinCondition } from "@/lib/mlSkinClassifier";
import { analyzeSkinWithTF } from "@/lib/tfSkinClassifier";
import { analyzeGutHealth } from "@/lib/mlGutAnalyzer";
import { extractAudioFeatures } from "@/lib/audioFeatureExtractor";

interface DiagnosticFlowProps {
  sensorType: "bark" | "skin" | "poop";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  captureLabel: string;
  descriptionPlaceholder: string;
}

const severityColors: Record<string, string> = {
  normal: "gradient-primary text-white",
  mild: "bg-glow-amber/20 text-glow-amber border border-glow-amber/30",
  moderate: "bg-glow-rose/20 text-glow-rose border border-glow-rose/30",
  severe: "bg-destructive/20 text-destructive border border-destructive/30",
};

const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  exit: { opacity: 0, y: -16 },
};

const DiagnosticFlow = ({ sensorType, title, subtitle, icon, color, captureLabel, descriptionPlaceholder }: DiagnosticFlowProps) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setStep(2);
  };

  const fetchReferenceImage = async (condition: string, userDescription?: string) => {
    // Reference images disabled - using local ML only
    setLoadingRef(false);
  };

  const analyze = async () => {
    setAnalyzing(true);
    setStep(3);
    setReferenceImage(null);
    try {
      let data: any;
      
      if (sensorType === "bark" && file) {
        const features = await extractAudioFeatures(file);
        data = classifyBarkEmotion(features);
      } else if (sensorType === "skin") {
        let image_base64: string | undefined;
        if (file) {
          const reader = new FileReader();
          image_base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(file);
          });
        }
        // Try TensorFlow.js first, fallback to rule-based
        try {
          data = await analyzeSkinWithTF(image_base64, description);
        } catch (e) {
          console.log('TensorFlow failed, using rule-based:', e);
          data = await analyzeSkinCondition(image_base64, description);
        }
      } else if (sensorType === "poop") {
        let image_base64: string | undefined;
        if (file) {
          const reader = new FileReader();
          image_base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.readAsDataURL(file);
          });
        }
        data = await analyzeGutHealth(image_base64, description);
      } else {
        throw new Error("Invalid sensor type or missing data");
      }
      
      setResult(data);
      addScanRecord({
        sensor_type: sensorType,
        health_score: data.health_score ?? null,
        severity: data.severity ?? null,
        emotional_state: data.emotional_state ?? null,
        summary: data.summary ?? data.detailed_analysis?.slice(0, 100) ?? null,
      });

      if (sensorType === "skin" && data.primary_condition) {
        fetchReferenceImage(data.primary_condition, description);
      }
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => { setStep(1); setFile(null); setPreview(null); setDescription(""); setResult(null); setReferenceImage(null); setLoadingRef(false); };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div
              animate={step >= s ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-semibold text-sm transition-all ${
                step >= s ? `${color} text-white shadow-glow-sm` : "glass text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" strokeWidth={2} /> : s}
            </motion.div>
            {s < 3 && <div className={`w-10 h-0.5 rounded-full transition-colors ${step > s ? "gradient-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" {...slideUp} className="text-center space-y-5">
            <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">{captureLabel}</h2>
            <p className="text-muted-foreground font-body text-sm">{subtitle}</p>

            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRef.current?.click()}
              className="glass rounded-2xl p-10 cursor-pointer hover:border-primary/40 transition-all btn-squishy relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "radial-gradient(circle at center, hsl(170 80% 45% / 0.05), transparent)" }} />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-muted-foreground font-body text-sm">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground/60 mt-1 font-body">{sensorType === "bark" ? "WAV, MP3, M4A" : "JPG, PNG, HEIC"}</p>
            </motion.div>
            <input ref={fileRef} type="file" className="hidden" accept={sensorType === "bark" ? "audio/*" : "image/*"} onChange={handleFileSelect} />

            {sensorType !== "bark" && (
              <Button variant="outline" className="rounded-xl btn-squishy font-body border-border" onClick={() => fileRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" strokeWidth={2} /> Use Camera
              </Button>
            )}

            <div className="pt-3">
              <p className="text-xs text-muted-foreground mb-2 font-body uppercase tracking-wider">Or describe symptoms</p>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={descriptionPlaceholder} className="rounded-xl glass border-glass-border font-body" />
              {description && (
                <Button onClick={() => setStep(2)} className="mt-3 gradient-primary text-primary-foreground rounded-xl btn-squishy font-body shadow-glow-sm">
                  Continue
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" {...slideUp} className="space-y-5">
            <h2 className="text-xl font-display font-bold text-foreground text-center tracking-tight">Review & Analyze</h2>
            {preview && (
              <div className="rounded-2xl overflow-hidden glass max-h-72 flex items-center justify-center">
                {sensorType === "bark" ? (
                  <audio src={preview} controls className="w-full p-4" />
                ) : (
                  <img src={preview} alt="Upload preview" className="max-h-72 object-contain" />
                )}
              </div>
            )}
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional notes..." className="rounded-xl glass border-glass-border font-body" />
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl flex-1 h-11 btn-squishy font-body border-border" onClick={reset}>Back</Button>
              <Button className="gradient-primary text-primary-foreground rounded-xl flex-1 h-11 btn-squishy shadow-glow-sm font-body" onClick={analyze}>
                Run Analysis
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" {...slideUp} className="space-y-5">
            {analyzing ? (
              <div className="text-center py-16 space-y-5">
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-glow-purple border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full gradient-primary animate-pulse-soft" />
                  </div>
                </div>
                <h2 className="text-lg font-display font-bold text-foreground tracking-tight">Processing scan data...</h2>
                <p className="text-muted-foreground font-body text-sm">ML model is analyzing your submission</p>
                <Progress value={65} className="max-w-xs mx-auto" />
              </div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h2 className="text-xl font-display font-bold text-foreground mb-3 tracking-tight">Diagnostic Report</h2>
                  <div className="flex items-center justify-center gap-3">
                    <Badge className={`${severityColors[result.severity] || "bg-secondary"} rounded-lg font-body`}>
                      {result.severity?.toUpperCase()}
                    </Badge>
                    <span className="text-2xl font-display font-bold text-gradient">{result.health_score}</span>
                    <span className="text-lg text-muted-foreground font-display">/100</span>
                  </div>
                </div>

                {/* Side-by-side comparison for skin */}
                {sensorType === "skin" && (referenceImage || loadingRef || preview) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-primary" strokeWidth={2} />
                      <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">
                        {preview ? "Visual Comparison" : "Reference Image"}
                      </h3>
                    </div>
                    <div className={`grid ${preview ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                      {/* User's photo */}
                      {preview && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-widest text-center">Your Photo</p>
                          <div className="rounded-xl overflow-hidden border border-border aspect-square bg-secondary/30 flex items-center justify-center">
                            <img src={preview} alt="Your skin photo" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
                      {/* Reference image */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-body font-semibold text-primary uppercase tracking-widest text-center">
                          {result.primary_condition || "Reference"}
                        </p>
                        <div className={`rounded-xl overflow-hidden border border-primary/20 ${preview ? "aspect-square" : "aspect-video max-w-xs mx-auto"} bg-secondary/30 flex items-center justify-center`}>
                          {loadingRef ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <p className="text-[10px] text-muted-foreground font-body">Generating reference...</p>
                            </div>
                          ) : referenceImage ? (
                            <img src={referenceImage} alt={`Reference: ${result.primary_condition}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-3">
                              <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                              <p className="text-[10px] text-muted-foreground font-body">No reference available</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {result.primary_condition && (
                      <p className="text-xs text-muted-foreground font-body text-center mt-1">
                        {preview
                          ? <>Your photo compared with a typical case of <span className="text-foreground font-medium">{result.primary_condition}</span></>
                          : <>Typical appearance of <span className="text-foreground font-medium">{result.primary_condition}</span> on a dog</>
                        }
                      </p>
                    )}
                  </motion.div>
                )}

                <div className="glass rounded-2xl p-5 space-y-3">
                  <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Analysis</h3>
                  <div className="text-muted-foreground text-sm leading-relaxed font-body space-y-3">
                    {(result.detailed_analysis || result.summary || JSON.stringify(result))
                      .split(/\n\n|\n/)
                      .filter((p: string) => p.trim())
                      .map((p: string, i: number) => (
                        <p key={i}>{p.trim()}</p>
                      ))}
                  </div>
                </div>

                {result.emotional_state && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-2 tracking-tight">Emotional State</h3>
                    <Badge className="gradient-primary text-primary-foreground px-4 py-1 rounded-lg font-body">{result.emotional_state}</Badge>
                    {result.confidence && <p className="text-xs text-muted-foreground mt-2 font-body">Confidence: {result.confidence}%</p>}
                  </div>
                )}

                {result.conditions_detected?.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-3 tracking-tight">Conditions Detected</h3>
                    <div className="space-y-2">
                      {result.conditions_detected.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                          <span className="font-body font-medium text-foreground text-sm">{c.name}</span>
                          <span className="text-xs text-muted-foreground font-body">{c.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.color_analysis && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-2 tracking-tight">Color Analysis</h3>
                    <p className="text-foreground font-body text-sm">{result.color_analysis.color} — <span className="text-muted-foreground">{result.color_analysis.indication}</span></p>
                  </div>
                )}

                {result.recommendations?.length > 0 && (
                  <div className="glass rounded-2xl p-5">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-3 tracking-tight">Recommendations</h3>
                    <ul className="space-y-2">
                      {result.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                          <AlertTriangle className="w-3.5 h-3.5 text-glow-amber mt-0.5 shrink-0" strokeWidth={2} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button onClick={reset} className="w-full gradient-primary text-primary-foreground rounded-xl h-11 btn-squishy shadow-glow-sm font-body">
                  New Analysis
                </Button>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticFlow;
