import { toast } from "sonner";

interface LiveMatchInfo {
  id: number;
  homeNationFlag: string;
  homeNationName: string;
  homeNationCode: string;
  awayNationFlag: string;
  awayNationName: string;
  awayNationCode: string;
  stage: string | null;
}

export function fireMatchLiveToast(match: LiveMatchInfo) {
  toast.custom(
    (id) => (
      <div
        onClick={() => {
          toast.dismiss(id);
          window.location.href = `/matches/${match.id}`;
        }}
        className="flex items-center gap-3 cursor-pointer w-full max-w-sm rounded-xl border border-red-500/40 bg-card shadow-2xl px-4 py-3 hover:border-red-500/70 transition-colors"
        style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, rgba(239,68,68,0.06) 100%)" }}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">
            Match is Live
          </p>
          <p className="text-sm font-bold text-foreground truncate">
            {match.homeNationFlag} {match.homeNationCode}
            <span className="text-muted-foreground font-normal mx-1.5">vs</span>
            {match.awayNationCode} {match.awayNationFlag}
          </p>
          {match.stage && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{match.stage}</p>
          )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 shrink-0">
          Watch →
        </span>
      </div>
    ),
    { duration: 9000, id: `match-live-${match.id}` },
  );
}

export function firePredictionCorrectToast(matchLabel: string, matchId: number, xpEarned: number, bonus: number) {
  toast.custom(
    (id) => (
      <div
        onClick={() => { toast.dismiss(id); window.location.href = "/predictions"; }}
        className="flex items-center gap-3 cursor-pointer w-full max-w-sm rounded-xl border border-emerald-500/40 bg-card shadow-2xl px-4 py-3 hover:border-emerald-500/70 transition-colors"
        style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, rgba(16,185,129,0.06) 100%)" }}
      >
        <span className="text-2xl shrink-0">✅</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">
            Correct Prediction!
          </p>
          <p className="text-sm font-bold text-foreground truncate">{matchLabel}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            +{xpEarned} XP earned — including +{bonus} bonus
          </p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 shrink-0">
          View →
        </span>
      </div>
    ),
    { duration: 10000, id: `pred-correct-${matchId}` },
  );
}
