// Makes a photo smaller before it is uploaded: phone photos are often 3–5 MB,
// after this about 200–400 KB, which still looks sharp on any screen.
// The longest side becomes at most `maxSize` px; the result is WebP (or JPEG in browsers
// that can't make WebP, e.g. older Safari). Phone photos taken sideways stay the right way up.
// Throws if the browser can't read the file as a picture.
export async function shrinkImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    // PNGs can be see-through; give them the page's cream background instead of black
    context.fillStyle = "#fcf9f4";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await toBlob("image/webp");
    // A browser that can't make WebP silently returns PNG instead (big): use JPEG then
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
    if (!blob) throw new Error("Could not convert the picture");
    return blob;
  } finally {
    bitmap.close();
  }
}
