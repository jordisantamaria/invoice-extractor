"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";

export function InvoiceViewer({
  imageBase64,
  imageMimeType,
  imageUrl,
}: {
  imageBase64: string;
  imageMimeType: string;
  imageUrl?: string;
}) {
  const [zoom, setZoom] = useState(1);

  // Prefer a public URL (demo invoices) over an inlined base64 data URI (uploads).
  const imageSrc = imageUrl || `data:${imageMimeType};base64,${imageBase64}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">Original Invoice</span>
        <div className="flex items-center gap-1">
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
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-[700px] p-4 bg-muted/30">
        {imageMimeType === "application/pdf" ? (
          <object
            data={`data:application/pdf;base64,${imageBase64}`}
            type="application/pdf"
            className="w-full"
            style={{ height: "660px" }}
          >
            <p className="text-sm text-muted-foreground text-center py-8">
              PDF preview not supported in this browser.
            </p>
          </object>
        ) : (
          <img
            src={imageSrc}
            alt="Invoice"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            className="transition-transform"
          />
        )}
      </div>
    </Card>
  );
}
