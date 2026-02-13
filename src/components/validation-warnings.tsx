"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ValidationWarnings({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Validation Issues ({errors.length})</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
