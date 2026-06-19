import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Activity, MessageSquare, Star, ThumbsUp, Users, Zap, ChevronRight, Vote, Target, CheckCircle2, XCircle, Clock, Flag, Pencil, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { getBaseUrl } from "@/lib/api";
import { toast } from "sonner";

const TIERS = [
  { name: "Casual", minPoints: 0, maxPoints: 49 },
  { name: "Fan", minPoints: 50, maxPoints: 199 },
  { name: "Capo", minPoints: 200, maxPoints: 499 },
  { name: "Ultras", minPoints: 500, maxPoints: Infinity },
];

const EARN_RULES = [
  { action: "Cast a poll vote", points: 5, icon: <Vote className="h-4 w-4" /> },
  { action: "Post a match reaction", points: 3, icon: <ThumbsUp className="h-4 w-4" /> },
  { action: "Start a discussion", points: 8, icon: <MessageSquare className="h-4 w-4" /> },
  { action: "Leave a comment", points: 2, icon: <Activity className="h-4 w-4" /> },
  { action: "Join a nation", points: 10, icon: <Users className="h-4 w-4" /> },
];

type Outcome = "home" | "draw" | "away";

interface PredictionEntry {
  matchId: number;
  predictedOutcome: Outcome;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  isResolved: number;
  xpEarned: number;
  createdAt: string;
  match: {
    homeNationCode: string;
    homeNationName: string;
    homeNationFlag: string;
    awayNationCode: string;
    awayNationName: string;
    awayNationFlag: string;
    stage: string | null;
    status: string;
    scheduledAt: string;
    homeScore: number | null;
    awayScore: number | null;
  };
}

function useMyPredictions() {
  const { getToken } = useAuth();
  return useQuery<PredictionEntry[]>({
    queryKey: ["me-predictions"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${getBaseUrl()}api/me/predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Failed to fetch predictions");
      return r.json();
    },
    staleTime: 30_000,
  });
}

function TierProgressBar({ points }: { points: number }) {
  const currentTierIdx = TIERS.reduce((acc, t, i) => (points >= t.minPoints ? i : acc), 0);
  const currentTier = TIERS[currentTierIdx];
  const nextTier = TIERS[currentTierIdx + 1];

  const isMax = !nextTier;
  const progressPct = isMax
    ? 100
    : Math.min(
        100,
        Math.round(
          ((points - currentTier.minPoints) /
            (nextTier.minPoints - currentTier.minPoints)) *
            100,
        ),
      );

  const tierColors: Record<string, string> = {
    Casual: "bg-slate-400",
    Fan: "bg-sky-400",
    Capo: "bg-violet-400",
    Ultras: "bg-primary",
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground font-medium">
          {isMax ? (
            <span className="text-primary font-bold">MAX TIER REACHED</span>
          ) : (
            <>
              <span className="text-foreground font-bold">{nextTier.minPoints - points}</span>
              <span className="text-muted-foreground"> pts to </span>
              <span className="font-bold" style={{ color: "inherit" }}>{nextTier.name}</span>
            </>
          )}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {isMax ? `${points} pts` : `${points} / ${nextTier.minPoints}`}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tierColors[currentTier.name]}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function TierLadder({ currentPoints }: { currentPoints: number }) {
  const activeTierIdx = TIERS.reduce((acc, t, i) => (currentPoints >= t.minPoints ? i : acc), 0);

  const tierColors: Record<string, string> = {
    Casual: "border-slate-400/30 bg-slate-400/5",
    Fan: "border-sky-400/30 bg-sky-400/5",
    Capo: "border-violet-400/30 bg-violet-400/5",
    Ultras: "border-primary/40 bg-primary/5",
  };

  const activeRing: Record<string, string> = {
    Casual: "ring-slate-400/40",
    Fan: "ring-sky-400/40",
    Capo: "ring-violet-400/40",
    Ultras: "ring-primary/40",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TIERS.map((tier, idx) => {
        const isActive = idx === activeTierIdx;
        const isUnlocked = currentPoints >= tier.minPoints;
        return (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-4 transition-all ${tierColors[tier.name]} ${
              isActive ? `ring-2 ${activeRing[tier.name]}` : ""
            } ${!isUnlocked ? "opacity-40 grayscale" : ""}`}
          >
            {isActive && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                  Current
                </span>
              </div>
            )}
            <ReputationBadge tier={tier.name} size="sm" className="mb-3" />
            <p className="font-mono text-xs text-muted-foreground mt-2">
              {tier.maxPoints === Infinity
                ? `${tier.minPoints}+ pts`
                : `${tier.minPoints}–${tier.maxPoints} pts`}
            </p>
            {!isUnlocked && (
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">Locked</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const OUTCOME_LABELS: Record<Outcome, string> = { home: "Home Win", draw: "Draw", away: "Away Win" };
const OUTCOME_COLORS: Record<Outcome, string> = {
  home: "text-primary border-primary/40 bg-primary/8",
  draw: "text-blue-400 border-blue-500/40 bg-blue-500/8",
  away: "text-purple-400 border-purple-500/40 bg-purple-500/8",
};

function resolvedStatus(entry: PredictionEntry) {
  const { match, predictedOutcome } = entry;
  if (match.status !== "completed" || match.homeScore == null || match.awayScore == null) {
    return "pending";
  }
  let actual: Outcome;
  if (match.homeScore > match.awayScore) actual = "home";
  else if (match.awayScore > match.homeScore) actual = "away";
  else actual = "draw";

  const outcomeCorrect = actual === predictedOutcome;
  const scoreCorrect =
    entry.predictedHomeScore === match.homeScore &&
    entry.predictedAwayScore === match.awayScore;

  if (scoreCorrect) return "exact";
  if (outcomeCorrect) return "correct";
  return "wrong";
}

function PredictionRow({ entry }: { entry: PredictionEntry }) {
  const status = resolvedStatus(entry);
  const { match } = entry;

  const dateStr = new Date(match.scheduledAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const statusBadge = {
    pending: { label: "Pending", cls: "text-muted-foreground bg-muted border-border", icon: <Clock className="h-3 w-3" /> },
    correct: { label: "Correct", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    exact: { label: "Exact Score!", cls: "text-orange-400 bg-orange-500/10 border-orange-500/30", icon: <Target className="h-3 w-3" /> },
    wrong: { label: "Wrong", cls: "text-red-400 bg-red-500/10 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
  }[status];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-2xl leading-none shrink-0">{match.homeNationFlag}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide truncate">
            {match.homeNationCode} <span className="text-muted-foreground font-normal">vs</span> {match.awayNationCode}
          </p>
          <p className="text-[10px] text-muted-foreground">{match.stage ?? "Group Stage"} · {dateStr}</p>
        </div>
        <span className="text-2xl leading-none shrink-0">{match.awayNationFlag}</span>
      </div>

      <div className={`shrink-0 px-2 py-1 rounded-lg border text-[10px] font-heading font-bold uppercase tracking-wide ${OUTCOME_COLORS[entry.predictedOutcome]}`}>
        {OUTCOME_LABELS[entry.predictedOutcome]}
        {entry.predictedHomeScore != null && entry.predictedAwayScore != null && (
          <span className="font-mono ml-1 opacity-70">({entry.predictedHomeScore}–{entry.predictedAwayScore})</span>
        )}
      </div>

      {match.status === "completed" && (
        <div className="text-xs font-mono text-muted-foreground shrink-0">
          {match.homeScore}–{match.awayScore}
        </div>
      )}

      <div className={`flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold ${statusBadge.cls}`}>
        {statusBadge.icon}
        {statusBadge.label}
      </div>

      {entry.xpEarned > 0 && (
        <div className="flex items-center gap-0.5 text-primary text-[10px] font-bold shrink-0">
          <Zap className="h-3 w-3" />+{entry.xpEarned}
        </div>
      )}
    </div>
  );
}

function PredictionsSection() {
  const { data: predictions, isLoading } = useMyPredictions();

  return (
    <section>
      <h3 className="text-xl font-heading font-bold uppercase mb-4 text-foreground flex items-center gap-2">
        <Target className="text-primary h-5 w-5" /> My Predictions
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : !predictions || predictions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-muted-foreground text-sm">No predictions yet.</p>
          <Link href="/predictions" className="text-primary text-sm font-bold hover:underline mt-1 inline-block">
            Make your first prediction →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map((entry) => (
            <PredictionRow key={entry.matchId} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}

function AllegianceSection({ nationCode, nationName }: { nationCode: string | null; nationName: string | null }) {
  return (
    <section>
      <h3 className="text-xl font-heading font-bold uppercase mb-4 text-foreground flex items-center gap-2">
        <Flag className="text-primary h-5 w-5" /> Favorite Team
      </h3>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {nationCode && nationName ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Flag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Pledged Allegiance</p>
                  <p className="text-xl font-heading font-bold text-foreground">{nationName}</p>
                  <p className="text-xs font-mono text-muted-foreground">{nationCode}</p>
                </div>
              </div>
              <Link
                href="/nations"
                className="text-xs text-primary font-bold uppercase tracking-wide hover:underline shrink-0"
              >
                Change →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <Flag className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">No Allegiance Yet</p>
                  <p className="text-sm text-muted-foreground">Pick your team and earn +10 reputation points.</p>
                </div>
              </div>
              <Link
                href="/nations"
                className="text-xs text-primary font-bold uppercase tracking-wide hover:underline shrink-0"
              >
                Choose Nation →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

type UsernameStatus = "idle" | "same" | "checking" | "available" | "taken" | "invalid";

function useUsernameAvailability(username: string, currentUsername: string | undefined) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [reason, setReason] = useState<string | null>(null);

  const trimmed = username.trim();

  // Debounced check
  useEffect(() => {
    if (!trimmed) { setStatus("idle"); setReason(null); return; }
    if (trimmed === currentUsername) { setStatus("same"); setReason(null); return; }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setStatus("invalid");
      setReason("Must be 2–40 characters.");
      return;
    }

    setStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${getBaseUrl()}api/me/check-username?username=${encodeURIComponent(trimmed)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        setStatus(json.available ? "available" : "taken");
        setReason(json.reason ?? null);
      } catch {
        setStatus("idle");
      }
    }, 420);

    return () => clearTimeout(timer);
  }, [trimmed, currentUsername]);

  return { status, reason };
}

function UsernameStatusIndicator({ status, reason }: { status: UsernameStatus; reason: string | null }) {
  if (status === "idle" || status === "same") return null;

  const configs: Record<Exclude<UsernameStatus, "idle" | "same">, { icon: React.ReactNode; text: string; cls: string }> = {
    checking: {
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      text: "Checking…",
      cls: "text-muted-foreground",
    },
    available: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      text: "Available",
      cls: "text-emerald-400",
    },
    taken: {
      icon: <XCircle className="h-3 w-3" />,
      text: reason ?? "Already taken",
      cls: "text-red-400",
    },
    invalid: {
      icon: <XCircle className="h-3 w-3" />,
      text: reason ?? "Invalid username",
      cls: "text-amber-400",
    },
  };

  const cfg = configs[status as Exclude<UsernameStatus, "idle" | "same">];
  if (!cfg) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-medium ${cfg.cls}`}>
      {cfg.icon}
      {cfg.text}
    </div>
  );
}

function EditProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateMe({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success("Profile updated!");
        onClose();
      },
      onError: () => toast.error("Failed to save changes."),
    },
  });

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const { status: usernameStatus, reason: usernameReason } = useUsernameAvailability(username, user?.username);

  // Sync fields when dialog opens with current values
  const handleOpenChange = (o: boolean) => {
    if (o && user) {
      setUsername(user.username ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
    if (!o) onClose();
  };

  const canSave = usernameStatus !== "taken" && usernameStatus !== "invalid" && !isPending;

  const handleSave = () => {
    if (!canSave) return;
    const body: { username?: string; avatarUrl?: string } = {};
    if (username.trim() && username.trim() !== user?.username) body.username = username.trim();
    if (avatarUrl.trim() !== (user?.avatarUrl ?? "")) body.avatarUrl = avatarUrl.trim() || undefined;
    mutate({ data: body });
  };

  const inputBorderClass = {
    idle: "border-border",
    same: "border-border",
    checking: "border-border",
    available: "border-emerald-500/50 focus:border-emerald-500",
    taken: "border-red-500/50 focus:border-red-500",
    invalid: "border-amber-500/50 focus:border-amber-500",
  }[usernameStatus];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-heading uppercase tracking-widest text-base">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-border rounded-xl bg-muted shrink-0">
              <AvatarImage src={avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-heading text-2xl bg-muted text-muted-foreground">
                {(username || user?.username || "?").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{username || user?.username}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Avatar preview</p>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ep-username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Username
              </Label>
              <UsernameStatusIndicator status={usernameStatus} reason={usernameReason} />
            </div>
            <Input
              id="ep-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={user?.username ?? ""}
              className={`bg-background text-foreground text-sm h-9 transition-colors ${inputBorderClass}`}
              maxLength={40}
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-avatar" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Avatar URL <span className="normal-case font-normal text-muted-foreground/50 tracking-normal">(optional)</span>
            </Label>
            <Input
              id="ep-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="bg-background border-border text-foreground text-sm h-9 font-mono"
            />
            <p className="text-[10px] text-muted-foreground">Paste any public image URL to use as your avatar.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}
            className="border-border text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="font-heading uppercase tracking-wide text-xs">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const [editOpen, setEditOpen] = useState(false);
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-card rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-card rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const pointsByActivity = [
    { label: "Poll Votes", value: user.totalVotes * 5, count: user.totalVotes, icon: <Vote className="h-4 w-4 text-primary" /> },
    { label: "Reactions", value: user.totalReactions * 3, count: user.totalReactions, icon: <ThumbsUp className="h-4 w-4 text-primary" /> },
    { label: "Discussions", value: user.totalDiscussions * 8, count: user.totalDiscussions, icon: <MessageSquare className="h-4 w-4 text-primary" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">My Identity</h1>
        <p className="text-muted-foreground mt-1">Your fan profile and reputation standing.</p>
      </header>

      {/* Identity Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-background to-background relative border-b border-border">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>
        <CardContent className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-14 mb-6">
            <Avatar className="w-28 h-28 border-4 border-card rounded-xl shadow-2xl bg-muted">
              <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-heading text-4xl bg-muted text-muted-foreground">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/60 hover:bg-muted hover:border-primary/30 transition-all text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide"
                title="Edit profile"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <ReputationBadge tier={user.reputationTier} size="lg" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-heading font-bold text-foreground">{user.username}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="uppercase tracking-widest text-xs font-semibold">Allegiance:</span>
              <span className="text-foreground font-bold text-sm">{user.nationName || "Unaffiliated Global Fan"}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono pt-1">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Tier Progress */}
          <TierProgressBar points={user.reputationPoints} />
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Reputation" value={user.reputationPoints.toLocaleString()} sub="total pts" icon={<Star className="text-primary h-5 w-5" />} highlight />
        <StatCard title="Poll Votes" value={user.totalVotes.toLocaleString()} sub="+5 pts each" icon={<Vote className="text-primary h-5 w-5" />} />
        <StatCard title="Reactions" value={user.totalReactions.toLocaleString()} sub="+3 pts each" icon={<ThumbsUp className="text-primary h-5 w-5" />} />
        <StatCard title="Discussions" value={user.totalDiscussions.toLocaleString()} sub="+8 pts each" icon={<MessageSquare className="text-primary h-5 w-5" />} />
      </div>

      {/* Favorite Team */}
      <AllegianceSection nationCode={user.nationCode ?? null} nationName={user.nationName ?? null} />

      {/* My Predictions */}
      <PredictionsSection />

      {/* Tier Ladder */}
      <section>
        <h3 className="text-xl font-heading font-bold uppercase mb-4 text-foreground flex items-center gap-2">
          <Zap className="text-primary h-5 w-5" /> Reputation Tiers
        </h3>
        <TierLadder currentPoints={user.reputationPoints} />
      </section>

      {/* Points Breakdown */}
      <section>
        <h3 className="text-xl font-heading font-bold uppercase mb-4 text-foreground flex items-center gap-2">
          <Activity className="text-primary h-5 w-5" /> Points Breakdown
        </h3>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            {pointsByActivity.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.icon}
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">×{item.count}</span>
                </div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full"
                    style={{
                      width: user.reputationPoints > 0
                        ? `${Math.min(100, Math.round((item.value / user.reputationPoints) * 100))}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-foreground w-12 text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* How to Earn */}
      <section>
        <h3 className="text-xl font-heading font-bold uppercase mb-4 text-foreground flex items-center gap-2">
          <ChevronRight className="text-primary h-5 w-5" /> How to Earn Points
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EARN_RULES.map((rule) => (
            <div
              key={rule.action}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors"
            >
              <div className="text-primary">{rule.icon}</div>
              <span className="flex-1 text-sm text-foreground">{rule.action}</span>
              <span className="font-heading font-bold text-primary text-lg">+{rule.points}</span>
            </div>
          ))}
        </div>
      </section>

      <EditProfileDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

function StatCard({
  title, value, sub, icon, highlight,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={`border-border hover:border-primary/30 transition-colors ${highlight ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          {icon}
        </div>
        <h3 className={`text-3xl font-heading font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
