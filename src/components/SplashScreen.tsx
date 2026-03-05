import { motion, AnimatePresence } from "framer-motion";
import { PawPrint } from "lucide-react";
import splashDog from "@/assets/splash-dog.jpg";

const SplashScreen = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Mesh gradient background */}
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Glow ring behind image */}
        <motion.div
          className="absolute w-52 h-52 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(170 80% 45% / 0.25), transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Dog photo */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 150, damping: 15 }}
        >
          <img
            src={splashDog}
            alt="Dog"
            className="w-36 h-36 rounded-full object-cover shadow-glow ring-2 ring-primary/30"
          />
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="relative z-10 mt-8 w-32 h-1 rounded-full bg-secondary overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full rounded-full gradient-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.div>

        {/* App name */}
        <motion.div
          className="relative z-10 mt-6 flex items-center gap-2.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src="/logo.png?v=2" alt="Pawsitive" className="w-8 h-8 object-contain" />
          <span className="text-2xl font-display font-bold text-foreground tracking-tight">Pawsitive</span>
        </motion.div>
        <motion.p
          className="relative z-10 text-xs text-muted-foreground font-body mt-1 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ML Pet Health
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SplashScreen;
