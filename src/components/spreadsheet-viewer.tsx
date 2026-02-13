"use client";

import { Card } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

interface SpreadsheetViewerProps {
  textContent: string;
}

export function SpreadsheetViewer({ textContent }: SpreadsheetViewerProps) {
  if (!textContent) {
    return (
      <Card className="flex items-center justify-center p-12 text-muted-foreground">
        <FileSpreadsheet className="h-8 w-8 mr-3" />
        No spreadsheet content available
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Spreadsheet Content</span>
      </div>
      <pre className="p-4 text-xs font-mono overflow-auto max-h-[600px] whitespace-pre">
        {textContent}
      </pre>
    </Card>
  );
}
