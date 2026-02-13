import { InvoiceData } from "./schema";
import { JAPAN_TAX_RATES } from "./models";

const TOLERANCE = 0.5; // Allow small rounding differences

export function validateInvoice(data: InvoiceData): string[] {
  const errors: string[] = [];

  // 1. Check items sum matches subtotal
  const itemsSum = data.items.reduce((sum, item) => sum + item.amount, 0);
  if (Math.abs(itemsSum - data.subtotal) > TOLERANCE) {
    errors.push(
      `Items sum (${itemsSum}) does not match subtotal (${data.subtotal}). Difference: ${Math.abs(itemsSum - data.subtotal)}`
    );
  }

  // 2. Check each item's amount = quantity × unitPrice
  for (const item of data.items) {
    const expected = item.quantity * item.unitPrice;
    if (Math.abs(expected - item.amount) > TOLERANCE) {
      errors.push(
        `Item "${item.description}": quantity(${item.quantity}) × unitPrice(${item.unitPrice}) = ${expected}, but amount is ${item.amount}`
      );
    }
  }

  // 3. Check tax rate is valid (for JPY invoices)
  if (data.currency === "JPY" && data.taxRate != null) {
    const isValidRate = JAPAN_TAX_RATES.some(
      (rate) => Math.abs(data.taxRate! - rate) < 0.001
    );
    if (!isValidRate) {
      errors.push(
        `Tax rate ${(data.taxRate * 100).toFixed(1)}% is not a standard Japanese tax rate (8% or 10%)`
      );
    }
  }

  // 4. Check tax amount matches subtotal × taxRate
  if (data.taxRate != null) {
    const expectedTax = Math.round(data.subtotal * data.taxRate);
    if (Math.abs(expectedTax - data.taxAmount) > TOLERANCE) {
      errors.push(
        `Tax amount (${data.taxAmount}) does not match subtotal(${data.subtotal}) × taxRate(${(data.taxRate * 100).toFixed(1)}%) = ${expectedTax}`
      );
    }
  }

  // 5. Check subtotal + tax = total
  const expectedTotal = data.subtotal + data.taxAmount;
  if (Math.abs(expectedTotal - data.total) > TOLERANCE) {
    errors.push(
      `Subtotal(${data.subtotal}) + tax(${data.taxAmount}) = ${expectedTotal}, but total is ${data.total}`
    );
  }

  return errors;
}
