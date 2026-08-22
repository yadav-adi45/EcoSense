import Navbar from "@/components/Navbar";
import React from "react";
import { TrendingUp, ShoppingBag, Route, Leaf, Lightbulb, Sparkles } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import Footer from "./Footer";

const EcoBot = () => {
  return (
    <div className="min-h-screen bg-[#f0faf5] flex flex-col justify-between">
      <div>
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">

            {/* Heading */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#059669] text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                Interactive AI Sustainability Companion
              </div>
              <h1 className="font-black text-4xl sm:text-5xl mb-3 text-gray-900 tracking-tight">
                Chat with <span className="text-[#10b981]">EcoBot AI</span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto font-medium">
                Ask about eco-friendly transport, reducing your carbon footprint, or improving your sustainability score.
              </p>
            </div>

            {/* Chatbot Interface */}
            <div className="w-full shadow-xl rounded-3xl overflow-hidden mb-8 border border-emerald-500/20">
              <ChatInterface isExpanded={true} />
            </div>

            {/* Pro tip */}
            <div className="flex items-center gap-4 rounded-2xl p-5 bg-white border border-emerald-100 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm leading-relaxed text-gray-600 font-medium">
                <span className="text-gray-900 font-bold">Pro tip:</span>{" "}
                You can select different AI styles (like <span className="text-emerald-700 font-bold">Professional</span> or <span className="text-emerald-700 font-bold">Eco-Inspiring</span>) and click <span className="text-emerald-700 font-bold">✨ Enhance</span> to automatically refine your messages.
              </p>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default EcoBot;
