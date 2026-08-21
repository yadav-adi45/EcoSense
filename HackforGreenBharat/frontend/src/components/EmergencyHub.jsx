import { useState } from "react";
import {
  Hospital,
  ShieldCheck,
  MapPin,
  Phone,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Navigation,
  Eye,
  Crosshair,
  Sparkles,
} from "lucide-react";

const formatKm = (km) => {
  if (km == null || isNaN(km)) return "Nearby";
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

const EmergencyHub = ({
  hospitals = [],
  police = [],
  loading = false,
  selectedFacility = null,
  onFocusFacility = () => {},
  showHospitalsOnMap = true,
  showPoliceOnMap = true,
  onToggleHospitals = () => {},
  onTogglePolice = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("hospitals"); // "hospitals" | "police"
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const currentList = activeTab === "hospitals" ? hospitals : police;
  const filteredList = currentList.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="border-2 border-red-100/90 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
      {/* ── Header / Accordion Toggle ── */}
      <div className="p-3.5 bg-gradient-to-r from-red-50 via-rose-50 to-blue-50 border-b border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight uppercase tracking-wider">
                Emergency &amp; Safety Hub
              </h3>
              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                Top 10
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold">
              Nearest 10 Hospitals &amp; Police Stations Along Route
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white border border-red-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors shadow-xs"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 space-y-3 animate-in fade-in duration-200">
          {/* ── Category Tabs (Hospitals vs Police Stations) ── */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab("hospitals");
                setSearchQuery("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all ${
                activeTab === "hospitals"
                  ? "bg-white text-red-600 shadow-sm border border-red-200/80 scale-[1.02]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Hospital className="w-3.5 h-3.5 text-red-500" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("police");
                setSearchQuery("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all ${
                activeTab === "police"
                  ? "bg-white text-blue-600 shadow-sm border border-blue-200/80 scale-[1.02]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Police Stations ({police.length})</span>
            </button>
          </div>

          {/* ── Controls Row: Search & Map Visibility Toggles ── */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-gray-500">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === "hospitals" ? "hospitals" : "police"}...`}
                className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>

            {/* Map Marker Toggle */}
            <button
              type="button"
              onClick={activeTab === "hospitals" ? onToggleHospitals : onTogglePolice}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 shrink-0 transition-colors ${
                (activeTab === "hospitals" ? showHospitalsOnMap : showPoliceOnMap)
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
              title="Toggle map markers"
            >
              <Eye className="w-3 h-3" />
              <span>Pins on Map</span>
            </button>
          </div>

          {/* ── List of Facilities ── */}
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center text-gray-400 gap-2">
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-bold">Scanning emergency grid along route...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-gray-100">
              No matching {activeTab === "hospitals" ? "hospitals" : "police stations"} found.
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5 custom-scrollbar">
              {filteredList.map((facility, index) => {
                const isSelected = selectedFacility?.id === facility.id;
                const isHospital = facility.type === "hospital" || activeTab === "hospitals";

                return (
                  <div
                    key={facility.id || index}
                    onClick={() => onFocusFacility(facility)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden group ${
                      isSelected
                        ? isHospital
                          ? "bg-red-50/80 border-red-400 shadow-md ring-1 ring-red-400"
                          : "bg-blue-50/80 border-blue-400 shadow-md ring-1 ring-blue-400"
                        : "bg-gray-50/70 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            index === 0
                              ? isHospital
                                ? "bg-red-500 text-white"
                                : "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          #{index + 1}
                        </span>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-gray-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
                            {facility.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {facility.address || (isHospital ? "Hospital Care Center" : "Police Chowki")}
                          </p>
                        </div>
                      </div>

                      {/* Distance Badge */}
                      <span className="text-[10px] font-black bg-white border border-gray-200/80 px-2 py-0.5 rounded-full text-gray-700 shrink-0 whitespace-nowrap shadow-2xs">
                        📍 {formatKm(facility.distFromStart)}
                      </span>
                    </div>

                    {/* Meta Bar & Actions */}
                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {facility.emergency || (isHospital ? "24/7 Emergency" : "Patrol Ready")}
                        </span>
                        <span>•</span>
                        <span>~{facility.distFromRoute || "0.5"} km off-route</span>
                      </div>

                      {/* Focus Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFocusFacility(facility);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${
                          isSelected
                            ? isHospital
                              ? "bg-red-500 text-white shadow-xs"
                              : "bg-blue-500 text-white shadow-xs"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                        }`}
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>{isSelected ? "Focused" : "Focus on Map"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Notice */}
          <div className="p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-center gap-2 text-[10px] font-bold text-amber-800 leading-tight">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Click any facility to zoom &amp; inspect its location directly on the map.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyHub;
