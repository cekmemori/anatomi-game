import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-sandbox",
    ],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.goto("http://localhost:3001/explore", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('aside[aria-label="Panel kontrol model 3D"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shot-explore.png" });
  await browser.close();
  console.log("ok screenshot");
}

main().catch(console.error);
