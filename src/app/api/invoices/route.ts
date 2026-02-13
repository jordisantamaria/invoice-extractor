import { NextResponse } from "next/server";
import { getAllInvoices } from "@/lib/store";

export async function GET() {
  const invoices = getAllInvoices()
    .filter((inv) => inv.status !== "processing")
    .map(({ imageBase64, ...rest }) => rest);
  return NextResponse.json(invoices);
}
