export type Platform = "instagram" | "linkedin" | "tiktok";

export type AspectRatio =
  // Instagram
  | "ig-1:1"
  | "ig-4:5"
  | "ig-3:4"
  | "ig-9:16"
  // LinkedIn
  | "li-1:1"
  | "li-4:5"
  | "li-16:9"
  // TikTok
  | "tt-9:16";

// ---------------------------------------------------------------------------
// Structured slide model
//
// The AI produces CONTENT, never visual design. Each slide is a typed,
// validated data structure. The renderer (src/lib/render) turns it into HTML
// deterministically using the active theme's design tokens.
// ---------------------------------------------------------------------------

export type SlideType =
  | "cover"
  | "text"
  | "comparison"
  | "statistic"
  | "timeline"
  | "process"
  | "diagram"
  | "quote"
  | "conclusion";

export const SLIDE_TYPES: SlideType[] = [
  "cover",
  "text",
  "comparison",
  "statistic",
  "timeline",
  "process",
  "diagram",
  "quote",
  "conclusion",
];

interface SlideBase {
  id: string;
  type: SlideType;
  order: number;
  notes?: string;
}

export interface CoverSlide extends SlideBase {
  type: "cover";
  title: string;
  subtitle?: string;
  eyebrow?: string;
}

export interface TextSlide extends SlideBase {
  type: "text";
  title: string;
  body?: string;
  bullets?: string[];
}

export interface ComparisonSide {
  title: string;
  items: string[];
}

export interface ComparisonSlide extends SlideBase {
  type: "comparison";
  title: string;
  left: ComparisonSide;
  right: ComparisonSide;
}

export interface Stat {
  value: string;
  label: string;
}

export interface StatisticSlide extends SlideBase {
  type: "statistic";
  title?: string;
  stats: Stat[];
}

export interface TimelineEvent {
  label: string;
  title: string;
  description?: string;
}

export interface TimelineSlide extends SlideBase {
  type: "timeline";
  title: string;
  events: TimelineEvent[];
}

export interface ProcessStep {
  title: string;
  description?: string;
}

export interface ProcessSlide extends SlideBase {
  type: "process";
  title: string;
  steps: ProcessStep[];
}

export interface DiagramNode {
  label: string;
  description?: string;
}

export interface DiagramSlide extends SlideBase {
  type: "diagram";
  title: string;
  center: string;
  nodes: DiagramNode[];
}

export interface QuoteSlide extends SlideBase {
  type: "quote";
  quote: string;
  attribution?: string;
}

export interface ConclusionSlide extends SlideBase {
  type: "conclusion";
  title: string;
  body?: string;
  cta?: string;
}

export type Slide =
  | CoverSlide
  | TextSlide
  | ComparisonSlide
  | StatisticSlide
  | TimelineSlide
  | ProcessSlide
  | DiagramSlide
  | QuoteSlide
  | ConclusionSlide;

/**
 * Brand mark rendered in every slide's footer.
 *
 * A plain data shape (not BrandConfig) so the renderer stays decoupled from
 * how brand settings happen to be stored.
 */
export interface SlideBrand {
  name?: string;
  /** Logo URL. Takes precedence over `name` when both are set. */
  logoUrl?: string;
}

/** A slide's content without identity/ordering metadata. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type SlideContent = DistributiveOmit<Slide, "id" | "order" | "notes">;

export interface Carousel {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  slides: Slide[];
  caption?: string;
  hashtags?: string[];
  themeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CarouselsData {
  carousels: Carousel[];
}

export interface DimensionSpec {
  width: number;
  height: number;
  platform: Platform;
  label: string;
  recommended?: boolean;
}

export const DIMENSIONS: Record<AspectRatio, DimensionSpec> = {
  // Instagram
  "ig-1:1": { width: 1080, height: 1080, platform: "instagram", label: "Instagram Square" },
  "ig-4:5": { width: 1080, height: 1350, platform: "instagram", label: "Instagram Portrait", recommended: true },
  "ig-3:4": { width: 1080, height: 1440, platform: "instagram", label: "Instagram 3:4 Grid" },
  "ig-9:16": { width: 1080, height: 1920, platform: "instagram", label: "Instagram Story/Reel" },
  // LinkedIn
  "li-1:1": { width: 1080, height: 1080, platform: "linkedin", label: "LinkedIn Square" },
  "li-4:5": { width: 1080, height: 1350, platform: "linkedin", label: "LinkedIn Portrait", recommended: true },
  "li-16:9": { width: 1920, height: 1080, platform: "linkedin", label: "LinkedIn Landscape" },
  // TikTok
  "tt-9:16": { width: 1080, height: 1920, platform: "tiktok", label: "TikTok Vertical", recommended: true },
};

export const ALL_ASPECT_RATIOS = Object.keys(DIMENSIONS) as AspectRatio[];

export const ASPECT_RATIOS_BY_PLATFORM: Record<Platform, AspectRatio[]> = {
  instagram: ["ig-1:1", "ig-4:5", "ig-3:4", "ig-9:16"],
  linkedin: ["li-1:1", "li-4:5", "li-16:9"],
  tiktok: ["tt-9:16"],
};

export function getPlatform(ratio: AspectRatio): Platform {
  return DIMENSIONS[ratio].platform;
}

export const MAX_SLIDES = 20;
export const MAX_VERSIONS = 5;
