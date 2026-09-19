"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { SLIDE_TYPES, type SlideType } from "@/types/carousel";

const DESCRIPTIONS: Record<SlideType, string> = {
  cover: "Opening slide with a hook",
  text: "One idea with supporting points",
  comparison: "Two things side by side",
  statistic: "Headline numbers",
  timeline: "A sequence of events",
  process: "Ordered steps",
  diagram: "A concept and its parts",
  quote: "A quotation",
  conclusion: "Takeaway and call to action",
};

interface AddSlideDialogProps {
  carouselId: string;
  onAdded: () => void;
  disabled?: boolean;
}

/**
 * Add a slide by hand.
 *
 * Fetches a blank, schema-valid payload for the chosen type and posts it, so a
 * manually added slide behaves exactly like one the AI created.
 */
export function AddSlideDialog({ carouselId, onAdded, disabled }: AddSlideDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<SlideType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (type: SlideType) => {
    setBusy(type);
    setError(null);
    try {
      const blankRes = await fetch(
        `/api/carousels/${carouselId}/slides/blank?type=${type}`
      );
      if (!blankRes.ok) throw new Error("Could not prepare slide");
      const content = await blankRes.json();

      const res = await fetch(`/api/carousels/${carouselId}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Could not add slide");
      }

      setOpen(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add slide");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled} title="Add slide">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-xl">
          <Dialog.Title className="text-sm font-semibold">Add a slide</Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mt-1">
            Pick a slide type. You can edit the content afterwards.
          </Dialog.Description>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {SLIDE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleAdd(type)}
                disabled={busy !== null}
                className="text-left rounded-lg border border-border p-3 hover:border-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold capitalize">{type}</span>
                  {busy === type && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {DESCRIPTIONS[type]}
                </p>
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}