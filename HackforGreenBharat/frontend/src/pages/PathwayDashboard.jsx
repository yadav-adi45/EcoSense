import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowRight, Activity, Wind, CloudRain, MapPin, AlertTriangle, CheckCircle, Leaf, Zap, Cpu } from 'lucide-react';
import Navbar from "@/components/Navbar";

const PathwayDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/v9/alert");
        if (res.data.success && res.data.data) {
          const newData = res.data.data;
          setMetrics(newData);
          setStatus('connected');
          
          setLogs(prev => {
             const newLog = { 
                 time: new Date().toLocaleTimeString(), 
                 ...newData 
             };
             return [newLog, ...prev].slice(0, 50); 
          });
        }
      } catch (err) {
        setStatus('error');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  const simulateLocation = (type) => {
    const loc = type === 'danger' 
      ? { user_id: 'demo_user', lat: 28.7041, lon: 77.1025 }
      : { user_id: 'demo_user', lat: 12.9716, lon: 77.5946 };
      
    axios.post("http://localhost:8081/v1/inputs", loc)
      .then(() => toast.success(`Simulated ${type === 'danger' ? 'High Pollution Point' : 'Clean Point'}`))
      .catch((e) => toast.error("Failed to send: " + e.message));
  };

  return (
    <div className="min-h-screen bg-[#f0faf5] text-gray-800">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-28 text-center md:text-left">
        <header className="mb-12 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/50 blur-[120px] rounded-full pointer-events-none"></div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900 tracking-tight">
            Pathway <span className="text-emerald-600">Intelligence</span>
          </h1>
          <p className="text-gray-500 max-w-3xl text-lg font-medium">
            Experience real-time environmental analysis. Our high-throughput streaming engine processes your location data to detect air quality risks as they happen.
          </p>
        </header>

        {/* System Architecture */}
        <div className="bg-white rounded-[2.5rem] p-10 mb-12 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Cpu size={240} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-10 text-gray-800 flex items-center gap-3">
            <Activity className="w-6 h-6 text-emerald-500" /> System Architecture
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center relative z-10">
             {/* Step 1 */}
             <div className="flex-1 p-8 bg-emerald-50/30 rounded-3xl border border-emerald-100 hover:border-emerald-300 transition-all duration-300">
               <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                 <MapPin className="text-emerald-600 w-7 h-7" />
               </div>
               <h3 className="font-bold text-gray-800 text-lg">Sensor Stream</h3>
               <p className="text-sm text-gray-500 mt-2">Continuous GPS & Chemical Data</p>
             </div>
             
             <div className="hidden md:block">
                <ArrowRight className="text-emerald-200 w-8 h-8 animate-pulse" />
             </div>
             
             {/* Step 2 */}
             <div className="flex-1 p-8 bg-emerald-500 rounded-3xl border border-emerald-400 shadow-xl shadow-emerald-200 transition-all duration-300 group relative">
               <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5">
                 <Zap className="text-white w-7 h-7" />
               </div>
               <h3 className="font-bold text-white text-lg">Pathway Core</h3>
               <p className="text-sm text-emerald-50 mt-2">Complex Event Processing (Python)</p>
               <span className="absolute top-3 right-3 text-[10px] bg-white/20 text-white px-2.5 py-1 rounded-full font-black tracking-widest uppercase">Streaming</span>
             </div>
             
             <div className="hidden md:block">
                <ArrowRight className="text-emerald-200 w-8 h-8 animate-pulse" />
             </div>
             
             {/* Step 3 */}
             <div className="flex-1 p-8 bg-emerald-50/30 rounded-3xl border border-emerald-100 hover:border-emerald-300 transition-all duration-300">
               <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                 <CloudRain className="text-emerald-600 w-7 h-7" />
               </div>
               <h3 className="font-bold text-gray-800 text-lg">Insights API</h3>
               <p className="text-sm text-gray-500 mt-2">Alert Generation & Storage</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Live Metrics */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-emerald-100 shadow-sm flex flex-col relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50/50 blur-[80px] rounded-full"></div>
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                <span className="relative flex h-4 w-4">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                Live Environment Data
              </h2>
              {metrics && (
                <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 ${
                  metrics.level === 'High' 
                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {metrics.level} Risk
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10">
              {metrics ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 p-10 rounded-3xl bg-emerald-50/30 border border-emerald-100 text-center relative overflow-hidden group">
                    {metrics.level === 'High' && (
                        <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>
                    )}
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">Atmosphere AQI</p>
                    <div className={`text-9xl font-black tracking-tighter ${metrics.level === 'High' ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {metrics.aqi}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <div className={`p-2 rounded-full ${metrics.level === 'High' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                           {metrics.level === 'High' ? <AlertTriangle size={20} className="text-rose-500"/> : <CheckCircle size={20} className="text-emerald-600"/>}
                        </div>
                        <p className="text-lg font-bold text-gray-700">{metrics.description}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">CO2 PPM</p>
                    <div className="text-3xl font-black text-gray-800">{metrics.co2}</div>
                  </div>
                  <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">NO2 Density</p>
                    <div className="text-3xl font-black text-gray-800">{metrics.no2}</div>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-400 flex-col border-2 border-dashed border-emerald-100 rounded-[2rem] bg-emerald-50/10">
                  <Activity className="mb-4 animate-bounce text-emerald-400 w-12 h-12" />
                  <p className="font-bold text-lg">Waiting for data stream...</p>
                  <p className="text-sm mt-1 opacity-60">Initializing high-throughput connector</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-10 border-t border-emerald-50 relative z-10">
              <h3 className="text-xs font-black text-gray-400 mb-5 uppercase tracking-widest">Simulation Injection</h3>
              <div className="flex gap-4">
                <button 
                  onClick={() => simulateLocation('danger')}
                  className="flex-1 py-4 px-6 bg-white hover:bg-rose-50 text-rose-600 rounded-2xl text-sm font-bold transition-all border-2 border-rose-100 hover:border-rose-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertTriangle size={18} />
                  Pollution Spike
                </button>
                <button 
                  onClick={() => simulateLocation('clean')}
                  className="flex-1 py-4 px-6 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold transition-all border-2 border-emerald-100 hover:border-emerald-300 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Leaf size={18} />
                  Clean Air Path
                </button>
              </div>
            </div>
          </div>

          {/* Processing Logs */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-emerald-100 shadow-sm h-[720px] flex flex-col relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                Engine Processing Output
            </h2>
            <div className="flex-1 overflow-y-auto bg-gray-900 rounded-3xl p-8 font-mono text-sm border-4 border-gray-800 custom-scrollbar shadow-inner">
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-600 italic font-medium">
                    // No events in queue...
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="mb-6 border-b border-gray-800/50 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-emerald-400 font-bold">[{log.time}]</span>
                    <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-xs">Node_ID: {log.user_id}</span>
                  </div>
                  <div className="pl-0 text-gray-300 mb-2 font-semibold">
                    &gt; LAT/LON: {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold ${log.level === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      DETECTED AQI: {log.aqi} [{log.level} RISK]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwayDashboard;
