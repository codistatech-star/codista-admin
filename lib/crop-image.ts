/** Crop a region of an image to a JPEG/PNG blob (max edge capped). */

const MAX_EDGE = 1600;

export type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Failed to load image")));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CroppedAreaPixels,
  contentType: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const size = Math.min(crop.width, crop.height, MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
      contentType,
      0.9,
    );
  });
}
