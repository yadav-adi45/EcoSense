import React from "react";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  Leaf, 
  Flame,
  Activity
} from "lucide-react";

export default function AnimalDangerZoneCard({ 
  route, 
  onChooseSaferRoute,
  isSaferRouteAvailable = false
}) {
  const riskScore = route?.animalRisk?.maxRisk || route?.maxAnimalRisk || 78;
  const riskLevel = route?.animalRisk?.riskLevel || route?.animalRiskLevel || (riskScore > 60 ? "HIGH" : riskScore > 30 ? "MODERATE" : "LOW");
  const isHighRisk = riskScore > 30 || riskLevel === "High" || riskLevel === "Severe" || riskLevel === "HIGH";

  // Calculate danger stretch approx distance
  const dangerDistance = route?.distance 
    ? `${(parseFloat(route.distance) * 0.35).toFixed(1)} km`
    : "2.4 km";

  // Recorded species summary
  const recordedSpecies = route?.animalRisk?.commonAnimals || route?.animalRisk?.animals || [
    { name: "Wild Mammals", count: 4, category: "mammal" },
    { name: "Reptiles / Serpents", count: 7, category: "reptile" },
    { name: "Avian Wildlife", count: 2, category: "bird" }
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#0d1117] border border-red-900/40 text-white shadow-2xl shadow-red-950/30 p-4 sm:p-5 space-y-4 font-sans select-none transition-all duration-300">
      
      {/* ── TOP SECTION: 2-COLUMN SPLIT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        
        {/* ── LEFT COLUMN: PHOTOREALISTIC DANGER SIGN BANNER ── */}
        <div className="md:col-span-5 relative rounded-2xl overflow-hidden min-h-[260px] md:min-h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-white/10 shadow-inner group">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ 
              backgroundImage: `url('/wildlife_banner.jpg')`,
              backgroundPosition: 'center 40%'
            }}
          />
          {/* Multi-layer contrast gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-red-950/20 mix-blend-multiply pointer-events-none" />

          {/* Top Left: 🚨 DANGER ZONE Glass Pill */}
          <div className="relative z-10 self-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 hover:bg-red-600 border border-red-400/50 backdrop-blur-md text-[11px] font-black tracking-wider uppercase text-white shadow-lg shadow-red-600/40">
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>DANGER ZONE</span>
            </span>
          </div>

          {/* Center Graphic: Wildlife Crossing Sign */}
          <div className="relative z-10 flex flex-col items-center my-auto py-3">
            <div className="bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center max-w-[200px] text-center transform group-hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner mb-1.5 animate-bounce" style={{ animationDuration: '3s' }}>
                🐘
              </div>
              <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-300 leading-tight">
                WILDLIFE CROSSING
              </h5>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-red-400 mt-0.5">
                HIGH RISK AREA
              </span>
            </div>
          </div>

          {/* Bottom Alert Message Banner */}
          <div className="relative z-10 bg-black/80 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xs shrink-0">
              🐾
            </div>
            <p className="text-[10px] text-gray-200 font-semibold leading-snug">
              Animals may cross the road suddenly. <span className="text-amber-300 font-bold">Drive with caution</span> and avoid this route if possible.
            </p>
          </div>
        </div>

        {/* ── RIGHT COLUMN: INTELLIGENCE & METRICS DASHBOARD ── */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3.5">
          
          {/* Header Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-inner">
                <span className="text-sm">🐾</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  ANIMAL <span className="text-red-500">DANGER ZONE</span>
                </h3>
                <span className="text-[11px] font-bold text-gray-400 mt-0.5 block">
                  High Probability of Animal Crossing
                </span>
              </div>
            </div>

            {/* Red Information Callout Box */}
            <div className="mt-2.5 p-3 rounded-2xl bg-red-950/30 border border-red-600/30 flex items-start gap-2.5 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-lg bg-red-600/30 border border-red-500/50 flex items-center justify-center text-xs text-red-300 shrink-0 mt-0.5">
                🐾
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                This road passes through a wildlife corridor. There is a{" "}
                <span className="text-amber-300 font-bold">high probability of animals</span>{" "}
                such as elephants, deer, reptiles, or other wild animals suddenly appearing on the road.
              </p>
            </div>
          </div>

          {/* RISK DETAILS STATS GRID */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
              Risk Details
            </span>

            <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5">
              {/* Metric 1: Risk Level */}
              <div className="flex flex-col justify-between space-y-1 border-r border-slate-800 pr-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  <Activity className="w-3 h-3 text-red-500" />
                  <span>Risk Level</span>
                </div>
                <span className="text-sm font-black text-red-500 tracking-wide uppercase">
                  {riskLevel}
                </span>
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/20 text-[9px] font-bold text-red-300 w-fit">
                  Avoid if possible
                </span>
              </div>

              {/* Metric 2: Peak Hours */}
              <div className="flex flex-col justify-between space-y-1 border-r border-slate-800 px-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span>Most Active</span>
                </div>
                <span className="text-[11px] font-black text-slate-200 leading-tight">
                  6:00 PM – 6:00 AM
                </span>
                <span className="text-[9px] font-bold text-orange-400 truncate">
                  Be Extra Cautious
                </span>
              </div>

              {/* Metric 3: Distance */}
              <div className="flex flex-col justify-between space-y-1 pl-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Distance</span>
                </div>
                <span className="text-sm font-black text-slate-200">
                  {dangerDistance}
                </span>
                <span className="text-[9px] font-bold text-gray-400 truncate">
                  High Risk Stretch
                </span>
              </div>
            </div>
          </div>

          {/* MINI ROUTE CORRIDOR VISUAL MAP (SVG Graphic) */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2.5 flex flex-col items-center justify-center">
            {/* Top satellite mini background */}
            <div 
              className="absolute inset-0 opacity-25 bg-cover bg-center"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.2), transparent 70%), url('https://mt1.google.com/vt/lyrs=y&x=11&y=7&z=4')`
              }}
            />

            {/* Glowing Corridor Path SVG */}
            <div className="relative z-10 w-full h-12 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 40" fill="none">
                {/* Safe Green Path (Start to Hazard) */}
                <path
                  d="M 20 20 Q 70 8, 110 20"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Hazard Red Glowing Path (The Danger Zone) */}
                <path
                  d="M 110 20 Q 160 32, 210 20"
                  stroke="#ef4444"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                />
                {/* Safe Green Path (Hazard to Destination) */}
                <path
                  d="M 210 20 Q 250 8, 300 20"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Start Pin */}
                <circle cx="20" cy="20" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />

                {/* Hazard Pulse Halo & Pin */}
                <circle cx="160" cy="23" r="14" fill="#ef4444" fillOpacity="0.25" className="animate-ping origin-center" />
                <circle cx="160" cy="23" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                <text x="160" y="26" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">!</text>

                {/* Destination Pin */}
                <circle cx="300" cy="20" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="relative z-10 flex items-center justify-between w-full px-2 text-[9px] font-black uppercase text-gray-400">
              <span className="text-emerald-400">● Origin</span>
              <span className="text-red-400 tracking-wider font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                High Risk Zone
              </span>
              <span className="text-blue-400">● Destination</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM RECOMMENDATION & ACTION FOOTER ── */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-emerald-950/30 p-3 rounded-2xl border border-emerald-500/20">
        
        {/* Left: Recommendation Note */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block leading-tight">
              Our Recommendation
            </span>
            <p className="text-[11px] font-medium text-gray-300 leading-tight">
              Choose an <span className="text-emerald-300 font-bold">alternative route</span> to ensure your safety and protect wildlife.
            </p>
          </div>
        </div>

        {/* Right: Interactive Button */}
        {onChooseSaferRoute && (
          <button
            type="button"
            onClick={onChooseSaferRoute}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Leaf className="w-3.5 h-3.5 text-white" />
            <span>Choose Safer Route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Footer Motto */}
      <div className="text-center pt-0.5">
        <p className="text-[9.5px] font-bold text-gray-400 flex items-center justify-center gap-1.5">
          <span>🍃</span>
          <span>Travel Safe. Protect Wildlife. Protect Nature.</span>
        </p>
      </div>

    </div>
  );
}
