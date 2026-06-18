import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity, MessageSquare, Star, Trophy, Users } from "lucide-react";

export default function Profile() {
  const { data: user, isLoading } = useGetMe();

  if (isLoading) {
    return <div className="space-y-8 animate-pulse">
      <div className="h-64 bg-card rounded-2xl"></div>
      <div className="grid grid-cols-3 gap-6"><div className="h-32 bg-card rounded-xl"></div></div>
    </div>;
  }

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-heading font-bold uppercase text-foreground">My Identity</h1>
      </header>

      {/* Identity Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-background to-background relative border-b border-border">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <CardContent className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-16 mb-8">
            <Avatar className="w-32 h-32 border-4 border-card rounded-xl shadow-2xl bg-muted">
              <AvatarImage src={user.avatarUrl || undefined} className="object-cover" />
              <AvatarFallback className="font-heading text-4xl bg-muted text-muted-foreground">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge variant="outline" className="text-primary border-primary/50 bg-primary/5 px-4 py-1.5 font-heading uppercase text-sm tracking-widest rounded">
              {user.reputationTier}
            </Badge>
          </div>

          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">{user.username}</h2>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <span className="uppercase tracking-widest text-sm font-semibold">Allegiance:</span>
              <span className="text-foreground font-bold">{user.nationName || "Unaffiliated Global Fan"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-mono">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <h3 className="text-2xl font-heading font-bold uppercase mt-12 mb-6 text-foreground flex items-center gap-2">
        <Activity className="text-primary h-6 w-6" /> Fan Analytics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Reputation" value={user.reputationPoints.toLocaleString()} icon={<Star className="text-primary h-5 w-5" />} />
        <StatCard title="Pulse Votes" value={user.totalVotes.toLocaleString()} icon={<Activity className="text-primary h-5 w-5" />} />
        <StatCard title="Reactions" value={user.totalReactions.toLocaleString()} icon={<Users className="text-primary h-5 w-5" />} />
        <StatCard title="Discussions" value={user.totalDiscussions.toLocaleString()} icon={<MessageSquare className="text-primary h-5 w-5" />} />
      </div>

    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          {icon}
        </div>
        <h3 className="text-4xl font-heading font-bold text-foreground">{value}</h3>
      </CardContent>
    </Card>
  );
}
