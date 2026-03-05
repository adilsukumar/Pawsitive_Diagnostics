import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loadBarkModel } from "@/lib/mlBarkClassifier";

export default function MLModelStatus() {
  const [modelStatus, setModelStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [accuracy, setAccuracy] = useState(82.93);

  useEffect(() => {
    checkModel();
    const interval = setInterval(checkModel, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkModel = async () => {
    const isLoaded = await loadBarkModel();
    setModelStatus(isLoaded ? "connected" : "offline");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-3 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Brain className={`w-5 h-5 ${modelStatus === "connected" ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />
          {modelStatus === "checking" && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-semibold text-foreground">ML Model</span>
            {modelStatus === "connected" ? (
              <Wifi className="w-3 h-3 text-primary" />
            ) : modelStatus === "offline" ? (
              <WifiOff className="w-3 h-3 text-muted-foreground" />
            ) : null}
          </div>
          <p className="text-[10px] text-muted-foreground font-body">
            {modelStatus === "checking" && "Connecting..."}
            {modelStatus === "connected" && `Live · ${accuracy}% accuracy`}
            {modelStatus === "offline" && "Demo mode"}
          </p>
        </div>
      </div>
      <Badge
        variant={modelStatus === "connected" ? "default" : "outline"}
        className={`text-[10px] px-2 py-0.5 ${
          modelStatus === "connected"
            ? "gradient-bark text-white"
            : "border-muted-foreground/30 text-muted-foreground"
        }`}
      >
        {modelStatus === "checking" && "..."}
        {modelStatus === "connected" && "ACTIVE"}
        {modelStatus === "offline" && "FALLBACK"}
      </Badge>
    </motion.div>
  );
}
