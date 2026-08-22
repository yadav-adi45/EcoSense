import React, { useState } from "react";
import { Bot, Sparkles, X, MessageSquare } from "lucide-react";
import ChatInterface from "./ChatInterface";

const FloatingEcoBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* 💬 POPUP CHAT WINDOW */}
      {isOpen && (
        <div
          className={`pointer-events-auto mb-4 transition-all duration-300 transform origin-bottom-right animate-in fade-in zoom-in-95 ${
            isExpanded
              ? "w-[92vw] sm:w-[480px] md:w-[560px] max-w-[95vw]"
              : "w-[90vw] sm:w-[380px] md:w-[400px] max-w-[92vw]"
          }`}
        >
          <ChatInterface
            embedded={false}
            onClose={() => setIsOpen(false)}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            isExpanded={isExpanded}
          />
        </div>
      )}

      {/* 🌿 FLOATING ACTION BUTTON (FAB) */}
      <div className="pointer-events-auto flex items-center gap-3">
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1c15]/95 border border-emerald-500/30 text-emerald-300 text-xs font-black shadow-xl backdrop-blur-md cursor-pointer hover:border-emerald-400 hover:scale-105 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin [animation-duration:4s]" />
            <span>Ask EcoBot AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative group p-4 rounded-3xl shadow-2xl transition-all duration-300 active:scale-90 flex items-center justify-center border ${
            isOpen
              ? "bg-gradient-to-br from-[#0c241a] to-[#06140e] border-emerald-500/40 text-emerald-300 hover:text-white"
              : "bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white border-emerald-300/40 hover:scale-110 shadow-emerald-950/40 hover:shadow-emerald-500/30"
          }`}
          title={isOpen ? "Close EcoBot" : "Chat with EcoBot AI"}
        >
          {/* Pulsing ring indicator */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-3xl bg-emerald-400/30 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
          ) : (
            <Bot className="w-6 h-6 stroke-[2.2] transition-transform group-hover:scale-110" />
          )}

          {/* Active online dot */}
          {!isOpen && (
            <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-emerald-300 border-2 border-emerald-800 shadow-xs" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingEcoBot;
