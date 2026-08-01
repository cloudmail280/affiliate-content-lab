import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.8,
};

export type CompressProgress = (percent: number) => void;

/**
 * Compress a product image client-side before upload.
 * - Scales down to max 1280px on the longest edge
 * - Targets <= 1MB file size
 * - Runs in a Web Worker so the main thread stays responsive
 *
 * Falls back to the original file if compression fails or yields no benefit,
 * so the upload flow never breaks because of the optimization step.
 */
export async function compressProductImage(
  file: File,
  onProgress?: CompressProgress
): Promise<File> {
  // Skip if already small and JPEG (near-optimal, avoids re-encode overhead)
  const oneMB = 1024 * 1024;
  if (file.size <= oneMB && file.type === "image/jpeg") {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      ...COMPRESSION_OPTIONS,
      onProgress,
    });
    // Only adopt the compressed file if it's actually smaller
    return compressed.size < file.size ? compressed : file;
  } catch (error) {
    console.warn("Image compression failed, using original:", error);
    return file;
  }
}
