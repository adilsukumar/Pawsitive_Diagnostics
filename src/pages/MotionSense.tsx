import { useState, useEffect } from "react";
import { Activity, TrendingUp, Gauge, Bluetooth } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useGlobalSensorData } from "@/contexts/LiveSensorContext";
import { Link } from "react-router-dom";

interface IMUData {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  temperature: number;
}

const MotionSense = () => {
  const sensorData = useGlobalSensorData();
  const connected = sensorData.bleConnected && sensorData.connected;
  
  const [imuData, setImuData] = useState<IMUData>({
    accelX: 0,
    accelY: 0,
    accelZ: 0,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    temperature: 22
  });

  const [activityLevel, setActivityLevel] = useState<"resting" | "walking" | "running" | "playing">("resting");

  // Update activity level based on scratch intensity from collar
  useEffect(() => {
    if (sensorData.latest?.scratch_intensity) {
      const intensity = sensorData.latest.scratch_intensity;
      if (intensity > 8) setActivityLevel("playing");
      else if (intensity > 5) setActivityLevel("running");
      else if (intensity > 2) setActivityLevel("walking");
      else setActivityLevel("resting");
    }
  }, [sensorData.latest?.scratch_intensity]);

  const getActivityColor = () => {
    switch (activityLevel) {
      case "playing": return "bg-purple-500";
      case "running": return "bg-red-500";
      case "walking": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getActivityProgress = () => {
    switch (activityLevel) {
      case "playing": return 100;
      case "running": return 75;
      case "walking": return 40;
      default: return 10;
    }
  };

  return (
    <AppLayout title="MotionSense AI" showBack>
      <div className="px-4 py-6 min-h-full space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg mb-3">
            <Activity className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            MotionSense AI
          </h1>
          <p className="text-gray-700 text-sm font-medium">
            Intelligent movement and behavioral health monitoring
          </p>
        </motion.div>

        {/* Collar Not Connected */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-center"
          >
            <Bluetooth className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Collar Not Connected</h3>
            <p className="text-sm text-gray-700 mb-4">
              Connect your ESP32 Smart Collar with MPU6050 sensor to see real-time motion data
            </p>
            <Link to="/collar">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl">
                <Bluetooth className="w-4 h-4 mr-2" />
                Connect Collar
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Activity Status */}
        {connected && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Level
            </h2>
            <Badge className={`${getActivityColor()} text-white`}>
              {activityLevel.toUpperCase()}
            </Badge>
          </div>
          <Progress value={getActivityProgress()} className="h-3 mb-2" />
          <p className="text-xs text-gray-700 text-center font-medium">
            {activityLevel === "resting" && "Your pet is resting"}
            {activityLevel === "walking" && "Your pet is walking around"}
            {activityLevel === "running" && "Your pet is running!"}
            {activityLevel === "playing" && "Your pet is playing actively!"}
          </p>
        </Card>
        )}

        {/* Accelerometer Data */}
        {connected && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Accelerometer (m/s²)
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">X-Axis</p>
              <p className="text-xl font-bold text-red-600">
                {imuData.accelX.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">Y-Axis</p>
              <p className="text-xl font-bold text-green-600">
                {imuData.accelY.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">Z-Axis</p>
              <p className="text-xl font-bold text-blue-600">
                {imuData.accelZ.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        )}

        {/* Gyroscope Data */}
        {connected && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Gyroscope (°/s)
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">Roll</p>
              <p className="text-xl font-bold text-red-600">
                {imuData.gyroX.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">Pitch</p>
              <p className="text-xl font-bold text-green-600">
                {imuData.gyroY.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-700 mb-1 font-semibold">Yaw</p>
              <p className="text-xl font-bold text-blue-600">
                {imuData.gyroZ.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
        )}

        {/* Temperature */}
        {connected && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Sensor Temperature
              </h3>
              <p className="text-xs text-gray-700 font-medium">
                MPU6050 internal temperature
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {imuData.temperature.toFixed(1)}°C
              </p>
            </div>
          </div>
        </Card>
        )}

        {/* Features */}
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-5 border border-blue-700">
          <h3 className="font-bold text-white mb-3 text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-300" />
            Key Features
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-100">
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>6-Axis Motion Tracking:</strong> MPU6050 IMU with 3-axis accelerometer and 3-axis gyroscope</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>Activity Classification:</strong> Detects sleeping, resting, walking, running, playing, and sudden movements</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>Baseline Learning:</strong> Builds personalized behavior profile over 3-7 days of monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>Behavioral Alerts:</strong> Detects excessive sleep, activity drops, hyperactivity, and prolonged immobility</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>Gait Analysis:</strong> Monitors step rhythm and motion symmetry to detect potential leg discomfort</span>
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
              <span><strong>Fall Detection:</strong> Identifies sudden acceleration spikes and impact events</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
};

export default MotionSense;
