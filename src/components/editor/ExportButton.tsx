"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  carouselId: string;
  slideCount: number;
}

export function ExportButton({ carouselId, slideCount }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [format, setFormat] = useState<"png" | "jpg">("png");

  const handleExport = async () => {
    if (exporting || slideCount === 0) return;
    setExporting(true);
    setDone(false);

    try {
      const response = await fetch(
        `/api/carousels/${carouselId}/export?format=${format}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carousel-${carouselId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
      setTimeout(() => setDone(false), 3000);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as "png" | "jpg")}
        disabled={exporting}
        className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground"
        aria-label="Export format"
      >
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
      </select>
      <Button
        onClick={handleExport}
        disabled={exporting || slideCount === 0}
        variant="accent"
        size="sm"
      >
        <span
          key={exporting ? "exporting" : done ? "done" : "idle"}
          className="oc-enter-pop inline-flex items-center gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exporting…</span>
            </>
          ) : done ? (
            <>
              <Check className="h-4 w-4" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export</span>
            </>
          )}
        </span>
      </Button>
    </div>
  );
}
