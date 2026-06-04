import { NextResponse } from "next/server";
import { getAllInvoices } from "@/lib/store";

export async function GET() {
  const all = await getAllInvoices();
  const invoices = all
    .filter((inv) => inv.status !== "processing")
    .map(({ imageBase64, ...rest }) => rest);
  return NextResponse.json(invoices);
}
