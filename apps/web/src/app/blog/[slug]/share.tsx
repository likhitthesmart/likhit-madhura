"use client";
import { Check, Facebook, Link2, Twitter } from "lucide-react";
import { useState } from "react";

export function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const openShare = (base: string) => {
    const url = encodeURIComponent(window.location.href);
    window.open(base.replace("{url}", url).replace("{title}", encodeURIComponent(title)), "_blank", "noopener");
  };
  return (
    <div className="mt-8 flex items-center gap-3 border-t border-sand pt-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-bark/60">Share</span>
      <button onClick={() => openShare("https://twitter.com/intent/tweet?text={title}&url={url}")} aria-label="Share on X" className="rounded-full border border-sand-dark p-2 text-bark hover:border-forest-500 hover:text-forest-800"><Twitter className="h-4 w-4" /></button>
      <button onClick={() => openShare("https://www.facebook.com/sharer/sharer.php?u={url}")} aria-label="Share on Facebook" className="rounded-full border border-sand-dark p-2 text-bark hover:border-forest-500 hover:text-forest-800"><Facebook className="h-4 w-4" /></button>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        aria-label="Copy link"
        className="rounded-full border border-sand-dark p-2 text-bark hover:border-forest-500 hover:text-forest-800"
      >
        {copied ? <Check className="h-4 w-4 text-forest-700" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
