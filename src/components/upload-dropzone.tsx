"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function UploadDropzone() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { id } = await res.json();
        // Redirect immediately — results page will poll for completion
        router.push(`/results/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setIsUploading(false);
      }
    },
    [router],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <Card
      className={`relative border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        if (!isUploading) {
          document.getElementById("file-upload")?.click();
        }
      }}
    >
      <input
        id="file-upload"
        type="file"
        accept="image/*,application/pdf,text/csv,.csv,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Uploading...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Drop an invoice here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports PDF, PNG, JPG, CSV, Excel
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-3">{error}</p>
      )}
    </Card>
  );
}
