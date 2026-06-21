import { useState } from "react";
import { useListDiscussions, useCreateDiscussion } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, ArrowUpCircle, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["all", "analysis", "prediction", "reaction", "general"];

export default function Discussions() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const nationCode = searchParams.get("nationCode") || undefined;
  const matchId = searchParams.get("matchId") ? parseInt(searchParams.get("matchId")!) : undefined;

  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  const queryClient = useQueryClient();
  const { data: discussions, isLoading } = useListDiscussions({
    nationCode,
    matchId,
    category: category === "all" ? undefined : category,
    limit: 20,
  });

  const createDiscussion = useCreateDiscussion();

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    createDiscussion.mutate(
      { data: { title: title.trim(), content: content.trim(), category: newCategory, nationCode: nationCode ?? null } },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setNewCategory("general");
          setShowForm(false);
          queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Discussions</h1>
          <p className="text-muted-foreground mt-1">Tactical analysis, matchday hype, and fan reactions.</p>
        </div>
        <Button
          className="font-heading uppercase tracking-widest shrink-0 gap-2"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Thread"}
        </Button>
      </header>

      {/* New Thread Form */}
      {showForm && (
        <Card className="bg-card border-primary/20 border">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-heading font-bold uppercase text-foreground text-sm tracking-widest">Start a Thread</h3>
            <Input
              placeholder="Thread title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/50 border-border"
            />
            <Textarea
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-muted/50 border-border min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {["general", "analysis", "prediction", "reaction"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                      newCategory === cat
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || createDiscussion.isPending}
                className="font-heading uppercase tracking-widest shrink-0"
                size="sm"
              >
                {createDiscussion.isPending ? "Posting..." : "Post Thread · +8 pts"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${
              category === cat
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 flex gap-5">
              <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
                <div className="h-5 w-5 rounded-full bg-muted" />
                <div className="h-3 w-5 rounded bg-muted" />
              </div>
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex gap-2">
                  <div className="h-4 w-16 rounded bg-muted" />
                  <div className="h-4 w-12 rounded bg-muted" />
                </div>
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : discussions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/60 rounded-2xl gap-3 text-center">
          <span className="text-5xl">💬</span>
          <div>
            <p className="font-heading font-bold uppercase text-foreground tracking-wide">No Threads Yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to spark a conversation.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions?.map((discussion) => (
            <Link key={discussion.id} href={`/discussions/${discussion.id}`}>
              <Card className="bg-card border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex gap-5">
                    {/* Upvote */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0 pt-0.5">
                      <ArrowUpCircle className={`w-5 h-5 ${discussion.hasUserUpvoted ? "text-primary" : "group-hover:text-primary/50 transition-colors"}`} />
                      <span className="font-mono font-bold text-xs">{discussion.upvotes}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {discussion.category}
                        </span>
                        {discussion.nationCode && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-bold uppercase tracking-widest">
                            {discussion.nationCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-1.5 truncate group-hover:text-primary/90 transition-colors">
                        {discussion.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{discussion.content}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={discussion.avatarUrl || undefined} />
                            <AvatarFallback className="bg-muted text-[8px]">
                              {discussion.username.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{discussion.username}</span>
                          {discussion.reputationTier && (
                            <ReputationBadge tier={discussion.reputationTier} size="sm" />
                          )}
                          <span className="opacity-40">·</span>
                          <span>{new Date(discussion.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <MessageSquare className="w-3.5 h-3.5" /> {discussion.commentCount}
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
