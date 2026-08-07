import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PollutionScoreRing from "./PollutionScoreRing";
import {
  Leaf,
  ChevronRight,
  Wind,
  AlertTriangle,
  Brain,
  ShieldCheck,
  Users,
  Sparkles,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { Link } from "react-router-dom";
import ScoreBreakdown from "./ScoreBreakdown";
import { getAuthHeaders } from "@/utils/auth";
import { serverUrl } from "@/main";
import Footer from "@/pages/Footer";

const getScoreMeta = (score) => {
  if (score >= 701)
    return {
      text: "text-emerald-600",
      label: "Low Pollution Impact",
      bg: "bg-emerald-50",
    };

  if (score >= 401)
    return {
      text: "text-amber-600",
      label: "Moderate Pollution Impact",
      bg: "bg-amber-50",
    };

  return {
    text: "text-rose-600",
    label: "High Pollution Impact",
    bg: "bg-rose-50",
  };
};

const DEFAULT_ASSESSMENT = {
  score: 642,
  level: "Moderate Pollution Impact",
  aiExplanation: "Your current lifestyle shows a moderate ecological footprint and air pollution impact. While your transportation practices (low distance commuting) are excellent, your household electricity consumption and shopping habits still present critical optimization opportunities. Swapping out older appliances, using smart power strips, and decreasing single-use product consumption can easily boost your score above 750.",
  precautions: {
    personal: [
      "Improve home ventilation by using certified HEPA air purifiers during peak city traffic hours.",
      "Wear certified N95/N99 respirators when navigating active construction zones or high dust corridors.",
      "Incorporate green energy habits like smart thermostat timers to reduce domestic carbon spikes."
    ],
    area: [
      "Partner with resident welfare associations to install solar-powered security lighting in common parks.",
      "Support domestic solid waste segregation programs and local community composting facilities.",
      "Organize neighborhood tree plantation drives to create localized green air buffers."
    ]
  },
  answers: {
    electricity: 450,
    transport: "public",
    distance: 12,
    diet: "vegetarian",
    recycling: "often"
  }
};

const Dashboard = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.warn("Using default assessment fallback due to disconnected database:", err);
        setAssessment(DEFAULT_ASSESSMENT);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0faf5]">
        <Navbar />
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
          <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Assembling Your Impact...</p>
        </div>
      </div>
    );
  }

  const score = assessment?.score || 0;
  const meta = getScoreMeta(score);

  return (
    <div className="min-h-screen w-full bg-[#f0faf5] pb-24">
      <Navbar />

      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
              <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-100/40 blur-3xl opacity-50 rounded-full -z-10"></div>
            <div>
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600 tracking-wide uppercase">Environmental Intelligence</span>
              </div>
               <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-none">
                Earth Guardian, <span className="text-emerald-500">
                  {assessment?.userId?.name?.split(' ')[0] || "Eco Warrior"}
                </span>
              </h1>
              <p className="text-gray-500 mt-4 text-lg font-normal max-w-xl text-gray-500">
                Your journey towards a sustainable future is being mapped in real-time.
              </p>
            </div>
            <Link to="/questionnaire">
               <Button className="h-14 px-8 text-base bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2">
                UPDATE HABITS
                <ArrowUpRight className="w-6 h-6" />
              </Button>
            </Link>
          </div>

          {/* ROW 1 → Score + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Eco Score Card */}
            <div className="bg-white rounded-2xl p-8 border border-emerald-50 shadow-sm border border-gray-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                 <Leaf size={100} className="text-emerald-500" />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-10 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Leaf className="w-6 h-6 text-emerald-500" />
                 </div>
                 Eco Impact Score
               </h3>

               <div className="flex flex-col items-center py-6">
                  <PollutionScoreRing score={score} size={150} strokeWidth={12} />
                  <div className="mt-12 text-center">
                    <p className={`text-3xl font-bold tracking-tighter ${meta.text} uppercase`}>
                      {assessment?.level || "Analyzing..."}
                    </p>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-xs">Current Resilience Level</p>
                  </div>
               </div>
            </div>

            {/* Score Breakdown (Assume it handles its own internal spacing if updated) */}
            <ScoreBreakdown answers={assessment?.answers} />
          </div>

          {/* ROW 2 → AI Analysis (FULL WIDTH) */}
          <Card className="border-none bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader className="bg-purple-500/5 px-8 pt-6 pb-4">
              <CardTitle className="flex items-center gap-4 text-gray-900 text-base font-bold uppercase tracking-wide">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 shadow-lg shadow-purple-100">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                Deep Neural Analysis
              </CardTitle>
            </CardHeader>

            <CardContent className="text-gray-700 leading-relaxed text-base font-normal p-8">
              {assessment ? (
                <p className="italic">"{assessment.aiExplanation}"</p>
              ) : (
                <div className="flex flex-col items-center py-16">
                  <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-gray-900 font-bold text-xl mb-2">Analysis Missing</p>
                  <p className="text-gray-400 font-medium max-w-sm text-center">
                    Complete your periodic assessment to unlock personalized AI insights and optimization paths.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROW 3 → Precautions */}
          {assessment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white rounded-2xl p-8 border border-emerald-50 shadow-sm border border-gray-100 relative overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 opacity-5">
                    <ShieldCheck size={100} className="text-emerald-500" />
                 </div>
                 <h3 className="flex items-center gap-4 text-gray-900 font-bold text-base mb-6 uppercase tracking-wide">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    Personal Growth
                 </h3>
                 <ul className="space-y-6 relative z-10">
                    {assessment.precautions.personal.map((p, i) => (
                      <li key={i} className="flex gap-6 text-gray-800 bg-white p-5 rounded-2xl border border-gray-50 shadow-sm hover:bg-white hover:shadow-lg transition-all">
                        <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
                        <span className="font-medium text-sm text-gray-700 leading-relaxed mt-1">{p}</span>
                      </li>
                    ))}
                  </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-blue-50 shadow-sm border border-gray-100 relative overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 opacity-5">
                    <Users size={100} className="text-blue-500" />
                 </div>
                 <h3 className="flex items-center gap-4 text-gray-900 font-bold text-base mb-6 uppercase tracking-wide">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Community Impact
                 </h3>
                 <ul className="space-y-6 relative z-10">
                    {assessment.precautions.area.map((p, i) => (
                      <li key={i} className="flex gap-6 text-gray-800 bg-white p-5 rounded-2xl border border-gray-50 shadow-sm hover:bg-white hover:shadow-lg transition-all">
                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
                        <span className="font-medium text-sm text-gray-700 leading-relaxed mt-1">{p}</span>
                      </li>
                    ))}
                  </ul>
              </div>
            </div>
          )}

          {/* ROW 4 → AQI CTA */}
          <div className="bg-white rounded-3xl p-10 border border-sky-50 shadow-2xl shadow-sky-900/5 text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent pointer-events-none"></div>
             <div className="relative z-10">
                 <div className="w-20 h-20 rounded-2xl bg-sky-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-sky-100 group-hover:scale-110 transition-transform">
                    <Wind className="w-10 h-10 text-white" />
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight uppercase">Live Path Insight</h3>
                 <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg font-medium">
                   Unlock real-time atmosphere analysis and AQI-optimized routing across your city.
                 </p>
                 <Link to="/pollution">
                   <Button className="h-14 px-10 text-base bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95">
                     EXPLORE REAL-TIME MAP
                   </Button>
                 </Link>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
