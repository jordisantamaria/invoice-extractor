import { fromBuffer } from "pdf2pic";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function pdfToImage(pdfBuffer: Buffer): Promise<{ base64: string; mimeType: string }> {
  const converter = fromBuffer(pdfBuffer, {
    density: 200,
    format: "png",
    width: 1200,
    height: 1600,
    savePath: os.tmpdir(),
    saveFilename: `invoice-${Date.now()}`,
  });

  const result = await converter(1); // First page only

  if (!result.path) {
    throw new Error("Failed to convert PDF to image");
  }

  const imageBuffer = await fs.readFile(result.path);
  const base64 = imageBuffer.toString("base64");

  // Clean up temp file
  await fs.unlink(result.path).catch(() => {});

  return {
    base64,
    mimeType: "image/png",
  };
}
