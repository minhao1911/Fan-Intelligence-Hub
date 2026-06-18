import { useListDiscussions } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowUpCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Discussions() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const nationCode = searchParams.get('nationCode') || undefined;
  const matchId = searchParams.get('matchId') ? parseInt(searchParams.get('matchId')!) : undefined;

  const { data: discussions, isLoading } = useListDiscussions({ nationCode, matchId, limit: 20 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Discussions</h1>
          <p className="text-muted-foreground mt-2">Tactical analysis, matchday hype, and fan reactions.</p>
        </div>
        <Button className="font-heading uppercase tracking-widest shrink-0">New Thread</Button>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : discussions?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          No discussions found for this criteria. Be the first to start one.
        </div>
      ) : (
        <div className="space-y-4">
          {discussions?.map(discussion => (
            <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Upvote Column */}
                    <div className="flex flex-col items-center gap-2 text-muted-foreground shrink-0">
                      <ArrowUpCircle className={`w-6 h-6 ${discussion.hasUserUpvoted ? 'text-primary' : ''}`} />
                      <span className="font-mono font-bold text-sm">{discussion.upvotes}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{discussion.category}</span>
                        {discussion.nationCode && <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold uppercase tracking-widest">{discussion.nationCode}</span>}
                      </div>
                      
                      <h3 className="text-xl font-bold text-foreground mb-2 truncate">{discussion.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{discussion.content}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={discussion.avatarUrl || undefined} />
                            <AvatarFallback className="bg-muted text-[8px]">{discussion.username.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{discussion.username}</span>
                          <span className="opacity-50">•</span>
                          <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <MessageSquare className="w-4 h-4" /> {discussion.commentCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
