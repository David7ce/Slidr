"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LlmConfig } from "@/lib/llm/types";

interface ProviderPreset {
  id: string;
  label: string;
  baseURL: string;
  model: string;
  free?: boolean;
}

interface LlmConfigModalProps {
  open: boolean;
  onClose: () => void;
  config: LlmConfig;
  onSave: (config: LlmConfig) => Promise<void>;
}

export function LlmConfigModal({ open, onClose, config, onSave }: LlmConfigModalProps) {
  const [baseURL, setBaseURL] = useState(config.baseURL);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(config.model);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed the form from the saved config when the dialog opens, during render.
  const [seededFor, setSeededFor] = useState<{ open: boolean; config: unknown }>({
    open: false,
    config: null,
  });
  if (open && (!seededFor.open || seededFor.config !== config)) {
    setSeededFor({ open: true, config });
    setBaseURL(config.baseURL);
    setModel(config.model);
    setApiKey("");
    setSaved(false);
  } else if (!open && seededFor.open) {
    setSeededFor({ open: false, config: null });
  }

  useEffect(() => {
    if (!open) return;
    fetch("/api/llm-config")
      .then((r) => r.json())
      .then((data) => setPresets(data.presets || []))
      .catch(() => setPresets([]));
  }, [open, config]);

  const applyPreset = (preset: ProviderPreset) => {
    setBaseURL(preset.baseURL);
    setModel(preset.model);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: LlmConfig = {
        baseURL: baseURL.trim(),
        model: model.trim(),
        apiKey: apiKey.trim() || config.apiKey,
      };
      await onSave(payload);
      setSaved(true);
      setTimeout(() => onClose(), 600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold">LLM Settings</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-xs text-muted-foreground mb-4">
            Slidr works with any OpenAI-compatible endpoint. Your key is stored locally in{" "}
            <code className="text-[10px]">data/llm-config.json</code>.
          </Dialog.Description>

          {presets.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground">Quick setup</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="rounded-md border border-border px-2 py-1 text-[11px] hover:border-accent hover:text-accent transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Base URL</label>
              <input
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                API Key {config.apiKey && <span className="font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={config.apiKey ? "••••••••" : "sk-…"}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="llama-3.3-70b-versatile"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="accent" size="sm" onClick={handleSave} disabled={saving}>
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Saved
                </>
              ) : saving ? (
                "Saving…"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
