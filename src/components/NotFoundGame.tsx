import { useState, useEffect, useRef } from "react";
import { Home, Play, RotateCcw, HelpCircle, Trophy, Wallet } from "lucide-react";

interface FallingObject {
  id: number;
  x: number;
  y: number;
  type: "coin" | "gem" | "inflation";
  speed: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export default function NotFoundGame() {
  const [gameState, setGameState] = useState<"START" | "PLAYING" | "GAMEOVER">("START");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("monty_404_highscore") || 0);
    }
    return 0;
  });
  const [rank, setRank] = useState<"Goblin" | "Guardian" | "Overlord">("Goblin");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const objectsRef = useRef<FallingObject[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const basketRef = useRef({ x: 150, width: 70, height: 12 });
  const touchXRef = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Screen shake state
  const shakeTimeRef = useRef(0);
  const shakeIntensityRef = useRef(0);

  // Sync ref with state for canvas loops
  useEffect(() => {
    scoreRef.current = score;
    // Calculate Rank
    if (score < 50) {
      setRank("Goblin");
    } else if (score < 150) {
      setRank("Guardian");
    } else {
      setRank("Overlord");
    }
  }, [score]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  // Load / Save Highscore
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("monty_404_highscore", String(score));
    }
  }, [score, highScore]);

  // Initialize Canvas Size
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 240;
      basketRef.current.x = (canvas.width - basketRef.current.width) / 2;
    }
  };

  useEffect(() => {
    if (gameState === "PLAYING") {
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [gameState]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
        keysPressed.current[e.key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
        keysPressed.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Spawn wealth & obstacle objects
  const spawnObject = (canvasWidth: number) => {
    const rand = Math.random();
    let type: "coin" | "gem" | "inflation" = "coin";
    let size = 10;
    
    if (rand < 0.2) {
      type = "gem"; // Rare emerald gems
      size = 8;
    } else if (rand < 0.45) {
      type = "inflation"; // Red debt inflation obstacles
      size = 12;
    }

    // Base speed increases with score
    const speed = (Math.random() * 2 + 1.5) * (1 + scoreRef.current * 0.003);

    return {
      id: Date.now() + Math.random(),
      x: Math.random() * (canvasWidth - 40) + 20,
      y: -20,
      type,
      speed,
      size,
    };
  };

  // Spawn Burst Particles
  const createBurst = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // slight upward float
        color,
        alpha: 1,
        size: Math.random() * 3 + 2,
      });
    }
  };

  // Trigger Screen Shake
  const triggerShake = (intensity = 6, duration = 15) => {
    shakeTimeRef.current = duration;
    shakeIntensityRef.current = intensity;
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    objectsRef.current = [];
    particlesRef.current = [];
    shakeTimeRef.current = 0;
    setGameState("PLAYING");
  };

  // Game Engine Loop
  useEffect(() => {
    if (gameState !== "PLAYING") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameCount = 0;

    const update = () => {
      frameCount++;

      // Move basket left/right
      const speedMultiplier = 6;
      if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"] || keysPressed.current["A"]) {
        basketRef.current.x = Math.max(0, basketRef.current.x - speedMultiplier);
      }
      if (keysPressed.current["ArrowRight"] || keysPressed.current["d"] || keysPressed.current["D"]) {
        basketRef.current.x = Math.min(canvas.width - basketRef.current.width, basketRef.current.x + speedMultiplier);
      }

      // Smooth touch drag
      if (touchXRef.current !== null) {
        const basketCenter = basketRef.current.width / 2;
        const targetX = touchXRef.current - basketCenter;
        // Linear interpolation for smooth catching
        basketRef.current.x += (targetX - basketRef.current.x) * 0.25;
        // Clamp bounds
        basketRef.current.x = Math.max(0, Math.min(canvas.width - basketRef.current.width, basketRef.current.x));
      }

      // Spawn new items
      const spawnRate = Math.max(25, 60 - Math.floor(scoreRef.current * 0.15));
      if (frameCount % spawnRate === 0) {
        objectsRef.current.push(spawnObject(canvas.width));
      }

      // Process falling items
      objectsRef.current.forEach((obj, idx) => {
        obj.y += obj.speed;

        // Basket collision detection
        const basketY = canvas.height - 25;
        const isAlignedX = obj.x + obj.size >= basketRef.current.x && obj.x - obj.size <= basketRef.current.x + basketRef.current.width;
        const isAlignedY = obj.y + obj.size >= basketY && obj.y - obj.size <= basketY + basketRef.current.height;

        if (isAlignedX && isAlignedY) {
          // Object Caught!
          if (obj.type === "coin") {
            setScore((s) => s + 10);
            createBurst(obj.x, obj.y, "#EAB308", 8); // Gold splash
          } else if (obj.type === "gem") {
            setScore((s) => s + 25);
            createBurst(obj.x, obj.y, "#10B981", 16); // Emerald splash
          } else if (obj.type === "inflation") {
            // Bombed by inflation
            setScore((s) => Math.max(0, s - 30));
            triggerShake(8, 20);
            createBurst(obj.x, obj.y, "#F43F5E", 20); // Crimson alarm splash
            const nextLives = livesRef.current - 1;
            setLives(nextLives);
            if (nextLives <= 0) {
              setGameState("GAMEOVER");
            }
          }

          // Remove object
          objectsRef.current.splice(idx, 1);
        } else if (obj.y > canvas.height + 20) {
          // Missed object, remove from queue
          objectsRef.current.splice(idx, 1);

          // If missed a gold/gem, no penalty, but clean memory
        }
      });

      // Update particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });
    };

    const render = () => {
      // Clear with subtle theme matching background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply screen shake translation if active
      if (shakeTimeRef.current > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
        const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(dx, dy);
        shakeTimeRef.current--;
      }

      // Draw dashed guideline track for the basket
      ctx.strokeStyle = "rgba(47, 126, 121, 0.08)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 18);
      ctx.lineTo(canvas.width, canvas.height - 18);
      ctx.stroke();

      // Draw Basket (The Wallet)
      const basket = basketRef.current;
      const bY = canvas.height - 25;
      
      // Draw premium wallet structure
      ctx.fillStyle = "#2F7E79"; // Monty main teal color
      ctx.beginPath();
      ctx.roundRect(basket.x, bY, basket.width, basket.height, [6]);
      ctx.fill();

      // Wallet details / Gold buckle in center
      ctx.fillStyle = "#EAB308";
      ctx.beginPath();
      ctx.roundRect(basket.x + basket.width / 2 - 6, bY - 2, 12, 6, [2]);
      ctx.fill();

      // Draw Items
      objectsRef.current.forEach((obj) => {
        ctx.beginPath();
        if (obj.type === "coin") {
          // Golden Coin
          ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
          ctx.fillStyle = "#F59E0B"; // bright amber
          ctx.fill();
          ctx.strokeStyle = "#D97706";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Coin currency text symbol
          ctx.fillStyle = "#FFF";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("Rp", obj.x, obj.y);
        } else if (obj.type === "gem") {
          // Emerald Gem (Diamond layout)
          ctx.moveTo(obj.x, obj.y - obj.size);
          ctx.lineTo(obj.x + obj.size, obj.y);
          ctx.lineTo(obj.x, obj.y + obj.size);
          ctx.lineTo(obj.x - obj.size, obj.y);
          ctx.closePath();
          ctx.fillStyle = "#10B981"; // emerald
          ctx.fill();
          ctx.strokeStyle = "#059669";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (obj.type === "inflation") {
          // Inflation bomb (Crimson circle with spikes)
          ctx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
          ctx.fillStyle = "#E11D48"; // rose-600
          ctx.fill();
          ctx.strokeStyle = "#9F1239";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Spiky indicators
          ctx.fillStyle = "#FFF";
          ctx.font = "bold 8px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("x", obj.x, obj.y - 1);
        }
      });

      // Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    };

    const loop = () => {
      update();
      render();
      requestRef.current = requestAnimationFrame(loop);
    };

    // Begin Loop
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState]);

  // Touch Move Listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== "PLAYING" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    touchXRef.current = touch.clientX - rect.left;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== "PLAYING" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    touchXRef.current = touch.clientX - rect.left;
  };

  const handleTouchEnd = () => {
    touchXRef.current = null;
  };

  // Mouse drag fallback (let users move bucket by hovering / clicking)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== "PLAYING" || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const basketCenter = basketRef.current.width / 2;
    basketRef.current.x = Math.max(0, Math.min(canvasRef.current.width - basketRef.current.width, mouseX - basketCenter));
  };

  // Render Rank Styles
  const getRankBadge = () => {
    const ranks = {
      Goblin: {
        text: "Financial Goblin 👺",
        class: "border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400",
      },
      Guardian: {
        text: "Wealth Guardian 🛡️",
        class: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500 dark:text-cyan-400",
      },
      Overlord: {
        text: "Portfolio Overlord 👑",
        class: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-lg shadow-emerald-500/5 animate-pulse",
      },
    };
    const current = ranks[rank];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border font-bold ${current.class}`}>
        {current.text}
      </span>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300">
      
      {/* Game Header Area */}
      <div className="p-6 border-b border-border/40 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Error Code: 404</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Highscore: {highScore}</span>
        </div>
      </div>

      {/* Main Interactive Screen */}
      <div className="relative flex-1 bg-background/50 flex flex-col justify-center min-h-[260px]">
        {gameState === "START" && (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Monty's Wealth Catcher</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Halaman ini hilang dalam inflasi! Selagi Anda tersesat, yuk kumpulkan aset dan selamatkan kantong Anda.
              </p>
            </div>

            {/* Instruction Legend */}
            <div className="flex items-center justify-center gap-5 text-[10px] font-bold text-muted-foreground border border-border/40 p-2.5 rounded-xl bg-card">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Koin (+10)</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Permata (+25)</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Inflasi (-30)</span>
            </div>

            <button
              onClick={startGame}
              id="btn-play-game"
              className="flex items-center justify-center gap-1.5 h-10 px-6 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md shadow-teal-800/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              Mulai Bermain
            </button>
          </div>
        )}

        {gameState === "PLAYING" && (
          <div className="relative w-full flex flex-col">
            {/* Real-time stats header overlay */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between select-none pointer-events-none">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Wealth Caught</span>
                <span className="text-xl font-black text-foreground tracking-tight tabular-nums">Rp {score * 1000}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="text-[9px]">
                      {i < lives ? "❤️" : "💀"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-muted-foreground uppercase mr-1">Current Class</span>
                {getRankBadge()}
              </div>
            </div>

            {/* Main Canvas Node */}
            <canvas
              ref={canvasRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseMove={handleMouseMove}
              className="w-full bg-muted/10 dark:bg-zinc-950/20 border-b border-border/40 cursor-ew-resize touch-none block"
            />

            {/* Instruction bar */}
            <div className="py-2.5 text-center text-[9px] font-bold text-muted-foreground/80 bg-muted/20 select-none flex justify-center items-center gap-1.5 border-t border-border/40">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Gunakan keyboard ← / → atau geser mouse/sentuh layar untuk menangkap aset</span>
              <button 
                type="button" 
                onClick={() => setGameState("START")}
                className="ml-2 px-2 py-0.5 rounded border border-border hover:bg-card text-foreground pointer-events-auto"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {gameState === "GAMEOVER" && (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-black text-rose-500">Kantong Anda Bocor!</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Inflasi berhasil mendepresiasi aset Anda. Berikut hasil penyelamatan portofolio Anda:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs border border-border/50 rounded-2xl p-4 bg-muted/10">
              <div className="text-left">
                <span className="text-[9px] text-muted-foreground uppercase block">Aset Selamat</span>
                <span className="text-base font-black text-foreground tabular-nums">Rp {score * 1000}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-muted-foreground uppercase block">Pangkat Akhir</span>
                <span className="font-bold text-xs block text-teal-600 dark:text-teal-400">{rank}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex items-center gap-1.5 h-10 px-5 rounded-xl bg-gradient-to-r from-[#1B5C58] to-[#2F7E79] hover:from-[#2F7E79] hover:to-[#1B5C58] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Footer Navigation Actions */}
      <div className="p-6 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
        <p className="text-xs text-muted-foreground text-center sm:text-left leading-tight">
          Halaman yang Anda tuju tidak ada. Ayo kembali ke tempat aman.
        </p>
        <a
          href="/"
          id="btn-back-home"
          className="flex items-center justify-center gap-1.5 h-10 px-5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold shadow-sm transition-all active:scale-95 decoration-none w-full sm:w-auto"
        >
          <Home className="h-3.5 w-3.5 text-muted-foreground" />
          Dashboard Utama
        </a>
      </div>

      {/* Trigger Game Over on canvas boundary if score goes below 0 (managed in game loops) */}
      {/* We hook into loop to dynamically update states when needed */}
      <script is:inline define:vars={{ score, gameState }}>
        {`
          // Game state listener trigger if score drops below a threshold
          if (gameState === "PLAYING" && score < 0) {
            // Trigger gameover state updates
          }
        `}
      </script>
    </div>
  );
}
