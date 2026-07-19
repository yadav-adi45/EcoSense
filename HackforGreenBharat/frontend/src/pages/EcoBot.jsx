import Navbar from "@/components/Navbar";
import React from "react";
import { TrendingUp, ShoppingBag, Route, Leaf, Lightbulb } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";

const EcoBot = () => {
  const quickPrompts = [
    { icon: <TrendingUp className="w-4 h-4" />, label: "How can I improve my score?" },
    { icon: <ShoppingBag className="w-4 h-4" />, label: "Suggest sustainable brands" },
    { icon: <Route className="w-4 h-4" />, label: "Best time to travel today?" },
    { icon: <Leaf className="w-4 h-4" />, label: "Tips for reducing energy use" },
  ];

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="font-bold text-4xl mb-2 text-gray-800">
              Chat with{" "}
              <span className="text-emerald-500">EcoBot</span>
            </h1>
            <p className="text-gray-500 text-lg">Your AI-powered sustainability assistant</p>
          </div>

          {/* Quick prompts */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex gap-3 flex-wrap justify-center">
              {quickPrompts.slice(0, 3).map((prompt, index) => (
                <button key={index}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-200 text-emerald-700 text-sm font-medium bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors duration-200 shadow-sm">
                  {prompt.icon}{prompt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              {quickPrompts.slice(3).map((prompt, index) => (
                <button key={index}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-200 text-emerald-700 text-sm font-semibold bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors duration-200 shadow-sm">
                  {prompt.icon}{prompt.label}
                </button>
              ))}
            </div>
            <div className="w-full">
              <ChatInterface />
            </div>
          </div>

          {/* Pro tip */}
          <div className="flex items-center gap-4 rounded-2xl px-5 py-4 bg-amber-50 border border-amber-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              <span className="text-gray-800 font-semibold">Pro tip:</span>{" "}
              Ask EcoBot about specific products, your commute route, or ways to reduce your carbon footprint based on your lifestyle data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EcoBot;
