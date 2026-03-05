import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SOSAlertProps {
  emotion: string;
  confidence: number;
  onDismiss: () => void;
}

const EMERGENCY_NUMBER = "1962";

export default function SOSAlert({ emotion, confidence, onDismiss }: SOSAlertProps) {
  const [shake, setShake] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShake(prev => prev + 1);
    }, 500);
    
    // Auto vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    return () => clearInterval(interval);
  }, []);

  const isCritical = emotion === "pain" || emotion === "sad" || emotion === "angry";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ 
        background: isCritical 
          ? "radial-gradient(circle, rgba(220, 38, 38, 0.95) 0%, rgba(127, 29, 29, 0.98) 100%)"
          : "radial-gradient(circle, rgba(251, 146, 60, 0.95) 0%, rgba(194, 65, 12, 0.98) 100%)"
      }}
    >
      {/* Pulsing background rings */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className={`absolute inset-0 rounded-full border-8 ${
          isCritical ? "border-red-300" : "border-orange-300"
        }`} />
      </motion.div>

      <motion.div
        key={shake}
        animate={{
          rotate: [0, -5, 5, -5, 5, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        <div className="glass-strong rounded-3xl p-8 text-center space-y-6 shadow-lifted relative overflow-hidden">
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Alert icon */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative mx-auto"
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              isCritical 
                ? "bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.8)]" 
                : "bg-orange-500 shadow-[0_0_60px_rgba(251,146,60,0.8)]"
            }`}>
              <AlertTriangle className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            
            {/* Pulsing rings */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute inset-0 rounded-full border-4 ${
                  isCritical ? "border-red-300" : "border-orange-300"
                }`}
                animate={{
                  scale: [1, 2, 2],
                  opacity: [0.8, 0, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
          </motion.div>

          {/* Alert text */}
          <div className="space-y-2 relative z-10">
            <motion.h2
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-3xl font-display font-black text-white tracking-tight"
            >
              {isCritical ? "🚨 SOS ALERT!" : "⚠️ HIGH ALERT!"}
            </motion.h2>
            <p className="text-white/90 font-display font-semibold text-lg">
              Your dog shows signs of
            </p>
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-2xl font-display font-black text-white uppercase tracking-wide"
            >
              {emotion === "pain" && "SEVERE PAIN"}
              {emotion === "sad" && "EXTREME SADNESS"}
              {emotion === "angry" && "HIGH AGGRESSION"}
              {emotion === "afraid" && "INTENSE FEAR"}
              {emotion === "happy" && "EXCESSIVE EXCITEMENT"}
            </motion.p>
            <p className="text-white/80 font-body text-sm">
              Confidence: {confidence}%
            </p>
          </div>

          {/* Emergency actions */}
          <div className="space-y-3 relative z-10">
            {isCritical && (
              <>
                <motion.a
                  href={`tel:${EMERGENCY_NUMBER}`}
                  whileTap={{ scale: 0.95 }}
                  className="block w-full bg-white text-red-600 py-4 rounded-2xl font-display font-black text-lg shadow-lifted btn-squishy flex items-center justify-center gap-2"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255,255,255,0.5)",
                      "0 0 40px rgba(255,255,255,0.8)",
                      "0 0 20px rgba(255,255,255,0.5)",
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Phone className="w-6 h-6" />
                  CALL VET NOW
                </motion.a>
                <p className="text-white/90 font-body text-sm font-semibold">
                  Emergency: {EMERGENCY_NUMBER}
                </p>
              </>
            )}
            
            <button
              onClick={onDismiss}
              className="w-full bg-white/20 backdrop-blur text-white py-3 rounded-2xl font-display font-bold btn-squishy"
            >
              I'm Checking On My Dog
            </button>
          </div>

          {/* Warning message */}
          {isCritical && (
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/90 font-body text-xs leading-relaxed relative z-10"
            >
              ⚠️ Immediate attention required. Check for injuries, provide comfort, and contact your veterinarian.
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
