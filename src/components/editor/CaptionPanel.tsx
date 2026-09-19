"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptionPanelProps {
  carouselId: string;
  caption?: string;
  hashtags?: string[];
  onUpdate?: () => void;
}

export function CaptionPanel({ carouselId, caption, hashtags, onUpdate }: CaptionPanelProps) {
  const [value, setValue] = useState(caption || "");
  const [tags, setTags] = useState((hashtags || []).join(" "));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Adopt new caption data during render rather than in an effect.
  const [syncedSource, setSyncedSource] = useState({ caption, hashtags });
  if (syncedSource.caption !== caption || syncedSource.hashtags !== hashtags) {
    setSyncedSource({ caption, hashtags });
    setValue(caption || "");
    setTags((hashtags || []).join(" "));
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/carousels/${carouselId}/caption`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: value,
          hashtags: tags.split(/\s+/).filter(Boolean).map((t) => t.replace(/^#/, "")),
        }),
      });
      onUpdate?.();
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const text = `${value}\n\n${tags}`.trim();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Caption</label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          placeholder="Write a caption…"
          className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Hashtags</label>
        <textarea
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          rows={3}
          placeholder="#design #ai #carousel"
          className="mt-1 w-full rounded-md border border-border bg-surface p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm" variant="accent">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button onClick={handleCopy} size="sm" variant="outline">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
    </div>
  );
}
