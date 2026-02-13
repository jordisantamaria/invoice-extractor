import { NextRequest, NextResponse } from "next/server";
import { extractInvoice } from "@/lib/extract";
import { generateId, setInvoice } from "@/lib/store";
import fs from "fs/promises";
import path from "path";

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
    const imageMimeType = "image/png";

    const id = generateId();

    setInvoice({
      id,
      status: "processing",
      data: {} as never,
      imageBase64,
      imageMimeType,
      modelUsed: "",
      validationErrors: [],
      cascaded: false,
      createdAt: new Date().toISOString(),
    });

    // Fire-and-forget: extract in background
    extractInvoice(imageBase64, imageMimeType)
      .then((result) => {
        setInvoice({
          id,
          status: result.status,
          data: result.data,
          imageBase64,
          imageMimeType,
          modelUsed: result.modelUsed,
          validationErrors: result.validationErrors,
          cascaded: result.cascaded,
          createdAt: new Date().toISOString(),
        });
      })
      .catch((error) => {
        console.error("Background demo extraction error:", error);
        setInvoice({
          id,
          status: "needs-review",
          data: {} as never,
          imageBase64,
          imageMimeType,
          modelUsed: "error",
          validationErrors: [error instanceof Error ? error.message : "Extraction failed"],
          cascaded: false,
          createdAt: new Date().toISOString(),
        });
      });

    return NextResponse.json({ id, status: "processing" });
  } catch (error) {
    console.error("Demo extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process demo invoice", detail: message },
      { status: 500 },
    );
  }
}
