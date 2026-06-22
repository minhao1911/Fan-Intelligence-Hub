import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";
import {
  useGetNationConfidence,
  useVoteNationConfidence,
  getGetNationConfidenceQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const VOTE_LEVELS = [
  { level: 1, label: "Doomed",    emoji: "💀" },
  { level: 2, label: "Shaky",     emoji: "😟" },
  { level: 3, label: "Neutral",   emoji: "😐" },
  { level: 4, label: "Strong",    emoji: "💪" },
  { level: 5, label: "Champions", emoji: "🔥" },
];

function confidenceColor(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-yellow-400";
  if (score >= 35) return "bg-orange-400";
  return "bg-red-500";
}

function confidenceLabel(score: number) {
  if (score >= 80) return "Elite";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Mixed";
  if (score >= 35) return "Shaky";
  return "Low";
}

interface Props {
  nationCode: string;
  nationName: string;
  flagEmoji: string;
  isMember: boolean;
}

export function NationConfidenceMeter({ nationCode, nationName, flagEmoji, isMember }: Props) {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const { data, isLoading } = useGetNationConfidence(nationCode, {
    query: {
      queryKey: getGetNationConfidenceQueryKey(nationCode),
      refetchInterval: 20000,
    },
  });

  const vote = useVoteNationConfidence({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getGetNationConfidenceQueryKey(nationCode) }),
    },
  });

  const handleVote = (level: number) => {
    if (!me || !isMember || vote.isPending) return;
    vote.mutate({ code: nationCode, data: { level } });
  };

  if (isLoading) {
    return <div className="h-40 bg-card rounded-2xl animate-pulse" />;
  }

  if (!data) return null;

  const { overallConfidence, totalVotes, myVote, breakdown } = data;
  const barColor = confidenceColor(overallConfidence);
  const isFirstVote = myVote === null && me && isMember;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-heading font-bold uppercase tracking-wide text-foreground">
              Fan Confidence
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-lg">{flagEmoji}</span>
            <span className="font-medium">{nationName}</span>
          </div>
        </div>

        {/* Big score + bar */}
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-heading font-black text-foreground">
                {overallConfidence}
              </span>
              <span className="text-sm text-muted-foreground font-medium">/ 100</span>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                overallConfidence >= 65 ? "bg-emerald-500/15 text-emerald-400" :
                overallConfidence >= 45 ? "bg-yellow-400/15 text-yellow-400" : "bg-red-500/15 text-red-400"
              )}>
                {confidenceLabel(overallConfidence)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{totalVotes.toLocaleString()} votes</span>
            </div>
          </div>

          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: `${overallConfidence}%` }}
            />
          </div>
        </div>

        {/* Breakdown bars */}
        {totalVotes > 0 && (
          <div className="space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.level} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-base leading-none">{b.emoji}</span>
                <span className="w-16 text-muted-foreground truncate">{b.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground font-mono">{b.pct}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Vote buttons */}
        <div className="pt-1 space-y-2">
          {isMember && me ? (
            <>
              <p className="text-xs text-muted-foreground font-medium">
                {myVote ? "Update your vote:" : "Cast your confidence vote:"}
                {isFirstVote && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-primary">
                    <Zap className="h-2.5 w-2.5" /> +5 rep on first vote
                  </span>
                )}
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {VOTE_LEVELS.map((lvl) => {
                  const isSelected = myVote === lvl.level;
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => handleVote(lvl.level)}
                      disabled={vote.isPending}
                      title={lvl.label}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/15 text-primary shadow-sm scale-105"
                          : "border-border bg-background/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-foreground",
                        vote.isPending && "opacity-50 cursor-wait"
                      )}
                    >
                      <span className="text-lg leading-none">{lvl.emoji}</span>
                      <span className="hidden sm:block text-[10px] leading-tight text-center">
                        {lvl.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-1">
              {me ? "Join this group to cast a confidence vote." : "Sign in and join to vote."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
