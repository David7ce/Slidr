"use client";

import { useState, useEffect } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/theme";

interface ThemeGalleryProps {
  selectedThemeId: string | null;
  onSelect: (themeId: string) => void;
}

export function ThemeGallery({ selectedThemeId, onSelect }: ThemeGalleryProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(data.themes || []))
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4">
        No themes found. Add a DESIGN.md preset to{" "}
        <code className="text-[10px]">src/lib/themes/presets/</code>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {themes.map((theme) => {
        const isSelected = theme.id === selectedThemeId;
        return (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              isSelected
                ? "border-accent bg-accent/5"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold truncate">{theme.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
            </div>

            {/* Palette swatches */}
            <div className="flex gap-1 mt-2">
              {[
                theme.palette.background,
                theme.palette.primary,
                theme.palette.accent,
                theme.palette.surface,
              ].map((color, i) => (
                <span
                  key={i}
                  className="h-4 w-4 rounded-full border border-black/10"
                  style={{ background: color }}
                />
              ))}
            </div>

            <div className="mt-2 text-[10px] text-muted-foreground truncate">
              {theme.fonts.heading} · {theme.fonts.body}
            </div>
            {theme.atmosphere && (
              <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                {theme.atmosphere}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeGalleryHeader() {
  return (
    <span className="text-sm font-semibold flex items-center gap-1.5">
      <Palette className="h-4 w-4" />
      Themes
    </span>
  );
}
