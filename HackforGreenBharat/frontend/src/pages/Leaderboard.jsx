import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Trophy, TrendingUp, TrendingDown, Users, Flame, Building, X } from "lucide-react";
import { getAuthHeaders } from "@/utils/auth";
import { serverUrl } from "@/main";
import Footer from "@/pages/Footer";

const MEDAL = ["🥇", "🥈", "🥉"];
const TABS = [
  { key: "all", label: "All Heroes", icon: <Users size={14} /> },
  { key: "streaks", label: "Streaks", icon: <Flame size={14} /> },
  { key: "city", label: "City Pride", icon: <Building size={14} /> },
];

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("weekly");
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${serverUrl}/api/v4/leader`, {
          credentials: "include",
          headers: { ...getAuthHeaders() },
        });
        const data = await res.json();
        setLeaders(data.leaderboard || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [timeframe]);

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div style={{ minHeight: "100vh", background: "#f0faf5", fontFamily: "'Inter', sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "100px 20px 60px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#dcfce7", border: "1px solid #bbf7d0",
            borderRadius: "99px", padding: "5px 12px", marginBottom: "12px"
          }}>
            <Trophy size={13} color="#16a34a" />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Global Eco Champions
            </span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#111827", margin: "0 0 6px" }}>
            Community <span style={{ color: "#10b981" }}>Leaderboard</span>
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            Celebrating the small steps that make a giant difference.
          </p>
        </div>

        {/* ── Controls Row ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          {/* Sub-tabs */}
          <div style={{
            display: "inline-flex", background: "white",
            border: "1px solid #e5e7eb", borderRadius: "10px", padding: "3px", gap: "2px"
          }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "7px 14px", borderRadius: "7px", border: "none",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  background: activeTab === t.key ? "#10b981" : "transparent",
                  color: activeTab === t.key ? "white" : "#6b7280",
                  transition: "all 0.15s"
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Timeframe */}
          <div style={{
            display: "inline-flex", background: "white",
            border: "1px solid #e5e7eb", borderRadius: "10px", padding: "3px", gap: "2px"
          }}>
            {["weekly", "monthly", "alltime"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "7px 14px", borderRadius: "7px", border: "none",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize",
                  background: timeframe === tf ? "#111827" : "transparent",
                  color: timeframe === tf ? "white" : "#6b7280",
                  transition: "all 0.15s"
                }}
              >
                {tf === "alltime" ? "All Time" : tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: "14px" }}>
            Loading rankings...
          </div>
        ) : leaders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: "14px" }}>
            No data available yet.
          </div>
        ) : (
          <>
            {/* ── Top 3 Podium Strip ── */}
            {topThree.length >= 3 && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "12px", marginBottom: "20px"
              }}>
                {/* Reorder: 2nd, 1st, 3rd */}
                {[topThree[1], topThree[0], topThree[2]].map((user, i) => {
                  const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                  const isFirst = rank === 1;
                  return (
                    <div
                      key={user._id}
                      onClick={() => setSelected(selected?._id === user._id ? null : user)}
                      style={{
                        background: "white",
                        border: isFirst ? "2px solid #10b981" : "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "20px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        marginTop: isFirst ? "0" : "16px",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      <div style={{ fontSize: "22px", marginBottom: "10px" }}>{MEDAL[rank - 1]}</div>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        background: isFirst ? "#dcfce7" : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                        fontSize: "18px", fontWeight: "700",
                        color: isFirst ? "#16a34a" : "#6b7280"
                      }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: "700", color: "#111827", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.name}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 12px", fontWeight: "500" }}>
                        {rank === 1 ? "Gold" : rank === 2 ? "Silver" : "Bronze"}
                      </p>
                      <div style={{
                        display: "inline-block",
                        background: isFirst ? "#10b981" : "#f3f4f6",
                        color: isFirst ? "white" : "#374151",
                        borderRadius: "8px", padding: "5px 14px",
                        fontSize: "16px", fontWeight: "700"
                      }}>
                        {user.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Full Leaderboard Table ── */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "48px 1fr auto",
                padding: "12px 20px", background: "#f9fafb",
                borderBottom: "1px solid #f3f4f6"
              }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" }}>#</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" }}>User</span>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" }}>Score</span>
              </div>

              {/* Rows */}
              {leaders.map((user, index) => {
                const isTop3 = index < 3;
                return (
                  <div
                    key={user._id || index}
                    onClick={() => setSelected(selected?._id === user._id ? null : user)}
                    style={{
                      display: "grid", gridTemplateColumns: "48px 1fr auto",
                      alignItems: "center", padding: "13px 20px",
                      borderBottom: index < leaders.length - 1 ? "1px solid #f9fafb" : "none",
                      cursor: "pointer",
                      background: selected?._id === user._id ? "#f0fdf4" : "white",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => { if (selected?._id !== user._id) e.currentTarget.style.background = "#fafafa"; }}
                    onMouseLeave={e => { if (selected?._id !== user._id) e.currentTarget.style.background = "white"; }}
                  >
                    {/* Rank */}
                    <div>
                      {isTop3 ? (
                        <span style={{ fontSize: "18px" }}>{MEDAL[index]}</span>
                      ) : (
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#d1d5db" }}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* User info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: isTop3 ? "#dcfce7" : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: "700",
                        color: isTop3 ? "#16a34a" : "#9ca3af", flexShrink: 0
                      }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                          {user.name}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Active Eco Warrior</span>
                        </div>
                      </div>
                    </div>

                    {/* Score + trend */}
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#10b981" }}>
                        {user.score}
                      </p>
                      {user.change !== undefined && (
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "flex-end",
                          gap: "2px", marginTop: "2px",
                          fontSize: "11px", fontWeight: "600",
                          color: user.change >= 0 ? "#16a34a" : "#dc2626"
                        }}>
                          {user.change >= 0
                            ? <TrendingUp size={11} />
                            : <TrendingDown size={11} />}
                          {user.change >= 0 ? "+" : ""}{user.change}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </>
        )}
      </main>

      <Footer />

      {/* ── Modal Popup ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "16px",
              padding: "32px", width: "100%", maxWidth: "360px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              position: "relative"
            }}
          >
            {/* Close btn */}
            <button
              onClick={() => setSelected(null)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "#f3f4f6", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", display: "flex",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#6b7280"
              }}
            >
              <X size={16} />
            </button>

            {/* Avatar */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "#dcfce7", border: "2px solid #a7f3d0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "26px", fontWeight: "700", color: "#16a34a",
                margin: "0 auto 12px"
              }}>
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "700", color: "#111827" }}>
                {selected.name}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
                Rank #{selected.rank} &nbsp;·&nbsp; Active Eco Warrior
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#f3f4f6", margin: "0 0 20px" }} />

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: "12px", padding: "16px", textAlign: "center"
              }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Eco Score</p>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#10b981" }}>{selected.score}</p>
              </div>
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: "12px", padding: "16px", textAlign: "center"
              }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Change</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  {(selected.change ?? 0) >= 0
                    ? <TrendingUp size={16} color="#16a34a" />
                    : <TrendingDown size={16} color="#dc2626" />}
                  <p style={{
                    margin: 0, fontSize: "24px", fontWeight: "700",
                    color: (selected.change ?? 0) >= 0 ? "#16a34a" : "#dc2626"
                  }}>
                    {(selected.change ?? 0) >= 0 ? "+" : ""}{selected.change ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
