import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from "react-toastify";
import {
  Zap,
  Car,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Recycle,
  Utensils,
  Home,
  Sparkles,
  Leaf,
  ArrowRight,
  Loader2
} from "lucide-react";
import { serverUrl } from "@/main";
import Footer from "./Footer";

const questions = [
  {
    id: "electricity",
    category: "Energy",
    icon: <Zap className="w-6 h-6" />,
    question: "What's your average monthly electricity consumption?",
    type: "slider",
    min: 0,
    max: 1000,
    unit: "kWh",
    hint: "Roughly estimating from your recent billing history.",
  },
  {
    id: "transport",
    category: "Transportation",
    icon: <Car className="w-6 h-6" />,
    question: "What's your primary mode of transportation?",
    type: "radio",
    options: [
      { value: "public", label: "Public Transport (Metro/Bus)" },
      { value: "carpool", label: "Carpool / Shared Journeys" },
      { value: "personal", label: "Personal Vehicle (Fuel)" },
      { value: "bike", label: "Active Travel (Bicycle/Walking)" },
      { value: "electric", label: "Electric Vehicle (Clean Energy)" },
    ],
  },
  {
    id: "distance",
    category: "Transportation",
    icon: <Car className="w-6 h-6" />,
    question: "How many kilometers do you travel daily?",
    type: "slider",
    min: 0,
    max: 100,
    unit: "km",
  },
  {
    id: "shopping",
    category: "Consumption",
    icon: <ShoppingBag className="w-6 h-6" />,
    question: "How would you describe your shopping habits?",
    type: "radio",
    options: [
      { value: "rarely", label: "Minimalist (Only essentials)" },
      { value: "monthly", label: "Conscious (Regular needs)" },
      { value: "weekly", label: "Frequent (Fashion & Trends)" },
      { value: "secondhand", label: "Sustainable (Pre-loved only)" },
    ],
  },
  {
    id: "diet",
    category: "Lifestyle",
    icon: <Utensils className="w-6 h-6" />,
    question: "How would you describe your dietary choices?",
    type: "radio",
    options: [
      { value: "vegan", label: "Plant-Based (Vegan)" },
      { value: "vegetarian", label: "Vegetarian" },
      { value: "flexitarian", label: "Flexitarian (Low Meat)" },
      { value: "omnivore", label: "Balanced (Regular Meat)" },
    ],
  },
  {
    id: "recycling",
    category: "Environment",
    icon: <Recycle className="w-6 h-6" />,
    question: "Do you actively participate in waste segregation?",
    type: "radio",
    options: [
      { value: "always", label: "Strictly (100% sorting)" },
      { value: "mostly", label: "Often (Major items)" },
      { value: "sometimes", label: "Occasionally" },
      { value: "never", label: "Not active yet" },
    ],
  },
  {
    id: "home",
    category: "Home Efficiency",
    icon: <Home className="w-6 h-6" />,
    question: "Does your residence use smart or energy-efficient tech?",
    type: "radio",
    options: [
      { value: "all", label: "Fully Optimized (Smart Hub)" },
      { value: "most", label: "High Efficiency (Energy Star)" },
      { value: "some", label: "Partial (A few appliances)" },
      { value: "none", label: "Traditional setup" },
    ],
  },
];

const Questionnaire = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  const currentQuestion = questions[currentStep];
  const total = questions.length;
  const progress = ((currentStep + 1) / total) * 100;

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (currentStep < total - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      calculateScore();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const calculateScore = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`${serverUrl}/api/v4/eco`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      toast.success(`Analysis Complete! Score: ${data.assessment.score}`);
      navigate("/dashboard", { state: data.assessment });
    } catch (err) {
      toast.error("Had trouble processing the score.");
    } finally {
      setIsCalculating(false);
    }
  };

  const canProceed = answers[currentQuestion.id] !== undefined;

  return (
    <div className="min-h-screen bg-[#f0faf5] pb-24">
      <Navbar />

      <main className="pt-32 pb-12">
        <div className="container mx-auto px-6 max-w-2xl relative">
            
            
          {/* Progress Section */}
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Analysis <span className="text-emerald-500">Progress</span></h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">{currentStep + 1} of {total} Milestones</p>
              </div>
              <span className="text-2xl font-bold text-emerald-500 tracking-tight">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="w-full h-4 rounded-2xl bg-white border border-emerald-100 p-1 overflow-hidden">
              <div
                className="h-full transition-all duration-700 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="bg-white border-none rounded-2xl shadow-sm border border-emerald-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.04] pointer-events-none -translate-y-4 translate-x-4">
                <Sparkles size={160} className="text-emerald-500" />
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100 bg-emerald-50/20">
                  {currentQuestion.icon}
                </div>
                <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px] bg-emerald-50 px-3 py-1 rounded-full">
                  {currentQuestion.category}
                </span>
              </div>

              <CardTitle className="text-gray-900 text-3xl font-semibold leading-tight tracking-tight uppercase max-w-2xl">
                {currentQuestion.question}
              </CardTitle>

              {currentQuestion.hint && (
                <CardDescription className="text-gray-500 font-medium text-base italic mt-3">
                  "{currentQuestion.hint}"
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-10">
              {/* SLIDER COMPONENT */}
              {currentQuestion.type === "slider" && (
                <div className="space-y-12 py-6">
                  <div className="relative">
                    <Slider
                        className="eco-slider h-4"
                        value={[Number(answers[currentQuestion.id]) ?? currentQuestion.min]}
                        min={currentQuestion.min}
                        max={currentQuestion.max}
                        step={1}
                        onValueChange={(val) => handleAnswer(val[0])}
                    />
                  </div>

                  <div className="flex items-center justify-center p-12 bg-gray-50/30 rounded-2xl border border-dashed border-gray-100 mt-8">
                    <div className="text-center">
                        <span className="text-[5rem] font-bold text-emerald-500 tracking-tighter leading-none block">
                        {answers[currentQuestion.id] ?? currentQuestion.min}
                        </span>
                        <span className="text-gray-400 font-bold text-sm uppercase tracking-[0.2em] mt-3 block">
                        {currentQuestion.unit}
                        </span>
                    </div>
                  </div>
                </div>
              )}

              {/* RADIO GROUP COMPONENT */}
              {currentQuestion.type === "radio" && (
                <RadioGroup
                  value={String(answers[currentQuestion.id] || "")}
                  onValueChange={handleAnswer}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option) => (
                    <Label
                      key={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                        answers[currentQuestion.id] === option.value
                          ? "border-emerald-500 bg-white shadow-xl shadow-emerald-900/10"
                          : "border-gray-50 bg-gray-50/50 hover:border-emerald-200 hover:bg-white"
                      }`}
                    >
                      <RadioGroupItem value={option.value} className="w-6 h-6 border-2 border-emerald-200 text-emerald-500" />
                      <span className={`text-sm font-medium tracking-wide ${answers[currentQuestion.id] === option.value ? 'text-emerald-700' : 'text-gray-600'}`}>
                        {option.label}
                      </span>
                      {answers[currentQuestion.id] === option.value && (
                          <div className="absolute right-6"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div></div>
                      )}
                    </Label>
                  ))}
                </RadioGroup>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex gap-6 pt-10 border-t border-gray-50">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="h-14 flex-1 rounded-2xl border-none bg-gray-50 text-gray-400 font-bold text-base hover:bg-gray-100 transition-all uppercase tracking-widest"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isCalculating}
                  className="h-14 flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-widest"
                >
                  {isCalculating ? (
                      <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          ALGORITHMS RUNNING...
                      </div>
                  ) : currentStep === total - 1 ? (
                    <div className="flex items-center gap-3">
                        GENERATE REPORT <ArrowRight className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                        NEXT <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <p className="text-center mt-12 text-gray-400 text-xs font-medium">Environmental Intelligence Unit • EcoSense V4.0</p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Questionnaire;
