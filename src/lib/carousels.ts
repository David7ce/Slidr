/**
 * Compatibility layer.
 *
 * Carousel storage now lives in `src/lib/projects.ts`, where each carousel is a
 * directory containing `carousel.json`, `assets/`, and `output/`. This module
 * re-exports the project store under the previous names so existing API routes
 * and the LLM adapter keep working unchanged.
 *
 * `getCarousel` is aliased to `readCarousel` because the old API returned
 * `null` for a missing carousel rather than throwing.
 */
export {
  listCarousels,
  readCarousel,
  readCarousel as getCarousel,
  createCarousel,
  updateCarousel,
  deleteCarousel,
  duplicateCarousel,
  addSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  projectDir,
  assetsDir,
  outputDir,
  writeAsset,
  readAsset,
  writeOutput,
  assetUrl,
} from "./projects";
