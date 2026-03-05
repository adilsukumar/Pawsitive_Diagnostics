import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

const guides = [
  { color: "#4ADE80", label: "Apple Green", condition: "Ringworm", description: "Ringworm-infected hair fluoresces apple-green under 365nm UV.", action: "Antifungal treatment. Isolate pet.", wavelength: "365nm" },
  { color: "#FF6B6B", label: "Coral Red", condition: "Bacterial Overgrowth", description: "Coral-red fluorescence indicates Pseudomonas bacterial infection.", action: "Antibacterial treatment needed.", wavelength: "365-405nm" },
  { color: "#FFFFFF", label: "White/Blue", condition: "Healthy Baseline", description: "Normal skin shows faint white-blue fluorescence. Your reference point.", action: "No action — healthy.", wavelength: "365nm" },
  { color: "#FFD700", label: "Yellow-Green", condition: "Porphyrin Staining", description: "Porphyrin from saliva/tears around eyes, mouth, or paws. May signal allergies.", action: "Monitor for allergies.", wavelength: "405nm" },
  { color: "#8B5CF6", label: "Purple/Violet", condition: "Contaminants", description: "Fabric fibers, medications, or cleaning products — not a health issue.", action: "Clean area & re-examine.", wavelength: "365nm" },
];

const FluorescenceGuide = () => (
  <AppLayout title="UV Guide" showBack>
    <div className="px-4 py-6 space-y-4">
      <p className="text-xs text-muted-foreground text-center">
        Interpreting UV LED skin scan results (365-450nm)
      </p>

      {guides.map((g, i) => (
        <motion.div
          key={g.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-popover rounded-2xl p-4 border border-border flex gap-4"
        >
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl border-2 border-border" style={{ backgroundColor: g.color, boxShadow: `0 0 16px ${g.color}30` }} />
            <span className="text-[9px] text-muted-foreground mt-1">{g.wavelength}</span>
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-display font-bold text-foreground text-sm">{g.label} — {g.condition}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
            <div className="bg-secondary rounded-lg px-2.5 py-1.5">
              <p className="text-xs font-medium text-foreground">→ {g.action}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="bg-secondary rounded-2xl p-5 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ UV fluorescence is a screening tool only. Always confirm with a veterinarian.
        </p>
      </div>
    </div>
  </AppLayout>
);

export default FluorescenceGuide;
