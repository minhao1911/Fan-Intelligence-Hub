import { useState } from "react";
import { Link } from "wouter";
import { useListGroups, useCreateGroup, useListNations } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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

      {/* ── Hero Header ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative px-6 py-7 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🏟️</span>
              <h1 className="text-4xl font-heading font-bold uppercase text-foreground tracking-tight">Fan Groups</h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Join or create communities around your favourite nations and rivalries.</p>
            {groups && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3 text-primary" />
                <span><strong className="text-foreground">{groups.length}</strong> active communities</span>
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wide gap-2 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_28px_rgba(251,191,36,0.3)] transition-shadow">
                <Plus className="h-4 w-4" /> New Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-md rounded-2xl">
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
                        className={`w-9 h-9 text-xl rounded-xl border transition-all ${form.coverEmoji === e ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(251,191,36,0.2)]" : "border-border hover:border-muted-foreground"}`}
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
                    className="bg-input border-border rounded-xl"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Description *</label>
                  <textarea
                    placeholder="What's this group about?"
                    className="w-full rounded-xl border border-border bg-input text-foreground px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    rows={3}
                    maxLength={200}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block">Nation (optional)</label>
                  <select
                    className="w-full rounded-xl border border-border bg-input text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${form.isPublic ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {form.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {form.isPublic ? "Public" : "Private"}
                  </button>
                  <span className="text-xs text-muted-foreground">{form.isPublic ? "Anyone can join" : "Invite only"}</span>
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground font-heading uppercase tracking-wide rounded-xl"
                  onClick={handleCreate}
                  disabled={createGroup.isPending || !form.name.trim() || !form.description.trim()}
                >
                  {createGroup.isPending ? "Creating…" : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Search + Filter ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search groups…"
            className="pl-10 bg-card border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={nationFilter}
          onChange={(e) => setNationFilter(e.target.value)}
        >
          <option value="">All nations</option>
          {nations?.map((n) => (
            <option key={n.code} value={n.code}>{n.flagEmoji} {n.name}</option>
          ))}
        </select>
      </div>

      {/* ── Grid ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 bg-muted/40 rounded-2xl animate-pulse" />)}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border/50 rounded-2xl">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-muted-foreground font-medium">No groups found.</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first — create one above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-0.5 h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                {/* Top accent bar */}
                <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />

                <div className="relative p-5 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <div className="text-4xl leading-none select-none group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
                        {group.coverEmoji}
                      </div>
                      <div className="absolute inset-0 blur-xl opacity-30 text-3xl flex items-center justify-center pointer-events-none">
                        {group.coverEmoji}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold uppercase tracking-wide text-foreground truncate text-sm">
                        {group.name}
                      </h3>
                      {group.nationCode && (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                          {nations?.find((n) => n.code === group.nationCode)?.flagEmoji}{" "}
                          {nations?.find((n) => n.code === group.nationCode)?.name ?? group.nationCode}
                        </span>
                      )}
                    </div>
                    {!group.isPublic && (
                      <div className="shrink-0 p-1 rounded-md bg-muted/60">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                    {group.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/40">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {group.memberCount.toLocaleString()} {group.memberCount === 1 ? "member" : "members"}
                    </span>
                    {group.isUserMember && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                        Joined
                      </span>
                    )}
                    {!group.isPublic && (
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-border">
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
