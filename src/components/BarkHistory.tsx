import { motion } from "framer-motion";
import { Clock, Volume2 } from "lucide-react";
import type { EmotionKey, EmotionLog } from "@/hooks/useContinuousListening";

const emotionConfig: Record<EmotionKey, { emoji: string; color: string; bgLight: string }> = {
  normal: { emoji: "🐕", color: "text-muted-foreground", bgLight: "bg-muted/30" },
  happy: { emoji: "😊", color: "text-amber-500", bgLight: "bg-amber-500/10" },
  pain: { emoji: "🩹", color: "text-rose-500", bgLight: "bg-rose-500/10" },
  sad: { emoji: "😢", color: "text-blue-500", bgLight: "bg-blue-500/10" },
  afraid: { emoji: "😨", color: "text-purple-500", bgLight: "bg-purple-500/10" },
  angry: { emoji: "😤", color: "text-red-600", bgLight: "bg-red-600/10" },
};

interface Props {
  logs: EmotionLog[];
}

const BarkHistory = ({ logs }: Props) => {
  // Group logs by date
  const grouped: Record<string, EmotionLog[]> = {};
  logs.slice(0, 50).forEach((log) => {
    const date = log.created_at.split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr + "T00:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  if (logs.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" strokeWidth={2} />
        <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">Bark History</h3>
        <span className="text-[10px] text-muted-foreground font-body ml-auto">{logs.length} detections</span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {dateKeys.map((date) => (
          <div key={date}>
            <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
              {formatDate(date)}
            </p>
            <div className="space-y-1">
              {grouped[date].map((log, i) => {
                const cfg = emotionConfig[log.emotion];
                const time = new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                return (
                  <motion.div
                    key={`${date}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 ${cfg.bgLight}`}
                  >
                    <Volume2 className={`w-3 h-3 ${cfg.color} shrink-0`} strokeWidth={2} />
                    <span className="text-sm shrink-0">{cfg.emoji}</span>
                    <span className={`text-xs font-body font-semibold capitalize shrink-0 ${cfg.color}`}>{log.emotion}</span>
                    <span className="text-[10px] text-muted-foreground font-body">{log.confidence}%</span>
                    {log.note && <span className="text-[10px] text-muted-foreground font-body truncate flex-1 min-w-0">{log.note}</span>}
                    <span className="text-[10px] text-muted-foreground font-body ml-auto shrink-0">{time}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarkHistory;
