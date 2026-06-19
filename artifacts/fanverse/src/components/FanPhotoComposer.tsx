import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Image as ImageIcon, Star } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type FanPhotoTag = "jersey" | "goat";

export interface FanPhoto {
  id: string;
  imageUrl: string;
  tag: FanPhotoTag;
  caption: string;
  username: string;
  avatarUrl?: string;
  nationCode?: string;
  createdAt: string;
  cheers: number;
}

interface FanPhotoComposerProps {
  open: boolean;
  onClose: () => void;
  onPost: (photo: FanPhoto) => void;
  username: string;
  avatarUrl?: string;
  nationCode?: string;
}

const TAG_OPTIONS: { value: FanPhotoTag; emoji: string; label: string; desc: string }[] = [
  { value: "jersey", emoji: "🎽", label: "Fan Jersey", desc: "Show off your football kit" },
  { value: "goat",   emoji: "🐐", label: "With My GOAT", desc: "You & your all-time legend" },
];

export default function FanPhotoComposer({ open, onClose, onPost, username, avatarUrl, nationCode }: FanPhotoComposerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [tag, setTag] = useState<FanPhotoTag>("jersey");
  const [caption, setCaption] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePost = () => {
    if (!preview) return;
    const photo: FanPhoto = {
      id: `fp-${Date.now()}`,
      imageUrl: preview,
      tag,
      caption: caption.trim(),
      username,
      avatarUrl,
      nationCode,
      createdAt: new Date().toISOString(),
      cheers: 0,
    };
    onPost(photo);
    setPreview(null);
    setCaption("");
    setTag("jersey");
    onClose();
  };

  const handleClose = () => {
    setPreview(null);
    setCaption("");
    setTag("jersey");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-card border-border max-w-lg w-full p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="font-heading uppercase tracking-widest text-sm text-foreground flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" /> Share Your Fan Moment
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload a photo in your fan jersey or with your GOAT player and add a caption.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-6 flex flex-col gap-4">

          {/* User row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-primary shrink-0">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-secondary text-foreground font-heading text-xs">
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-foreground">{username}</p>
              {nationCode && (
                <span className="text-[10px] text-primary border border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded font-bold uppercase">
                  {nationCode}
                </span>
              )}
            </div>
          </div>

          {/* Tag selector */}
          <div className="flex gap-2">
            {TAG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTag(opt.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                  tag === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span className="text-2xl leading-none">{opt.emoji}</span>
                <span className="text-xs font-bold uppercase tracking-wide">{opt.label}</span>
                <span className="text-[10px] text-center leading-tight opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* Image upload area */}
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-all duration-150 ${
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {tag === "jersey" ? (
                  <Upload className="h-5 w-5 text-primary" />
                ) : (
                  <Star className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">
                  {tag === "jersey" ? "Drop your jersey photo here" : "Drop your GOAT photo here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · JPG, PNG, WEBP</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden group">
              <img
                src={preview}
                alt="Fan photo preview"
                className="w-full max-h-72 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-2 rounded-lg transition"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Change
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-2 rounded-lg transition"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
              {/* Tag badge on image */}
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded bg-primary text-primary-foreground">
                  {TAG_OPTIONS.find((t) => t.value === tag)?.emoji} {TAG_OPTIONS.find((t) => t.value === tag)?.label}
                </span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </div>
          )}

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              tag === "jersey"
                ? "Tell the world about your kit... which match are you watching in it? 🎽⚽"
                : "Who's your GOAT and why? Drop the hot take 🐐🔥"
            }
            rows={2}
            className="resize-none bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-primary text-sm"
            maxLength={280}
          />
          <div className="flex items-center justify-between -mt-2">
            <span className="text-[11px] text-muted-foreground">{280 - caption.length} characters left</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePost}
              disabled={!preview}
              className="font-heading uppercase tracking-wide"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              Post Moment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
