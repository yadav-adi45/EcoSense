import React, { useState } from "react";
import axios from "axios";
import { Sparkles, Loader2, Check, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { serverUrl } from "@/main";

const STYLES = [
  { value: "Professional", label: "👔 Professional", desc: "Polished, formal & executive tone" },
  { value: "Casual", label: "😎 Casual", desc: "Friendly, relaxed & conversational" },
  { value: "Shorten", label: "✂️ Shorten", desc: "Concise, punchy & direct" },
  { value: "Eco-Inspiring", label: "🌿 Eco-Inspiring", desc: "Green motivation & sustainability impact" },
  { value: "Fix Grammar", label: "✍️ Fix Grammar", desc: "Fix typos & punctuation while keeping meaning" },
];

export default function AIWritingAssistant({ text, onEnhance, compact = false, context = "community" }) {
  const [selectedStyle, setSelectedStyle] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [previousText, setPreviousText] = useState(null);

  const handleEnhance = async (e) => {
    if (e) e.preventDefault();

    if (!text || !text.trim()) {
      toast.info("Please write something first!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${serverUrl}/api/v3/enhance`, {
        text: text.trim(),
        style: selectedStyle,
        context,
      });

      if (res.data?.success && res.data?.rewrittenText) {
        setPreviousText(text);
        onEnhance(res.data.rewrittenText);
        toast.success(`✨ Text enhanced to "${selectedStyle}" style!`);
      } else {
        throw new Error(res.data?.message || "Failed to enhance writing");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to enhance writing";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    if (previousText !== null) {
      onEnhance(previousText);
      setPreviousText(null);
      toast.info("Reverted to original text");
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="text-xs font-bold bg-white border border-emerald-200 rounded-xl px-2.5 py-1.5 text-gray-700 outline-none hover:border-emerald-400 transition-colors shadow-xs"
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleEnhance}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Enhancing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enhance</span>
            </>
          )}
        </button>

        {previousText !== null && (
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all text-xs"
            title="Revert to original draft"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/60 border border-emerald-200/80 shadow-xs mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs px-2 py-1 rounded-lg bg-emerald-100/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Writing Assistant:</span>
        </div>

        <div className="relative">
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="text-xs font-black bg-white border border-emerald-200 rounded-xl px-3 py-1.5 pr-7 text-gray-800 outline-none hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer shadow-xs"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {previousText !== null && (
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
            title="Revert to original text"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleEnhance}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Enhancing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enhance</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
