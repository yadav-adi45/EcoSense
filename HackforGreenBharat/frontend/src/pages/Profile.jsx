import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  User, Trophy, Leaf, Zap, Car, ShoppingBag,
  Award, Target, Calendar, MapPin, Edit,
  Settings, TrendingUp, CheckCircle, Clock, ArrowRight
} from "lucide-react";
import { serverUrl } from "@/main";
import Footer from "./Footer";

const staticData = {
  maxScore: 900,
  rank: 4,
  totalUsers: 15000,
  streakDays: 12,
  carbonSaved: "245 kg",
  treesPlanted: 8,
};

const scoreBreakdown = [
  { category: "Electricity", score: 185, maxScore: 225, icon: Zap,         color: "#F59E0B" },
  { category: "Transport",   score: 210, maxScore: 225, icon: Car,          color: "#3B82F6" },
  { category: "Shopping",    score: 165, maxScore: 225, icon: ShoppingBag,  color: "#14B8A6" },
  { category: "Lifestyle",   score: 160, maxScore: 225, icon: Leaf,         color: "#22C55E" },
];

const recentActivities = [
  { action: "Completed 'Plastic-Free Week' challenge", points: "+50", time: "2 hours ago" },
  { action: "Used public transport for 5 days",        points: "+30", time: "1 day ago" },
  { action: "Scanned eco-friendly product",            points: "+10", time: "2 days ago" },
  { action: "Joined family competition",               points: "+20", time: "3 days ago" },
  { action: "Reduced electricity by 15%",              points: "-25", time: "5 days ago" },
];

const badges = [
  { name: "Eco Warrior",    description: "Complete 10 challenges",       icon: Trophy,      earned: true  },
  { name: "Green Streak",   description: "7-day eco streak",             icon: Zap,         earned: true  },
  { name: "Carbon Crusher", description: "Save 100kg CO₂",              icon: Leaf,        earned: true  },
  { name: "Public Hero",    description: "Use public transport 20 times",icon: Car,         earned: false },
  { name: "Smart Shopper",  description: "Scan 50 eco products",         icon: ShoppingBag, earned: false },
  { name: "Family Champ",   description: "Win 5 family competitions",    icon: Award,       earned: false },
];

/* ─── shared card style ─── */
const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
};

const Profile = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${serverUrl}/api/v4/eco/latest`, { credentials: "include" });
        const data = await res.json();
        setAssessment(data.assessment);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0faf5" }}>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "16px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #a7f3d0", borderTopColor: "#10b981", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading profile…</p>
        </div>
      </div>
    );
  }

  /* ── no data ── */
  if (!assessment) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0faf5" }}>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 20px" }}>
          <div style={{ ...card, padding: "40px", maxWidth: "380px", textAlign: "center" }}>
            <Target size={40} color="#d1d5db" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>Profile not found</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
              Please sign in or complete an assessment first.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#10b981", color: "white", border: "none", borderRadius: "9px", padding: "10px 24px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userProfile = {
    name:          assessment.userId?.name || "Eco Warrior",
    email:         assessment.userId?.email || "warrior@ecosense.ai",
    location:      assessment.userId?.profile?.location || "India",
    joinedDate:    assessment.userId?.createdAt
      ? new Date(assessment.userId.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "March 2024",
    avatar:        assessment.userId?.profile?.profilePhoto,
    pollutionScore: assessment.score || 0,
    rank:          staticData.rank,
    streakDays:    staticData.streakDays,
    carbonSaved:   staticData.carbonSaved,
  };

  const scorePercentage = (userProfile.pollutionScore / staticData.maxScore) * 100;
  const RADIUS = 80;
  const CIRC   = 2 * Math.PI * RADIUS;
  const offset = CIRC - (scorePercentage / 100) * CIRC;

  return (
    <div style={{ minHeight: "100vh", background: "#f0faf5", fontFamily: "'Inter', sans-serif" }} className="mt-16">
      <Navbar />

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px 60px" }}>

        {/* ════════════════════════════════
            HEADER CARD
        ════════════════════════════════ */}
        <div style={{ ...card, marginBottom: "24px", overflow: "hidden" }}>
          {/* Banner strip */}
          <div style={{ height: "80px", background: "linear-gradient(to right, #10b981, #059669)" }} />

          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", marginTop: "-36px", flexWrap: "wrap" }}>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "14px",
                  background: "#dcfce7", border: "3px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px", fontWeight: "700", color: "#059669",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {userProfile.name[0]?.toUpperCase()}
                </div>
                <button style={{
                  position: "absolute", bottom: "-4px", right: "-4px",
                  width: "22px", height: "22px", borderRadius: "6px",
                  background: "#10b981", border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer"
                }}>
                  <Edit size={10} color="white" />
                </button>
              </div>

              {/* Name & meta */}
              <div style={{ flex: 1, paddingBottom: "4px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  background: "#dcfce7", border: "1px solid #bbf7d0",
                  borderRadius: "99px", padding: "3px 10px", marginBottom: "6px"
                }}>
                  <Trophy size={11} color="#059669" />
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#059669" }}>Master Guardian</span>
                </div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 6px" }}>
                  {userProfile.name}
                </h1>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6b7280" }}>
                    <MapPin size={13} color="#10b981" /> {userProfile.location}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#6b7280" }}>
                    <Calendar size={13} color="#10b981" /> Joined {userProfile.joinedDate}
                  </span>
                </div>
              </div>

              {/* Rank & Streak pills */}
              <div style={{ display: "flex", gap: "10px", paddingBottom: "4px" }}>
                <div style={{ textAlign: "center", background: "#10b981", borderRadius: "10px", padding: "10px 18px", minWidth: "80px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.8)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Rank</p>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: "white", margin: 0 }}>#{userProfile.rank}</p>
                </div>
                <div style={{ textAlign: "center", background: "#f97316", borderRadius: "10px", padding: "10px 18px", minWidth: "80px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.8)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Day Streak</p>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: "white", margin: 0 }}>{userProfile.streakDays}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            STATS ROW — Score · Segments · Badges
        ════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>

          {/* Impact Score Ring */}
          <div style={{ ...card, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
              <TrendingUp size={15} color="#10b981" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mastery</span>
            </div>

            <svg width="190" height="190" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="95" cy="95" r={RADIUS} stroke="#f3f4f6" strokeWidth="14" fill="none" />
              <circle
                cx="95" cy="95" r={RADIUS}
                stroke="#10b981" strokeWidth="14" fill="none"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div style={{ marginTop: "-110px", marginBottom: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "36px", fontWeight: "700", color: "#10b981", margin: 0 }}>{userProfile.pollutionScore}</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0", fontWeight: "500" }}>IMPACT PTS</p>
            </div>
            <div style={{ width: "100%", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px", textAlign: "center", marginTop: "90px" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#059669" }}>Top 8% Performance</p>
            </div>
          </div>

          {/* Score Segments */}
          <div style={{ ...card, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
              <Target size={15} color="#10b981" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>Segments</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {scoreBreakdown.map((item) => (
                <div key={item.category}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <item.icon size={14} color={item.color} />
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{item.category}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>{item.score} / {item.maxScore}</span>
                  </div>
                  <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(item.score / item.maxScore) * 100}%`,
                      background: item.color,
                      borderRadius: "99px",
                      transition: "width 0.8s ease"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div style={{ ...card, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
              <Award size={15} color="#10b981" />
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>Badges</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  title={badge.description}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "12px 8px", borderRadius: "10px",
                    background: badge.earned ? "#f0fdf4" : "#f9fafb",
                    border: `1px solid ${badge.earned ? "#bbf7d0" : "#e5e7eb"}`,
                    opacity: badge.earned ? 1 : 0.5,
                    cursor: "default"
                  }}
                >
                  <badge.icon size={20} color={badge.earned ? "#10b981" : "#d1d5db"} style={{ marginBottom: "6px" }} />
                  <span style={{ fontSize: "10px", fontWeight: "600", color: badge.earned ? "#059669" : "#9ca3af", textAlign: "center", lineHeight: "1.3" }}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#10b981" }}>3 new trophies available</p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            BOTTOM ROW — Activity · Sidebar
        ════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>

          {/* Recent Activity */}
          <div style={{ ...card, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} color="#10b981" />
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>Recent Activity</span>
              </div>
              <button style={{ fontSize: "12px", fontWeight: "600", color: "#10b981", background: "none", border: "none", cursor: "pointer" }}>View all</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentActivities.map((a, i) => {
                const isPos = a.points.startsWith("+");
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "12px 14px", borderRadius: "10px",
                    background: "#fafafa", border: "1px solid #f3f4f6"
                  }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
                      background: isPos ? "#dcfce7" : "#fee2e2",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <CheckCircle size={16} color={isPos ? "#16a34a" : "#dc2626"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "13px", color: "#374151", fontWeight: "500" }}>{a.action}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.time}</p>
                    </div>
                    <span style={{
                      fontSize: "13px", fontWeight: "700",
                      color: isPos ? "#16a34a" : "#dc2626",
                      background: isPos ? "#dcfce7" : "#fee2e2",
                      padding: "3px 10px", borderRadius: "99px"
                    }}>
                      {a.points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Carbon saved */}
            <div style={{ ...card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Leaf size={16} color="#059669" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Carbon Saved</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#059669" }}>{userProfile.carbonSaved}</p>
                </div>
              </div>
              <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "68%", background: "#10b981", borderRadius: "99px" }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af" }}>68% of monthly goal</p>
            </div>

            {/* Eco Course CTA */}
            <div style={{ ...card, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={16} color="#059669" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#111827" }}>Eco Mastery Course</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Improve your score</p>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6", marginBottom: "14px" }}>
                Upgrade your sustainability skills with bite-sized lessons.
              </p>
              <button style={{
                width: "100%", padding: "9px", borderRadius: "9px",
                background: "#111827", color: "white",
                border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
              }}>
                Learn More <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick stats */}
            <div style={{ ...card, padding: "20px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: "600", color: "#111827", textTransform: "uppercase", letterSpacing: "0.04em" }}>Quick Stats</p>
              {[
                { label: "Trees Planted",   value: staticData.treesPlanted, unit: "trees" },
                { label: "Total Users",     value: `${(staticData.totalUsers / 1000).toFixed(0)}k`,  unit: "users" },
                { label: "Carbon Saved",    value: staticData.carbonSaved, unit: "" },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: i < 2 ? "1px solid #f3f4f6" : "none"
                }}>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>{s.label}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>{s.value} {s.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Profile;
