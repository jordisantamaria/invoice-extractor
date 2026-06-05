import { NextRequest, NextResponse, after } from "next/server";
import { extractInvoice } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import { EMPTY_INVOICE_DATA } from "@/lib/schema";
import fs from "fs/promises";
import path from "path";

// Allow time for the (cascading) model call to finish in the after() callback.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { filename } = await req.json();

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename);
    const imagePath = path.join(process.cwd(), "public", "demo-invoices", safeName);

    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    // Demo images are static assets — reference them by public URL (the viewer
    // reads imageUrl when present) so we don't bloat the store with base64.
    const imageUrl = `/demo-invoices/${safeName}`;
    const imageMimeType = "image/png";

    const id = generateId();
    const createdAt = new Date().toISOString();

    // Persist a "processing" record immediately so the results page can poll
    // and show the progress UI while extraction runs.
    await setInvoice({
      id,
      status: "processing",
      data: EMPTY_INVOICE_DATA,
      imageBase64: "",
      imageMimeType,
      imageUrl,
      modelUsed: "",
      validationErrors: [],
      cascaded: false,
      createdAt,
    });

    // Run extraction AFTER responding. On Vercel, after() keeps the function
    // alive until this completes (up to maxDuration) — the supported way to do
    // post-response work without an unreliable fire-and-forget promise.
    after(async () => {
      try {
        const result = await extractInvoice(imageBase64, imageMimeType);
        await setInvoice({
          id,
          status: result.status,
          data: result.data,
          imageBase64: "",
          imageMimeType,
          imageUrl,
          modelUsed: result.modelUsed,
          validationErrors: result.validationErrors,
          cascaded: result.cascaded,
          createdAt,
        });
      } catch (error) {
        console.error("Demo extraction error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        await setInvoice({
          id,
          status: "failed",
          data: EMPTY_INVOICE_DATA,
          imageBase64: "",
          imageMimeType,
          imageUrl,
          modelUsed: "error",
          validationErrors: [message],
          cascaded: false,
          createdAt,
        }).catch((e) => console.error("Failed to persist failed-state record:", e));
      }
    });

    return NextResponse.json({ id, status: "processing" });
  } catch (error) {
    console.error("Demo route error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process demo invoice", detail: message },
      { status: 500 },
    );
  }
}
