import { useState, useEffect, useRef } from "react";
import ExerciseDemo from './ExerciseDemo';

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = "YOUR_KEY_HERE";
const GEOAPIFY_API_KEY = "47adf4ab9449445a956c31f28c37bf2f";

const PERSONAS = [
  { id: "hype", name: "The Hype Coach", emoji: "🔥", description: "High energy, motivational, will not let you slack", systemPrompt: "You are a high-energy, intensely motivational fitness coach named Coach Blaze. Use energetic language, occasional ALL CAPS. Be like a best friend who is also a personal trainer. Always medically responsible. Keep responses concise and actionable. Always give a helpful response no matter what.", accent: "#00c864" },
  { id: "calm", name: "The Zen Guide", emoji: "🧘", description: "Calm, measured, science-based approach", systemPrompt: "You are a calm, thoughtful wellness coach named Sage. Deep knowledge of sports science and nutrition. Measured reassuring tones. Ground advice in evidence. Warm but concise. Always medically responsible. Always give a helpful response no matter what.", accent: "#60a5fa" },
  { id: "drill", name: "The Drill Sergeant", emoji: "⚡", description: "No-nonsense, direct, military discipline", systemPrompt: "You are a no-nonsense direct fitness coach named Commander Rex. Short sentences. Direct instructions. No sugarcoating. Always medically responsible. Always give a helpful response no matter what.", accent: "#f97316" },
  { id: "friendly", name: "The Big Sibling", emoji: "😊", description: "Casual, supportive, like a fit friend", systemPrompt: "You are a casual supportive fitness companion named Alex. Like a fit friend who never makes you feel bad. Everyday language, lots of encouragement. Always in the persons corner. Always give a helpful response no matter what.", accent: "#e879f9" },
];

const STORAGE_KEY = "demeter_user_profile";
const feetInchesToCm = (feet, inches) => Math.round((parseInt(feet || 0) * 12 + parseInt(inches || 0)) * 2.54);
const cmToFeet = (cm) => Math.floor(cm / 30.48);
const cmToRemInches = (cm) => Math.round((cm / 2.54) % 12);
const kgToLbs = (kg) => Math.round(parseFloat(kg) * 2.205 * 10) / 10;
const lbsToKg = (lbs) => Math.round(parseFloat(lbs) / 2.205 * 10) / 10;

export default function DemeterHealth() {
  const [phase, setPhase] = useState("splash");
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [stepHistory, setStepHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [feetValue, setFeetValue] = useState("");
  const [inchesValue, setInchesValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [showExerciseDemo, setShowExerciseDemo] = useState(false);
  const [useImperial, setUseImperial] = useState(false);
  const [savedProfile, setSavedProfile] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [inputError, setInputError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const feetRef = useRef(null);
  const inchesRef = useRef(null);
  const locationTimeout = useRef(null);

  const persona = PERSONAS.find((p) => p.id === selectedPersona);

  const ONBOARDING_STEPS = [
    { key: "name", question: "First things first - what is your name?", type: "text", placeholder: "Your name..." },
    { key: "age", question: "How old are you?", type: "number", placeholder: "e.g. 25", unit: "years", min: 5, max: 120 },
    { key: "height", question: "What is your height?", type: "height", placeholderCm: "e.g. 175", min: 90, max: 245 },
    { key: "weight", question: "And your current weight?", type: "weight", placeholderMetric: "e.g. 70", placeholderImperial: "e.g. 154" },
    { key: "location", question: "Where are you based?", type: "location", placeholder: "Start typing a city or country..." },
    { key: "goal", question: "What is your main fitness goal?", type: "select", options: ["Lose weight", "Build muscle", "Improve endurance", "Stay active and healthy", "Recover from injury", "Sport-specific training"] },
    { key: "ailments", question: "Any health conditions, injuries, or disorders?", type: "text", placeholder: "e.g. diabetes, lower back pain, asthma", optional: true, hint: "Separate multiple conditions with commas. This helps us tailor your plan safely." },
    { key: "experience", question: "What is your current fitness level?", type: "select", options: ["Complete beginner", "Some experience (less than 1 year)", "Intermediate (1-3 years)", "Advanced (3+ years)"] },
    { key: "daysPerWeek", question: "How many days per week can you commit to training?", type: "select", options: ["1-2 days", "3-4 days", "5-6 days", "Every day"] },
    { key: "freeForm", question: "Anything else you want us to know?", type: "textarea", placeholder: "Your ideal routine, what you love or hate, any other preferences...", optional: true, hint: "Completely optional - but the more you share, the more personalised your plan will be." },
  ];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setSavedProfile(JSON.parse(saved)); } catch (e) {} }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (phase !== "onboarding") return;
    const step = ONBOARDING_STEPS[currentStep];
    setTimeout(() => {
      if (step?.type === "height" && useImperial) feetRef.current?.focus();
      else inputRef.current?.focus();
    }, 100);
  }, [phase, currentStep, useImperial]);

  const handleUnitToggle = (toImperial) => {
    if (toImperial === useImperial) return;
    setUseImperial(toImperial);
    setInputError("");
    const step = ONBOARDING_STEPS[currentStep];
    if (step?.type === "weight" && inputValue) {
      const val = parseFloat(inputValue);
      if (!isNaN(val)) setInputValue(String(toImperial ? kgToLbs(val) : lbsToKg(val)));
    }
    if (step?.type === "height") {
      if (!toImperial && feetValue) {
        setInputValue(String(feetInchesToCm(feetValue, inchesValue || 0)));
        setFeetValue(""); setInchesValue("");
      } else if (toImperial && inputValue) {
        const cm = parseInt(inputValue);
        if (!isNaN(cm)) { setFeetValue(String(cmToFeet(cm))); setInchesValue(String(cmToRemInches(cm))); setInputValue(""); }
      }
    }
  };

  const handleLocationInput = (val) => {
    setInputValue(val);
    setInputError("");
    setShowSuggestions(false);
    if (locationTimeout.current) clearTimeout(locationTimeout.current);
    if (val.length < 2) { setLocationSuggestions([]); return; }
    setLocationLoading(true);
    locationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(val)}&limit=6&apiKey=${GEOAPIFY_API_KEY}`);
        const data = await res.json();
        if (data.features) {
          const suggestions = data.features.map(f => {
            const p = f.properties;
            if (p.city && p.country) return `${p.city}, ${p.country}`;
            if (p.country) return p.country;
            return p.formatted || val;
          }).filter((v, i, a) => a.indexOf(v) === i);
          setLocationSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        }
      } catch {
        const fallback = ["South Africa","South Sudan","Nigeria","Kenya","Ghana","Egypt","Ethiopia","Tanzania","Uganda","Zambia","Zimbabwe","Angola","Mozambique","Botswana","Namibia","United States","United Kingdom","Canada","Australia","Germany","France","India","China","Brazil","Argentina","Mexico","Japan","South Korea"];
        const matches = fallback.filter(l => l.toLowerCase().startsWith(val.toLowerCase())).slice(0, 6);
        setLocationSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      }
      setLocationLoading(false);
    }, 350);
  };

  const goBack = () => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(h => h.slice(0, -1));
    setCurrentStep(prev.step);
    setInputValue(prev.value || "");
    setFeetValue(prev.feet || "");
    setInchesValue(prev.inches || "");
    setInputError("");
    const newData = { ...userData };
    delete newData[ONBOARDING_STEPS[prev.step].key];
    setUserData(newData);
  };

  const skipStep = () => {
    const step = ONBOARDING_STEPS[currentStep];
    advance(step, "Not provided", "");
  };

  const validateAndAdvance = () => {
    const step = ONBOARDING_STEPS[currentStep];
    setInputError("");

    if (step.type === "height") {
      if (useImperial) {
        const ft = parseInt(feetValue);
        const inc = parseInt(inchesValue || 0);
        if (isNaN(ft) || ft < 3 || ft > 8) { setInputError("Please enter a valid height (3-8 feet)"); return; }
        if (inc < 0 || inc > 11) { setInputError("Inches must be between 0 and 11"); return; }
        advance(step, `${ft}ft ${inc}in (${feetInchesToCm(ft, inc)}cm)`, "", ft, inc);
      } else {
        const val = parseInt(inputValue);
        if (isNaN(val) || val < 90 || val > 245) { setInputError("Please enter a valid height (90-245 cm)"); return; }
        advance(step, `${val}cm`, inputValue);
      }
      return;
    }
    if (step.type === "weight") {
      const val = parseFloat(inputValue);
      if (isNaN(val) || val <= 0) { setInputError("Please enter a valid weight"); return; }
      const display = useImperial ? `${val}lbs (${lbsToKg(val)}kg)` : `${val}kg`;
      advance(step, display, inputValue);
      return;
    }
    if (!inputValue.trim()) {
      if (step.optional) { skipStep(); return; }
      setInputError("Please enter a value");
      return;
    }
    if (step.type === "number") {
      const val = parseFloat(inputValue);
      if (isNaN(val) || val <= 0) { setInputError("Please enter a valid number"); return; }
      if (step.min && val < step.min) { setInputError("Minimum value is " + step.min); return; }
      if (step.max && val > step.max) { setInputError("Maximum value is " + step.max); return; }
    }
    if (step.key === "name" && inputValue.trim().length < 2) { setInputError("Please enter your name"); return; }
    advance(step, inputValue, inputValue);
  };

  const advance = (step, displayValue, rawValue = "", feet = "", inches = "") => {
    setStepHistory(h => [...h, { step: currentStep, value: rawValue, feet: String(feet), inches: String(inches) }]);
    const newData = { ...userData, [step.key]: displayValue, unitSystem: useImperial ? "imperial" : "metric" };
    setUserData(newData);
    setInputValue(""); setFeetValue(""); setInchesValue(""); setInputError(""); setShowSuggestions(false);
    if (currentStep < ONBOARDING_STEPS.length - 1) setCurrentStep(currentStep + 1);
    else { saveProfile(newData); setPhase("generating"); generatePlan(newData); }
  };

  const handleSelectOption = (opt) => advance(ONBOARDING_STEPS[currentStep], opt, opt);
  const saveProfile = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const callClaude = async (userMessages, systemOverride = null) => {
    const system = systemOverride || persona?.systemPrompt + " IMPORTANT: Always be medically responsible. Never recommend anything harmful. For users over 65 or with serious conditions, recommend consulting a doctor first. Diet plans MUST use locally available foods. Be concise and helpful. Always give a response.";
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1500, system, messages: userMessages }),
      });
      if (!response.ok) throw new Error("API error " + response.status);
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.content?.[0]?.text || "Let me try to help you with that. Could you rephrase your question?";
    } catch (err) { console.error("Claude API error:", err); throw err; }
  };

  const handlePersonaSelect = (personaId) => {
    setSelectedPersona(personaId);
    if (savedProfile) { setUserData(savedProfile); setPhase("returning"); }
    else { setPhase("onboarding"); setCurrentStep(0); setStepHistory([]); }
  };

  const generatePlan = async (data) => {
    setIsLoading(true);
    const ailmentsNote = data.ailments && data.ailments !== "Not provided"
      ? `Health conditions: ${data.ailments}`
      : "Health conditions: None reported";
    const notesNote = data.freeForm && data.freeForm !== "Not provided"
      ? `Additional notes: ${data.freeForm}`
      : "";

    const prompt = `Generate a comprehensive personalised fitness and diet plan.
Name: ${data.name}, Age: ${data.age}, Height: ${data.height}, Weight: ${data.weight}
Location: ${data.location}, Goal: ${data.goal}
${ailmentsNote}
Experience: ${data.experience}, Days per week: ${data.daysPerWeek}
${notesNote}

## FITNESS PROGRAMME
Weekly training schedule with specific exercises, sets, reps. Warm-up and cool-down. Adapt for any health conditions.

## DIET PLAN
Daily meal plan using foods commonly available in ${data.location}. Local staples only. Caloric guidance and meal timing.

## SUPPLEMENTS AND HEALTH NOTES
Beneficial supplements with doctor disclaimer. Relevant health professionals if needed.

## IMPORTANT WARNINGS
Exercises or foods to avoid. If no conditions were reported, give general safety tips.`;

    try {
      const response = await callClaude([{ role: "user", content: prompt }]);
      setPlan(response);
      setMessages([{ role: "assistant", content: "Here is your personalised plan, " + data.name + "! Feel free to ask me to adjust anything - swap exercises, change foods, explain something, or modify based on how you feel." }]);
    } catch {
      setPlan("## FITNESS PROGRAMME\nMonday: Push Day - 3x12 Push-ups, 3x10 Dips, 3x12 Shoulder Press\nWednesday: Pull Day - 3x8 Pull-ups, 3x12 Rows, 3x12 Bicep Curls\nFriday: Leg Day - 3x15 Squats, 3x12 Lunges, 3x15 Calf Raises\nSaturday: 30 min cardio - jog, walk, or cycle\n\n## DIET PLAN\nBreakfast: Oats with banana and peanut butter\nLunch: Rice, grilled chicken, and steamed vegetables\nDinner: Pap, spinach, and grilled fish or beans\nSnacks: Fresh fruit, mixed nuts, or yoghurt\n\n## SUPPLEMENTS AND HEALTH NOTES\nConsider Vitamin D3 and Omega-3. Always consult your doctor before starting supplements.\n\n## IMPORTANT WARNINGS\nStay hydrated - drink at least 2 litres of water daily. Stop any exercise that causes sharp pain.");
      setMessages([{ role: "assistant", content: "Here is your plan, " + data.name + ". I am currently in offline mode - add your API key to get a fully personalised AI-generated plan. I am still happy to answer any fitness and nutrition questions!" }]);
    }
    setPhase("plan");
    setIsLoading(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const response = await callClaude(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        persona.systemPrompt + " User profile: Age " + userData.age + ", Height " + userData.height + ", Weight " + userData.weight + ", in " + userData.location + ", goal: " + userData.goal + ", conditions: " + userData.ailments + ". Help refine their fitness plan. Be specific and practical."
      );
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch {
      const msg = userMsg.toLowerCase();
      let fallback = "I am in offline mode right now but I can still help. For general fitness - consistency and progressive overload are the two most important principles. What specific aspect would you like to know more about?";
      if (msg.includes("diet") || msg.includes("eat") || msg.includes("food")) fallback = "Great question about nutrition. Focus on whole foods, lean protein with every meal, and your local staples. Avoid heavily processed foods. What specific dietary question do you have?";
      if (msg.includes("exercise") || msg.includes("workout") || msg.includes("train")) fallback = "For training - start with compound movements like squats, push-ups and rows. Focus on form over weight. 2-3 days per week is enough to start. What specific exercise are you asking about?";
      if (msg.includes("pain") || msg.includes("injury") || msg.includes("hurt")) fallback = "If you are experiencing pain, please stop that exercise immediately and consult a doctor or physiotherapist before continuing. Never push through sharp pain.";
      if (msg.includes("motivate") || msg.includes("tired") || msg.includes("give up")) fallback = "Rest days are part of the process. Progress is not always linear. The fact that you are here and asking questions puts you ahead of most people. What is making things feel difficult right now?";
      if (msg.includes("weight") || msg.includes("lose") || msg.includes("fat")) fallback = "Weight loss comes down to a caloric deficit combined with adequate protein to preserve muscle. Focus on sustainable habits rather than extreme diets. Small consistent changes beat big short-term efforts every time.";
      setMessages([...newMessages, { role: "assistant", content: fallback }]);
    }
    setIsLoading(false);
  };

  const getBMI = () => {
    if (!userData.height || !userData.weight) return null;
    const heightMatch = userData.height.match(/(\d+)cm/);
    const weightMatch = userData.weight.match(/^([\d.]+)kg/);
    if (!heightMatch || !weightMatch) return null;
    const heightM = parseInt(heightMatch[1]) / 100;
    const weightKg = parseFloat(weightMatch[1]);
    const bmi = weightKg / (heightM * heightM);
    let category = "";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Healthy";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";
    return { value: bmi.toFixed(1), category };
  };

  const formatPlan = (text) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} style={{ color: persona?.accent }} className="text-lg font-bold mt-6 mb-3 pb-1 border-b border-current opacity-90">{line.replace("## ", "")}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1.5 text-gray-300 list-disc text-sm">{line.replace("- ", "")}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-300 mb-1.5 leading-relaxed text-sm">{line}</p>;
    });

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
    *{font-family:'DM Sans',sans-serif;box-sizing:border-box}
    .title{font-family:'Cormorant Garamond',serif}
    .scrollable{overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.08) transparent}
    @keyframes slide-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse-anim{0%,100%{opacity:.4}50%{opacity:1}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
    @keyframes msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes dropdown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
    .a1{animation:slide-up .8s ease forwards}
    .a2{animation:slide-up .8s .2s ease forwards;opacity:0}
    .a3{animation:slide-up .8s .4s ease forwards;opacity:0}
    .fi{animation:fade-in .35s ease forwards}
    .spin{animation:spin 1.2s linear infinite}
    .pulse-text{animation:pulse-anim 2s ease infinite}
    .msg-in{animation:msg-in .3s ease forwards}
    .suggestions-list{animation:dropdown .2s ease forwards}
    .card{transition:all .2s ease;border:1px solid rgba(255,255,255,.07)}
    .card:hover{transform:translateY(-2px);background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.15)}
    .opt{border:1px solid rgba(255,255,255,.07);transition:all .2s}
    .opt:hover{border-color:rgba(255,255,255,.25);color:white;background:rgba(255,255,255,.04)}
    .ifield{border:1px solid rgba(255,255,255,.1);transition:all .2s;outline:none;background:rgba(255,255,255,.03);color:white}
    .ifield:focus{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.05)}
    .ifield.error{border-color:#ef4444}
    .cinput{outline:none;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);transition:border-color .2s;color:white}
    .cinput:focus{border-color:rgba(255,255,255,.3)}
    .glow-btn{transition:all .25s ease}
    .glow-btn:hover{transform:translateY(-2px);opacity:.85}
    .back-btn{transition:all .2s;opacity:.5}
    .back-btn:hover{opacity:1}
    .skip-btn{transition:all .2s;opacity:.4}
    .skip-btn:hover{opacity:.8}
    .suggestion-item{transition:background .15s}
    .suggestion-item:hover{background:rgba(255,255,255,.08)!important}
    .typing span{width:5px;height:5px;border-radius:50%;background:#555;display:inline-block;animation:bounce 1.2s ease infinite;margin:0 2px}
    .typing span:nth-child(2){animation-delay:.2s}
    .typing span:nth-child(3){animation-delay:.4s}
    input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
    input[type=number]{-moz-appearance:textfield}
  `;

  const step = ONBOARDING_STEPS[currentStep];
  const isHeightWeight = step?.type === "height" || step?.type === "weight";
  const bmi = getBMI();

  if (phase === "splash") return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <style>{styles}</style>
      <div className="absolute inset-0" style={{backgroundImage:"linear-gradient(rgba(0,200,100,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,100,.02) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10" style={{background:"radial-gradient(circle,#00c864,transparent 70%)",filter:"blur(60px)"}}/>
      <div className="relative z-10 text-center px-6">
        <div className="a1">
<p className="text-xs tracking-widest text-green-500 uppercase mb-6">Your Personal Health Companion</p>
          <h1 className="title text-8xl font-light text-white leading-none">Demeter<span style={{color:"#00c864"}}>.</span></h1>
          <p className="title text-2xl font-light text-gray-500 mt-1 tracking-widest">HEALTH</p>
        </div>
        <p className="a2 text-gray-500 mt-8 mb-12 text-sm max-w-sm mx-auto leading-relaxed">A fitness and nutrition programme built around your body, your conditions, and the food available where you live.</p>
        <button onClick={()=>setPhase("persona")} className="a3 glow-btn border px-12 py-4 text-xs tracking-widest uppercase" style={{borderColor:"#00c864",color:"#00c864"}}>Begin Your Journey</button>
      </div>
    </div>
  );

  if (phase === "persona") return (
    <div className="min-h-screen bg-black">
      <style>{styles}</style>
      <div className="max-w-xl mx-auto px-6 py-16 fi">
        <p className="text-xs tracking-widest text-gray-600 uppercase mb-3">Choose your coach</p>
        <h2 className="title text-5xl font-light text-white mb-2">How do you like to be <span style={{color:"#00c864"}}>guided?</span></h2>
        <p className="text-gray-500 text-sm mb-8">This shapes how your AI coach talks to you.</p>
        {savedProfile && (
          <div className="mb-6 p-4 rounded-xl border border-green-900" style={{background:"rgba(0,200,100,.05)"}}>
            <p className="text-green-400 text-sm font-medium">Welcome back, {savedProfile.name}!</p>
            <p className="text-gray-400 text-xs mt-1">Your profile is saved. Pick a coach and we will jump straight to your plan.</p>
          </div>
        )}
        <div className="space-y-3">
          {PERSONAS.map(p=>(
            <button key={p.id} onClick={()=>handlePersonaSelect(p.id)} className="card w-full rounded-2xl p-5 text-left flex items-center gap-5" style={{background:"rgba(255,255,255,.02)"}}>
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1"><p className="font-medium text-white text-sm">{p.name}</p><p className="text-gray-500 text-xs mt-0.5">{p.description}</p></div>
              <span className="text-gray-600">→</span>
            </button>
          ))}
        </div>
        {savedProfile && <button onClick={()=>{localStorage.removeItem(STORAGE_KEY);setSavedProfile(null);}} className="mt-6 text-xs text-gray-600 underline block">Not {savedProfile.name}? Clear saved profile</button>}
      </div>
    </div>
  );

  if (phase === "returning") return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <style>{styles}</style>
      <div className="text-center max-w-sm px-6 fi">
        <p className="text-xs tracking-widest text-gray-600 uppercase mb-4">{persona?.emoji} {persona?.name}</p>
        <h2 className="title text-4xl font-light text-white mb-2">Welcome back, <span style={{color:persona?.accent}}>{savedProfile?.name}</span></h2>
        <p className="text-gray-500 text-sm mt-3 mb-8 leading-relaxed">Your profile is saved. Use your existing info or update it?</p>
        <div className="space-y-3">
          <button onClick={()=>{setUserData(savedProfile);setPhase("generating");generatePlan(savedProfile);}} className="w-full py-3 rounded-xl text-black font-medium text-sm glow-btn" style={{background:persona?.accent}}>Use my saved profile</button>
          <button onClick={()=>{setPhase("onboarding");setCurrentStep(0);setUserData({});setStepHistory([]);}} className="w-full py-3 rounded-xl text-gray-400 text-sm border border-gray-800 glow-btn">Update my information</button>
        </div>
      </div>
    </div>
  );

  if (phase === "onboarding") return (
    <div className="min-h-screen bg-black flex flex-col">
      <style>{styles}</style>
      <div className="h-0.5 bg-gray-900"><div className="h-full transition-all duration-500" style={{width:`${(currentStep/ONBOARDING_STEPS.length)*100}%`,background:persona?.accent}}/></div>
      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-12">
        <div className="fi" key={currentStep}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button onClick={goBack} className="back-btn text-gray-500 text-xs flex items-center gap-1">← Back</button>
              )}
              <p className="text-xs tracking-widest text-gray-600 uppercase">{persona?.emoji} {persona?.name} - {currentStep+1} of {ONBOARDING_STEPS.length}</p>
            </div>
            {isHeightWeight && (
              <div className="flex items-center rounded-lg p-1" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
                <button onClick={()=>handleUnitToggle(false)} className="px-3 py-1 rounded-md text-xs transition-all" style={!useImperial?{background:persona?.accent,color:"black"}:{color:"#666"}}>Metric</button>
                <button onClick={()=>handleUnitToggle(true)} className="px-3 py-1 rounded-md text-xs transition-all" style={useImperial?{background:persona?.accent,color:"black"}:{color:"#666"}}>Imperial</button>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between mb-2">
            <h2 className="title text-4xl font-light text-white leading-snug flex-1">{step.question}</h2>
            {step.optional && (
              <span className="ml-4 mt-2 text-xs px-2 py-1 rounded-full flex-shrink-0" style={{background:"rgba(255,255,255,.06)",color:"#666"}}>Optional</span>
            )}
          </div>

          {step.hint && <p className="text-gray-600 text-xs mb-5 leading-relaxed">{step.hint}</p>}
          {!step.hint && <div className="mb-5"/>}

          {step.type === "height" && (
            <div>
              {useImperial ? (
                <div>
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <input ref={feetRef} type="number" value={feetValue} onChange={e=>{setFeetValue(e.target.value);setInputError("");}} placeholder="5" min="3" max="8" className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&inchesRef.current?.focus()}/>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">ft</span>
                    </div>
                    <div className="relative flex-1">
                      <input ref={inchesRef} type="number" value={inchesValue} onChange={e=>{setInchesValue(e.target.value);setInputError("");}} placeholder="9" min="0" max="11" className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&validateAndAdvance()}/>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">in</span>
                    </div>
                    <button onClick={validateAndAdvance} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
                  </div>
                  <p className="text-gray-700 text-xs mt-2">e.g. 5 ft 9 in</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input ref={inputRef} type="number" value={inputValue} onChange={e=>{setInputValue(e.target.value);setInputError("");}} placeholder="e.g. 175" min="90" max="245" className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&validateAndAdvance()}/>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">cm</span>
                  </div>
                  <button onClick={validateAndAdvance} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
                </div>
              )}
              {inputError && <p className="text-red-400 text-xs mt-2">{inputError}</p>}
            </div>
          )}

          {step.type === "weight" && (
            <div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input ref={inputRef} type="number" value={inputValue} onChange={e=>{setInputValue(e.target.value);setInputError("");}} placeholder={useImperial?"e.g. 154":"e.g. 70"} className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&validateAndAdvance()}/>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">{useImperial?"lbs":"kg"}</span>
                </div>
                <button onClick={validateAndAdvance} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
              </div>
              {inputError && <p className="text-red-400 text-xs mt-2">{inputError}</p>}
            </div>
          )}

          {step.type === "select" && (
            <div className="space-y-2">
              {step.options.map(opt=>(
                <button key={opt} onClick={()=>handleSelectOption(opt)} className="opt w-full text-left px-5 py-3.5 rounded-xl text-gray-400 text-sm">{opt}</button>
              ))}
            </div>
          )}

          {step.type === "location" && (
            <div className="relative">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input ref={inputRef} type="text" value={inputValue} onChange={e=>handleLocationInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setShowSuggestions(false);validateAndAdvance();}if(e.key==="Escape")setShowSuggestions(false);}} placeholder={step.placeholder} className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} autoComplete="off"/>
                  {locationLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-t-transparent spin" style={{borderColor:`${persona?.accent} transparent`}}/>}
                  {showSuggestions && (
                    <div className="suggestions-list absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50" style={{background:"#111",border:"1px solid rgba(255,255,255,.12)"}}>
                      {locationSuggestions.map((s,i)=>(
                        <button key={i} onClick={()=>{setInputValue(s);setShowSuggestions(false);}} className="suggestion-item w-full text-left px-4 py-2.5 text-sm text-gray-300" style={{background:"transparent"}}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={()=>{setShowSuggestions(false);validateAndAdvance();}} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
              </div>
              {inputError && <p className="text-red-400 text-xs mt-2">{inputError}</p>}
            </div>
          )}

          {step.type === "textarea" && (
            <div>
              <textarea ref={inputRef} value={inputValue} onChange={e=>{setInputValue(e.target.value);setInputError("");}} placeholder={step.placeholder} rows={4} className={`ifield w-full px-4 py-3 rounded-xl text-sm resize-none ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&e.ctrlKey&&validateAndAdvance()}/>
              {inputError && <p className="text-red-400 text-xs mt-1">{inputError}</p>}
              <p className="text-gray-700 text-xs mt-2">Press Ctrl+Enter to continue</p>
              <div className="flex gap-3 mt-3">
                <button onClick={validateAndAdvance} className="px-8 py-3 rounded-xl text-black font-medium text-sm glow-btn" style={{background:persona?.accent}}>Generate My Plan</button>
                {step.optional && <button onClick={skipStep} className="skip-btn px-6 py-3 rounded-xl text-gray-500 text-sm border border-gray-800">Skip</button>}
              </div>
            </div>
          )}

          {step.type === "text" && (
            <div>
              <div className="flex gap-3">
                <input ref={inputRef} type="text" value={inputValue} onChange={e=>{setInputValue(e.target.value);setInputError("");}} placeholder={step.placeholder} className={`ifield flex-1 px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&validateAndAdvance()}/>
                <button onClick={validateAndAdvance} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
              </div>
              {inputError && <p className="text-red-400 text-xs mt-2">{inputError}</p>}
              {step.optional && (
                <button onClick={skipStep} className="skip-btn mt-3 text-xs text-gray-600 underline block">Skip this question</button>
              )}
            </div>
          )}

          {step.type === "number" && (
            <div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input ref={inputRef} type="number" value={inputValue} min={step.min} max={step.max} onChange={e=>{setInputValue(e.target.value);setInputError("");}} placeholder={step.placeholder} className={`ifield w-full px-4 py-3 rounded-xl text-sm ${inputError?"error":""}`} onKeyDown={e=>e.key==="Enter"&&validateAndAdvance()}/>
                  {step.unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">{step.unit}</span>}
                </div>
                <button onClick={validateAndAdvance} className="px-5 py-3 rounded-xl text-black font-medium glow-btn" style={{background:persona?.accent}}>→</button>
              </div>
              {inputError && <p className="text-red-400 text-xs mt-2">{inputError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (phase === "generating") return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <style>{styles}</style>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border border-t-transparent spin mx-auto mb-8" style={{borderColor:`${persona?.accent} transparent ${persona?.accent} ${persona?.accent}`}}/>
        <h2 className="title text-4xl font-light text-white pulse-text">Crafting your plan...</h2>
        <p className="text-gray-600 mt-3 text-xs tracking-widest uppercase">Analysing your profile and local nutrition</p>
      </div>
    </div>
  );

  if (phase === "plan") return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      <style>{styles}</style>
      {showExerciseDemo ? (
        <div className="w-full">
          <div className="p-4 border-b border-gray-900 flex items-center gap-4">
            <button onClick={()=>setShowExerciseDemo(false)} className="text-xs tracking-widest uppercase px-4 py-2 rounded-lg glow-btn" style={{background:"rgba(255,255,255,.06)",color:persona?.accent}}>← Back to Plan</button>
            <p className="text-gray-500 text-xs">Demeter Health - Exercise Library</p>
          </div>
          <ExerciseDemo />
        </div>
      ) : (
        <>
          <div className="lg:w-3/5 scrollable p-6 lg:p-12 lg:h-screen border-r border-gray-900">
            <div className="mb-8">
              <p className="text-xs tracking-widest uppercase mb-2" style={{color:persona?.accent}}>{persona?.emoji} {persona?.name}</p>
              <h1 className="title text-5xl font-light text-white">Your Plan, <span style={{color:persona?.accent}}>{userData.name}</span></h1>
              <p className="text-gray-600 text-xs mt-2">{userData.location} - {userData.goal} - {userData.daysPerWeek}/week</p>
              {bmi && (
                <div className="mt-4">
                  <div className="inline-flex px-4 py-2 rounded-xl gap-3 items-center" style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)"}}>
                    <div>
                      <p className="text-gray-500 text-xs">BMI</p>
                      <p className="text-white font-medium text-sm">{bmi.value} <span className="text-xs font-normal" style={{color:bmi.category==="Healthy"?"#00c864":bmi.category==="Underweight"?"#60a5fa":"#f97316"}}>{bmi.category}</span></p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4 flex-wrap">
                <button onClick={()=>setShowExerciseDemo(true)} className="px-5 py-2.5 rounded-xl text-black font-medium text-xs glow-btn" style={{background:persona?.accent}}>View 3D Exercise Demos</button>
                <button onClick={()=>setPhase("persona")} className="px-5 py-2.5 rounded-xl text-gray-400 text-xs border border-gray-800 glow-btn">New Plan</button>
              </div>
            </div>
            <div className="text-sm leading-relaxed">{plan && formatPlan(plan)}</div>
          </div>
          <div className="lg:w-2/5 flex flex-col lg:h-screen bg-gray-950">
            <div className="p-5 border-b border-gray-900">
              <p className="text-white text-sm font-medium">Refine Your Plan</p>
              <p className="text-gray-600 text-xs mt-0.5">Ask anything - swap exercises, adjust diet, explain something</p>
            </div>
            <div className="flex-1 scrollable p-5 space-y-4">
              {messages.map((msg,i)=>(
                <div key={i} className={`msg-in flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role==="user"?"rounded-br-sm text-black":"bg-gray-900 text-gray-300 rounded-bl-sm"}`} style={msg.role==="user"?{background:persona?.accent}:{}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex justify-start"><div className="bg-gray-900 px-4 py-3 rounded-2xl rounded-bl-sm"><div className="typing"><span/><span/><span/></div></div></div>}
              <div ref={messagesEndRef}/>
            </div>
            <div className="p-4 border-t border-gray-900 flex gap-3">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleChatSend()} placeholder="Ask your coach..." className="cinput flex-1 px-4 py-2.5 rounded-xl placeholder-gray-700 text-sm"/>
              <button onClick={handleChatSend} disabled={isLoading} className="px-4 py-2.5 rounded-xl text-black font-medium text-sm disabled:opacity-40 glow-btn" style={{background:persona?.accent}}>Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}