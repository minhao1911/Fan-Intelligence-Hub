import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetDiscussion,
  getGetDiscussionQueryKey,
  useUpvoteDiscussion,
  useAddComment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, ArrowUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";

export default function DiscussionDetail() {
  const { id } = useParams();
  const discussionId = parseInt(id as string, 10);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: discussion, isLoading } = useGetDiscussion(discussionId, {
    query: { enabled: !!discussionId, queryKey: getGetDiscussionQueryKey(discussionId) },
  });

  const upvote = useUpvoteDiscussion();
  const addComment = useAddComment();

  const handleUpvote = () => {
    upvote.mutate(
      { id: discussionId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(discussionId) }) },
    );
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(
      { id: discussionId, data: { content: commentText.trim() } },
      {
        onSuccess: () => {
          setCommentText("");
          queryClient.invalidateQueries({ queryKey: getGetDiscussionQueryKey(discussionId) });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-pulse">
        <div className="h-64 bg-card rounded-2xl" />
        <div className="h-32 bg-card rounded-xl" />
      </div>
    );
  }

  if (!discussion) return <div className="text-center py-20 text-muted-foreground">Discussion not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Link href="/discussions" className="text-muted-foreground hover:text-primary flex items-center gap-2 w-fit text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Discussions
      </Link>

      {/* Main Post */}
      <Card className="bg-card border-border relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/60" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex gap-6">
            {/* Upvote */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <button
                onClick={handleUpvote}
                disabled={upvote.isPending || discussion.hasUserUpvoted}
                className={`p-2 rounded-lg transition-colors ${
                  discussion.hasUserUpvoted
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <span className="font-mono font-bold text-base text-foreground">{discussion.upvotes}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-1 bg-muted rounded text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {discussion.category}
                </span>
                {discussion.nationCode && (
                  <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-bold uppercase tracking-widest">
                    {discussion.nationCode}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 leading-tight">
                {discussion.title}
              </h1>
              <div className="text-muted-foreground mb-8 whitespace-pre-wrap leading-relaxed text-sm">
                {discussion.content}
              </div>

              <div className="flex items-center gap-3 pt-5 border-t border-border/50">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={discussion.avatarUrl || undefined} />
                  <AvatarFallback className="bg-muted text-xs">
                    {discussion.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {discussion.username}
                    {discussion.reputationTier && (
                      <ReputationBadge tier={discussion.reputationTier} size="sm" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(discussion.createdAt).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Leave a Comment · +2 pts
          </h4>
          <Textarea
            placeholder="Share your take..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="bg-muted/50 border-border resize-none min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              size="sm"
              className="font-heading uppercase tracking-widest"
            >
              {addComment.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-lg font-heading font-bold uppercase flex items-center gap-2 text-foreground">
          <MessageSquare className="w-5 h-5 text-primary" /> Comments ({discussion.commentCount})
        </h3>

        {!discussion.comments?.length ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
            No comments yet. Be the first.
          </div>
        ) : (
          <div className="space-y-3">
            {discussion.comments.map((comment: any) => (
              <Card key={comment.id} className="bg-card/60 border-border/50">
                <CardContent className="p-4 sm:p-5 flex gap-4">
                  <Avatar className="h-8 w-8 border border-border shrink-0 mt-0.5">
                    <AvatarImage src={comment.avatarUrl || undefined} />
                    <AvatarFallback className="bg-muted text-xs">
                      {comment.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{comment.username}</span>
                      {comment.reputationTier && (
                        <ReputationBadge tier={comment.reputationTier} size="sm" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
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
