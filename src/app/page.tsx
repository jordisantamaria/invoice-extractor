import { UploadDropzone } from "@/components/upload-dropzone";
import { DemoInvoicePicker } from "@/components/demo-invoice-picker";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Invoice Data Extraction</h1>
        <p className="text-muted-foreground mt-1">
          Upload an invoice image or PDF to extract structured data using AI vision models.
          The system uses cascading models (Haiku → Sonnet) with automatic validation.
        </p>
      </div>

      <UploadDropzone />

      <Separator className="my-8" />

      <DemoInvoicePicker />
    </div>
  );
}
