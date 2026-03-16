import { useState, useEffect, useRef } from "react";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = "YOUR_KEY_HERE";

const PERSONAS = [
  {
    id: "hype",
    name: "The Hype Coach",
    emoji: "🔥",
    description: "High energy, motivational, will not let you slack",
    systemPrompt: "You are a high-energy, intensely motivational fitness coach. You use energetic language, occasional ALL CAPS for emphasis, and keep the user pumped up. You are like a best friend who is also a personal trainer. Use phrases like LET'S GO!, You have GOT this!, No excuses! - but still be genuinely helpful and medically responsible. Never recommend anything dangerous.",
    accent: "#00c864",
  },
  {
    id: "calm",
    name: "The Zen Guide",
    emoji: "🧘",
    description: "Calm, measured, science-based approach",
    systemPrompt: "You are a calm, thoughtful wellness coach with deep knowledge of sports science and nutrition. You speak in measured, reassuring tones. You validate peoples journeys, never judge, and always ground advice in evidence. Be warm but never fluffy.",
    accent: "#60a5fa",
  },
  {
    id: "drill",
    name: "The Drill Sergeant",
    emoji: "⚡",
    description: "No-nonsense, direct, military discipline",
    systemPrompt: "You are a no-nonsense, direct fitness coach. You do not sugarcoat things. Short sentences. Direct instructions. You respect discipline above all. BUT - you are medically responsible. You always adapt to the persons real physical condition and limitations.",
    accent: "#f97316",
  },
  {
    id: "friendly",
    name: "The Big Sibling",
    emoji: "😊",
    description: "Casual, supportive, like a fit friend",
    systemPrompt: "You are a casual, supportive fitness companion - like that one friend who is really into fitness but never makes you feel bad about yourself. You use everyday language, lots of encouragement. You are approachable, non-intimidating, and always in the persons corner.",
    accent: "#e879f9",
  },
];

const ONBOARDING_STEPS = [
  { key: "name", question: "First things first - what is your name?", type: "text", placeholder: "Your name..." },
  { key: "age", question: "How old are you?", type: "number", placeholder: "Your age...", unit: "years" },
  { key: "height", question: "What is your height?", type: "number", placeholder: "e.g. 175", unit: "cm" },
  { key: "weight", question: "And your current weight?", type: "number", placeholder: "e.g. 70", unit: "kg" },
  { key: "location", question: "Where are you based? (City or Country)", type: "text", placeholder: "e.g. Johannesburg, South Africa" },
  { key: "goal", question: "What is your main fitness goal?", type: "select", options: ["Lose weight", "Build muscle", "Improve endurance", "Stay active and healthy", "Recover from injury", "Sport-specific training"] },
  { key: "ailments", question: "Any health conditions, injuries, or disorders I should know about?", type: "text", placeholder: "e.g. lower back pain, diabetes, asthma - or type none" },
  { key: "experience", question: "What is your current fitness level?", type: "select", options: ["Complete beginner", "Some experience (less than 1 year)", "Intermediate (1-3 years)", "Advanced (3+ years)"] },
  { key: "daysPerWeek", question: "How many days per week can you commit to training?", type: "select", options: ["1-2 days", "3-4 days", "5-6 days", "Every day"] },
  { key: "freeForm", question: "Last thing - tell me anything else about what you want.", type: "textarea", placeholder: "Be as specific or as vague as you like..." },
];

export default function DemeterHealth() {
  const [phase, setPhase] = useState("splash");
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const persona = PERSONAS.find((p) => p.id === selectedPersona);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (phase === "onboarding") inputRef.current?.focus(); }, [phase, currentStep]);

  const callClaude = async (userMessages, systemOverride = null) => {
    const system = systemOverride || persona?.systemPrompt + " IMPORTANT RULES: Always be medically responsible. Never recommend anything that could harm someone with their stated health conditions. For users over 65 or with serious conditions, always recommend consulting a doctor first. Diet plans MUST use locally available foods from their stated location. Be concise but thorough.";

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1000, system, messages: userMessages }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "Something went wrong. Please try again.";
  };

  const handlePersonaSelect = (personaId) => {
    setSelectedPersona(personaId);
    setPhase("onboarding");
    setCurrentStep(0);
  };

  const handleOnboardingSubmit = async () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (!inputValue.trim()) return;
    const newUserData = { ...userData, [step.key]: inputValue };
    setUserData(newUserData);
    setInputValue("");
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setPhase("generating");
      await generatePlan(newUserData);
    }
  };

  const generatePlan = async (data) => {
    setIsLoading(true);
    setPlan("## FITNESS PROGRAMME\nMonday: Push Day - 3x12 Push-ups, 3x12 Dips, 3x15 Shoulder Press\nWednesday: Pull Day - 3x10 Pull-ups, 3x12 Rows, 3x15 Bicep Curls\nFriday: Leg Day - 3x15 Squats, 3x12 Lunges, 3x15 Calf Raises\nSaturday: Cardio - 30 min jog or cycling\n\n## DIET PLAN\nBreakfast: Oats with banana and peanut butter\nLunch: Rice, chicken, and vegetables\nDinner: Pap, spinach, and grilled fish\nSnacks: Fruit, nuts, yoghurt\n\n## SUPPLEMENTS AND HEALTH NOTES\nConsider Vitamin D and Omega-3. Consult your doctor before starting any supplements.\n\n## IMPORTANT WARNINGS\nStay hydrated. Rest when needed. Stop if you feel pain.");
    setMessages([{ role: "assistant", content: "Here is your personalised plan, " + data.name + "! Feel free to ask me anything - adjust exercises, swap foods, or ask for explanations." }]);
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
        persona.systemPrompt + " User profile: Age " + userData.age + ", " + userData.weight + "kg, " + userData.height + "cm, in " + userData.location + ", goal: " + userData.goal + ", conditions: " + userData.ailments + ". Current plan: " + plan
      );
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, something went wrong. Try again!" }]);
    }
    setIsLoading(false);
  };

  const formatPlan = (text) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} style={{ color: persona?.accent }} className="text-lg font-bold mt-6 mb-2 border-b border-current pb-1">{line.replace("## ", "")}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1 text-gray-300 list-disc">{line.replace("- ", "")}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-300 mb-1 leading-relaxed text-sm">{line}</p>;
    });

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
    * { font-family: 'DM Sans', sans-serif; }
    .title { font-family: 'Cormorant Garamond', serif; }
    .scrollable { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
    @keyframes slide-up { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fade-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .a1{animation:slide-up .8s ease forwards}
    .a2{animation:slide-up .8s .2s ease forwards;opacity:0}
    .a3{animation:slide-up .8s .4s ease forwards;opacity:0}
    .fi{animation:fade-in .35s ease forwards}
    .spin{animation:spin 1.2s linear infinite}
    .pulse{animation:pulse 2s ease infinite}
    .msg-in{animation:msg-in .3s ease forwards}
    .card{transition:all .2s ease;border:1px solid rgba(255,255,255,.07)}
    .card:hover{transform:translateY(-2px);background:rgba(255,255,255,.04)!important}
    .opt{border:1px solid rgba(255,255,255,.07);transition:all .2s}
    .opt:hover{color:white}
    .ifield{border:1px solid rgba(255,255,255,.1);transition:border-color .2s;outline:none;background:rgba(255,255,255,.03)}
    .cinput{outline:none;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);transition:border-color .2s}
    .glow:hover{box-shadow:0 0 40px rgba(0,200,100,.25);transform:translateY(-2px)}
    .glow{transition:all .25s ease}
    .typing span{width:5px;height:5px;border-radius:50%;background:#555;display:inline-block;animation:bounce 1.2s ease infinite;margin:0 2px}
    .typing span:nth-child(2){animation-delay:.2s}
    .typing span:nth-child(3){animation-delay:.4s}
  `;

  if (phase === "splash") return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <style>{styles}</style>
      <div className="absolute inset-0" style={{backgroundImage:"linear-gradient(rgba(0,200,100,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,100,.025) 1px,transparent 1px)",backgroundSize:"40px 40px"}} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10" style={{background:"radial-gradient(circle,#00c864,transparent 70%)",filter:"blur(60px)"}} />
      <div className="relative z-10 text-center px-6">
        <div className="a1">
          <p className="text-xs tracking-widest text-green-500 uppercase mb-6">Your Personal Health Companion</p>
          <h1 className="title text-8xl font-light text-white leading-none">Demeter<span style={{color:"#00c864"}}>.</span></h1>
          <p className="title text-2xl font-light text-gray-500 mt-1 tracking-widest">HEALTH</p>
        </div>
        <p className="a2 text-gray-500 mt-8 mb-12 text-sm max-w-sm mx-auto leading-relaxed">A fitness and nutrition programme built around your body, your conditions, and the food available where you live.</p>
        <button onClick={() => setPhase("persona")} className="a3 glow border px-12 py-4 text-xs tracking-widest uppercase" style={{borderColor:"#00c864",color:"#00c864"}}>Begin Your Journey</button>
      </div>
    </div>
  );

  if (phase === "persona") return (
    <div className="min-h-screen bg-black">
      <style>{styles}</style>
      <div className="max-w-xl mx-auto px-6 py-16 fi">
        <p className="text-xs tracking-widest text-gray-600 uppercase mb-3">Choose your coach</p>
        <h2 className="title text-5xl font-light text-white mb-2">How do you like to be <span style={{color:"#00c864"}}>guided?</span></h2>
        <p className="text-gray-500 text-sm mb-10">This shapes how your AI coach talks to you.</p>
        <div className="space-y-3">
          {PERSONAS.map(p => (
            <button key={p.id} onClick={() => handlePersonaSelect(p.id)} className="card w-full rounded-2xl p-5 text-left flex items-center gap-5" style={{background:"rgba(255,255,255,.02)"}}>
              <span className="text-3xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{p.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>
              </div>
              <span className="text-gray-600">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (phase === "onboarding") {
    const step = ONBOARDING_STEPS[currentStep];
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <style>{styles}</style>
        <div className="h-0.5 bg-gray-900"><div className="h-full transition-all duration-500" style={{width:`${(currentStep/ONBOARDING_STEPS.length)*100}%`,background:persona?.accent}} /></div>
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-12">
          <div className="fi" key={currentStep}>
            <p className="text-xs tracking-widest text-gray-600 uppercase mb-6">{persona?.emoji} {persona?.name} - {currentStep+1} of {ONBOARDING_STEPS.length}</p>
            <h2 className="title text-4xl font-light text-white mb-8 leading-snug">{step.question}</h2>
            {step.type === "select" ? (
              <div className="space-y-2">
                {step.options.map(opt => (
                  <button key={opt} onClick={() => { const d={...userData,[step.key]:opt}; setUserData(d); if(currentStep<ONBOARDING_STEPS.length-1) setCurrentStep(currentStep+1); else{setPhase("generating");generatePlan(d);} }} className="opt w-full text-left px-5 py-3.5 rounded-xl text-gray-400 text-sm">{opt}</button>
                ))}
              </div>
            ) : step.type === "textarea" ? (
              <div>
                <textarea ref={inputRef} value={inputValue} onChange={e=>setInputValue(e.target.value)} placeholder={step.placeholder} rows={4} className="ifield w-full px-4 py-3 rounded-xl text-white placeholder-gray-700 text-sm resize-none" onKeyDown={e=>e.key==="Enter"&&e.ctrlKey&&handleOnboardingSubmit()} />
                <button onClick={handleOnboardingSubmit} className="mt-4 px-8 py-3 rounded-xl text-black font-medium text-sm" style={{background:persona?.accent}}>Generate My Plan</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input ref={inputRef} type={step.type} value={inputValue} onChange={e=>setInputValue(e.target.value)} placeholder={step.placeholder} className="ifield w-full px-4 py-3 rounded-xl text-white placeholder-gray-700 text-sm" onKeyDown={e=>e.key==="Enter"&&handleOnboardingSubmit()} />
                  {step.unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs">{step.unit}</span>}
                </div>
                <button onClick={handleOnboardingSubmit} className="px-5 py-3 rounded-xl text-black font-medium" style={{background:persona?.accent}}>→</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "generating") return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <style>{styles}</style>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border border-t-transparent spin mx-auto mb-8" style={{borderColor:`${persona?.accent} transparent ${persona?.accent} ${persona?.accent}`}} />
        <h2 className="title text-4xl font-light text-white pulse">Crafting your plan...</h2>
        <p className="text-gray-600 mt-3 text-xs tracking-widest uppercase">Analysing your profile and local nutrition</p>
      </div>
    </div>
  );

  if (phase === "plan") return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row">
      <style>{styles}</style>
      <div className="lg:w-3/5 scrollable p-6 lg:p-12 lg:h-screen border-r border-gray-900">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase mb-2" style={{color:persona?.accent}}>{persona?.emoji} {persona?.name}</p>
          <h1 className="title text-5xl font-light text-white">Your Plan, <span style={{color:persona?.accent}}>{userData.name}</span></h1>
          <p className="text-gray-600 text-xs mt-2">{userData.location} - {userData.goal} - {userData.daysPerWeek}/week</p>
        </div>
        <div className="text-sm leading-relaxed">{plan && formatPlan(plan)}</div>
      </div>
      <div className="lg:w-2/5 flex flex-col lg:h-screen bg-gray-950">
        <div className="p-5 border-b border-gray-900">
          <p className="text-white text-sm font-medium">Refine Your Plan</p>
          <p className="text-gray-600 text-xs mt-0.5">Ask anything - swap exercises, adjust diet, explain something</p>
        </div>
        <div className="flex-1 scrollable p-5 space-y-4">
          {messages.map((msg,i) => (
            <div key={i} className={`msg-in flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
              <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role==="user"?"rounded-br-sm text-black":"bg-gray-900 text-gray-300 rounded-bl-sm"}`} style={msg.role==="user"?{background:persona?.accent}:{}}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="bg-gray-900 px-4 py-3 rounded-2xl rounded-bl-sm"><div className="typing"><span/><span/><span/></div></div></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-900 flex gap-3">
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleChatSend()} placeholder="Ask your coach..." className="cinput flex-1 px-4 py-2.5 rounded-xl text-white placeholder-gray-700 text-sm" />
          <button onClick={handleChatSend} disabled={isLoading} className="px-4 py-2.5 rounded-xl text-black font-medium text-sm disabled:opacity-40" style={{background:persona?.accent}}>Send</button>
        </div>
      </div>
    </div>
  );
}