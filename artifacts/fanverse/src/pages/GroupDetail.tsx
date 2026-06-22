import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import {
  useGetGroup,
  useJoinGroup,
  useLeaveGroup,
  useListGroupPosts,
  useCreateGroupPost,
  useDeleteGroupPost,
  getGetGroupQueryKey,
  getListGroupPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ReputationBadge } from "@/components/ui/ReputationBadge";
import {
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Crown,
  Star,
  Send,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { NationConfidenceMeter } from "@/components/NationConfidenceMeter";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function GroupDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const groupId = parseInt(id as string, 10);

  const [postText, setPostText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: group, isLoading } = useGetGroup(groupId, {
    query: { enabled: !isNaN(groupId), queryKey: getGetGroupQueryKey(groupId) },
  });

  const { data: posts, isLoading: postsLoading } = useListGroupPosts(groupId, undefined, {
    query: {
      enabled: !isNaN(groupId),
      queryKey: getListGroupPostsQueryKey(groupId),
      refetchInterval: 15000,
    },
  });

  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const createPost = useCreateGroupPost();
  const deletePost = useDeleteGroupPost();

  const toggleMembership = () => {
    if (!group) return;
    const opts = {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) }),
    };
    if (group.isUserMember) {
      leaveGroup.mutate({ id: groupId }, opts);
    } else {
      joinGroup.mutate({ id: groupId }, opts);
    }
  };

  const submitPost = () => {
    if (!postText.trim() || createPost.isPending) return;
    createPost.mutate(
      { id: groupId, data: { content: postText.trim() } },
      {
        onSuccess: () => {
          setPostText("");
          queryClient.invalidateQueries({ queryKey: getListGroupPostsQueryKey(groupId) });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitPost();
    }
  };

  const handleDelete = (postId: number) => {
    deletePost.mutate(
      { id: groupId, postId },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListGroupPostsQueryKey(groupId) }),
      }
    );
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
  const isMember = group.isUserMember;
  const isAdmin = group.userRole === "admin";

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
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tight text-foreground">
              {group.name}
            </h1>
            <p className="text-muted-foreground mt-3 text-base max-w-xl">{group.description}</p>
            <div className="flex items-center justify-center md:justify-start gap-1.5 mt-3 text-sm text-muted-foreground font-medium">
              <Users className="h-4 w-4" />
              {group.memberCount.toLocaleString()} {group.memberCount === 1 ? "member" : "members"}
            </div>
          </div>
          <div className="shrink-0">
            {isAdmin ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-heading font-bold uppercase tracking-wide">
                <Crown className="h-4 w-4" /> Admin
              </span>
            ) : (
              <Button
                onClick={toggleMembership}
                disabled={isPending}
                variant={isMember ? "outline" : "default"}
                className={
                  isMember
                    ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive font-heading uppercase tracking-wide"
                    : "bg-primary text-primary-foreground font-heading uppercase tracking-wide"
                }
              >
                {isPending ? "…" : isMember ? "Leave Group" : "Join Group"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nation Confidence Meter — only for nation-affiliated groups */}
      {group.nation && (
        <NationConfidenceMeter
          nationCode={group.nation.code}
          nationName={group.nation.name}
          flagEmoji={group.nation.flagEmoji}
          isMember={isMember || isAdmin}
        />
      )}

      {/* Wall */}
      <div>
        <h2 className="text-xl font-heading font-bold uppercase tracking-wide text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Group Wall
        </h2>

        {/* Composer — only for members */}
        {(isMember || isAdmin) && me ? (
          <Card className="bg-card border-border mb-4">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
                  <AvatarImage src={me?.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                    {(me?.username ?? "ME").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    ref={textareaRef}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share something with the group… (⌘↵ to post)"
                    className="resize-none bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[80px] text-sm"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{postText.length}/1000</span>
                    <Button
                      size="sm"
                      onClick={submitPost}
                      disabled={!postText.trim() || createPost.isPending}
                      className="bg-primary text-primary-foreground font-heading uppercase tracking-wide gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {createPost.isPending ? "Posting…" : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !me ? (
          <Card className="bg-card border-border border-dashed mb-4">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              Sign in and join the group to post on the wall.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border border-dashed mb-4">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              Join this group to post on the wall.
            </CardContent>
          </Card>
        )}

        {/* Post list */}
        {postsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
            No posts yet. Be the first to write something!
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const canDelete =
                isAdmin || post.author.id === (group.members.find((m) => m.username === me?.username)?.id);
              return (
                <Card key={post.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 border border-border shrink-0 mt-0.5">
                        <AvatarImage src={post.author.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-heading text-xs">
                          {post.author.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{post.author.username}</span>
                          {post.author.role === "admin" && (
                            <Crown className="h-3 w-3 text-primary shrink-0" />
                          )}
                          <ReputationBadge tier={post.author.reputationTier} size="sm" />
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                          {post.content}
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deletePost.isPending}
                          className="shrink-0 self-start p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Members */}
      <div>
        <h2 className="text-xl font-heading font-bold uppercase tracking-wide text-foreground mb-4">Members</h2>
        {group.members.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground">
            No members yet.
          </div>
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
