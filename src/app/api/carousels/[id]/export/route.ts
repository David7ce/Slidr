import { NextResponse } from "next/server";
import archiver from "archiver";
import { getCarousel } from "@/lib/carousels";
import { writeOutput } from "@/lib/projects";
import { getBrand } from "@/lib/brand";
import type { SlideBrand } from "@/types/carousel";
import { exportAllSlides, resolveTheme, type ExportFormat } from "@/lib/export-slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);

  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  if (carousel.slides.length === 0) {
    return NextResponse.json({ error: "No slides to export" }, { status: 400 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get("format");
  const format: ExportFormat = requested === "jpg" ? "jpg" : "png";

  const safeName = carousel.name.replace(/[^a-zA-Z0-9-_]/g, "_");

  try {
    const theme = await resolveTheme(carousel.themeId);
    const brandConfig = await getBrand();
    const brand: SlideBrand = {
      name: brandConfig.authorName || brandConfig.name || undefined,
      logoUrl: brandConfig.logoPath ?? undefined,
    };

    const images = await exportAllSlides(carousel.slides, theme, carousel.aspectRatio, {
      format,
      brand,
    });

    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 5 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", (err) => reject(err));

      try {
        for (const { name, buffer } of images) {
          archive.append(buffer, { name });
        }
        archive.finalize();
      } catch (err) {
        archive.destroy();
        reject(err);
      }
    });

    // Keep a local copy in the project's output/ directory so exports are
    // reproducible artifacts of the project rather than one-off downloads.
    await writeOutput(id, `carousel-${safeName}.zip`, zipBuffer).catch(() => {});

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="carousel-${safeName}.zip"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Export failed: ${message}` }, { status: 500 });
  }
}
