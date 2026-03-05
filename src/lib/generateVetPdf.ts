import jsPDF from "jspdf";
import { getScanHistory } from "./scanHistory";

export interface VetPdfData {
  dogName: string | null;
  dogBreed: string | null;
  dogAge: string | null;
  dogWeight: string | null;
  dogPhotoBase64: string | null;
  scanHistory: ReturnType<typeof getScanHistory>;
  emotionLogs: any[];
  sensorReadings: any[];
}

// Utility to load an image URL as base64 data URL
export const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const COLORS = {
  primary: [16, 185, 129] as [number, number, number],
  primaryDark: [5, 150, 105] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  info: [59, 130, 246] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  pink: [236, 72, 153] as [number, number, number],
  dark: [30, 30, 30] as [number, number, number],
  gray: [100, 100, 100] as [number, number, number],
  lightGray: [230, 230, 230] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  bgLight: [245, 250, 248] as [number, number, number],
};

export const generateVetPdf = (data: VetPdfData): Blob => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pw - margin * 2;
  let y = 20;

  const checkPage = (need: number) => {
    if (y + need > ph - 20) {
      addFooter();
      doc.addPage();
      y = 16;
    }
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.gray);
    doc.text(
      "Pawsitive Diagnosis -- AI-Powered Pet Health Monitoring -- For Veterinary Reference Only",
      pw / 2,
      ph - 8,
      { align: "center" }
    );
    doc.text(
      `Page ${doc.getNumberOfPages()}`,
      pw - margin,
      ph - 8,
      { align: "right" }
    );
  };

  const sectionHeader = (title: string, color: [number, number, number], icon?: string) => {
    checkPage(16);
    // Colored bar
    doc.setFillColor(...color);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${icon ? icon + "  " : ""}${title}`, margin + 4, y + 7);
    y += 14;
    doc.setTextColor(...COLORS.dark);
  };

  const labelValue = (label: string, value: string, labelColor?: [number, number, number]) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(labelColor || COLORS.gray));
    const labelText = `${label}:`;
    doc.text(labelText, margin + 4, y);
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    doc.text(` ${value}`, margin + 4 + labelWidth + 2, y);
    y += 5.5;
  };

  const drawDivider = () => {
    doc.setDrawColor(...COLORS.lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pw - margin, y);
    y += 4;
  };

  const wrappedText = (text: string, indent = 0, fontSize = 9) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    const lines = doc.splitTextToSize(text, contentW - indent - 4);
    lines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, margin + indent, y);
      y += 4.5;
    });
  };

  // ═══════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pw, 40, "F");
  // Gradient-like second bar
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(0, 32, pw, 8, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Pawsitive Diagnosis", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Veterinary Health Report", margin, 26);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
  doc.text(`Report ID: ${crypto.randomUUID().slice(0, 8).toUpperCase()}`, pw - margin, 32, { align: "right" });

  // Dog photo in header
  if (data.dogPhotoBase64) {
    try {
      doc.addImage(data.dogPhotoBase64, "JPEG", pw - margin - 26, 4, 24, 24);
      // Round border effect
      doc.setDrawColor(...COLORS.white);
      doc.setLineWidth(1);
      doc.circle(pw - margin - 14, 16, 12.5, "S");
    } catch { /* skip if image fails */ }
  }

  y = 48;

  // ═══════════════════════════════════════
  // DOG PROFILE
  // ═══════════════════════════════════════
  sectionHeader("Dog Profile", COLORS.primary);

  // Profile box
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, y, contentW, 28, 2, 2, "F");
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, 28, 2, 2, "S");
  y += 6;

  const halfW = contentW / 2;
  // Left column
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...COLORS.primary);
  doc.text("Name:", margin + 4, y);
  doc.setTextColor(...COLORS.dark); doc.setFont("helvetica", "normal");
  doc.text(data.dogName || "Not set", margin + 22, y);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...COLORS.primary);
  doc.text("Breed:", margin + halfW, y);
  doc.setTextColor(...COLORS.dark); doc.setFont("helvetica", "normal");
  doc.text(data.dogBreed || "Not set", margin + halfW + 20, y);
  y += 7;

  doc.setFont("helvetica", "bold"); doc.setTextColor(...COLORS.primary);
  doc.text("Age:", margin + 4, y);
  doc.setTextColor(...COLORS.dark); doc.setFont("helvetica", "normal");
  doc.text(data.dogAge ? `${data.dogAge} years` : "Not set", margin + 22, y);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...COLORS.primary);
  doc.text("Weight:", margin + halfW, y);
  doc.setTextColor(...COLORS.dark); doc.setFont("helvetica", "normal");
  doc.text(data.dogWeight ? `${data.dogWeight} kg` : "Not set", margin + halfW + 20, y);
  y += 12;
  y += 6;

  // ═══════════════════════════════════════
  // EMOTION OVERVIEW
  // ═══════════════════════════════════════
  if (data.emotionLogs.length > 0) {
    sectionHeader("Emotion Overview", COLORS.purple);

    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(...COLORS.gray);
    doc.text(`Total emotion detections: ${data.emotionLogs.length}`, margin + 2, y);
    y += 6;

    const emotions = ["happy", "normal", "pain", "sad", "afraid", "angry"];
    const emotionColors: Record<string, [number, number, number]> = {
      happy: [34, 197, 94],
      normal: [100, 116, 139],
      pain: [220, 38, 38],
      sad: [59, 130, 246],
      afraid: [234, 179, 8],
      angry: [249, 115, 22],
    };
    const emotionLabels: Record<string, string> = {
      happy: "Happy",
      normal: "Normal",
      pain: "Pain",
      sad: "Sad",
      afraid: "Afraid",
      angry: "Angry",
    };

    // Bar chart
    const barH = 8;
    const maxCount = Math.max(...emotions.map(e => data.emotionLogs.filter((l: any) => l.emotion === e).length), 1);

    emotions.forEach((e) => {
      const count = data.emotionLogs.filter((l: any) => l.emotion === e).length;
      if (count === 0) return;
      checkPage(12);

      const barWidth = Math.max((count / maxCount) * (contentW - 50), 4);
      const color = emotionColors[e] || COLORS.gray;

      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
      doc.text(emotionLabels[e], margin + 2, y + 5.5);

      doc.setFillColor(...color);
      doc.roundedRect(margin + 24, y + 1, barWidth, barH - 2, 1.5, 1.5, "F");

      doc.setTextColor(...COLORS.dark); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`${count}`, margin + 26 + barWidth, y + 5.5);

      y += barH + 2;
    });

    y += 4;
    drawDivider();
  }

  // ═══════════════════════════════════════
  // COMPLETE EMOTION HISTORY
  // ═══════════════════════════════════════
  if (data.emotionLogs.length > 0) {
    sectionHeader("Complete Emotion Log", COLORS.info);

    // Table header
    doc.setFillColor(...COLORS.info);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Date & Time", margin + 3, y + 5);
    doc.text("Emotion", margin + 50, y + 5);
    doc.text("Confidence", margin + 85, y + 5);
    doc.text("Note", margin + 110, y + 5);
    y += 9;

    let rowIndex = 0;
    data.emotionLogs.forEach((log: any) => {
      checkPage(7);
      // Alternating row color
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, y - 3.5, contentW, 6, "F");
      }

      const ts = new Date(log.timestamp || log.created_at).toLocaleString();
      const emotion = (log.emotion || "unknown").charAt(0).toUpperCase() + (log.emotion || "unknown").slice(1);
      const conf = log.confidence != null ? `${log.confidence}%` : "--";
      const note = log.note || "--";

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
      doc.text(ts, margin + 3, y);
      doc.setFont("helvetica", "bold");
      doc.text(emotion, margin + 50, y);
      doc.setFont("helvetica", "normal");
      doc.text(conf, margin + 85, y);
      const noteTrunc = note.length > 30 ? note.slice(0, 30) + "..." : note;
      doc.text(noteTrunc, margin + 110, y);

      y += 6;
      rowIndex++;
    });

    y += 4;
    drawDivider();
  }

  // ═══════════════════════════════════════
  // PAIN & DISTRESS ALERTS
  // ═══════════════════════════════════════
  const painAlerts = data.emotionLogs.filter((l) => l.emotion === "pain");
  const sadAlerts = data.emotionLogs.filter((l) => l.emotion === "sad");
  const afraidAlerts = data.emotionLogs.filter((l) => l.emotion === "afraid");
  const angryAlerts = data.emotionLogs.filter((l) => l.emotion === "angry");

  if (painAlerts.length > 0 || sadAlerts.length > 0 || afraidAlerts.length > 0 || angryAlerts.length > 0) {
    sectionHeader("Alerts & Concerns", COLORS.danger);

    const alertGroups = [
      { label: "Pain Detected", items: painAlerts, color: COLORS.danger },
      { label: "Sadness / Crying", items: sadAlerts, color: COLORS.info },
      { label: "Fear / Anxiety", items: afraidAlerts, color: COLORS.warning },
      { label: "Aggression", items: angryAlerts, color: COLORS.pink },
    ];

    alertGroups.forEach(({ label, items, color }) => {
      if (items.length === 0) return;
      checkPage(12);

      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
      doc.text(`${label} (${items.length} occurrence${items.length > 1 ? "s" : ""})`, margin + 2, y);
      y += 6;

      items.forEach((l: any) => {
        checkPage(6);
        const ts = new Date(l.timestamp || l.created_at).toLocaleString();
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...COLORS.dark);
        doc.text(`- ${l.note || label} | Confidence: ${l.confidence || "?"}% | ${ts}`, margin + 4, y);
        y += 5;
      });
      y += 3;
    });

    drawDivider();
  }

  // ═══════════════════════════════════════
  // DIAGNOSTIC SCAN HISTORY
  // ═══════════════════════════════════════
  const scanTypes = [
    { label: "Bark Analysis History", type: "bark", color: COLORS.primary },
    { label: "Skin Analysis History", type: "skin", color: COLORS.pink },
    { label: "Gut Analysis History", type: "poop", color: COLORS.warning },
  ];

  scanTypes.forEach(({ label, type, color }) => {
    const scans = data.scanHistory.filter((s) => s.sensor_type === type);
    if (scans.length === 0) return;

    sectionHeader(`${label} (${scans.length})`, color);

    scans.forEach((s, idx) => {
      checkPage(22);

      // Card-like box
      doc.setFillColor(250, 250, 252);
      doc.setDrawColor(...COLORS.lightGray);
      doc.setLineWidth(0.3);

      const cardStartY = y;
      // We'll draw the box after we know the height

      const date = new Date(s.timestamp).toLocaleString();

      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
      doc.text(`Scan #${idx + 1}`, margin + 4, y + 4);
      doc.setTextColor(...COLORS.gray); doc.setFont("helvetica", "italic"); doc.setFontSize(8);
      doc.text(date, margin + 30, y + 4);
      y += 8;

      if (s.severity) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        const sevColor = s.severity === "critical" ? COLORS.danger : s.severity === "moderate" ? COLORS.warning : COLORS.primary;
        doc.setTextColor(...sevColor);
        doc.text(`Severity: ${s.severity.toUpperCase()}`, margin + 4, y);
        y += 5;
      }

      if (s.health_score != null) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...COLORS.dark);
        doc.text(`Health Score: ${s.health_score}/100`, margin + 4, y);

        // Mini score bar
        const barX = margin + 42;
        doc.setFillColor(...COLORS.lightGray);
        doc.roundedRect(barX, y - 3, 40, 4, 1, 1, "F");
        const scoreColor = s.health_score >= 70 ? COLORS.primary : s.health_score >= 40 ? COLORS.warning : COLORS.danger;
        doc.setFillColor(...scoreColor);
        doc.roundedRect(barX, y - 3, (s.health_score / 100) * 40, 4, 1, 1, "F");
        y += 5;
      }

      if (s.emotional_state) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...COLORS.purple);
        doc.text(`Emotional State: ${s.emotional_state}`, margin + 4, y);
        y += 5;
      }

      if (s.summary) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...COLORS.dark);
        const lines = doc.splitTextToSize(s.summary, contentW - 12);
        lines.forEach((line: string) => {
          checkPage(5);
          doc.text(line, margin + 4, y);
          y += 4.2;
        });
      }

      // Draw card border
      const cardH = y - cardStartY + 3;
      doc.setFillColor(250, 250, 252);
      doc.setDrawColor(...COLORS.lightGray);
      doc.roundedRect(margin, cardStartY, contentW, cardH, 2, 2, "S");

      // Left accent bar
      doc.setFillColor(...color);
      doc.rect(margin, cardStartY, 2, cardH, "F");

      y += 6;
    });

    y += 2;
  });

  // ═══════════════════════════════════════
  // SENSOR READINGS TABLE
  // ═══════════════════════════════════════
  if (data.sensorReadings.length > 0) {
    sectionHeader(`Collar Sensor Readings (${data.sensorReadings.length})`, COLORS.info);

    // Table header
    const cols = ["Time", "Bark", "NH3 ppm", "CH4 ppm", "CO2 ppm", "Scratch"];
    const colW = contentW / cols.length;

    doc.setFillColor(...COLORS.info);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
    cols.forEach((c, i) => doc.text(c, margin + i * colW + 2, y + 5));
    y += 9;

    doc.setFont("helvetica", "normal"); doc.setTextColor(...COLORS.dark);

    data.sensorReadings.forEach((r: any, idx: number) => {
      checkPage(6);

      if (idx % 2 === 0) {
        doc.setFillColor(245, 248, 255);
        doc.rect(margin, y - 3.5, contentW, 5.5, "F");
      }

      doc.setFontSize(7); doc.setTextColor(...COLORS.dark);
      const vals = [
        new Date(r.created_at).toLocaleTimeString(),
        r.bark_spike?.toString() ?? "--",
        r.ammonia_ppm?.toFixed(1) ?? "--",
        r.methane_ppm?.toFixed(1) ?? "--",
        r.co2_ppm?.toFixed(1) ?? "--",
        r.scratch_intensity?.toFixed(1) ?? "--",
      ];
      vals.forEach((v, i) => doc.text(v, margin + i * colW + 2, y));
      y += 5;
    });

    y += 4;
    drawDivider();
  }

  // ═══════════════════════════════════════
  // SUMMARY STATISTICS
  // ═══════════════════════════════════════
  sectionHeader("Report Summary", COLORS.primaryDark);

  const totalScans = data.scanHistory.length;
  const totalEmotions = data.emotionLogs.length;
  const totalSensor = data.sensorReadings.length;
  const avgScore = data.scanHistory.filter(s => s.health_score != null).length > 0
    ? Math.round(data.scanHistory.filter(s => s.health_score != null).reduce((a, s) => a + (s.health_score || 0), 0) / data.scanHistory.filter(s => s.health_score != null).length)
    : null;

  doc.setFillColor(...COLORS.bgLight);
  const summaryItems = 3 + (avgScore != null ? 1 : 0);
  doc.roundedRect(margin, y, contentW, summaryItems * 6 + 6, 2, 2, "F");
  y += 6;

  labelValue("Total Diagnostic Scans", `${totalScans}`, COLORS.primary);
  labelValue("Total Emotion Detections", `${totalEmotions}`, COLORS.purple);
  labelValue("Total Sensor Readings", `${totalSensor}`, COLORS.info);
  if (avgScore != null) {
    labelValue("Average Health Score", `${avgScore}/100`, avgScore >= 70 ? COLORS.primary : COLORS.danger);
  }

  y += 6;

  // ═══════════════════════════════════════
  // DISCLAIMER
  // ═══════════════════════════════════════
  checkPage(20);
  doc.setFillColor(255, 248, 240);
  doc.setDrawColor(...COLORS.warning);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentW, 16, 2, 2, "FD");

  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...COLORS.warning);
  doc.text("Disclaimer", margin + 4, y + 5);
  doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(...COLORS.gray);
  doc.text("This report is generated by an AI-powered monitoring system and is intended for veterinary", margin + 4, y + 10);
  doc.text("reference only. It does not replace professional veterinary diagnosis or treatment.", margin + 4, y + 14);

  // Add footer to last page
  addFooter();

  return doc.output("blob");
};
