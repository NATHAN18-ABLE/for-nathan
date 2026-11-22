"use client";

/**
 * A keepsake photo: the 3D view (without the name tags and buttons) in a paper frame with a
 * caption, as a JPEG the traveler can save or share.
 */
export async function framePhoto(shot: string, caption: { brand: string; place: string; date: string }): Promise<Blob> {
  const img = new Image();
  img.src = shot;
  await img.decode();
  const pad = Math.round(img.width * 0.035);
  const foot = Math.round(pad * 2.6);
  const c = document.createElement("canvas");
  c.width = img.width + pad * 2;
  c.height = img.height + pad + foot;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fbf8f1";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, pad, pad);
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const size = Math.round(pad * 0.62);
  const y = img.height + pad + foot / 2 + size * 0.35;
  g.fillStyle = "#1e2126";
  g.font = `600 ${size}px ${font}`;
  g.textAlign = "left";
  g.fillText(caption.brand, pad, y);
  g.fillStyle = "rgba(30,33,38,0.62)";
  g.font = `400 ${Math.round(size * 0.86)}px ${font}`;
  g.textAlign = "right";
  g.fillText(`${caption.place} · ${caption.date}`, c.width - pad, y);
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("no photo"))), "image/jpeg", 0.92));
}
