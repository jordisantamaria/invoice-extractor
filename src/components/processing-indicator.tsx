"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const STEPS = [
  { label: "Uploading document", threshold: 0 },
  { label: "Analyzing with GPT-4o mini", threshold: 5 },
  { label: "Extracting structured data", threshold: 15 },
  { label: "Validating math and tax rates", threshold: 30 },
  { label: "Cascading to GPT-4o (validation failed)", threshold: 60 },
  { label: "Re-extracting with error hints", threshold: 90 },
  { label: "Finalizing results", threshold: 120 },
];

const ESTIMATED_SECONDS = 45;
const ESTIMATED_CASCADE_SECONDS = 120;

export function ProcessingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentStep = [...STEPS].reverse().find((s) => elapsed >= s.threshold) || STEPS[0];
  const isCascading = elapsed > 50;
  const estimated = isCascading ? ESTIMATED_CASCADE_SECONDS : ESTIMATED_SECONDS;
  const remaining = Math.max(0, estimated - elapsed);
  const progress = Math.min(95, Math.round((elapsed / estimated) * 100));

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <div className="text-center">
          <p className="font-medium">{currentStep.label}...</p>
          <p className="text-sm text-muted-foreground mt-1">
            {elapsed < estimated
              ? `~${remaining}s remaining`
              : "Almost done..."}
          </p>
        </div>

        <div className="w-full max-w-xs">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {formatTime(elapsed)} elapsed
          </p>
        </div>

        {isCascading && (
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Initial extraction had validation errors. Retrying with a more accurate model for better results.
          </p>
        )}
      </div>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
