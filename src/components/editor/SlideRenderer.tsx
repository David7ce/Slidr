"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { wrapSlideHtml } from "@/lib/slide-html";
import { renderSlide, themeFontFamilies } from "@/lib/render";
import type { Slide, AspectRatio, SlideBrand } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";
import type { Theme } from "@/types/theme";

interface SlideRendererProps {
  slide: Slide;
  theme: Theme;
  aspectRatio: AspectRatio;
  index: number;
  total: number;
  brand?: SlideBrand;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a structured slide in a sandboxed iframe.
 *
 * The HTML is produced by the same deterministic renderer used for export, so
 * the preview is pixel-identical to the exported image.
 */
export function SlideRenderer({
  slide,
  theme,
  aspectRatio,
  index,
  total,
  brand,
  className,
  style,
}: SlideRendererProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const { width: slideW, height: slideH } = DIMENSIONS[aspectRatio];

  const srcDoc = useMemo(() => {
    const body = renderSlide(slide, theme, aspectRatio, { index, total, brand });
    return wrapSlideHtml(body, aspectRatio, { fontFamilies: themeFontFamilies(theme) });
  }, [slide, theme, aspectRatio, index, total, brand]);

  const measure = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDims({ w: rect.width, h: rect.height });
    }
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => measure());
    obs.observe(el);
    measure();
    return () => obs.disconnect();
  }, [measure]);

  const scale = dims ? Math.min(dims.w / slideW, dims.h / slideH) : 0;
  const scaledW = Math.floor(slideW * scale);
  const scaledH = Math.floor(slideH * scale);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {scale > 0 && (
        <div
          style={{
            width: scaledW,
            height: scaledH,
            overflow: "hidden",
            borderRadius: 8,
            position: "relative",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <iframe
            sandbox=""
            srcDoc={srcDoc}
            title={`Slide ${index}`}
            style={{
              width: slideW,
              height: slideH,
              border: "none",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}
