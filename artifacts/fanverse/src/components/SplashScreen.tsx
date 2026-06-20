import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 400);
    const exitTimer = setTimeout(() => setPhase("exit"), 1800);
    const doneTimer = setTimeout(() => onComplete(), 2400);
    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.55s ease-in-out" : "opacity 0.3s ease-out",
        pointerEvents: phase === "exit" ? "none" : "all",
      }}
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          transform: phase === "enter" ? "scale(0.82) translateY(12px)" : phase === "exit" ? "scale(1.04) translateY(-6px)" : "scale(1) translateY(0)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease-out",
        }}
      >
        {/* Glow ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-[28px]"
            style={{
              boxShadow: "0 0 60px 20px rgba(0,200,255,0.18), 0 0 120px 40px rgba(0,120,255,0.1)",
              borderRadius: "28px",
            }}
          />
          {/* Spinning ring */}
          <div
            className="absolute -inset-3 rounded-[36px] border-2 border-transparent"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,255,0.5), transparent 40%, rgba(0,120,255,0.5)) border-box",
              WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              maskComposite: "exclude",
              animation: "spin 2.8s linear infinite",
            }}
          />
          <img
            src="/fanverse-logo.png"
            alt="FanVerse"
            className="w-28 h-28 rounded-[24px] object-cover relative z-10"
          />
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-heading text-3xl font-black uppercase tracking-wider text-foreground">
            Fan<span className="text-primary">Verse</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            United by Passion
          </span>
        </div>

        {/* Loader dots */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60"
              style={{
                animation: `bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
