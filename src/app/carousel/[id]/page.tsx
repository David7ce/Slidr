"use client";

import { useEffect, useState, useCallback, useRef, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Grid3X3, Maximize2, Settings, Palette, MessageSquare, Pencil } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { CarouselPreview } from "@/components/editor/CarouselPreview";
import { SlideFilmstrip } from "@/components/editor/SlideFilmstrip";
import { SizeSelector } from "@/components/editor/SizeSelector";
import { ExportButton } from "@/components/editor/ExportButton";
import { CaptionPanel } from "@/components/editor/CaptionPanel";
import { SlideEditor } from "@/components/editor/SlideEditor";
import { AddSlideDialog } from "@/components/editor/AddSlideDialog";
import { FullscreenPreview } from "@/components/editor/FullscreenPreview";
import { ThemeGallery } from "@/components/themes/ThemeGallery";
import { LlmConfigModal } from "@/components/llm/LlmConfigModal";
import type { Carousel, AspectRatio, SlideBrand, Slide } from "@/types/carousel";
import type { LlmConfig } from "@/lib/llm/types";
import type { Theme } from "@/types/theme";
import type { BrandConfig } from "@/types/brand";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CarouselEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showCaptionPanel, setShowCaptionPanel] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [showLlmConfig, setShowLlmConfig] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LlmConfig | null>(null);
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  // Optimistic slide edits: while the user types in the editor, the preview
  // reflects the draft immediately instead of waiting for the save round-trip.
  const [draftSlide, setDraftSlide] = useState<Slide | null>(null);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchCarousel = useCallback(async () => {
    try {
      const res = await fetch(`/api/carousels/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data: Carousel = await res.json();
        setCarousel((prev) => {
          if (prev && data.slides.length > prev.slides.length) {
            setActiveSlide(data.slides.length - 1);
          } else {
            setActiveSlide((prevIdx) =>
              data.slides.length === 0 ? 0 : Math.min(prevIdx, data.slides.length - 1)
            );
          }
          return data;
        });
      }
    } catch {
      // ignore network errors
    }
  }, [id]);

  const fetchLlmConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/llm-config");
      const data = await res.json();
      setLlmConfig(data.config);
      setLlmConfigured(data.configured);
    } catch {
      // ignore
    }
  }, []);

  const fetchBrand = useCallback(async () => {
    try {
      const res = await fetch("/api/brand");
      if (res.ok) setBrand(await res.json());
    } catch {
      // ignore
    }
  }, []);

  // Initial data load. State is set after `await`, so this cannot cascade
  // synchronously; the rule cannot see through the async boundary.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCarousel();
    void fetchLlmConfig();
    void fetchBrand();
  }, [fetchCarousel, fetchLlmConfig, fetchBrand]);

  // Load the theme list once, then derive the active theme during render.
  // Fetching per themeId change would also mean setting state inside an effect.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setThemes((data.themes as Theme[]) ?? []);
      })
      .catch(() => {
        if (!cancelled) setThemes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const theme =
    themes.find((t) => t.id === carousel?.themeId) ?? null;

  // Poll for carousel updates while the AI is generating slides.
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(fetchCarousel, 500);
    return () => clearInterval(interval);
  }, [isGenerating, fetchCarousel]);

  const handleAspectChange = async (ratio: AspectRatio) => {
    if (!carousel) return;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: ratio }),
    });
    if (res.ok) setCarousel(await res.json());
  };

  const handleThemeChange = async (themeId: string) => {
    if (!carousel) return;
    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId }),
    });
    if (res.ok) setCarousel(await res.json());
  };

  const handleDeleteSlide = (slideId: string) => {
    if (!carousel) return;
    const slideIndex = carousel.slides.findIndex((s) => s.id === slideId);
    setConfirmState({
      open: true,
      title: `Delete slide ${slideIndex + 1}?`,
      description: "This action cannot be undone.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}/slides/${slideId}`, {
          method: "DELETE",
        });
        if (res.ok) await fetchCarousel();
      },
    });
  };

  const handleDeleteCarousel = useCallback(() => {
    if (!carousel) return;
    setConfirmState({
      open: true,
      title: `Delete "${carousel.name}"?`,
      description: "This will permanently delete the carousel and all its slides.",
      onConfirm: async () => {
        const res = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
        if (res.ok) router.push("/");
      },
    });
  }, [carousel, id, router]);

  const handleStreamStart = useCallback(() => setIsGenerating(true), []);
  const handleStreamEnd = useCallback(() => {
    setIsGenerating(false);
    fetchCarousel();
  }, [fetchCarousel]);

  const handleReorderSlides = useCallback(
    async (slideIds: string[]) => {
      await fetch(`/api/carousels/${id}/slides`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideIds }),
      });
      await fetchCarousel();
    },
    [id, fetchCarousel]
  );

  const handleAddSlideRequest = useCallback(() => {
    setChatOpen(true);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, []);

  // Live preview: while the user types, the draft overrides the saved slide in
  // the preview and filmstrip. Cleared when the editor closes or the slide
  // changes, so a stale draft never lingers.
  const handleEditorChange = useCallback((slide: Slide) => {
    setDraftSlide(slide);
  }, []);

  const handleEditorClose = useCallback(() => {
    setShowEditorPanel(false);
    setDraftSlide(null);
  }, []);

  const handleSaveLlmConfig = async (config: LlmConfig) => {
    await fetch("/api/llm-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    await fetchLlmConfig();
  };

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold">Carousel not found</p>
        <p className="text-sm text-muted-foreground">This carousel may have been deleted.</p>
        <Link href="/" className="text-sm text-accent underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!carousel) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const brandMark: SlideBrand | undefined = brand
    ? {
        name: brand.authorName || brand.name || undefined,
        logoUrl: brand.logoPath ?? undefined,
      }
    : undefined;

  // Overlay the in-progress draft onto the active slide so the preview and
  // filmstrip reflect edits as the user types, before the save round-trip.
  const previewSlides = useMemo(() => {
    if (!draftSlide) return carousel.slides;
    const idx = carousel.slides.findIndex((s) => s.id === draftSlide.id);
    if (idx === -1) return carousel.slides;
    const next = [...carousel.slides];
    next[idx] = draftSlide;
    return next;
  }, [carousel.slides, draftSlide]);

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title={carousel.name}
        showBack
        editable
        onTitleChange={async (name) => {
          const res = await fetch(`/api/carousels/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (res.ok) setCarousel(await res.json());
        }}
        onSettingsClick={() => setShowLlmConfig(true)}
      />

      {theme && (
        <FullscreenPreview
          open={showFullscreen}
          onOpenChange={setShowFullscreen}
          slides={carousel.slides}
          theme={theme}
          aspectRatio={carousel.aspectRatio}
          activeIndex={activeSlide}
          onActiveChange={setActiveSlide}
          brand={brandMark}
        />
      )}

      {llmConfig && (
        <LlmConfigModal
          open={showLlmConfig}
          onClose={() => setShowLlmConfig(false)}
          config={llmConfig}
          onSave={handleSaveLlmConfig}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((s) => ({ ...s, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {chatOpen && (
          <div className="oc-fade w-80 border-r border-border shrink-0 flex flex-col bg-surface">
            <ChatPanel
              carouselId={id}
              llmConfigured={llmConfigured}
              onStreamStart={handleStreamStart}
              onStreamEnd={handleStreamEnd}
              chatInputRef={chatInputRef}
            />
          </div>
        )}

        {showThemePanel && (
          <div className="oc-fade w-72 border-r border-border shrink-0 flex flex-col bg-surface p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Palette className="h-4 w-4" />
                Themes
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowThemePanel(false)}>
                ×
              </Button>
            </div>
            <ThemeGallery
              selectedThemeId={carousel.themeId ?? null}
              onSelect={handleThemeChange}
            />
          </div>
        )}

        {showCaptionPanel && (
          <div className="oc-fade w-72 border-r border-border shrink-0 flex flex-col bg-surface overflow-y-auto">
            <div className="flex items-center justify-between p-4 pb-0">
              <span className="text-sm font-semibold">Caption</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCaptionPanel(false)}>
                ×
              </Button>
            </div>
            <CaptionPanel
              carouselId={id}
              caption={carousel.caption}
              hashtags={carousel.hashtags}
              onUpdate={fetchCarousel}
            />
          </div>
        )}

        {showEditorPanel &&
          (carousel.slides[activeSlide] ? (
            <div className="oc-fade w-80 border-r border-border shrink-0 flex flex-col bg-surface">
              <SlideEditor
                key={carousel.slides[activeSlide].id}
                carouselId={id}
                slide={carousel.slides[activeSlide]}
                onSaved={fetchCarousel}
                onChange={handleEditorChange}
              />
            </div>
          ) : (
            <div className="oc-fade w-80 border-r border-border shrink-0 flex flex-col bg-surface p-6 text-center justify-center">
              <p className="text-sm text-muted-foreground">
                No slide selected. Add a slide to edit its content.
              </p>
            </div>
          ))}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="h-11 border-b border-border bg-surface flex items-center px-4 gap-2 shrink-0 overflow-x-auto">
            <SizeSelector value={carousel.aspectRatio} onChange={handleAspectChange} />
            <div className="flex-1" />
            <Button
              variant={chatOpen ? "outline" : "ghost"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className={chatOpen ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Toggle chat"
              title="AI assistant"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showThemePanel ? "outline" : "ghost"}
              size="sm"
              onClick={() => setShowThemePanel(!showThemePanel)}
              className={showThemePanel ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Themes"
              title="Theme gallery"
            >
              <Palette className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showCaptionPanel ? "outline" : "ghost"}
              size="sm"
              onClick={() => setShowCaptionPanel(!showCaptionPanel)}
              className={showCaptionPanel ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Caption"
              title="Caption & hashtags"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showEditorPanel ? "outline" : "ghost"}
              size="sm"
              onClick={() => (showEditorPanel ? handleEditorClose() : setShowEditorPanel(true))}
              className={showEditorPanel ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Edit slide"
              title="Edit slide content"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AddSlideDialog carouselId={id} onAdded={fetchCarousel} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullscreen(true)}
              className="text-muted-foreground"
              aria-label="Fullscreen preview"
              title="Fullscreen preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={showSafeZones ? "outline" : "ghost"}
              size="sm"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={showSafeZones ? "border-accent text-accent" : "text-muted-foreground"}
              aria-label="Toggle safe zones"
              title="Safe zones"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteCarousel}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Delete carousel"
              title="Delete carousel"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <ExportButton carouselId={id} slideCount={carousel.slides.length} />
          </div>

          {theme ? (
            <CarouselPreview
              slides={previewSlides}
              theme={theme}
              aspectRatio={carousel.aspectRatio}
              activeIndex={activeSlide}
              onActiveChange={setActiveSlide}
              showSafeZones={showSafeZones}
              brand={brandMark}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground p-8 max-w-xs">
                <Palette className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No theme selected</p>
                <p className="text-xs mt-1">
                  Pick a theme so slides can be rendered. The AI can also choose one for you.
                </p>
                <Button
                  variant="accent"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowThemePanel(true)}
                >
                  Choose a theme
                </Button>
              </div>
            </div>
          )}

          {theme && (
            <SlideFilmstrip
              slides={previewSlides}
              theme={theme}
              aspectRatio={carousel.aspectRatio}
              activeIndex={activeSlide}
              onActiveChange={setActiveSlide}
              onDeleteSlide={handleDeleteSlide}
              onAddSlideRequest={handleAddSlideRequest}
              onReorderSlides={handleReorderSlides}
              isGenerating={isGenerating}
              brand={brandMark}
            />
          )}
        </div>
      </div>
    </div>
  );
}
