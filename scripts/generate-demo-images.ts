import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const DEMO_DIR = path.join(__dirname, "..", "demo-invoices");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "demo-invoices");

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const htmlFiles = fs
    .readdirSync(DEMO_DIR)
    .filter((f) => f.endsWith(".html"));

  console.log(`Found ${htmlFiles.length} HTML files to convert`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 900, height: 1200 },
  });

  for (const file of htmlFiles) {
    const name = path.basename(file, ".html");
    const htmlPath = path.join(DEMO_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);

    console.log(`Converting ${file} → ${name}.png`);

    const page = await context.newPage();
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(500); // Let fonts render

    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });

    await page.close();
    console.log(`  ✓ Saved ${outputPath}`);
  }

  await browser.close();
  console.log("\nDone! All demo images generated.");
}

main().catch(console.error);
