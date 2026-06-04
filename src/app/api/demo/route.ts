import { NextRequest, NextResponse } from "next/server";
import { extractInvoice } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import { EMPTY_INVOICE_DATA } from "@/lib/schema";
import fs from "fs/promises";
import path from "path";

// Allow time for the (cascading) model call to finish within the request.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let id: string | null = null;
  let imageUrl = "";
  const imageMimeType = "image/png";

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
    // Demo images are static assets — reference them by public URL so we don't
    // bloat the store with base64 (the viewer reads imageUrl when present).
    imageUrl = `/demo-invoices/${safeName}`;

    id = generateId();

    // Extract synchronously: the work runs inside the request so it completes
    // and is persisted before we respond (serverless has no reliable background).
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
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id, status: result.status });
  } catch (error) {
    console.error("Demo extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    // If we already created an id, persist a "failed" record so the results
    // page can render a clear error instead of breaking.
    if (id) {
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
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ id, status: "failed" });
    }

    return NextResponse.json(
      { error: "Failed to process demo invoice", detail: message },
      { status: 500 },
    );
  }
}
