import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/pages/Footer";
import { AuthContext } from "./context/context";
import { serverUrl } from "@/main";
import { getAuthHeaders } from "@/utils/auth";
import { ecoCoinService } from "@/services/ecoCoinService";
import { toast } from "react-toastify";
import EcoCoinIcon from "@/components/ui/EcoCoinIcon";
import {
  Sparkles,
  ArrowRight,
  Navigation,
  Gift,
  Camera,
  Car,
  CheckCircle2,
  ShoppingBag,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Brain,
  Leaf,
  Users
} from "lucide-react";

const DEFAULT_ASSESSMENT = {
  score: 642,
  level: "Moderate Pollution Impact",
  aiExplanation:
    "Your travel and consumption habits are helping reduce carbon emissions. Choose AQI-optimized clean routes, report road hazards, and explore carpooling to maximize your daily EcoCoins earnings.",
};

const Dasboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);

  // 🪙 EcoCoins State
  const [coinBalance, setCoinBalance] = useState(user?.ecoCoins || 0);
  const [canClaimDaily, setCanClaimDaily] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [coinStats, setCoinStats] = useState({ totalEarned: 0, totalSpent: 0, totalActions: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Route & Sustainability statistics from history
  const [impactStats, setImpactStats] = useState(null);

  // 1. Fetch EcoCoins balance & transactions
  const fetchCoinData = async () => {
    if (!user) return;
    setLoadingCoins(true);
    try {
      const [balData, txData] = await Promise.all([
        ecoCoinService.getBalance().catch(() => null),
        ecoCoinService.getTransactions(1, 6).catch(() => null),
      ]);

      if (balData?.success) {
        setCoinBalance(balData.balance);
        setCanClaimDaily(balData.canClaimDaily);
        setCoinStats({
          totalEarned: balData.totalEarned,
          totalSpent: balData.totalSpent,
          totalActions: balData.totalActions,
        });
        if (setUser && balData.balance !== user?.ecoCoins) {
          setUser((prev) => prev ? { ...prev, ecoCoins: balData.balance } : prev);
        }
      }

      if (txData?.success) {
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.warn("EcoCoins load warning:", err.message);
    } finally {
      setLoadingCoins(false);
    }
  };

  useEffect(() => {
    fetchCoinData();
  }, [user?._id]);

  // Handle Daily Login Reward Claim
  const handleClaimDaily = async () => {
    if (!user) {
      toast.info("Please login to claim your daily EcoCoins bonus!");
      navigate("/login");
      return;
    }
    setClaimingDaily(true);
    try {
      const res = await ecoCoinService.claimDailyLogin();
      if (res?.success) {
        setCoinBalance(res.balance);
        setCanClaimDaily(false);
        if (setUser) {
          setUser((prev) => prev ? { ...prev, ecoCoins: res.balance } : prev);
        }
        toast.success(res.message || "🎉 +5 EcoCoins claimed!");
        fetchCoinData();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.message || err.message || "Failed to claim daily bonus");
      }
    } finally {
      setClaimingDaily(false);
    }
  };

  // 2. Load latest habits assessment
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`${serverUrl}/api/v4/eco/latest`, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
        const data = await res.json();
        if (data && data.success && data.assessment) {
          setAssessment(data.assessment);
        } else {
          setAssessment(DEFAULT_ASSESSMENT);
        }
      } catch (err) {
        setAssessment(DEFAULT_ASSESSMENT);
      }
    };
    fetchLatest();
  }, []);

  // 3. Load Route Travel History
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecosense_route_history");
      if (raw) {
        const history = JSON.parse(raw);
        if (history && history.length > 0) {
          const totalRoutes = history.length;
          const ecoRoutes = history.filter((h) => h.isEco).length;

          let totalDist = 0;
          history.forEach((h) => {
            const num = parseFloat(h.distance);
            if (!isNaN(num)) totalDist += num;
          });

          let totalPollutionReduced = 0;
          let countEco = 0;
          history.forEach((h) => {
            if (h.isEco) {
              totalPollutionReduced += h.pollutionReduced || 22;
              countEco++;
            }
          });
          const avgReduced = countEco > 0 ? Math.round(totalPollutionReduced / totalRoutes) : 22;

          setImpactStats({
            routesExplored: totalRoutes,
            distance: totalDist.toFixed(1) + " km",
            ecoFriendly: ecoRoutes,
            pollutionReduced: avgReduced > 0 ? avgReduced + "%" : "24%",
          });
        }
      }
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f0faf5] pb-24 text-gray-800 font-sans">
      <Navbar />

      <main className="pt-28 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* ========================================================================= */}
          {/* 🌟 HERO SECTION & ECOCOINS REWARD VAULT (LIGHT GREEN UNIFIED PALETTE) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Box: Environmental Greeting & Quick Nav */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-7 md:p-8 border border-emerald-100/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-extrabold text-emerald-700 tracking-wider uppercase">
                    EcoSense Dashboard
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  Welcome back,{" "}
                  <span className="text-emerald-600">
                    {user?.name?.split(" ")[0] || "Eco Champion"}
                  </span>{" "}
                  👋
                </h1>

                <p className="text-gray-600 text-sm md:text-base font-medium max-w-xl leading-relaxed">
                  Earn <strong className="text-emerald-700 font-bold">EcoCoins</strong> by taking sustainable actions — clean route navigation, reporting road hazards, and sharing rides. Redeem your balance for direct discounts in our EcoStore!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3 items-center relative z-10">
                <Link to="/routes">
                  <button className="h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                    <Navigation className="w-3.5 h-3.5" />
                    Clean Routes
                    <span className="flex items-center gap-1 bg-emerald-600/60 px-2 py-0.5 rounded-lg text-[10px]">
                      <EcoCoinIcon size={12} /> +20
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>

                <Link to="/eco-product">
                  <button className="h-11 px-5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold rounded-2xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    Spend Coins (Store)
                  </button>
                </Link>

                <Link to="/community">
                  <button className="h-11 px-4 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    Report Proof
                    <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">
                      <EcoCoinIcon size={11} /> +15
                    </span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Box: EcoCoins Vault Card (Light Green / White Aesthetic) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 rounded-3xl p-7 md:p-8 border border-emerald-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
              
              {/* Vault Header */}
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">
                      EcoCoins Vault
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    1 EcoCoin = ₹1.00 Instant Product Discount
                  </p>
                </div>

                <Link to="/eco-product">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1 hover:bg-emerald-200/70 transition-all">
                    Redeem <ArrowUpRight size={13} />
                  </span>
                </Link>
              </div>

              {/* Main Balance Display */}
              <div className="my-6 relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-emerald-100 shrink-0 p-1">
                  <EcoCoinIcon size={52} animated />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">
                      {coinBalance}
                    </span>
                    <span className="text-base md:text-lg font-extrabold text-emerald-600">
                      EcoCoins
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 block mt-0.5">
                    ≈ ₹{coinBalance}.00 store discount available
                  </span>
                </div>
              </div>

              {/* Daily Login Claim / Streak Footer */}
              <div className="relative z-10 pt-4 border-t border-emerald-100 flex items-center justify-between gap-3">
                {canClaimDaily ? (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claimingDaily}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl shadow-md shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <EcoCoinIcon size={18} />
                    {claimingDaily ? "Claiming Bonus..." : "Claim Daily Bonus (+5 EcoCoins)"}
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 bg-emerald-100/60 border border-emerald-200 rounded-2xl text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Daily +5 Coins Claimed Today!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 🎯 ECOCOINS EARNING OPPORTUNITIES (HOW TO EARN) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  Ways to Earn EcoCoins
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Complete real-world green tasks to automatically earn rewards in your account
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-gray-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                  <EcoCoinIcon size={14} /> Lifetime Earned: <strong className="text-emerald-700">{coinStats.totalEarned} Coins</strong>
                </span>
              </div>
            </div>

            {/* Earning Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Task 1: Clean Routes */}
              <Link
                to="/routes"
                className="group p-5 bg-gradient-to-b from-emerald-50/40 to-white border border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      🗺️
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1">
                      <EcoCoinIcon size={13} /> +20
                    </span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                    Travel Low-Pollution Route
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                    Pick an AQI-optimized route for your car, bike, EV, or walk.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Explore Routes</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Task 2: Community Hazard Reporting */}
              <Link
                to="/community"
                className="group p-5 bg-gradient-to-b from-emerald-50/40 to-white border border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      📸
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1">
                      <EcoCoinIcon size={13} /> +15
                    </span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                    Report Transit Hazards
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                    Capture photo proof of potholes, garbage dumps, or waterlogging.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Report Proof</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Task 3: Rideshare & Carpool */}
              <Link
                to="/community"
                className="group p-5 bg-gradient-to-b from-emerald-50/40 to-white border border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      🚗
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1">
                      <EcoCoinIcon size={13} /> +10
                    </span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                    Offer Rideshare / Carpool
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                    Share open seats on your daily commute to slash fossil emissions.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Share Ride</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Task 4: Electricity Bill Scanner */}
              <Link
                to="/bill-scanner"
                className="group p-5 bg-gradient-to-b from-emerald-50/40 to-white border border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      ⚡
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg shadow-xs flex items-center gap-1">
                      <EcoCoinIcon size={13} /> +10
                    </span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-600 transition-colors">
                    Scan Electricity Bill
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                    Upload power utility bills to detect carbon savings opportunities.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Scan Bill</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🪙 RECENT ECOCOINS TRANSACTIONS & TRAVEL IMPACT (2-COL LIGHT PALETTE) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Panel 1: EcoCoins Activity Ledger */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100/80 shadow-xs flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <EcoCoinIcon size={20} />
                    EcoCoins Reward Ledger
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-100">
                    Live History
                  </span>
                </div>

                {loadingCoins ? (
                  <div className="animate-pulse space-y-3 py-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-gray-50 rounded-2xl" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
                      <Gift className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">No transactions yet</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Claim your daily login bonus or complete an eco-route to earn your first coins!
                    </p>
                    {canClaimDaily && (
                      <button
                        onClick={handleClaimDaily}
                        className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Claim +5 Daily Coins
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx._id}
                        className="p-3.5 rounded-2xl bg-[#fbfdfc] border border-emerald-100/70 flex items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === "earn"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {tx.type === "earn" ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-xs truncate">
                              {tx.description}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`font-black text-xs shrink-0 px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                            tx.type === "earn"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <EcoCoinIcon size={14} /> {tx.type === "earn" ? `+${tx.amount}` : `-${tx.amount}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                <span>Total Spent: <strong className="text-gray-900">₹{coinStats.totalSpent}.00</strong></span>
                <Link to="/eco-product" className="text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1">
                  Visit EcoStore <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Panel 2: Travel & Sustainability Impact */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100/80 shadow-xs flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    Your Eco Travel Impact
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase border border-emerald-100">
                    Verified Stats
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 mt-2">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">
                      Routes Explored
                    </span>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {impactStats?.routesExplored || 0}
                    </p>
                    <span className="text-[11px] text-emerald-700/80 font-bold block mt-1">Clean transit trips</span>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">
                      Distance Travelled
                    </span>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {impactStats?.distance || "0.0 km"}
                    </p>
                    <span className="text-[11px] text-emerald-700/80 font-bold block mt-1">Low-exposure routing</span>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">
                      Eco-Friendly Routes
                    </span>
                    <p className="text-3xl font-black text-gray-900 mt-1">
                      {impactStats?.ecoFriendly || 0}
                    </p>
                    <span className="text-[11px] text-emerald-700/80 font-bold block mt-1">Emission-reduced journeys</span>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/80">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block">
                      Pollution Bypassed
                    </span>
                    <p className="text-3xl font-black text-emerald-600 mt-1">
                      {impactStats?.pollutionReduced || "24%"}
                    </p>
                    <span className="text-[11px] text-emerald-700/80 font-bold block mt-1">Average PM2.5 avoidance</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                <span>Total Actions: <strong className="text-emerald-700">{coinStats.totalActions}</strong></span>
                <Link to="/routes" className="text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1">
                  Start New Route <ArrowRight size={12} />
                </Link>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 🧠 SMART ADVISOR & COMMUNITY BANNER (LIGHT GREEN THEMED) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-100/80">
            <div className="space-y-2 max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                <Brain className="w-3.5 h-3.5" />
                EcoSense Clean Mobility Tip
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900">
                "Active mobility and low-pollution route navigation earn the highest EcoCoins rewards."
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                {assessment?.aiExplanation || DEFAULT_ASSESSMENT.aiExplanation}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
              <Link to="/community">
                <button className="h-11 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Community Feed
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dasboard;
