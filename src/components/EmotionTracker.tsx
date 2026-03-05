import { motion } from "framer-motion";
import { SmilePlus, Frown, AlertTriangle, Heart, Flame } from "lucide-react";
import type { EmotionKey, EmotionLog } from "@/hooks/useContinuousListening";

const emotions = [
  { key: "normal" as EmotionKey, label: "Normal", emoji: "🐕", icon: SmilePlus, color: "bg-muted", textColor: "text-muted-foreground", bgLight: "bg-muted/30" },
  { key: "happy" as EmotionKey, label: "Happy", emoji: "😊", icon: SmilePlus, color: "bg-amber-500", textColor: "text-amber-500", bgLight: "bg-amber-500/10" },
  { key: "pain" as EmotionKey, label: "Pain", emoji: "🩹", icon: Heart, color: "bg-rose-500", textColor: "text-rose-500", bgLight: "bg-rose-500/10" },
  { key: "sad" as EmotionKey, label: "Sad", emoji: "😢", icon: Frown, color: "bg-blue-500", textColor: "text-blue-500", bgLight: "bg-blue-500/10" },
  { key: "afraid" as EmotionKey, label: "Afraid", emoji: "😨", icon: AlertTriangle, color: "bg-purple-500", textColor: "text-purple-500", bgLight: "bg-purple-500/10" },
  { key: "angry" as EmotionKey, label: "Angry", emoji: "😤", icon: Flame, color: "bg-red-600", textColor: "text-red-600", bgLight: "bg-red-600/10" },
] as const;

interface EmotionTrackerProps {
  logs: EmotionLog[];
  latestEmotion?: EmotionKey | null;
}

const EmotionTracker = ({ logs, latestEmotion }: EmotionTrackerProps) => {
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.created_at.startsWith(today));
  const emotionCounts: Record<string, number> = {};
  todayLogs.forEach((l) => { emotionCounts[l.emotion] = (emotionCounts[l.emotion] || 0) + 1; });
  const total = todayLogs.length || 1;

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display font-semibold text-foreground text-sm tracking-tight mb-3">
          Today's Emotion Timeline
        </h3>

        {todayLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">
            No emotion data yet. Start listening to track your dog's mood!
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {emotions.map((e) => {
                const count = emotionCounts[e.key] || 0;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={e.key} className="flex items-center gap-1.5">
                    <span className="text-xs w-4 shrink-0">{e.emoji}</span>
                    <span className="text-[10px] font-body text-muted-foreground w-12 shrink-0 truncate">{e.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-0">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${e.color}`}
                      />
                    </div>
                    <span className="text-[10px] font-body text-muted-foreground w-7 text-right shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto">
              {todayLogs.slice(0, 10).map((log, i) => {
                const emo = emotions.find((e) => e.key === log.emotion);
                const time = new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={i} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 min-w-0 ${emo?.bgLight || "bg-muted"}`}>
                    <span className="text-xs shrink-0">{emo?.emoji}</span>
                    <span className={`text-[10px] font-body font-medium shrink-0 ${emo?.textColor || "text-foreground"}`}>{emo?.label}</span>
                    {log.note && <span className="text-[10px] text-muted-foreground font-body truncate flex-1 min-w-0">{log.note}</span>}
                    <span className="text-[10px] text-muted-foreground font-body ml-auto shrink-0">{time}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {latestEmotion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass rounded-2xl p-4 text-center ${emotions.find((e) => e.key === latestEmotion)?.bgLight}`}
        >
          <span className="text-3xl">{emotions.find((e) => e.key === latestEmotion)?.emoji}</span>
          <p className="font-display font-bold text-foreground text-sm mt-1 tracking-tight">
            Your dog seems {latestEmotion}!
          </p>
          <p className="text-[10px] text-muted-foreground font-body mt-0.5">Just detected</p>
        </motion.div>
      )}
    </div>
  );
};

export { emotions };
export default EmotionTracker;
