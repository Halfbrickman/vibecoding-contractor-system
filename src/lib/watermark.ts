import { optimizeImageToWebP } from "./imageOptimizer";

/**
 * Utility Wrapper untuk kompatibilitas fungsi Watermark + WebP converter
 */
export async function applyImageWatermark(
  file: File,
  watermarkUrl?: string | null,
  options?: {
    opacity?: number;
    widthRatio?: number;
    marginRatio?: number;
    isPanorama?: boolean;
  }
): Promise<File> {
  return optimizeImageToWebP(file, {
    watermarkUrl,
    isPanorama: options?.isPanorama,
  });
}
