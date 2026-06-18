import { useParams, Link } from "wouter";
import { useGetDiscussion, getGetDiscussionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, ArrowUpCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function DiscussionDetail() {
  const { id } = useParams();
  const discussionId = parseInt(id as string, 10);

  const { data: discussion, isLoading } = useGetDiscussion(discussionId, { 
    query: { enabled: !!discussionId, queryKey: getGetDiscussionQueryKey(discussionId) } 
  });

  if (isLoading) {
    return <div className="space-y-8 animate-pulse"><div className="h-64 bg-card rounded-2xl"></div></div>;
  }

  if (!discussion) return <div className="text-center py-20">Discussion not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Link href="/discussions" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Discussions
      </Link>

      {/* Main Post */}
      <Card className="bg-card border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
        <CardContent className="p-6 sm:p-8">
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-2 text-muted-foreground shrink-0">
              <button className="hover:text-primary transition-colors">
                <ArrowUpCircle className={`w-8 h-8 ${discussion.hasUserUpvoted ? 'text-primary' : ''}`} />
              </button>
              <span className="font-mono font-bold text-lg">{discussion.upvotes}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-1 bg-muted rounded text-xs font-bold uppercase tracking-widest text-muted-foreground">{discussion.category}</span>
                {discussion.nationCode && <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold uppercase tracking-widest">{discussion.nationCode}</span>}
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">{discussion.title}</h1>
              <div className="prose prose-invert max-w-none text-muted-foreground mb-8 whitespace-pre-wrap leading-relaxed">
                {discussion.content}
              </div>
              
              <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={discussion.avatarUrl || undefined} />
                  <AvatarFallback className="bg-muted text-xs">{discussion.username.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-2">
                    {discussion.username} 
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">{discussion.reputationTier}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(discussion.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2 text-foreground">
          <MessageSquare className="w-5 h-5 text-primary" /> Comments ({discussion.commentCount})
        </h3>

        <div className="space-y-4">
           {discussion.comments?.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">No comments yet.</div>
           ) : (
             discussion.comments?.map(comment => (
                <Card key={comment.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4 sm:p-6 flex gap-4">
                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                      <AvatarImage src={comment.avatarUrl || undefined} />
                      <AvatarFallback className="bg-muted text-xs">{comment.username.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-sm font-bold text-foreground">{comment.username}</span>
                         <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
