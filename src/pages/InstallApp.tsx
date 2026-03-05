import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Share2, CheckCircle, PawPrint, RefreshCw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getScanHistory } from "@/lib/scanHistory";
import { generateComprehensiveVetPdf } from "@/lib/generateComprehensiveVetPdf";
import { useToast } from "@/hooks/use-toast";

const InstallApp = () => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generateVetShare = async () => {
    setGenerating(true);
    try {
      const dogName = localStorage.getItem("dog_name") || null;
      const dogBreed = localStorage.getItem("dog_breed") || null;
      const dogAge = localStorage.getItem("dog_age") || null;
      const dogWeight = localStorage.getItem("dog_weight") || null;
      const dogPhotoBase64 = localStorage.getItem("dog_photo") || null;

      let emotionLogs: any[] = [];
      try {
        const raw = localStorage.getItem("emotion_logs");
        emotionLogs = raw ? JSON.parse(raw) : [];
      } catch { /* empty */ }

      const scanHistory = getScanHistory();

      const { data: sensorReadings } = await supabase
        .from("sensor_readings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Generate comprehensive PDF
      const pdfBlob = generateComprehensiveVetPdf({
        dogName,
        dogBreed,
        dogAge,
        dogWeight,
        dogPhotoBase64,
        allData: {
          emotionLogs,
          scanHistory,
          sensorReadings: sensorReadings || [],
        },
      });

      // Upload to PRIVATE storage
      const fileName = `vet-report-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("vet-reports")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: false });

      if (uploadError) throw uploadError;

      // Generate SIGNED URL that expires in 7 days (secure!)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from("vet-reports")
        .createSignedUrl(fileName, 604800); // 7 days in seconds

      if (signedError) throw signedError;

      setPdfUrl(signedUrlData.signedUrl);
      toast({ title: "🐾 Vet report ready!", description: "Secure link expires in 7 days" });
    } catch (e: any) {
      toast({ title: "Failed to generate", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const qrCodeUrl = pdfUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(pdfUrl)}&bgcolor=0a0f1a&color=2dd4a8&margin=16`
    : null;

  return (
    <AppLayout title="Vet Share" showBack>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 min-h-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow-sm">
            <Share2 className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground tracking-tight">Share with Vet</h2>
          <p className="text-muted-foreground text-sm font-body">
            Generate a PDF report your vet can scan & download with {localStorage.getItem("dog_name") || "your dog"}'s complete health profile
          </p>
        </motion.div>

        {/* What's included */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm tracking-tight">📋 What the report includes</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: "🐕", label: "Dog profile & photo" },
              { emoji: "📊", label: "3 days to 1 year data" },
              { emoji: "🎙️", label: "All emotion logs" },
              { emoji: "🔬", label: "All diagnostic scans" },
              { emoji: "📡", label: "All sensor readings" },
              { emoji: "📈", label: "Time-based analysis" },
            ].map((item) => (
              <div key={item.label} className="bg-secondary/50 rounded-xl p-2.5 flex items-center gap-2">
                <span className="text-sm">{item.emoji}</span>
                <span className="text-[10px] text-muted-foreground font-body">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Generate / QR Display */}
        {!pdfUrl ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Button onClick={generateVetShare} disabled={generating}
              className="w-full gradient-primary text-primary-foreground rounded-xl h-12 font-body shadow-glow-sm btn-squishy text-base">
              {generating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" /> Generate Vet Report
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            {/* Success */}
            <div className="glass rounded-2xl p-4 flex items-center gap-3 ring-2 ring-primary/30">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-display font-semibold text-foreground text-sm">Report ready!</p>
                <p className="text-[10px] text-muted-foreground font-body">Your vet can scan this QR code to download the full PDF report</p>
                <p className="text-[10px] text-destructive font-body font-semibold mt-0.5">Expires in 7 days for privacy</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="glass rounded-2xl p-6 flex flex-col items-center space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-lifted">
                <img src={qrCodeUrl!} alt="Vet QR Code" className="w-56 h-56" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground font-body">
                  Point your vet's phone camera at this QR code
                </p>
                <div className="flex items-center gap-1.5 justify-center">
                  <PawPrint className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-display font-semibold">
                    {localStorage.getItem("dog_name") || "Dog"}'s Health Report (PDF)
                  </span>
                </div>
              </div>
            </div>

            {/* Download button */}
            <Button onClick={() => {
              const a = document.createElement("a");
              a.href = pdfUrl;
              a.download = `${localStorage.getItem("dog_name") || "dog"}-vet-report.pdf`;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast({ title: "📥 Downloading report..." });
            }} className="w-full gradient-primary text-primary-foreground rounded-xl h-10 font-body shadow-glow-sm btn-squishy">
              <FileDown className="w-4 h-4 mr-2" /> Download PDF Report
            </Button>

            {/* Copy link */}
            <div className="glass rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  navigator.clipboard.writeText(pdfUrl);
                  toast({ title: "📋 Link copied!" });
                }} className="w-full bg-secondary text-foreground rounded-xl h-10 font-body text-sm font-semibold btn-squishy flex items-center justify-center gap-2">
                  📋 Copy PDF Link
                </button>
              </div>
            </div>

            {/* Regenerate */}
            <Button onClick={() => { setPdfUrl(null); generateVetShare(); }} variant="outline"
              className="w-full rounded-xl h-10 font-body border-border">
              <RefreshCw className="w-4 h-4 mr-2" /> Generate New Report
            </Button>
          </motion.div>
        )}

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-body">
            <strong className="text-foreground">For Veterinarians:</strong> Scan the QR code to instantly download a PDF with the complete health record including diagnostic history, emotion patterns, pain alerts, and sensor data. No app needed.
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default InstallApp;
