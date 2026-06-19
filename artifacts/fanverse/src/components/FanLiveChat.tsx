import { useState, useEffect, useRef, useCallback } from "react";
import { useListMatches } from "@workspace/api-client-react";
import { MessageCircle, Send, X, Wifi, Radio } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessage {
  id: string;
  author: string;
  initials: string;
  text: string;
  ts: Date;
  flag?: string;
  isMe?: boolean;
  type?: "goal" | "card" | "normal";
}

const FAKE_FANS = [
  { author: "CaioFCB",      flag: "🇧🇷", initials: "CF" },
  { author: "MadridMike",   flag: "🇪🇸", initials: "MM" },
  { author: "LionelFan99",  flag: "🇦🇷", initials: "LF" },
  { author: "EaglesGhana",  flag: "🇬🇭", initials: "EG" },
  { author: "SamuraiBlue",  flag: "🇯🇵", initials: "SB" },
  { author: "AlbicelesteFan",flag:"🇦🇷", initials: "AF" },
  { author: "RooneysGhost", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", initials: "RG" },
  { author: "OranjeArmy",   flag: "🇳🇱", initials: "OA" },
  { author: "SenegalRoar",  flag: "🇸🇳", initials: "SR" },
  { author: "TigerMaurice", flag: "🇨🇮", initials: "TM" },
  { author: "USAultra",     flag: "🇺🇸", initials: "UA" },
  { author: "CanadaRising", flag: "🇨🇦", initials: "CR" },
  { author: "MexicoFiel",   flag: "🇲🇽", initials: "MF" },
  { author: "PirloLegacy",  flag: "🇮🇹", initials: "PL" },
  { author: "KobeYamazaki", flag: "🇯🇵", initials: "KY" },
];

const MATCH_MESSAGES = [
  "Let's gooooo!! 🔥🔥",
  "This match is ELECTRIC",
  "Best WC match I've seen 🏆",
  "That pass was filthy 😮",
  "The midfield battle is unreal rn",
  "VAR better not ruin this",
  "Atmosphere looks insane in the stadium",
  "My heart can't take this 😭",
  "First half stats are mad lopsided",
  "That should've been a penalty no question",
  "Come on!! Push forward!",
  "The keeper is having the game of his life",
  "World Cup 2026 delivering already 🌍",
  "Anyone else watching with family? 🙌",
  "This ref is cooked lol",
  "Both wingers are absolute problems today",
  "Can't believe I almost missed this game",
  "FanVerse predicted this scoreline 👀",
  "The defensive block is so solid rn",
  "Third minute of stoppage time 😬",
  "Sub coming on could change everything",
  "That corner routine was chef's kiss 👌",
  "Halfway through and still 0-0 💀",
  "Press is relentless today",
  "My nerves 📈📈📈",
];

const GOAL_MESSAGES = [
  "GOAAAAAAL!! 🚨🚨🚨",
  "GET IN THERE!! 🎉🎉",
  "YESSSSSS 🙌🙌🙌",
  "Top bins!! What a finish!",
  "HOW IS THAT NOT OFFSIDE 😤",
  "SCREAMING RN 😭🔥",
  "WC 2026 is different gravy 🏆",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface Props {
  open: boolean;
  onClose: () => void;
  myUsername?: string;
}

export default function FanLiveChat({ open, onClose, myUsername }: Props) {
  const { data: liveMatches } = useListMatches({ status: "live", limit: 1 });
  const { data: upcomingMatches } = useListMatches({ status: "upcoming", limit: 1 });

  const activeMatch = liveMatches?.[0] ?? upcomingMatches?.[0] ?? null;
  const isLive = !!liveMatches?.[0];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const seed: ChatMessage[] = [];
    for (let i = 0; i < 12; i++) {
      const fan = randomFrom(FAKE_FANS);
      seed.push({
        id: `seed-${i}`,
        author: fan.author,
        initials: fan.initials,
        flag: fan.flag,
        text: randomFrom(MATCH_MESSAGES),
        ts: new Date(Date.now() - (12 - i) * 28_000),
      });
    }
    return seed;
  });

  const [draft, setDraft] = useState("");
  const [pulse, setPulse] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev.slice(-80), msg]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }, []);

  useEffect(() => {
    if (!open) return;
    const isGoalTick = () => Math.random() < 0.08;
    const interval = setInterval(() => {
      const fan = randomFrom(FAKE_FANS);
      const isGoal = isGoalTick();
      addMessage({
        id: `sim-${Date.now()}-${Math.random()}`,
        author: fan.author,
        initials: fan.initials,
        flag: fan.flag,
        text: isGoal ? randomFrom(GOAL_MESSAGES) : randomFrom(MATCH_MESSAGES),
        ts: new Date(),
        type: isGoal ? "goal" : "normal",
      });
    }, 3500 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [open, addMessage]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addMessage({
      id: `me-${Date.now()}`,
      author: myUsername ?? "You",
      initials: (myUsername ?? "You").substring(0, 2).toUpperCase(),
      text,
      ts: new Date(),
      isMe: true,
    });
    setDraft("");
  };

  const matchLabel = activeMatch
    ? `${activeMatch.homeTeam.shortName} vs ${activeMatch.awayTeam.shortName}`
    : "World Cup 2026";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 300 }}
      >
        <div className="flex flex-col h-full bg-[hsl(var(--card))] border-r border-border shadow-2xl">

          {/* Header */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border/60 bg-gradient-to-b from-primary/8 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {isLive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Fan Live Chat
                </span>
              </div>
              <button
                onClick={onClose}
                className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Match badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
              isLive
                ? "bg-red-500/15 border border-red-500/30 text-red-400"
                : "bg-secondary border border-border text-muted-foreground"
            }`}>
              {isLive ? (
                <Radio className="h-3 w-3 animate-pulse shrink-0" />
              ) : (
                <Wifi className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{matchLabel}</span>
              {activeMatch && isLive && activeMatch.minute != null && (
                <span className="ml-auto shrink-0 font-mono">{activeMatch.minute}'</span>
              )}
              {isLive && (
                <span className="ml-auto shrink-0 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Live
                </span>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isMe ? "flex-row-reverse" : ""} ${
                  msg.type === "goal" ? "animate-in slide-in-from-bottom-2 duration-300" : ""
                }`}
              >
                {!msg.isMe && (
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarFallback
                      className="text-[8px] font-heading font-bold bg-secondary text-muted-foreground"
                    >
                      {msg.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col gap-0.5 max-w-[200px] ${msg.isMe ? "items-end" : "items-start"}`}>
                  {!msg.isMe && (
                    <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                      {msg.flag && <span>{msg.flag}</span>}
                      {msg.author}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-snug ${
                      msg.isMe
                        ? "bg-primary text-primary-foreground rounded-tr-sm font-semibold"
                        : msg.type === "goal"
                        ? "bg-gradient-to-r from-primary/20 to-yellow-500/20 border border-primary/40 text-foreground font-bold"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 px-1">{fmtTime(msg.ts)}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Live fan count */}
          <div className="shrink-0 px-4 py-1.5 border-t border-border/40 bg-secondary/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] text-muted-foreground font-semibold">
              {(1847 + Math.floor(messages.length * 3)).toLocaleString()} fans watching
            </span>
            <span className={`ml-auto text-[10px] font-bold transition-opacity duration-300 ${pulse ? "opacity-100 text-primary" : "opacity-0"}`}>
              +1 message
            </span>
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 pb-4 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 border border-border focus-within:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Drop your take…"
                maxLength={120}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-all disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/50 mt-1.5 text-center">
              Press Enter to send · {120 - draft.length} chars left
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
