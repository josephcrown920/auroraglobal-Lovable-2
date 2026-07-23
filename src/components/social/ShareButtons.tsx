import { useState } from "react";
import { Facebook, Twitter, Linkedin, MessageCircle, Send, Link2, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ShareButtonsProps {
  url?: string;
  title?: string;
  text?: string;
  hashtags?: string[];
  className?: string;
  compact?: boolean;
}

/**
 * ShareButtons — social sharing bar.
 * Uses Web Share API on supported (mobile) browsers, and per-network share
 * intents everywhere else. TikTok/Instagram don't expose web share intents,
 * so we surface Copy Link as the canonical path for those apps.
 */
export function ShareButtons({
  url,
  title = "AURORA Performance Studio",
  text = "Direct your visual identity with AURORA.",
  hashtags = ["AURORAPerformanceStudio", "AIVideo"],

  className,
  compact = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "https://aurora.performance.studio");
  const encoded = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title);
  const encText = encodeURIComponent(text);
  const tags = hashtags.join(",");

  const nets = [
    { key: "x", label: "X / Twitter", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encText}&hashtags=${tags}` },
    { key: "fb", label: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { key: "in", label: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { key: "wa", label: "WhatsApp", icon: MessageCircle, href: `https://api.whatsapp.com/send?text=${encText}%20${encoded}` },
    { key: "tg", label: "Telegram", icon: Send, href: `https://t.me/share/url?url=${encoded}&text=${encText}` },
  ] as const;

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await copy();
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied — paste in TikTok, Instagram, or anywhere");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Button size={compact ? "sm" : "default"} variant="outline" onClick={nativeShare}>
        <Share2 className="mr-1.5 h-4 w-4" /> Share
      </Button>
      {nets.map((n) => {
        const Icon = n.icon;
        return (
          <a key={n.key} href={n.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${n.label}`}>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Icon className="h-4 w-4" />
            </Button>
          </a>
        );
      })}
      <Button size="icon" variant="ghost" className="rounded-full" onClick={copy} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
