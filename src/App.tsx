import { Link, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HomeScreen } from './components/home/HomeScreen';
import { OnboardingRoute } from './routes/OnboardingRoute';
import { ScienceSolarRoute } from './routes/ScienceSolarRoute';
import { MatchLettersRoute } from './routes/MatchLettersRoute';
import { GuessWordRoute } from './routes/GuessWordRoute';
import { MathEquationRoute } from './routes/MathEquationRoute';

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-xl text-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <p className="text-cyan-300 text-sm uppercase tracking-[0.35em] mb-4">404</p>
        <h1 className="text-4xl font-black">Route not found</h1>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/5 transition-colors"
          >
            Back to Hub
          </Link>
        </div>
      </div>
    </main>
  );
}

// SMART WRAPPER: Checks memory to see if onboarding is already done
function RootWrapper() {
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // Prevents brief flash of wrong screen

  useEffect(() => {
    // Check the browser's memory when the app first loads
    const savedState = localStorage.getItem('playspark_onboarded');
    if (savedState === 'true') {
      setHasOnboarded(true);
    }
    setIsChecking(false); // Done checking memory
  }, []);

  // Show nothing for a split second while we check memory
  if (isChecking) return null;

  if (!hasOnboarded) {
    return (
      <OnboardingRoute 
        onComplete={() => {
          // Save a tag in memory so we skip this next time!
          localStorage.setItem('playspark_onboarded', 'true');
          setHasOnboarded(true); 
        }} 
      />
    );
  }

  return <HomeScreen />;
}

export default function App() {
  return (
    <Routes>
      {/* Root Route starts with the smart wrapper */}
      <Route path="/" element={<RootWrapper />} />
      
      <Route path="/science-solar" element={<ScienceSolarRoute />} />
      <Route path="/english-match-letters" element={<MatchLettersRoute />} />
      <Route path="/english-guess-word" element={<GuessWordRoute />} />
      <Route path="/math-equations" element={<MathEquationRoute />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}