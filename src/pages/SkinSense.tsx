import { useState } from "react";
import { Camera, Bug, AlertCircle, Bluetooth } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DiagnosticFlow from "@/components/DiagnosticFlow";
import AppLayout from "@/components/AppLayout";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import LiveSensorPanel from "@/components/LiveSensorPanel";

const skinIssues = [
  { name: "Ticks", icon: "🪲", severity: "moderate", description: "Small parasites that attach to skin and feed on blood. Can transmit Lyme disease and other infections.", signs: "Visible bumps, redness around bite area, excessive scratching" },
  { name: "Fleas", icon: "🐜", severity: "mild", description: "Tiny jumping parasites causing intense itching. Can lead to flea allergy dermatitis.", signs: "Constant scratching, small dark specks in fur, hair loss" },
  { name: "Mange", icon: "⚠️", severity: "severe", description: "Caused by mites burrowing into the skin. Can be demodectic or sarcoptic (contagious).", signs: "Severe hair loss, crusty skin, intense itching, redness" },
  { name: "Hot Spots", icon: "🔥", severity: "moderate", description: "Moist, red, inflamed areas that develop rapidly from excessive licking or scratching.", signs: "Wet, oozing patches, hair loss around area, pain on touch" },
  { name: "Ringworm", icon: "⭕", severity: "moderate", description: "Fungal infection causing circular patches of hair loss. Contagious to humans.", signs: "Circular bald patches, scaly skin, brittle hair" },
  { name: "Allergic Dermatitis", icon: "💨", severity: "mild", description: "Skin reaction to food, environmental, or contact allergens causing inflammation.", signs: "Red skin, itching, ear infections, licking paws" },
  { name: "Bacterial Infection", icon: "🦠", severity: "moderate", description: "Pyoderma and other bacterial skin infections often secondary to other conditions.", signs: "Pus-filled bumps, crusty skin, odor, redness" },
  { name: "Yeast Infection", icon: "🍄", severity: "mild", description: "Overgrowth of yeast on skin, especially in warm, moist areas.", signs: "Musty odor, greasy coat, dark thickened skin, ear discharge" },
];

const severityColor: Record<string, string> = {
  mild: "bg-glow-amber/20 text-glow-amber border border-glow-amber/30",
  moderate: "bg-glow-rose/20 text-glow-rose border border-glow-rose/30",
  severe: "bg-destructive/20 text-destructive border border-destructive/30",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const SkinSense = () => {
  const [showGuide, setShowGuide] = useState(false);
  const sensorData = useGlobalSensorData();

  return (
    <AppLayout title="SkinSense" showBack>
      <div className="px-4 py-6 space-y-4 min-h-full">
        {/* Header icon */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <div className="w-16 h-16 rounded-2xl gradient-skin flex items-center justify-center mx-auto shadow-glow-sm mb-3">
            <Camera className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
        </motion.div>
        {/* Collar Not Connected Gate */}
        {!sensorData.bleConnected ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 text-center space-y-4">
            <Bluetooth className="w-10 h-10 text-muted-foreground mx-auto" strokeWidth={1.5} />
            <div>
              <p className="font-display font-semibold text-foreground text-sm tracking-tight">Collar Not Connected</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Connect your ESP32-C3 Smart Collar via Bluetooth first to enable skin analysis.
              </p>
            </div>
            <Link to="/collar">
              <Button className="gradient-primary text-primary-foreground rounded-xl h-11 px-8 font-body shadow-glow-sm">
                <Bluetooth className="w-4 h-4 mr-2" /> Connect Collar
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Toggle */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGuide(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all btn-squishy ${!showGuide ? "gradient-skin text-white shadow-glow-sm" : "glass text-muted-foreground"}`}
              >
                <Camera className="w-4 h-4 inline mr-1.5" strokeWidth={2} />
                Scan Skin
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGuide(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all btn-squishy ${showGuide ? "gradient-skin text-white shadow-glow-sm" : "glass text-muted-foreground"}`}
              >
                <Bug className="w-4 h-4 inline mr-1.5" strokeWidth={2} />
                Conditions
              </motion.button>
            </div>

            {/* Live Collar Sensor Data */}
            <LiveSensorPanel
              connected={sensorData.connected}
              secondsActive={sensorData.secondsActive}
              latest={sensorData.latest}
              readings={sensorData.readings}
              onStart={sensorData.startMonitoring}
              onStop={sensorData.stopMonitoring}
              sensorType="skin"
              gradient="gradient-skin"
            />

            {!showGuide ? (
              <DiagnosticFlow
                sensorType="skin"
                title="SkinSense AI"
                subtitle="AI-powered dermatological analysis"
                icon={<Camera className="w-7 h-7 text-white" strokeWidth={2} />}
                color="gradient-skin"
                captureLabel="Capture Skin Photo"
                descriptionPlaceholder="e.g. 'Red patches on belly, hair loss, constant scratching...'"
              />
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                <motion.div variants={item} className="glass rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-xs text-muted-foreground font-body">
                    Common skin conditions in dogs. Always consult a veterinarian for proper diagnosis and treatment.
                  </p>
                </motion.div>

                {skinIssues.map((issue) => (
                  <motion.div
                    key={issue.name}
                    variants={item}
                    className="glass rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{issue.icon}</span>
                        <h3 className="font-display font-semibold text-foreground tracking-tight">{issue.name}</h3>
                      </div>
                      <Badge className={`${severityColor[issue.severity]} rounded-lg text-[10px] font-body`}>{issue.severity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed font-body">{issue.description}</p>
                    <div className="bg-secondary/50 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-body text-secondary-foreground">Signs: {issue.signs}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SkinSense;
