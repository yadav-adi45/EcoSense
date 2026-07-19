import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Recycle,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Scan,
  TrendingDown,
  Info
} from "lucide-react";
import Footer from "@/pages/Footer";

const BillResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0faf5]">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-emerald-100 text-center max-w-md mx-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Info className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">No Data Found</h2>
          <p className="text-gray-500 font-medium mb-8">It seems like you haven't scanned a bill yet or the analysis was interrupted.</p>
          <Button
            onClick={() => navigate("/bill-scanner")}
            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200"
          >
            Return to Scanner
          </Button>
        </div>
      </div>
    );
  }

  const getImpactStyles = (impact) => {
    switch (impact) {
      case "hazardous":
        return {
          border: "border-red-100",
          bg: "bg-red-50/30",
          badge: "bg-red-500/10 text-red-600",
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        };
      case "moderate":
        return {
          border: "border-orange-100",
          bg: "bg-orange-50/30",
          badge: "bg-orange-500/10 text-orange-600",
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        };
      case "eco":
        return {
          border: "border-emerald-100",
          bg: "bg-emerald-50/30",
          badge: "bg-emerald-500/10 text-emerald-600",
          icon: <Leaf className="w-5 h-5 text-emerald-500" />,
        };
      default:
        return {
          border: "border-gray-100",
          bg: "bg-gray-50/30",
          badge: "bg-gray-500/10 text-gray-600",
          icon: <CheckCircle className="w-5 h-5 text-gray-500" />,
        };
    }
  };

  const getScoreColor = (score) => {
    if (score <= 10) return "text-emerald-500";
    if (score <= 20) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-[#f0faf5]">
      <Navbar />

      <div className="container mx-auto px-6 py-12 mt-[80px] pb-24">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/bill-scanner")}
          variant="ghost"
          className="mb-8 h-12 bg-white/50 border border-emerald-100/50 rounded-2xl text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Scanner
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Scan className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">AI Vision Analysis</span>
            </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Environmental <span className="text-emerald-500">Report</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            {result.productsDetected} items analyzed from your {result.inputType}.
          </p>
        </div>

        {/* Summary Card */}
        <Card className="max-w-4xl mx-auto mb-12 border-emerald-50 rounded-[3rem] shadow-xl shadow-emerald-900/5 bg-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 blur-[100px] rounded-full pointer-events-none"></div>
          <CardContent className="p-10 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1 text-center md:text-left">
                 <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                    <TrendingDown className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Environmental Impact</h2>
                 </div>
                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">"{result.summary}"</p>
              </div>
              
              <div className="flex items-center gap-6 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-inner">
                <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Pollution Score</span>
                    <span className="text-sm font-bold text-gray-400">Low is Better</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-7xl font-black tracking-tighter ${getScoreColor(result.pollutionScore)}`}>
                      {result.pollutionScore}
                    </div>
                    <div className="text-gray-300 font-bold text-xl">/100</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Breakdown */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                <Recycle className="w-5 h-5 text-emerald-500" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Itemized Analysis</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {result.breakdown.map((item, index) => {
              const styles = getImpactStyles(item.impact);

              return (
                <Card
                  key={index}
                  className={`border-2 ${styles.border} ${styles.bg} rounded-[2.5rem] overflow-hidden transition-all hover:shadow-lg group shadow-sm`}
                >
                  <CardContent className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-black text-gray-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                          {item.item}
                        </h4>
                        <div className="flex gap-2 mt-2">
                             <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${styles.badge}`}>
                                {item.impact}
                            </span>
                             <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white border border-gray-100 text-gray-400">
                                Score: {item.pollution}
                            </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        {styles.icon}
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="text-gray-600 font-medium text-sm leading-relaxed mb-6">
                      {item.reason}
                    </p>

                    {/* Recycling Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs ${
                          item.recyclable
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                            : "bg-red-500 text-white shadow-lg shadow-red-100"
                        }`}>
                            <Recycle className="w-4 h-4" />
                            {item.recyclable ? "Recyclable" : "Non-Recyclable"}
                        </div>
                    </div>

                    {/* Alternatives */}
                    {item.alternatives?.length > 0 && (
                      <div className="pt-6 border-t border-emerald-500/10">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Leaf className="w-4 h-4" />
                          Recommended Alternatives
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.alternatives.map((alt, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-100 shadow-sm hover:scale-105 transition-transform"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Scan Again */}
        <div className="text-center mt-16">
          <Button
            onClick={() => navigate("/bill-scanner")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white h-16 px-12 rounded-[2rem] text-lg font-black shadow-xl shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center mx-auto"
          >
            <Scan className="w-6 h-6 mr-3" />
            Analyze Another Document
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BillResult;
