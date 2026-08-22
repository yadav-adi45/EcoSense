import { useState, useRef, useEffect } from "react";
import { Bot, User, Send, Sparkles, Loader2, RotateCcw, ChevronDown, Zap, X, Maximize2, Minimize2 } from "lucide-react";
import { serverUrl } from "@/main";
import { toast } from "react-toastify";
import axios from "axios";

const STYLES = [
  { value: "Professional", label: "👔 Professional" },
  { value: "Casual", label: "😎 Casual" },
  { value: "Shorten", label: "✂️ Shorten" },
  { value: "Eco-Inspiring", label: "🌿 Eco-Inspiring" },
  { value: "Fix Grammar", label: "✍️ Fix Grammar" },
];

const QUICK_PROMPTS = [
  "How can I reduce my carbon footprint?",
  "How to earn EcoCoins in Community?",
  "Eco-friendly transport tips for today?",
  "Suggest sustainable alternatives for plastic",
];

const ChatInterface = ({ embedded = false, onClose = null, onToggleExpand = null, isExpanded = false }) => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant",
      content:
        "🌿 Hello! I'm EcoBot, your AI sustainability assistant. Ask me anything about reducing emissions, eco-friendly habits, pollution scores, or earning EcoCoins!",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("Professional");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previousInput, setPreviousInput] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEnhance = async () => {
    if (!input || !input.trim()) {
      toast.info("Please write something first!");
      return;
    }

    setIsEnhancing(true);
    try {
      const res = await axios.post(`${serverUrl}/api/v3/enhance`, {
        text: input.trim(),
        style: selectedStyle,
        context: "chat_prompt",
      });

      if (res.data?.success && res.data?.rewrittenText) {
        setPreviousInput(input);
        setInput(res.data.rewrittenText);
        toast.success(`✨ Rewritten in "${selectedStyle}" tone!`);
      } else {
        throw new Error(res.data?.message || "Failed to enhance writing");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to enhance writing";
      toast.error(msg);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = () => {
    if (previousInput !== null) {
      setInput(previousInput);
      setPreviousInput(null);
      toast.info("Reverted to original text");
    }
  };

  const handleSend = async (messageToSend = input) => {
    const textToSend = messageToSend?.trim();
    if (!textToSend || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPreviousInput(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${serverUrl}/api/v3/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.reply || "I am here to help you live more sustainably! 🌿",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "EcoBot is currently thinking... Feel free to ask another green question! 🌍",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full flex flex-col bg-gradient-to-b from-[#08140f] via-[#0b1c15] to-[#060f0b] text-[#e3f4eb] border border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${embedded ? "h-[540px]" : isExpanded ? "h-[700px]" : "h-[560px]"}`}>
      
      {/* 🌲 PREMIUM OBSIDIAN EMERALD HEADER */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-emerald-500/20 bg-[#0c2219]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0c2219] rounded-full animate-pulse shadow-xs"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm tracking-tight">EcoBot AI</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                Active
              </span>
            </div>
            <p className="text-[11px] font-bold text-emerald-400/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Sustainability &amp; Carbon Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="w-8 h-8 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 flex items-center justify-center transition-all border border-emerald-500/20"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-emerald-950/60 hover:bg-red-950/80 text-gray-300 hover:text-red-400 flex items-center justify-center transition-all border border-emerald-500/20"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 💬 MESSAGES CONTAINER (DARK SHADE) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3.5 bg-[#06100c]/80 backdrop-blur-md">
        
        {/* Quick Suggestion Chips */}
        {messages.length === 1 && (
          <div className="space-y-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/70 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" /> Quick Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#0e241b]/90 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/20 hover:border-emerald-400/40 transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            )}

            {/* MESSAGE BUBBLE */}
            <div
              className={`max-w-[84%] rounded-2xl px-4 py-3 shadow-lg ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-emerald-950/50"
                  : "bg-[#0e241b]/95 border border-emerald-500/25 text-[#e6f4ed] font-medium leading-relaxed shadow-emerald-950/30"
              }`}
            >
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span
                className={`text-[9px] font-bold mt-1.5 block ${
                  msg.role === "user" ? "text-emerald-200/80 text-right" : "text-emerald-400/50"
                }`}
              >
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-800/60 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-emerald-200" />
              </div>
            )}
          </div>
        ))}

        {/* LOADING INDICATOR */}
        {isLoading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-xl bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Bot className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#0e241b]/95 border border-emerald-500/25 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 🛠️ AI WRITING ENHANCE BAR & COMPOSER */}
      <div className="p-3 sm:p-4 border-t border-emerald-500/20 bg-[#091a13]/95 backdrop-blur-md">
        
        {/* Style Dropdown & Enhance Trigger */}
        <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-extrabold text-emerald-300/80 uppercase tracking-wider">AI Tone:</span>
            
            <div className="relative">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="text-xs font-bold bg-[#06120d] border border-emerald-500/30 rounded-xl px-2.5 py-1 pr-6 text-emerald-200 outline-none hover:border-emerald-400/60 cursor-pointer appearance-none transition-colors"
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0b1d16] text-emerald-100">
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-emerald-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {previousInput !== null && (
              <button
                type="button"
                onClick={handleUndo}
                className="p-1 px-2 rounded-lg bg-[#0e251c] hover:bg-[#133227] text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-all border border-emerald-500/20"
                title="Undo AI Rewrite"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#04160e] font-black text-xs shadow-md shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#04160e]" />
                  <span>Enhancing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#04160e]" />
                  <span>Enhance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text Input + Send Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask EcoBot or draft a prompt…"
            className="flex-1 rounded-2xl px-4 py-2.5 bg-[#05110c] border border-emerald-500/30 text-emerald-100 text-xs sm:text-sm font-medium placeholder:text-emerald-500/40 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#04160e] font-bold flex items-center justify-center shadow-lg shadow-emerald-950/60 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
