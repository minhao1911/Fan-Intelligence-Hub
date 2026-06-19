import { Link } from "wouter";
import { useListGroups } from "@workspace/api-client-react";
import { Crown, Users, Shirt, ChevronRight, Trophy } from "lucide-react";
import type { FanPhoto } from "./FanPhotoComposer";

interface Props {
  fanPhotos: FanPhoto[];
}

const RANK_STYLES = [
  { crown: "text-yellow-400", bg: "from-yellow-500/10 to-yellow-500/5", border: "border-yellow-500/30", badge: "bg-yellow-500 text-black" },
  { crown: "text-slate-300",  bg: "from-slate-500/10 to-slate-500/5",   border: "border-slate-400/30",  badge: "bg-slate-400 text-black" },
  { crown: "text-orange-400", bg: "from-orange-500/10 to-orange-500/5", border: "border-orange-500/30", badge: "bg-orange-500 text-black" },
];

export default function TopFanGroupsWidget({ fanPhotos }: Props) {
  const { data: groups, isLoading } = useListGroups({});

  const top3 = (groups ?? []).slice(0, 3);

  const jerseyCountByNation: Record<string, number> = {};
  for (const p of fanPhotos) {
    if (p.tag === "jersey" && p.nationCode) {
      jerseyCountByNation[p.nationCode] = (jerseyCountByNation[p.nationCode] ?? 0) + 1;
    }
  }

  const topJerseyNation = Object.entries(jerseyCountByNation).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-[10px] font-heading font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-1.5">
        <Trophy className="h-3 w-3" /> Top Fan Groups
      </h2>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : top3.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No groups yet.</p>
          <Link href="/groups">
            <span className="text-xs text-primary font-bold hover:underline cursor-pointer">Create one →</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {top3.map((group, idx) => {
            const style = RANK_STYLES[idx] ?? RANK_STYLES[2];
            const xp = (group.memberCount ?? 1) * 250;
            const hasTopJersey = group.nationCode && group.nationCode === topJerseyNation;

            return (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <div
                  className={`relative flex items-center gap-3 px-3 py-3 rounded-xl border bg-gradient-to-r ${style.bg} ${style.border} hover:border-primary/40 transition-all cursor-pointer group`}
                >
                  {/* Rank badge */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${style.badge}`}>
                    {idx === 0 ? <Crown className="h-3.5 w-3.5" /> : `#${idx + 1}`}
                  </div>

                  {/* Emoji + info */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{group.coverEmoji}</span>
                      <span className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {group.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" />
                        {(group.memberCount ?? 0).toLocaleString()} fans
                      </span>
                      <span className="text-[10px] font-bold text-primary font-mono">
                        {xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>

                  {/* Badges column */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {group.nationCode && (
                      <span className="text-[10px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded font-bold uppercase">
                        {group.nationCode}
                      </span>
                    )}
                    {hasTopJersey && (
                      <span className="flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        <Shirt className="h-2.5 w-2.5" /> Top Jerseys
                      </span>
                    )}
                  </div>

                  <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* XP scale legend */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide font-bold">XP Formula</p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5 text-primary" /> Members × 250</span>
          <span className="flex items-center gap-1"><Shirt className="h-2.5 w-2.5 text-blue-400" /> Jersey posts tracked</span>
        </div>
      </div>

      <Link href="/groups" className="block mt-3 text-center">
        <span className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">
          View All Groups →
        </span>
      </Link>
    </div>
  );
}
