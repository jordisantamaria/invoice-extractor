"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export function PdfViewer({ base64 }: { base64: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();

      const data = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const doc = await pdfjsLib.getDocument({ data }).promise;

      if (!cancelled) {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [base64]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      const doc = pdfDoc as { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number }; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } }> };
      const page = await doc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (!cancelled) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, zoom]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">Original Invoice</span>
        <div className="flex items-center gap-1">
          {numPages > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-16 text-center">
                {currentPage} / {numPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            disabled={zoom >= 4}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-[700px] p-4 bg-muted/30">
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
}
