import { readFile, writeFile, rename, mkdir, readdir, rm } from "fs/promises";
import path from "path";
import { Mutex } from "async-mutex";
import { generateId, now } from "./utils";
import type { Carousel, Slide, SlideContent, AspectRatio } from "@/types/carousel";
import { MAX_SLIDES } from "@/types/carousel";

/**
 * Local-first project storage.
 *
 * Every carousel is a directory on disk:
 *
 *   projects/<project-id>/
 *     carousel.json   <- the editable source of truth
 *     assets/         <- user-supplied images
 *     output/         <- generated exports
 *
 * `carousel.json` is authoritative. Rendered HTML is never persisted — it is
 * derived on demand from the slide content plus the active theme, so a project
 * stays readable, diffable, and hand-editable.
 */

const PROJECTS_DIR = path.join(process.cwd(), "projects");
const CAROUSEL_FILE = "carousel.json";
const ASSETS_DIR = "assets";
const OUTPUT_DIR = "output";

const mutexes = new Map<string, Mutex>();

function getMutex(id: string): Mutex {
  let mutex = mutexes.get(id);
  if (!mutex) {
    mutex = new Mutex();
    mutexes.set(id, mutex);
  }
  return mutex;
}

/** Reject ids that could escape the projects directory. */
function assertSafeId(id: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Unsafe project id: ${id}`);
  }
}

export function projectDir(id: string): string {
  assertSafeId(id);
  return path.join(PROJECTS_DIR, id);
}

export function assetsDir(id: string): string {
  return path.join(projectDir(id), ASSETS_DIR);
}

export function outputDir(id: string): string {
  return path.join(projectDir(id), OUTPUT_DIR);
}

/** Strip a filename down to something safe for use inside assets/. */
export function safeAssetName(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Public URL for an asset served by /api/projects/[id]/assets/[name]. */
export function assetUrl(id: string, name: string): string {
  return `/api/projects/${id}/assets/${safeAssetName(name)}`;
}

// --- carousel.json ---------------------------------------------------------

export async function readCarousel(id: string): Promise<Carousel | null> {
  try {
    assertSafeId(id);
    const raw = await readFile(path.join(projectDir(id), CAROUSEL_FILE), "utf-8");
    return JSON.parse(raw) as Carousel;
  } catch {
    return null;
  }
}

/**
 * Write carousel.json atomically. Assumes the caller does NOT hold this
 * project's mutex.
 */
export async function writeCarousel(carousel: Carousel): Promise<void> {
  const id = carousel.id;
  assertSafeId(id);
  const mutex = getMutex(id);
  await mutex.runExclusive(() => writeCarouselUnlocked(carousel));
}

/**
 * Perform the actual write. Split out from `writeCarousel` because
 * `async-mutex` is not reentrant: `mutate` already holds the mutex, so calling
 * the public `writeCarousel` from inside it would deadlock.
 */
async function writeCarouselUnlocked(carousel: Carousel): Promise<void> {
  const id = carousel.id;
  const dir = projectDir(id);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, CAROUSEL_FILE);
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(carousel, null, 2), "utf-8");
  await rename(tmpPath, filePath);
}

/** Mutate a project atomically: read, apply, write. */
async function mutate<T>(
  id: string,
  fn: (carousel: Carousel) => T | null
): Promise<T | null> {
  assertSafeId(id);
  const mutex = getMutex(id);
  return mutex.runExclusive(async () => {
    const carousel = await readCarousel(id);
    if (!carousel) return null;
    const result = fn(carousel);
    if (result === null) return null;
    carousel.updatedAt = now();
    await writeCarouselUnlocked(carousel);
    return result;
  });
}

export async function listCarousels(): Promise<Carousel[]> {
  let entries: string[];
  try {
    entries = await readdir(PROJECTS_DIR);
  } catch {
    return [];
  }

  const carousels = await Promise.all(entries.map((id) => readCarousel(id)));
  return carousels
    .filter((c): c is Carousel => c !== null && !c.isTemplate)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCarousel(
  name: string,
  aspectRatio: AspectRatio,
  themeId?: string
): Promise<Carousel> {
  const carousel: Carousel = {
    id: generateId(),
    name,
    aspectRatio,
    slides: [],
    isTemplate: false,
    tags: [],
    themeId,
    createdAt: now(),
    updatedAt: now(),
  };

  await mkdir(assetsDir(carousel.id), { recursive: true });
  await mkdir(outputDir(carousel.id), { recursive: true });
  await writeCarousel(carousel);
  return carousel;
}

export async function updateCarousel(
  id: string,
  updates: Partial<
    Pick<Carousel, "name" | "aspectRatio" | "tags" | "caption" | "hashtags" | "themeId">
  >
): Promise<Carousel | null> {
  await mutate<Carousel>(id, (c) => {
    Object.assign(c, updates);
    return c;
  });
  return readCarousel(id);
}

export async function deleteCarousel(id: string): Promise<boolean> {
  const existing = await readCarousel(id);
  if (!existing) return false;
  await rm(projectDir(id), { recursive: true, force: true }).catch(() => {});
  return true;
}

export async function duplicateCarousel(id: string): Promise<Carousel | null> {
  const source = await readCarousel(id);
  if (!source) return null;

  const duplicate: Carousel = {
    ...source,
    id: generateId(),
    name: `${source.name} (copy)`,
    slides: source.slides.map((s) => ({ ...s, id: generateId() })),
    isTemplate: false,
    createdAt: now(),
    updatedAt: now(),
  };

  await mkdir(assetsDir(duplicate.id), { recursive: true });
  await writeCarousel(duplicate);
  return duplicate;
}

// --- slides ----------------------------------------------------------------

function reindex(slides: Slide[]): void {
  slides.forEach((s, i) => {
    s.order = i;
  });
}

export async function addSlide(
  carouselId: string,
  content: SlideContent,
  notes = ""
): Promise<Slide | null> {
  const slide: Slide | null = await mutate<Slide | null>(carouselId, (c) => {
    if (c.slides.length >= MAX_SLIDES) return null;
    const created = {
      ...content,
      id: generateId(),
      order: c.slides.length,
      notes,
    } as Slide;
    c.slides.push(created);
    return created;
  });
  return slide;
}

export async function updateSlide(
  carouselId: string,
  slideId: string,
  content: SlideContent
): Promise<Slide | null> {
  return mutate<Slide | null>(carouselId, (c) => {
    const idx = c.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return null;
    const updated = {
      ...content,
      id: slideId,
      order: c.slides[idx].order,
      notes: c.slides[idx].notes,
    } as Slide;
    c.slides[idx] = updated;
    return updated;
  });
}

export async function deleteSlide(
  carouselId: string,
  slideId: string
): Promise<boolean> {
  const ok = await mutate<boolean>(carouselId, (c) => {
    const idx = c.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return null;
    c.slides.splice(idx, 1);
    reindex(c.slides);
    return true;
  });
  return ok === true;
}

export async function reorderSlides(
  carouselId: string,
  slideIds: string[]
): Promise<boolean> {
  const ok = await mutate<boolean>(carouselId, (c) => {
    const byId = new Map(c.slides.map((s) => [s.id, s]));
    const ordered: Slide[] = [];
    for (const id of slideIds) {
      const slide = byId.get(id);
      if (!slide) return null;
      ordered.push(slide);
    }
    // Any slide omitted from the list is appended rather than silently dropped.
    for (const slide of c.slides) {
      if (!slideIds.includes(slide.id)) ordered.push(slide);
    }
    c.slides = ordered;
    reindex(c.slides);
    return true;
  });
  return ok === true;
}

// --- assets & output -------------------------------------------------------

export async function writeAsset(
  projectId: string,
  filename: string,
  data: Buffer
): Promise<{ name: string; url: string; absPath: string }> {
  const name = safeAssetName(filename);
  const dir = assetsDir(projectId);
  await mkdir(dir, { recursive: true });
  const absPath = path.join(dir, name);
  await writeFile(absPath, data);
  return { name, url: assetUrl(projectId, name), absPath };
}

export async function readAsset(
  projectId: string,
  filename: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const name = safeAssetName(filename);
  try {
    const data = await readFile(path.join(assetsDir(projectId), name));
    const ext = path.extname(name).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".svg"
              ? "image/svg+xml"
              : "application/octet-stream";
    return { data, contentType };
  } catch {
    return null;
  }
}

/** Persist a generated export so the project keeps a local copy. */
export async function writeOutput(
  projectId: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const dir = outputDir(projectId);
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, path.basename(filename));
  await writeFile(target, data);
  return target;
}