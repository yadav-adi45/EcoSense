import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Upload, Search, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { serverUrl } from "@/main";

const BillScanner = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleAnalyze(selectedFile);
    }
  };

  const handleAnalyze = async (selectedFile) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("bill", selectedFile);

      const res = await fetch(`${serverUrl}/api/v8/analyze`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      navigate("/bill-result", { state: { result: data } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/v8/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billText: manualInput }),
        credentials: "include",
      });

      const data = await res.json();
      navigate("/bill-result", { state: { result: data } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />

      <div className="container mx-auto px-6 py-12 pt-32">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
             <Scan className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 tracking-tight">
            Eco <span className="text-emerald-500">Scanner</span>
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            Scan your receipts or search products to track their environmental footprints and update your score.
          </p>
        </div>

        {/* Scanner Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm p-10">
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Scan Product */}
              <div
                onClick={() => fileInputRef.current.click()}
                className="group border-2 border-dashed border-emerald-200 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Scan className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Take Photo
                </h3>
                <p className="text-gray-400 text-sm font-medium text-center">
                  Use your camera to scan a product barcode or receipt
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Upload Image */}
              <div
                onClick={() => imageInputRef.current.click()}
                className="group border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Upload Gallery
                </h3>
                <p className="text-gray-400 text-sm font-medium text-center">
                  Select an existing photo from your device's library
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-6 mb-10">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">or search manually</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Manual Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter product name, category or barcode..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                className="flex-1 h-16 bg-gray-50/50 border-gray-100 text-gray-800 rounded-2xl px-6 text-lg focus:border-emerald-400 focus:bg-white transition-all shadow-inner"
              />

              <Button
                onClick={handleManualSearch}
                disabled={loading || !manualInput.trim()}
                className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white px-10 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Search className="w-6 h-6 mr-3" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Helper Text */}
          <div className="mt-8 flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 shadow-sm">
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-500" />
             </div>
             <p className="text-sm font-medium text-emerald-700 leading-relaxed">
               Our AI Scanner matches products against environmental databases to calculate water footprint, carbon emission, and recyclability.
             </p>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f0faf5]/90 backdrop-blur-sm">
            <div className="bg-white rounded-[3rem] p-16 flex flex-col items-center shadow-2xl border border-emerald-50 max-w-md w-full mx-4">
              <div className="relative w-48 h-48 mb-10">
                <div className="absolute inset-0 rounded-full border-[6px] border-emerald-100" />
                <div
                  className="absolute inset-0 rounded-full border-[6px] border-emerald-500 border-t-transparent"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <div className="absolute inset-6 rounded-full bg-emerald-50/50 flex items-center justify-center">
                  <Scan className="w-20 h-20 text-emerald-500 animate-pulse" />
                </div>
              </div>

              <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">
                Analyzing...
              </h3>
              <p className="text-gray-500 font-bold text-center text-lg leading-tight uppercase tracking-tight">
                Calculating Eco <span className="text-emerald-500">Impact</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillScanner;
