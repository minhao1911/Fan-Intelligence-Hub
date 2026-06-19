import { useState } from "react";
import { Link } from "wouter";
import { useListGroups, useCreateGroup, useListNations } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users, Plus, Lock, Globe } from "lucide-react";

const EMOJIS = ["⚽", "🏆", "🔥", "⚡", "🛡️", "🎯", "👑", "💪", "🌍", "🎉", "🦁", "🐉"];

export default function Groups() {
  const [search, setSearch] = useState("");
  const [nationFilter, setNationFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coverEmoji: "⚽", nationCode: "", isPublic: true });
  const queryClient = useQueryClient();

  const { data: groups, isLoading } = useListGroups({ search: search || undefined, nationCode: nationFilter || undefined });
  const { data: nations } = useListNations({});
  const createGroup = useCreateGroup();

  const handleCreate = () => {
    if (!form.name.trim() || !form.description.trim()) return;
    createGroup.mutate(
      { data: { name: form.name, description: form.description, coverEmoji: form.coverEmoji, nationCode: form.nationCode || undefined, isPublic: form.isPublic } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["listGroups"] });
          setOpen(false);
          setForm({ name: "", description: "", coverEmoji: "⚽", nationCode: "", isPublic: true });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-foreground">Fan Groups</h1>
          <p className="text-muted-foreground mt-1">Join or create communities around your favourite nations and rivalries.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wide gap-2">
              <Plus className="h-4 w-4" /> New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading uppercase tracking-wide text-xl">Create a Fan Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Cover Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, coverEmoji: e }))}
                      className={`w-9 h-9 text-xl rounded-lg border transition-colors ${form.coverEmoji === e ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Group Name *</label>
                <Input
                  placeholder="e.g. Argentina Ultras"
                  className="bg-input border-border"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={60}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description *</label>
                <textarea
                  placeholder="What's this group about?"
                  className="w-full rounded-md border border-border bg-input text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                  maxLength={200}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Nation (optional)</label>
                <select
                  className="w-full rounded-md border border-border bg-input text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.nationCode}
                  onChange={(e) => setForm((f) => ({ ...f, nationCode: e.target.value }))}
                >
                  <option value="">— Any nation —</option>
                  {nations?.map((n) => (
                    <option key={n.code} value={n.code}>{n.flagEmoji} {n.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors ${form.isPublic ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {form.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {form.isPublic ? "Public" : "Private"}
                </button>
                <span className="text-xs text-muted-foreground">{form.isPublic ? "Anyone can join" : "Invite only"}</span>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wide"
                onClick={handleCreate}
                disabled={createGroup.isPending || !form.name.trim() || !form.description.trim()}
              >
                {createGroup.isPending ? "Creating…" : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups…"
            className="pl-10 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={nationFilter}
          onChange={(e) => setNationFilter(e.target.value)}
        >
          <option value="">All nations</option>
          {nations?.map((n) => (
            <option key={n.code} value={n.code}>{n.flagEmoji} {n.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <div className="text-5xl mb-3">⚽</div>
          <p className="text-muted-foreground font-medium">No groups found.</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first — create one above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl leading-none select-none group-hover:scale-110 transition-transform duration-300">{group.coverEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold uppercase tracking-wide text-foreground truncate">{group.name}</h3>
                      {group.nationCode && (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                          {nations?.find((n) => n.code === group.nationCode)?.flagEmoji} {nations?.find((n) => n.code === group.nationCode)?.name ?? group.nationCode}
                        </span>
                      )}
                    </div>
                    {!group.isPublic && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{group.description}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {group.memberCount.toLocaleString()} {group.memberCount === 1 ? "member" : "members"}
                    {group.isUserMember && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Joined</span>
                    )}
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
