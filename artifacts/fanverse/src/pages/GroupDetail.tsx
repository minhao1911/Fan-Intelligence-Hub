import { useParams, Link } from "wouter";
import { useGetGroup, useJoinGroup, useLeaveGroup, getGetGroupQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { ArrowLeft, Users, Globe, Lock, Crown, Star } from "lucide-react";

export default function GroupDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const groupId = parseInt(id as string, 10);

  const { data: group, isLoading } = useGetGroup(groupId, {
    query: { enabled: !isNaN(groupId), queryKey: getGetGroupQueryKey(groupId) },
  });

  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const toggleMembership = () => {
    if (!group) return;
    const opts = { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) }) };
    if (group.isUserMember) {
      leaveGroup.mutate({ id: groupId }, opts);
    } else {
      joinGroup.mutate({ id: groupId }, opts);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-56 bg-card rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 bg-card rounded-xl" />
          <div className="h-28 bg-card rounded-xl" />
        </div>
      </div>
    );
  }

  if (!group) return <div className="text-center py-20 text-muted-foreground">Group not found.</div>;

  const isPending = joinGroup.isPending || leaveGroup.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Link href="/groups" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      {/* Hero */}
      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="text-8xl md:text-9xl leading-none select-none">{group.coverEmoji}</div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
              {group.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {group.isPublic ? "Public Group" : "Private Group"}
              {group.nation && (
                <span className="ml-2 flex items-center gap-1">
                  · {group.nation.flagEmoji} {group.nation.name}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tight text-foreground">{group.name}</h1>
            <p className="text-muted-foreground mt-3 text-base max-w-xl">{group.description}</p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-sm text-muted-foreground font-medium">
              <Users className="h-4 w-4" />
              {group.memberCount.toLocaleString()} {group.memberCount === 1 ? "member" : "members"}
            </div>
          </div>
          <div className="shrink-0">
            {group.userRole === "admin" ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-heading font-bold uppercase tracking-wide">
                <Crown className="h-4 w-4" /> Admin
              </span>
            ) : (
              <Button
                onClick={toggleMembership}
                disabled={isPending}
                variant={group.isUserMember ? "outline" : "default"}
                className={group.isUserMember ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive font-heading uppercase tracking-wide" : "bg-primary text-primary-foreground font-heading uppercase tracking-wide"}
              >
                {isPending ? "…" : group.isUserMember ? "Leave Group" : "Join Group"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <div>
        <h2 className="text-xl font-heading font-bold uppercase tracking-wide text-foreground mb-4">Members</h2>
        {group.members.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground">No members yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.members.map((member) => (
              <Card key={member.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                      {member.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{member.username}</p>
                      {member.role === "admin" && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <ReputationBadge tier={member.reputationTier} size="sm" className="mt-0.5" />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="text-xs font-mono font-bold text-primary">{member.reputationPoints}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
