"use client";

import { useState, useCallback } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Slide } from "@/types/carousel";

interface SlideEditorProps {
  carouselId: string;
  slide: Slide;
  onSaved: () => void;
}

/**
 * Structured content editor for a single slide.
 *
 * Edits the slide's *content*, never its markup. Fields are driven by the
 * slide's type, so a comparison slide shows two columns and a statistic slide
 * shows a value/label list. The API validates the payload with the same zod
 * schema the AI's tool calls go through.
 */
export function SlideEditor({ carouselId, slide, onSaved }: SlideEditorProps) {
  const [draft, setDraft] = useState<Slide>(slide);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the draft when the caller switches slides. Adjusting state during
  // render (rather than in an effect) avoids a cascading re-render, and is the
  // pattern React recommends for deriving from new props.
  const [syncedFrom, setSyncedFrom] = useState(slide);
  if (slide !== syncedFrom) {
    setSyncedFrom(slide);
    setDraft(slide);
    setError(null);
    setSaved(false);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(slide);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carouselId}/slides/${slide.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || "Could not save");
      }

      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }, [carouselId, draft, slide.id, onSaved]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Edit slide</h2>
          <p className="text-xs text-muted-foreground truncate capitalize">
            {slide.type} · slide {slide.order + 1}
          </p>
        </div>
        <Button
          size="sm"
          variant={dirty ? "accent" : "ghost"}
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SlideFields draft={draft} setDraft={setDraft} />

        {error && (
          <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Replace one content field, preserving the rest of the draft. */
type SetDraft = (updater: (draft: Slide) => Slide) => void;

function SlideFields({ draft, setDraft }: { draft: Slide; setDraft: SetDraft }) {
  const patch = (fields: Record<string, unknown>) =>
    setDraft((d) => ({ ...d, ...fields }) as Slide);

  switch (draft.type) {
    case "cover":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Subtitle" hint="Optional">
            <TextInput value={draft.subtitle ?? ""} onChange={(v) => patch({ subtitle: v })} />
          </Field>
          <Field label="Eyebrow" hint="Short uppercase label">
            <TextInput value={draft.eyebrow ?? ""} onChange={(v) => patch({ eyebrow: v })} />
          </Field>
        </>
      );

    case "text":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Body" hint="Optional">
            <TextArea value={draft.body ?? ""} onChange={(v) => patch({ body: v })} rows={4} />
          </Field>
          <Field label="Bullets" hint="One per line, max 6">
            <TextArea
              value={(draft.bullets ?? []).join("\n")}
              onChange={(v) => patch({ bullets: lines(v, 6) })}
            />
          </Field>
        </>
      );

    case "comparison":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          {(["left", "right"] as const).map((side) => (
            <div key={side} className="space-y-2 rounded-lg border border-border p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {side}
              </span>
              <Field label="Heading">
                <TextInput
                  value={draft[side].title}
                  onChange={(v) => patch({ [side]: { ...draft[side], title: v } })}
                />
              </Field>
              <Field label="Items" hint="One per line, max 6">
                <TextArea
                  value={draft[side].items.join("\n")}
                  onChange={(v) => patch({ [side]: { ...draft[side], items: lines(v, 6) } })}
                />
              </Field>
            </div>
          ))}
        </>
      );

    case "statistic":
      return (
        <>
          <Field label="Title" hint="Optional">
            <TextInput value={draft.title ?? ""} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Stats" hint="One per line as: value | label">
            <TextArea
              value={draft.stats.map((s) => `${s.value} | ${s.label}`).join("\n")}
              onChange={(v) => patch({ stats: pairs(v, 4) })}
            />
          </Field>
        </>
      );

    case "timeline":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Events" hint="One per line as: marker | title | description">
            <TextArea
              rows={5}
              value={draft.events
                .map((e) => [e.label, e.title, e.description].filter(Boolean).join(" | "))
                .join("\n")}
              onChange={(v) =>
                patch({
                  events: lines(v, 6)
                    .map((row) => {
                      const [label = "", title = "", description = ""] = row
                        .split("|")
                        .map((s) => s.trim());
                      return { label, title, description: description || undefined };
                    })
                    .filter((e) => e.label && e.title),
                })
              }
            />
          </Field>
        </>
      );

    case "process":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Steps" hint="One per line as: title | description">
            <TextArea
              rows={5}
              value={draft.steps
                .map((s) => [s.title, s.description].filter(Boolean).join(" | "))
                .join("\n")}
              onChange={(v) =>
                patch({
                  steps: lines(v, 6)
                    .map((row) => {
                      const [title = "", description = ""] = row.split("|").map((s) => s.trim());
                      return { title, description: description || undefined };
                    })
                    .filter((s) => s.title),
                })
              }
            />
          </Field>
        </>
      );

    case "diagram":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Center" hint="The central concept">
            <TextInput value={draft.center} onChange={(v) => patch({ center: v })} />
          </Field>
          <Field label="Nodes" hint="One per line as: label | description">
            <TextArea
              rows={5}
              value={draft.nodes
                .map((n) => [n.label, n.description].filter(Boolean).join(" | "))
                .join("\n")}
              onChange={(v) =>
                patch({
                  nodes: lines(v, 6)
                    .map((row) => {
                      const [label = "", description = ""] = row.split("|").map((s) => s.trim());
                      return { label, description: description || undefined };
                    })
                    .filter((n) => n.label),
                })
              }
            />
          </Field>
        </>
      );

    case "quote":
      return (
        <>
          <Field label="Quote">
            <TextArea value={draft.quote} onChange={(v) => patch({ quote: v })} rows={5} />
          </Field>
          <Field label="Attribution" hint="Optional">
            <TextInput
              value={draft.attribution ?? ""}
              onChange={(v) => patch({ attribution: v })}
            />
          </Field>
        </>
      );

    case "conclusion":
      return (
        <>
          <Field label="Title">
            <TextInput value={draft.title} onChange={(v) => patch({ title: v })} />
          </Field>
          <Field label="Body" hint="Optional">
            <TextArea value={draft.body ?? ""} onChange={(v) => patch({ body: v })} rows={3} />
          </Field>
          <Field label="Call to action" hint="Optional">
            <TextInput value={draft.cta ?? ""} onChange={(v) => patch({ cta: v })} />
          </Field>
        </>
      );
  }
}

/** Split textarea input into trimmed, non-empty lines. */
function lines(value: string, max: number): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Parse "value | label" rows into stat objects. */
function pairs(value: string, max: number): { value: string; label: string }[] {
  return lines(value, max)
    .map((row) => {
      const [v = "", l = ""] = row.split("|").map((s) => s.trim());
      return { value: v, label: l };
    })
    .filter((p) => p.value && p.label);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {hint && <span className="text-[11px] text-muted-foreground/70 ml-1.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 rounded-md border border-border bg-surface px-2 text-xs outline-none focus:border-accent"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent resize-y"
    />
  );
}
