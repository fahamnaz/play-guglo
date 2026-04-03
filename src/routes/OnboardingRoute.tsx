import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mascot } from '../components/home/Mascot';
import type { MascotState } from '../data/mascotConfig';

const HEADING_FONT = '"Fredoka One", "Arial Rounded MT Bold", "Varela Round", "Comic Sans MS", sans-serif';
const BODY_FONT = '"Nunito", "Quicksand", "Segoe UI Rounded", "Comic Sans MS", sans-serif';

interface OnboardingRouteProps {
  onComplete: () => void;
}

export function OnboardingRoute({ onComplete }: OnboardingRouteProps) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState("Hi! I'm your PlaySpark buddy!");
  const [mascotNonce, setMascotNonce] = useState(0);
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Mixing magic potions...');

  const speak = useCallback((text: string, state: MascotState) => {
    setMascotLine(text); setMascotState(state); setMascotNonce(n => n + 1);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.3; utterance.rate = 1.1;
      utterance.onend = () => { setMascotState('idle'); setMascotNonce(n => n + 1); };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Mascot interactions per step
  useEffect(() => {
    if (step === 0) speak("Hi! I'm your PlaySpark buddy! Let's build your world!", 'happy');
    if (step === 1) speak("How many years old are you?", 'idle');
    if (step === 2) speak("What are your favorite things to do?", 'happy');
    if (step === 3) speak("What magic shall we learn today?", 'idle');
    if (step === 4) speak("Building your magical learning path!", 'happy');
  }, [step, speak]);

  // Loading Screen Logic
  useEffect(() => {
    if (step === 4) {
      const texts = [
        "Analyzing age band priorities...",
        "Setting up auditory modality...",
        "Boosting phonics & counting magic...",
        "Ready to play!"
      ];
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 2;
        setLoadingProgress(currentProgress);
        
        if (currentProgress === 25) setLoadingText(texts[0]);
        if (currentProgress === 50) setLoadingText(texts[1]);
        if (currentProgress === 75) setLoadingText(texts[2]);
        if (currentProgress >= 100) {
          setLoadingText(texts[3]);
          clearInterval(interval);
          
          // Generate the backend JSON data
          const onboardingData = {
            age_band: age && age <= 5 ? "preschool" : "early_primary",
            preferred_modality: interests.includes('music') || interests.includes('stories') ? "auditory" : "visual",
            priors_boosted: goals,
            confidence: 0.40
          };
          console.log("Onboarding Complete! Personalized Data:", onboardingData);
          
          setTimeout(onComplete, 1500); // Transition to Home
        }
      }, 60);
      
      return () => clearInterval(interval);
    }
  }, [step, age, interests, goals, onComplete]);

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const playSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextCtor) {
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
  };

  const nextStep = () => { playSound(); setStep(s => s + 1); };

  const CartoonButton = ({ children, onClick, active = false, color = 'bg-white' }: any) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, y: 4, boxShadow: '0 0px 0 rgba(0,0,0,0)' }}
      onClick={onClick}
      className={`rounded-3xl border-[6px] border-white px-8 py-6 text-3xl font-black shadow-[0_12px_0_rgba(0,0,0,0.15)] transition-colors
        ${active ? 'bg-green-400 text-white shadow-[0_12px_0_rgba(21,128,61,0.8)]' : `${color} text-slate-700 hover:bg-slate-50`}
      `}
      style={{ fontFamily: HEADING_FONT }}
    >
      {children}
    </motion.button>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-sky-200 flex items-center justify-center">
      {/* Background Image: using gardenbg2.jpeg as requested */}
      <img src="/gardenbg2.jpeg" alt="Garden Theme" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[3px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-sky-300/50 backdrop-blur-[2px]" /> 
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -40 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="relative z-10 w-full max-w-4xl px-6"
        >
          {/* STEP 0: WELCOME */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-violet-500/90 p-12 shadow-[0_20px_0_rgba(76,29,149,0.8)] backdrop-blur-sm">
              <span className="text-[100px] animate-bounce drop-shadow-xl">✨</span>
              <h1 className="mt-6 text-6xl font-black text-white" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '3px #8b5cf6', textShadow: '0 8px 0 rgba(0,0,0,0.2)' }}>
                Welcome to PlaySpark!
              </h1>
              <p className="mt-6 text-2xl font-bold text-violet-100" style={{ fontFamily: BODY_FONT }}>
                Before we play, let's build a magical learning path just for you!
              </p>
              <CartoonButton onClick={nextStep} color="bg-yellow-400 mt-10 text-yellow-950">
                Let's Go! 🚀
              </CartoonButton>
            </div>
          )}

          {/* STEP 1: AGE */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-sky-400/90 p-12 shadow-[0_20px_0_rgba(2,132,199,0.8)] backdrop-blur-sm">
              <h2 className="text-5xl font-black text-white" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '2px #0284c7', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                How old are you?
              </h2>
              <div className="mt-10 flex flex-wrap justify-center gap-6">
                {[3, 4, 5, 6, 7].map(num => (
                  <CartoonButton key={num} onClick={() => { setAge(num); nextStep(); }} color="bg-white">
                    {num}
                  </CartoonButton>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: INTERESTS */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-pink-400/90 p-12 shadow-[0_20px_0_rgba(190,24,93,0.8)] backdrop-blur-sm">
              <h2 className="text-5xl font-black text-white" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '2px #be185d', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                What do you love?
              </h2>
              <p className="mt-4 text-xl font-bold text-pink-100" style={{ fontFamily: BODY_FONT }}>Pick as many as you like!</p>
              <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-2xl">
                {[
                  { id: 'music', label: '🎵 Music & Songs' },
                  { id: 'stories', label: '📚 Stories' },
                  { id: 'puzzles', label: '🧩 Puzzles' },
                  { id: 'art', label: '🎨 Drawing' }
                ].map(item => (
                  <CartoonButton key={item.id} active={interests.includes(item.id)} onClick={() => toggleSelection(setInterests, item.id)}>
                    {item.label}
                  </CartoonButton>
                ))}
              </div>
              <CartoonButton onClick={nextStep} color="bg-yellow-400 mt-10 text-yellow-950">
                Next! ➡️
              </CartoonButton>
            </div>
          )}

          {/* STEP 3: GOALS */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-lime-500/90 p-12 shadow-[0_20px_0_rgba(77,124,15,0.8)] backdrop-blur-sm">
              <h2 className="text-5xl font-black text-white" style={{ fontFamily: HEADING_FONT, WebkitTextStroke: '2px #4d7c0f', textShadow: '0 6px 0 rgba(0,0,0,0.15)' }}>
                What shall we learn?
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-6 w-full max-w-2xl">
                {[
                  { id: 'phonics', label: '🔤 Letters & Words' },
                  { id: 'counting', label: '🔢 Numbers & Math' },
                  { id: 'colors', label: '🌈 Shapes & Colors' },
                  { id: 'nature', label: '🌍 Animals & Nature' }
                ].map(item => (
                  <CartoonButton key={item.id} active={goals.includes(item.id)} onClick={() => toggleSelection(setGoals, item.id)}>
                    {item.label}
                  </CartoonButton>
                ))}
              </div>
              <CartoonButton onClick={nextStep} color="bg-yellow-400 mt-10 text-yellow-950">
                Let's Play! 🎉
              </CartoonButton>
            </div>
          )}

          {/* STEP 4: LOADING SCREEN */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center rounded-[50px] border-[8px] border-white bg-violet-600/90 p-16 shadow-[0_20px_0_rgba(76,29,149,0.8)] backdrop-blur-sm">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="text-[120px] drop-shadow-2xl"
              >
                ⚙️
              </motion.div>
              <h2 className="mt-8 text-4xl font-black text-white" style={{ fontFamily: HEADING_FONT }}>
                {loadingText}
              </h2>
              
              {/* Magic Progress Bar */}
              <div className="mt-10 h-8 w-full max-w-md overflow-hidden rounded-full border-4 border-white bg-violet-900/50 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-400 via-yellow-400 to-sky-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <p className="mt-4 text-xl font-bold text-violet-200" style={{ fontFamily: BODY_FONT }}>
                {loadingProgress}% Complete
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
    </main>
  );
}