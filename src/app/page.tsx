"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Layers, Trash2, Copy } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateCarouselDialog } from "@/components/ui/create-carousel-dialog";
import { BrandSetup } from "@/components/brand/BrandSetup";
import type { Carousel } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";

export default function DashboardPage() {
  const router = useRouter();
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrandSetup, setShowBrandSetup] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const load = useCallback(async () => {
    try {
      const [carouselRes, brandRes] = await Promise.all([
        fetch("/api/carousels").then((r) => r.json()),
        fetch("/api/brand").then((r) => r.json()),
      ]);
      setCarousels(carouselRes.carousels || []);
      const brand = brandRes as BrandConfig;
      if (!brand.name || brand.name.trim() === "") {
        setShowBrandSetup(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once on mount. `load` sets state after `await`, so this cannot
  // cascade synchronously; the rule cannot see through the async boundary.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setConfirmState({
      open: true,
      title: `Delete "${name}"?`,
      description: "This will permanently delete the carousel and all its slides.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
        if (res.ok) setCarousels((prev) => prev.filter((c) => c.id !== id));
      },
    });
  }, []);

  const handleDuplicate = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const res = await fetch(`/api/carousels/${id}/duplicate`, { method: "POST" });
      if (res.ok) await load();
    },
    [load]
  );

  const handleCreate = useCallback(
    async (name: string, aspectRatio: string) => {
      try {
        const res = await fetch("/api/carousels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, aspectRatio }),
        });
        if (res.ok) {
          const carousel = await res.json();
          router.push(`/carousel/${carousel.id}`);
        } else {
          alert("Failed to create carousel. Please try again.");
        }
      } catch {
        alert("Network error: Could not connect to the server.");
      }
    },
    [router]
  );

  return (
    <div className="h-full flex flex-col">
      <TopBar onSettingsClick={() => setShowBrandSetup(true)} />

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      <CreateCarouselDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreate}
      />

      <BrandSetup
        open={showBrandSetup}
        onComplete={() => {
          setShowBrandSetup(false);
          load();
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">Carousels</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI writes the content. Templates handle the design.
              </p>
            </div>
            <Button variant="accent" size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New carousel
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : carousels.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
              <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">No carousels yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Create one and describe what you want to make.
              </p>
              <Button variant="accent" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New carousel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {carousels.map((carousel) => (
                <div
                  key={carousel.id}
                  onClick={() => router.push(`/carousel/${carousel.id}`)}
                  className="group relative rounded-xl border border-border bg-surface p-4 cursor-pointer hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{carousel.name}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => handleDuplicate(e, carousel.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, carousel.id, carousel.name)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">{carousel.aspectRatio}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {carousel.slides.length} slide{carousel.slides.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {carousel.themeId && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate">
                      Theme: {carousel.themeId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
