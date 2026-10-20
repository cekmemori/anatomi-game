import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("https://anatomi.apotiku.id/missions", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log("Missions snippet:", (await page.innerText("body")).slice(0, 300));
  await page.goto("https://anatomi.apotiku.id/achievements", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log("Achievements snippet:", (await page.innerText("body")).slice(0, 300));
  await browser.close();
}
run();
