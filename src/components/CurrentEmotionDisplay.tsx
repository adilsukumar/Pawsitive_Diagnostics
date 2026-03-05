import { motion, AnimatePresence } from "framer-motion";
import { Phone } from "lucide-react";
import type { EmotionKey } from "@/hooks/useContinuousListening";

const emotions: Record<EmotionKey, { emoji: string; label: string; bg: string; text: string }> = {
  normal: { emoji: "🐕", label: "Normal", bg: "bg-muted/30", text: "text-muted-foreground" },
  happy: { emoji: "😊", label: "Happy", bg: "bg-amber-500/15", text: "text-amber-500" },
  pain: { emoji: "🩹", label: "In Pain", bg: "bg-rose-500/15", text: "text-rose-500" },
  sad: { emoji: "😢", label: "Sad", bg: "bg-blue-500/15", text: "text-blue-500" },
  afraid: { emoji: "😨", label: "Afraid", bg: "bg-purple-500/15", text: "text-purple-500" },
  angry: { emoji: "😤", label: "Angry", bg: "bg-red-600/15", text: "text-red-600" },
};

interface Props {
  emotion: EmotionKey | null;
  confidence?: number;
  severity?: string;
}

const CurrentEmotionDisplay = ({ emotion, confidence, severity }: Props) => {
  if (!emotion) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-4xl mb-2">🐕</p>
        <p className="font-display font-bold text-lg text-muted-foreground">Waiting for detection...</p>
        <p className="text-xs text-muted-foreground font-body mt-1">Start listening to detect your dog's mood</p>
      </div>
    );
  }

  const cfg = emotions[emotion];
  const isSOS = emotion === "pain" && (confidence && confidence >= 50);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`rounded-2xl p-6 text-center ${cfg.bg} border-2 ${isSOS ? "border-red-500" : "border-transparent"}`}
        >
          <motion.p
            className="text-6xl mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {cfg.emoji}
          </motion.p>
          <p className={`font-display font-black text-3xl tracking-tight ${cfg.text}`}>
            {cfg.label}
          </p>
          {confidence && (
            <p className="text-sm text-muted-foreground font-body mt-1">
              {confidence}% confidence
            </p>
          )}
          <p className="text-[10px] text-muted-foreground font-body mt-1 uppercase tracking-widest">
            Current Mood · Updates every 8s
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Flashing SOS Button */}
      {isSOS && (
        <motion.a
          href="tel:911"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block"
        >
          <motion.div
            animate={{
              backgroundColor: ["hsl(0 84% 50%)", "hsl(0 84% 35%)", "hsl(0 84% 50%)"],
              boxShadow: [
                "0 0 20px 5px rgba(239,68,68,0.5)",
                "0 0 40px 10px rgba(239,68,68,0.8)",
                "0 0 20px 5px rgba(239,68,68,0.5)",
              ],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="rounded-2xl p-4 text-center cursor-pointer"
          >
            <div className="flex items-center justify-center gap-3">
              <Phone className="w-6 h-6 text-white" strokeWidth={2.5} />
              <span className="font-display font-black text-white text-xl tracking-tight">
                🚨 SOS — EMERGENCY VET
              </span>
            </div>
            <p className="text-white/80 text-xs font-body mt-1">
              Severe pain detected! Tap to call emergency vet
            </p>
          </motion.div>
        </motion.a>
      )}
    </div>
  );
};

export default CurrentEmotionDisplay;
