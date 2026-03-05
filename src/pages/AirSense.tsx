import { useState, useEffect } from "react";
import { Wind, AlertTriangle, CheckCircle, XCircle, Bluetooth } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { aiServices } from "@/lib/aiServices";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import { Link } from "react-router-dom";

interface GasReading {
  co2: number;
  voc: number;
  pm25: number;
  temperature: number;
  humidity: number;
}

const AirSense = () => {
  const { toast } = useToast();
  const sensorData = useGlobalSensorData();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const connected = sensorData.bleConnected && sensorData.connected;
  const [gasData, setGasData] = useState<GasReading>({
    co2: sensorData.latest?.co2_ppm || 0,
    voc: sensorData.latest?.ammonia_ppm || 0,
    pm25: sensorData.latest?.methane_ppm || 0,
    temperature: 22,
    humidity: 45
  });

  const runAnalysis = async () => {
    setAnalyzing(true);
    setResult(null);
    
    // Use live sensor data if available
    const currentData = {
      co2: sensorData.latest?.co2_ppm || gasData.co2,
      voc: sensorData.latest?.ammonia_ppm || gasData.voc,
      pm25: sensorData.latest?.methane_ppm || gasData.pm25,
      temperature: gasData.temperature,
      humidity: gasData.humidity
    };
    
    try {
      const analysis = await aiServices.analyzeAirQuality(currentData);
      setResult(analysis);
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Update gas data when new sensor readings come in
  useEffect(() => {
    if (sensorData.latest) {
      setGasData(prev => ({
        ...prev,
        co2: sensorData.latest?.co2_ppm || prev.co2,
        voc: sensorData.latest?.ammonia_ppm || prev.voc,
        pm25: sensorData.latest?.methane_ppm || prev.pm25
      }));
    }
  }, [sensorData.latest]);

  const getAirQualityStatus = () => {
    if (gasData.co2 < 600 && gasData.voc < 200 && gasData.pm25 < 25) {
      return { label: "Good", color: "text-white", bgColor: "bg-green-500", icon: CheckCircle };
    } else if (gasData.co2 < 1000 && gasData.voc < 400 && gasData.pm25 < 50) {
      return { label: "Moderate", color: "text-white", bgColor: "bg-yellow-500", icon: AlertTriangle };
    } else {
      return { label: "Poor", color: "text-white", bgColor: "bg-red-500", icon: XCircle };
    }
  };

  const status = getAirQualityStatus();
  const StatusIcon = status.icon;

  return (
    <AppLayout title="AirSense AI" showBack>
      <div className="px-4 py-6 min-h-full space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-2"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto shadow-lg mb-3">
            <Wind className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            AirSense AI
          </h1>
          <p className="text-gray-700 text-sm font-medium">
            Environmental safety monitoring with MQ135 gas sensor
          </p>
        </motion.div>

        {/* Collar Not Connected */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-center"
          >
            <Wind className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Collar Not Connected</h3>
            <p className="text-sm text-gray-700 mb-4">
              Connect your ESP32 Smart Collar with MQ135 sensor to see real-time air quality data
            </p>
            <Link to="/collar">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl">
                <Wind className="w-4 h-4 mr-2" />
                Connect Collar
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Current Status */}
        {connected && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Air Quality Status
            </h2>
            <Badge className={`${status.bgColor} ${status.color}`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {status.label}
            </Badge>
          </div>

          {/* Gas Readings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-700 uppercase mb-1 font-semibold">CO₂</p>
              <p className="text-2xl font-bold text-gray-900">{gasData.co2}</p>
              <p className="text-xs text-gray-700">ppm</p>
            </div>

            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-700 uppercase mb-1 font-semibold">VOC</p>
              <p className="text-2xl font-bold text-gray-900">{gasData.voc}</p>
              <p className="text-xs text-gray-700">ppb</p>
            </div>

            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-700 uppercase mb-1 font-semibold">PM2.5</p>
              <p className="text-2xl font-bold text-gray-900">{gasData.pm25}</p>
              <p className="text-xs text-gray-700">μg/m³</p>
            </div>

            <div className="bg-gray-700 rounded-xl p-4">
              <p className="text-xs text-gray-700 uppercase mb-1 font-semibold">Temp</p>
              <p className="text-2xl font-bold text-gray-900">{gasData.temperature}</p>
              <p className="text-xs text-gray-700">°C</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-700">Humidity</p>
              <p className="text-sm font-semibold text-gray-900">{gasData.humidity}%</p>
            </div>
            <Progress value={gasData.humidity} className="h-2" />
          </div>
        </motion.div>
        )}

        {/* Analyze Button */}
        {connected && (
        <AnimatePresence mode="wait">
          {!result && !analyzing && (
            <motion.div
              key="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Button
                onClick={runAnalysis}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl h-12 shadow-lg"
              >
                <Wind className="w-4 h-4 mr-2" />
                Analyze Air Quality with AI
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Analyzing */}
        {connected && analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 space-y-4"
          >
            <div className="relative w-16 h-16 mx-auto">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Analyzing...</h2>
            <p className="text-gray-700 text-sm font-medium">AI is processing environmental data</p>
          </motion.div>
        )}

        {/* Results */}
        {connected && (
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                  AI Analysis
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {result}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="w-full rounded-xl h-11"
              >
                New Analysis
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        )}

        {/* Features */}
        <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-xl p-5 border border-green-700">
          <h3 className="font-bold text-white mb-3 text-base flex items-center gap-2">
            <Wind className="w-5 h-5 text-green-300" />
            Key Features
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-100">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
              <span><strong>Real-time Gas Detection:</strong> Monitors NH₃, NOx, benzene, smoke, CO₂, and VOCs using MQ135 sensor</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
              <span><strong>Baseline Analysis:</strong> Establishes normal air quality levels and detects abnormal changes</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
              <span><strong>Smart Alerts:</strong> Instant notifications when toxic gas levels exceed safety thresholds</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
              <span><strong>Trend Detection:</strong> Identifies sudden pollution spikes, poor ventilation, and hazardous leaks</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 mt-0.5 flex-shrink-0" />
              <span><strong>Pet-Focused Safety:</strong> Protects pets from respiratory risks due to their higher sensitivity</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default AirSense;
