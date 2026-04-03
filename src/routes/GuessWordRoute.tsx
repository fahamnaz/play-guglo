import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useHandTracking } from '../hooks/useHandTracking';
import { GestureCursor } from '../components/home/GestureCursor';
import { Mascot } from '../components/home/Mascot';
import { LetterCube } from '../components/game/LetterCube';
import { SlotBox } from '../components/game/SlotBox';
import { WordImage } from '../components/game/WordImage';
import { words } from '../data/wordList';
import type { MascotState } from '../data/mascotConfig';

interface CubeNode {
  id: string; letter: string;
  colorClass: string; shadowClass: string; textColor: string;
  homeX: number; homeY: number; 
  targetX: number; targetY: number; 
  x: number; y: number; 
  isLocked: boolean; 
}

const COLORS = [
  { bg: 'bg-pink-400', shadow: '#be185d', text: 'text-white' },
  { bg: 'bg-sky-400', shadow: '#0369a1', text: 'text-white' },
  { bg: 'bg-yellow-400', shadow: '#a16207', text: 'text-yellow-950' },
  { bg: 'bg-lime-400', shadow: '#4d7c0f', text: 'text-lime-950' },
  { bg: 'bg-violet-400', shadow: '#5b21b6', text: 'text-white' },
];

export function GuessWordRoute() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { cursor, isReady: handTrackingReady } = useHandTracking(videoRef);

  const [score, setScore] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [cubes, setCubes] = useState<CubeNode[]>([]);
  const [slotsFilled, setSlotsFilled] = useState<boolean[]>([]);
  const [showPrize, setShowPrize] = useState(false);
  const [wrongShakeSlot, setWrongShakeSlot] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isCorrectGlow, setIsCorrectGlow] = useState(false);
  
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [mascotLine, setMascotLine] = useState('Spell the word!');
  const [mascotNonce, setMascotNonce] = useState(0);

  const [hoveredCubeId, setHoveredCubeId] = useState<string | null>(null);
  const [draggedCubeId, setDraggedCubeId] = useState<string | null>(null);

  const currentWord = words[wordIndex % words.length];

  // Engine Refs
  const nodesRef = useRef<Record<string, CubeNode>>({});
  const domRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  
  // ALIGNMENT FIX: Store slots mathematically so Visuals & Physics perfectly match
  const slotPositions = useRef<{x: number, y: number, expected: string, isFilled: boolean}[]>([]);
  
  // Interaction Refs
  const draggedIdRef = useRef<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const pinchLossFramesRef = useRef(0);
  const cursorRef = useRef(cursor);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isWinningRef = useRef(false);

  const playSound = useCallback((type: 'ding' | 'wrong' | 'win' | 'pick') => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current && AudioCtx) audioContextRef.current = new AudioCtx();
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'suspended') ctx?.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);

    if (type === 'pick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'win') {
      [440, 554, 659].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, ctx.currentTime + (i * 0.1));
        g.gain.setValueAtTime(0.2, ctx.currentTime + (i * 0.1));
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i * 0.1) + 0.6);
        o.start(ctx.currentTime + (i * 0.1)); o.stop(ctx.currentTime + (i * 0.1) + 0.6);
      });
    }
  }, []);

  const speak = useCallback((text: string, state: MascotState) => {
    setMascotLine(text); setMascotState(state); setMascotNonce(n => n + 1);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.3; utterance.rate = 1.1;
      utterance.onend = () => { setMascotState('idle'); setMascotNonce(n => n + 1); };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const startLevel = useCallback(() => {
    isWinningRef.current = false;
    setShowPrize(false);
    setIsCorrectGlow(false);
    
    const letters = currentWord.word.split('');
    const shuffled = [...letters].sort(() => 0.5 - Math.random());
    const slotCount = letters.length;
    
    const spacingVw = 14; 
    const slotStartX = 50 - ((slotCount - 1) * spacingVw) / 2;
    const slotY = 40; 

    // Initialize Slots Mathematically
    slotPositions.current = letters.map((letter, i) => ({ 
      x: slotStartX + i * spacingVw, 
      y: slotY,
      expected: letter,
      isFilled: false
    }));

    const trayStartX = 50 - ((slotCount - 1) * spacingVw) / 2;
    const trayY = 82;

    // Initialize Cubes
    const newNodes: Record<string, CubeNode> = {};
    const newCubes = shuffled.map((letter, i) => {
      const color = COLORS[i % COLORS.length];
      const id = `cube-${i}-${letter}-${Date.now()}`; // Ensure unique IDs across levels
      const homeX = trayStartX + i * spacingVw + (Math.random() * 6 - 3); 
      const homeY = trayY + (Math.random() * 4 - 2);
      
      newNodes[id] = { 
        id, letter, colorClass: color.bg, shadowClass: color.shadow, textColor: color.text, 
        homeX, homeY, targetX: homeX, targetY: homeY, x: homeX, y: homeY, 
        isLocked: false 
      };
      return newNodes[id];
    });

    nodesRef.current = newNodes;
    setCubes(newCubes);
    setSlotsFilled(new Array(slotCount).fill(false));
    speak('Spell the word!', 'idle');
  }, [currentWord, speak]);

  useEffect(() => { startLevel(); }, [startLevel]);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  // Main 60FPS ALWAYS-ON Physics Engine
  useEffect(() => {
    if (!handTrackingReady) return;

    const loop = () => {
      const nodes = nodesRef.current;
      const nodeList = Object.values(nodes);
      const liveCursor = cursorRef.current;
      
      const vw = window.innerWidth / 100;
      const vh = window.innerHeight / 100;

      // 1. HAND INTERACTION LOGIC
      if (!isWinningRef.current && liveCursor) {
        const cx = liveCursor.x * 100; 
        const cy = liveCursor.y * 100;
        
        let isPinching = Boolean(liveCursor.isPinching);
        if (!isPinching) {
          pinchLossFramesRef.current++;
          if (pinchLossFramesRef.current < 20) isPinching = true; 
        } else {
          pinchLossFramesRef.current = 0;
        }

        // PERFECT CIRCULAR HITBOXES
        if (!draggedIdRef.current) {
          let closestId: string | null = null; 
          let minDist = 25 * vh; 

          nodeList.forEach(n => {
            if (n.isLocked) return; 
            const nodePxX = n.x * vw;
            const nodePxY = n.y * vh;
            const handPxX = cx * vw;
            const handPxY = cy * vh;
            
            const dist = Math.hypot(nodePxX - handPxX, nodePxY - handPxY);
            if (dist < minDist) { minDist = dist; closestId = n.id; }
          });
          
          hoveredIdRef.current = closestId; 
          setHoveredCubeId(closestId);
        }

        // Execute Grab
        if (isPinching && hoveredIdRef.current && !draggedIdRef.current) {
          draggedIdRef.current = hoveredIdRef.current; 
          setDraggedCubeId(hoveredIdRef.current);
          playSound('pick');
        } 
        
        // Execute Release
        else if (!isPinching && draggedIdRef.current) {
          const node = nodes[draggedIdRef.current];
          let targetSlotIndex: number | null = null;
          let minDist = 20 * vh; // Drop radius

          const nodePxX = node.x * vw;
          const nodePxY = node.y * vh;

          slotPositions.current.forEach((slot, index) => {
            if (!slot.isFilled) {
              const slotPxX = slot.x * vw;
              const slotPxY = slot.y * vh;
              const dist = Math.hypot(nodePxX - slotPxX, nodePxY - slotPxY);
              if (dist < minDist) { minDist = dist; targetSlotIndex = index; }
            }
          });

          if (targetSlotIndex !== null) {
            const slot = slotPositions.current[targetSlotIndex];
            if (node.letter === slot.expected) {
              // PERFECT FIT FIX: Sets target explicitly to the mathematical slot coordinates
              node.targetX = slot.x;
              node.targetY = slot.y;
              node.isLocked = true;
              slot.isFilled = true;
              
              playSound('ding');
              setScore(s => s + 5); 
              setSlotsFilled(prev => { const n = [...prev]; n[targetSlotIndex!] = true; return n; });
              
              confetti({ particleCount: 40, spread: 60, origin: { x: slot.x / 100, y: slot.y / 100 }, colors: ['#4ade80', '#fef08a'] });
              speak('Nice!', 'liking-leg');
            } else {
              node.targetX = node.homeX; 
              node.targetY = node.homeY;
              playSound('wrong');
              setWrongShakeSlot(targetSlotIndex);
              setTimeout(() => setWrongShakeSlot(null), 400);
            }
          } else {
            node.targetX = node.homeX; 
            node.targetY = node.homeY;
          }

          draggedIdRef.current = null; setDraggedCubeId(null);
        }
      } 
      // Hand tracking failsafe
      else if (!liveCursor && draggedIdRef.current) {
        const node = nodes[draggedIdRef.current];
        if (node) {
          node.targetX = node.homeX;
          node.targetY = node.homeY;
        }
        draggedIdRef.current = null; setDraggedCubeId(null);
        hoveredIdRef.current = null; setHoveredCubeId(null);
      }

      // 2. ALWAYS-ON PHYSICS LOGIC
      let lockedCount = 0;

      nodeList.forEach(node => {
        // INSTANT SNAP FIX
        if (node.isLocked) {
          node.x = node.targetX;
          node.y = node.targetY;
          lockedCount++;
        } 
        else if (node.id === draggedIdRef.current && liveCursor) {
          const cx = liveCursor.x * 100;
          const cy = liveCursor.y * 100;
          node.x += (cx - node.x) * 0.95; 
          node.y += (cy - node.y) * 0.95;
        } else {
          node.x += (node.targetX - node.x) * 0.25;
          node.y += (node.targetY - node.y) * 0.25;
        }

        const el = domRefs.current[node.id];
        if (el) { el.style.left = `${node.x}vw`; el.style.top = `${node.y}vh`; }
      });

      // 3. FULL WORD COMPLETION
      if (lockedCount === currentWord.word.length && !draggedIdRef.current && !isWinningRef.current) {
        isWinningRef.current = true;
        setIsCorrectGlow(true);
        playSound('win');
        speak('Amazing! You did it!', 'happy');
        setShowPrize(true);
        setScore(s => s + 20); 
        
        const end = Date.now() + 2000;
        const frame = () => {
          confetti({ particleCount: 15, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fde047', '#4ade80', '#38bdf8'] });
          confetti({ particleCount: 15, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fde047', '#4ade80', '#38bdf8'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();

        setTimeout(() => {
          setEquationIndex(i => i + 1);
          startLevel();
        }, 4000);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [handTrackingReady, currentWord, playSound, speak, startLevel]);

  // Camera Initialization
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
      .then(stream => { 
        if (videoRef.current) { 
          videoRef.current.srcObject = stream; 
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
          };
        } 
      })
      .catch(err => {
        console.error("Camera Error:", err);
        setCameraError(true);
      });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden touch-none bg-sky-200">
      <img src="/gardenbg.jpeg" alt="Garden Theme" className="absolute inset-0 h-full w-full object-cover scale-105 blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/30 via-transparent to-lime-400/40 backdrop-blur-[1px]" /> 
      
      {/* Required for MediaPipe processing */}
      <video ref={videoRef} playsInline muted className="fixed top-0 left-0 w-32 h-32 opacity-0 pointer-events-none z-[-1]" />

      {/* CAMERA ERROR NOTIFICATION */}
      <AnimatePresence>
        {cameraError && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-24 left-0 right-0 flex justify-center z-50">
             <div className="bg-rose-500 text-white font-black px-6 py-4 rounded-3xl shadow-xl text-lg border-4 border-white" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
                ⚠️ Camera access denied! Please allow the camera to play.
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <div className="relative z-10 flex justify-between items-center p-6 sm:px-12 pointer-events-auto">
        <Link to="/" className="rounded-full border-[5px] border-white bg-pink-400 px-6 py-3 text-xl font-black text-white shadow-[0_8px_0_rgba(190,24,93,0.8)] hover:translate-y-1 hover:shadow-none transition-all" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
          Back Home
        </Link>
        <div className="flex items-center gap-4 rounded-3xl border-[5px] border-white bg-yellow-300 px-6 py-2 shadow-[0_8px_0_rgba(161,98,7,0.8)]">
          <span className="text-4xl">⭐</span>
          <span className="text-4xl font-black text-yellow-950" style={{ fontFamily: '"Comic Sans MS", cursive' }}>{score}</span>
        </div>
      </div>

      {/* Game Frame */}
      <div className="relative flex w-full flex-col items-center pt-2">
        <div className="rounded-[40px] border-[8px] border-white bg-violet-500/90 p-8 shadow-[0_15px_0_rgba(76,29,149,0.8)] backdrop-blur-sm">
          <WordImage emoji={currentWord.imageEmoji} hint={currentWord.hint} />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-15px) rotate(-4deg); }
            50% { transform: translateX(15px) rotate(4deg); }
            75% { transform: translateX(-15px) rotate(-4deg); }
          }
        `}} />

        {/* ABSOLUTE SLOT ALIGNMENT FIX */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {slotPositions.current.map((slot, i) => (
            <div 
              key={`slot-${i}`} 
              className="absolute"
              style={{ left: `${slot.x}vw`, top: `${slot.y}vh`, transform: 'translate(-50%, -50%)' }}
            >
              <SlotBox isFilled={slotsFilled[i]} isWrongShake={wrongShakeSlot === i} />
            </div>
          ))}
        </div>
      </div>

      {/* Draggable Cubes */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <AnimatePresence>
          {cubes.map((cube) => (
            <LetterCube
              key={cube.id}
              ref={(el) => { domRefs.current[cube.id] = el; }}
              letter={cube.letter}
              colorClass={cube.colorClass}
              shadowClass={cube.shadowClass}
              textColor={cube.textColor}
              isHovered={hoveredCubeId === cube.id}
              isDragging={draggedCubeId === cube.id}
              isLocked={cube.isLocked}
              initialX={cube.x}
              initialY={cube.y}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* REWARD OVERLAY */}
      <AnimatePresence>
        {showPrize && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: 'spring', bounce: 0.6 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto"
          >
            <div className="flex flex-col items-center rounded-[50px] border-[10px] border-white bg-gradient-to-b from-yellow-300 to-orange-400 p-12 shadow-[0_25px_0_rgba(154,52,18,0.8)]">
              <span className="text-[160px] drop-shadow-2xl animate-bounce">🏆</span>
              <h2 className="mt-4 text-7xl font-black text-white" style={{ fontFamily: '"Comic Sans MS", cursive', WebkitTextStroke: '4px #9a3412', textShadow: '0 8px 0 rgba(0,0,0,0.2)' }}>
                YOU WIN!
              </h2>
              <div className="mt-6 rounded-full border-4 border-white bg-sky-400 px-8 py-3 shadow-[0_6px_0_rgba(2,132,199,0.8)]">
                 <p className="text-3xl font-bold text-white" style={{ fontFamily: '"Comic Sans MS", cursive' }}>+20 Stars! ⭐</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Mascot state={mascotState} line={mascotLine} nonce={mascotNonce} />
      <GestureCursor cursor={cursor} holdProgress={0} isVisible={handTrackingReady} isActive={Boolean(draggedCubeId)} accentColor="#f472b6" centerColor={draggedCubeId ? '#f472b6' : '#fbcfe8'} size={draggedCubeId ? 'large' : 'default'} />
    </main>
  );
}