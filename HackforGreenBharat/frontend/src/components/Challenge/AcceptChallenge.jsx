import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Swords,
  Trophy,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  Leaf
} from "lucide-react";
import { serverUrl } from "@/main";
import Footer from "@/pages/Footer";

const AcceptChallenge = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("pending"); 

  const accept = async () => {
    try {
      setStatus("loading");
      await fetch(`${serverUrl}/api/v6/accept/${id}`, {
        method: "POST",
        credentials: "include",
      });
      setStatus("accepted");
    } catch {
      setStatus("error");
    }
  };

  const decline = async () => {
    try {
      setStatus("loading");
      await fetch(`${serverUrl}/api/v6/decline/${id}`, {
        method: "POST",
        credentials: "include",
      });
      setStatus("declined");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />

      <main className="container mx-auto px-6 pt-40 pb-24 max-w-2xl">
        <Card className="bg-white border-none rounded-[3.5rem] shadow-2xl shadow-emerald-900/10 overflow-hidden relative">
           <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none"></div>
          <CardContent className="p-12 text-center relative z-10">
            {status === "pending" && (
              <div className="space-y-10">
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                    <div className="relative w-full h-full rounded-[2.5rem] bg-emerald-500 border-4 border-white shadow-2xl flex items-center justify-center rotate-3 group hover:rotate-0 transition-transform duration-500">
                        <Swords className="w-16 h-16 text-white" />
                    </div>
                </div>
                
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-600 tracking-wide uppercase">New Invitation Received</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4 uppercase">
                        The Duel is <span className="text-emerald-500">Set</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        A fellow warrior has challenged you to an environmental showdown. Do you have what it takes?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={accept}
                    className="h-16 text-lg font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest transition-all active:scale-95"
                  >
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Accept Duel
                  </Button>
                  <Button
                    onClick={decline}
                    variant="outline"
                    className="h-16 text-lg font-black border-none bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all active:scale-95 uppercase tracking-widest"
                  >
                    <XCircle className="w-6 h-6 mr-3" />
                    Decline
                  </Button>
                </div>
                
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Rewards await the victor of this eco-clash</p>
              </div>
            )}

            {status === "loading" && (
              <div className="py-20 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-8" />
                <p className="text-emerald-900 font-black text-2xl uppercase tracking-tighter">Synchronizing Battle Stats...</p>
                <p className="text-gray-400 font-medium mt-2">Preparing the arena for impact</p>
              </div>
            )}

            {status === "accepted" && (
              <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-emerald-500 animate-ping opacity-20 rounded-full"></div>
                    <div className="relative w-full h-full rounded-[2.5rem] bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center">
                        <CheckCircle className="w-16 h-16 text-emerald-500" />
                    </div>
                </div>
                
                <div>
                   <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4 uppercase">
                        Duel <span className="text-emerald-500">Locked In!</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        The challenge has been accepted. It's time to show the world your green strength.
                    </p>
                </div>

                <Button
                  onClick={() => navigate(`/challenge/${id}`)}
                  className="w-full h-20 text-xl font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl shadow-2xl shadow-emerald-200 uppercase tracking-widest flex items-center justify-center gap-4 transition-all"
                >
                  ENTER THE ARENA
                  <ArrowRight className="w-8 h-8" />
                </Button>
              </div>
            )}

            {status === "declined" && (
              <div className="space-y-10">
                <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-red-50 border-4 border-white shadow-xl flex items-center justify-center">
                  <XCircle className="w-16 h-16 text-red-400" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4 uppercase">
                        Retreat <span className="text-red-500">Successful</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">You've declined the challenge. There's always another battle tomorrow.</p>
                </div>
                <Button
                  onClick={() => navigate("/my-challenges")}
                  className="w-full h-16 font-black bg-gray-900 text-white rounded-2xl uppercase tracking-widest shadow-xl"
                >
                  <Trophy className="w-5 h-5 mr-3" />
                  RETURN TO BASE
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-10">
                <div className="w-32 h-32 mx-auto rounded-[2.5rem] bg-orange-50 border-4 border-white shadow-xl flex items-center justify-center">
                  <AlertTriangle className="w-16 h-16 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4 uppercase">
                        System <span className="text-orange-500">Anomaly</span>
                    </h2>
                    <p className="text-gray-500 font-medium text-lg leading-relaxed">
                        This challenge link appears to have expired or moved to another timeline.
                    </p>
                </div>
                <Button
                  onClick={() => navigate("/my-challenges")}
                  className="w-full h-16 font-black bg-emerald-500 text-white rounded-2xl uppercase tracking-widest shadow-xl"
                >
                  <Trophy className="w-5 h-5 mr-3" />
                  MY RECENT CHALLENGES
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptChallenge;
