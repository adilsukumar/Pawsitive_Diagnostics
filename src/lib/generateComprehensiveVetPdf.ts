import { jsPDF } from "jspdf";

export interface ComprehensiveVetData {
  dogName: string | null;
  dogBreed: string | null;
  dogAge: string | null;
  dogWeight: string | null;
  dogPhotoBase64: string | null;
  allData: {
    emotionLogs: any[];
    scanHistory: any[];
    sensorReadings: any[];
  };
}

const filterByDays = (data: any[], days: number) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return data.filter(item => {
    const ts = new Date(item.timestamp || item.created_at).getTime();
    return ts >= cutoff;
  });
};

export const generateComprehensiveVetPdf = (data: ComprehensiveVetData): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const checkSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      addPage();
    }
  };

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Pawsitive Diagnosis', 14, 15);
  doc.setFontSize(12);
  doc.text('Comprehensive Veterinary Health Report', 14, 23);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  y = 45;

  // Dog Profile
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dog Profile', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.dogName || 'Not set'}`, 14, y);
  y += 6;
  doc.text(`Breed: ${data.dogBreed || 'Not set'}`, 14, y);
  y += 6;
  doc.text(`Age: ${data.dogAge ? data.dogAge + ' years' : 'Not set'}`, 14, y);
  y += 6;
  doc.text(`Weight: ${data.dogWeight ? data.dogWeight + ' kg' : 'Not set'}`, 14, y);
  y += 12;

  // Time periods
  const periods = [
    { label: '3 Days', days: 3 },
    { label: '5 Days', days: 5 },
    { label: '1 Week', days: 7 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 }
  ];

  periods.forEach(period => {
    checkSpace(40);

    // Section header
    doc.setFillColor(59, 130, 246);
    doc.rect(14, y, pageWidth - 28, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${period.label} Data Summary`, 16, y + 7);
    y += 14;

    doc.setTextColor(0, 0, 0);

    // Filter data
    const emotions = filterByDays(data.allData.emotionLogs, period.days);
    const scans = filterByDays(data.allData.scanHistory, period.days);
    const sensors = filterByDays(data.allData.sensorReadings, period.days);

    // Summary stats
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Records: ${emotions.length + scans.length + sensors.length}`, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`- Emotion Detections: ${emotions.length}`, 18, y);
    y += 5;
    doc.text(`- Diagnostic Scans: ${scans.length}`, 18, y);
    y += 5;
    doc.text(`- Sensor Readings: ${sensors.length}`, 18, y);
    y += 8;

    // Emotion breakdown
    if (emotions.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Emotion Breakdown:', 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      
      const emotionCounts: Record<string, number> = {};
      emotions.forEach(e => {
        emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      });

      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        doc.text(`  ${emotion}: ${count} (${((count / emotions.length) * 100).toFixed(1)}%)`, 18, y);
        y += 5;
      });
      y += 3;
    }

    // Health scores
    const scansWithScores = scans.filter(s => s.health_score != null);
    if (scansWithScores.length > 0) {
      const avgScore = scansWithScores.reduce((sum, s) => sum + s.health_score, 0) / scansWithScores.length;
      doc.setFont('helvetica', 'bold');
      doc.text(`Average Health Score: ${avgScore.toFixed(1)}/100`, 14, y);
      y += 8;
    }

    y += 5;
  });

  // All-time summary
  checkSpace(30);
  doc.setFillColor(139, 92, 246);
  doc.rect(14, y, pageWidth - 28, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('All-Time Summary', 16, y + 7);
  y += 14;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Emotion Logs: ${data.allData.emotionLogs.length}`, 14, y);
  y += 6;
  doc.text(`Total Scans: ${data.allData.scanHistory.length}`, 14, y);
  y += 6;
  doc.text(`Total Sensor Readings: ${data.allData.sensorReadings.length}`, 14, y);

  return doc.output('blob');
};
