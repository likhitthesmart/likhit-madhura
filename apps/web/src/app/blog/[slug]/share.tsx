"use client";
import { Check, Facebook, Link2, Twitter } from "lucide-react";
import { useState } from "react";

export function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  return (
    <div className="mt-8 flex items-center gap-3 border-t border-sand pt-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-bark/60">Share</span>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="rounded-full border border-sand-dark p-2 text-bark hover:border-forest-500 hover:text-forest-800"><Twitter className="h-4 w-4" /></a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="rounded-full border border-sand-dark p-2 text-bark hover:border-forest-500 hover:text-forest-800"><Facebook className="h-4 w-4" /></a>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
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
