import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send, Leaf, Recycle, Bike, Zap, Trophy, Users, ArrowRight, CheckCircle,
} from "lucide-react";
import { CHALLENGE_TEMPLATES } from "./ChallengeTemplate";
import { serverUrl } from "@/main";

const iconMap = {
  leaf: <Leaf className="w-6 h-6" />,
  recycle: <Recycle className="w-6 h-6" />,
  bike: <Bike className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
};

const SendChallenge = ({ opponent }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(CHALLENGE_TEMPLATES[0]);
  const [sent, setSent] = useState(false);

  const sendChallenge = async () => {
    try {
      setLoading(true);
      await fetch(`${serverUrl}/api/v6/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ opponentId: opponent?._id, email: email || undefined, template: selectedTemplate }),
      });
      setSent(true);
      setTimeout(() => { setSent(false); setEmail(""); }, 3000);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md">
              <Send className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Send Challenge</h1>
              <p className="text-gray-500 mt-0.5">Challenge a friend to go green together</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/my-challenges")}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Trophy className="w-4 h-4 mr-2" /> My Challenges
          </Button>
        </div>

        {/* Email Input */}
        {!opponent && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-gray-700">Challenge by Email</span>
            </div>
            <Input type="email" placeholder="Enter opponent's email address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border-gray-200 text-gray-800 focus:border-emerald-400" />
          </div>
        )}

        {/* Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {CHALLENGE_TEMPLATES.map((template, index) => {
            const isSelected = selectedTemplate.id === template.id;
            return (
              <div key={template.id} onClick={() => setSelectedTemplate(template)}
                className={`cursor-pointer rounded-2xl p-5 flex items-center gap-4 border-2 transition-all duration-200
                  ${isSelected ? "border-emerald-400 bg-emerald-50 shadow-md" : "border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}
                style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${template.color} shrink-0 shadow-sm`}>
                  {iconMap[template.icon]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{template.title}</h3>
                  <p className="text-sm text-gray-500">{template.description}</p>
                </div>
                {isSelected && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Send Button */}
        <button onClick={sendChallenge} disabled={loading || (!opponent && !email)}
          className="w-full h-14 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2
            bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all disabled:opacity-60">
          {loading ? "Sending..." : sent ? "✓ Challenge Sent!" : "Send Challenge"}
          {!loading && !sent && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default SendChallenge;
