import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Swords, Send, Trophy, Leaf, Lightbulb, Clock, Sparkles, ArrowLeft, CheckCircle,
} from "lucide-react";
import { serverUrl } from "@/main";

const ChallengeDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadChallenge = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/v6/${id}`, { credentials: "include" });
      const data = await res.json();
      setChallenge(data.challenge);
      setLogs(data.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadChallenge(); }, [id]);

  const submitAction = async () => {
    if (!action.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${serverUrl}/api/v7/recycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, challengeId: id }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setAction("");
      loadChallenge();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0faf5]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-14 h-14 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin mb-4" />
          <p className="text-emerald-600 font-medium">Loading challenge…</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#f0faf5]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl pt-24 text-center">
          <Swords className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Challenge Not Found</h2>
          <p className="text-gray-400 mb-5">This challenge may have ended or doesn't exist.</p>
          <Button onClick={() => navigate("/my-challenges")}
            className="border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Challenges
          </Button>
        </div>
      </div>
    );
  }

  const totalProgress = challenge.progress.challenger + challenge.progress.opponent;
  const challengerPercent = totalProgress > 0 ? (challenge.progress.challenger / totalProgress) * 100 : 50;

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl pt-24">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/my-challenges")}
            className="text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{challenge.title}</h1>
            <p className="text-gray-500 text-sm">{challenge.description}</p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm">
            <Trophy className="w-4 h-4" /> {challenge.reward} pts
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Challenge Progress</h3>
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${challengerPercent}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-emerald-600">You: {challenge.progress.challenger}pts</span>
            <span className="font-semibold text-blue-500">Opponent: {challenge.progress.opponent}pts</span>
          </div>
        </div>

        {/* Action Input */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-800">Log Your Eco Action</h3>
          </div>
          <div className="flex gap-3">
            <Input value={action} onChange={(e) => setAction(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitAction()}
              placeholder="What eco action did you do today?"
              className="bg-gray-50 border-gray-200 text-gray-800 focus:border-emerald-400 flex-1" />
            <button onClick={submitAction} disabled={submitting || !action.trim()}
              className="px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 disabled:opacity-60 transition">
              {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-700">AI Suggestions</span>
              </div>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 p-3 rounded-lg bg-white border border-emerald-100">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-800">Activity History</h3>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              No actions logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div key={log._id || index} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 font-semibold">
                      {log.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">{log.user?.name}</p>
                    <p className="text-sm text-gray-500">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeDashboard;
