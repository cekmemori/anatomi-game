import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";

const timings = JSON.parse(readFileSync("video_project/timings.json", "utf-8"));
mkdirSync("video_project/raw_videos", { recursive: true });

const BASE_URL = "http://localhost:5173";

async function addMouseHelper(page) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const box = document.createElement("div");
      box.id = "playwright-mouse-pointer";
      box.style.position = "fixed";
      box.style.top = "0";
      box.style.left = "0";
      box.style.width = "22px";
      box.style.height = "22px";
      box.style.background = "rgba(20, 184, 166, 0.9)";
      box.style.border = "2.5px solid #ffffff";
      box.style.borderRadius = "50%";
      box.style.pointerEvents = "none";
      box.style.zIndex = "99999999";
      box.style.boxShadow = "0 0 14px rgba(0,0,0,0.7)";
      box.style.transform = "translate(-50%, -50%)";
      box.style.transition = "transform 0.12s ease, width 0.12s, height 0.12s, background 0.12s";
      document.body.appendChild(box);

      window.addEventListener("mousemove", (e) => {
        box.style.left = e.clientX + "px";
        box.style.top = e.clientY + "px";
      });
      window.addEventListener("mousedown", () => {
        box.style.transform = "translate(-50%, -50%) scale(0.7)";
        box.style.background = "rgba(234, 179, 8, 0.95)";
      });
      window.addEventListener("mouseup", () => {
        box.style.transform = "translate(-50%, -50%) scale(1)";
        box.style.background = "rgba(20, 184, 166, 0.9)";
      });
    });
  });
}

async function safeClick(page, locator, timeout = 2500) {
  try {
    const loc = locator.first();
    await loc.waitFor({ state: "visible", timeout });
    await loc.click({ timeout, force: true });
    return true;
  } catch (e) {
    return false;
  }
}

async function smoothMove(page, fromX, fromY, toX, toY, steps = 18) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = fromX + (toX - fromX) * ease;
    const y = fromY + (toY - fromY) * ease;
    await page.mouse.move(x, y);
    await page.waitForTimeout(16);
  }
}

async function smoothScroll(page, distance, durationMs = 1200) {
  const steps = 24;
  const stepDist = distance / steps;
  const interval = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "instant" }), stepDist);
    await page.waitForTimeout(interval);
  }
}

function collectRecordedFile(sceneId) {
  const dir = `video_project/raw_videos/${sceneId}`;
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith(".webm"));
  if (files.length > 0) {
    const src = `${dir}/${files[0]}`;
    const dest = `video_project/raw_videos/${sceneId}.webm`;
    copyFileSync(src, dest);
    return dest;
  }
  return null;
}

// 1. Landing Page Scene (27.2s)
async function recordScene1(browser, scene) {
  console.log(`[1/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Mouse over hero title and badges
  await smoothMove(page, 200, 200, 480, 280, 20);
  await page.waitForTimeout(1000);
  await smoothMove(page, 480, 280, 640, 280, 20);
  await page.waitForTimeout(1000);

  // Smooth scroll down to highlight features
  await smoothScroll(page, 460, 1600);
  await page.waitForTimeout(1000);

  // Hover over feature cards
  await smoothMove(page, 640, 360, 340, 380, 20);
  await page.waitForTimeout(1200);
  await smoothMove(page, 340, 380, 640, 380, 20);
  await page.waitForTimeout(1200);
  await smoothMove(page, 640, 380, 940, 380, 20);
  await page.waitForTimeout(1200);

  // Scroll back to top hero
  await smoothScroll(page, -460, 1400);
  await page.waitForTimeout(800);
  await smoothMove(page, 940, 380, 520, 420, 20);

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

// 2. Explore 3D Scene (26.6s)
async function recordScene2(browser, scene) {
  console.log(`[2/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  await page.goto(`${BASE_URL}/explore?organ=heart`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);

  // Rotate 3D model
  await page.mouse.move(620, 360);
  await page.mouse.down();
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(620 + i * 7, 360 - i * 1.5);
    await page.waitForTimeout(25);
  }
  await page.mouse.up();
  await page.waitForTimeout(800);

  // Rotate back smoothly
  await page.mouse.down();
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(788 - i * 7, 324 + i * 1.5);
    await page.waitForTimeout(25);
  }
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Click cardiovascular filter button
  const sysBtn = page.locator("button:has-text('Peredaran Darah'), button:has-text('Kardiovaskular')").first();
  if (await sysBtn.count() > 0) {
    const box = await sysBtn.boundingBox();
    if (box) {
      await smoothMove(page, 620, 360, box.x + box.width / 2, box.y + box.height / 2, 18);
      await page.waitForTimeout(300);
      await safeClick(page, sysBtn, 1500);
    }
  }
  await page.waitForTimeout(1200);

  // Move mouse over InfoPanel on the right side
  await smoothMove(page, 300, 360, 980, 260, 20);
  await page.waitForTimeout(1200);
  await smoothMove(page, 980, 260, 980, 480, 20);
  await page.waitForTimeout(1200);

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

// 3. Misi & Kuis Interaktif Scene (17.6s)
async function recordScene3(browser, scene) {
  console.log(`[3/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  // Part A: Show Missions (6 seconds)
  await page.goto(`${BASE_URL}/missions`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await smoothMove(page, 640, 250, 480, 380, 18);
  await page.waitForTimeout(1200);
  await smoothMove(page, 480, 380, 780, 380, 18);
  await page.waitForTimeout(1200);

  // Part B: Navigate to Quiz (remaining ~10 seconds)
  await page.goto(`${BASE_URL}/quiz`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Click 'Mulai Kuis'
  const startBtn = page.locator("button:has-text('Mulai Kuis')").first();
  if (await startBtn.count() > 0) {
    const sbox = await startBtn.boundingBox();
    if (sbox) {
      await smoothMove(page, 780, 380, sbox.x + sbox.width / 2, sbox.y + sbox.height / 2, 18);
      await page.waitForTimeout(300);
      await safeClick(page, startBtn, 1500);
      await page.waitForTimeout(1200);
    }
  }

  // Click an answer choice
  const opt = page.locator(".grid button").nth(1);
  if (await opt.count() > 0) {
    const obox = await opt.boundingBox();
    if (obox) {
      await smoothMove(page, 640, 450, obox.x + obox.width / 2, obox.y + obox.height / 2, 18);
      await page.waitForTimeout(300);
      await safeClick(page, opt, 1500);
      await page.waitForTimeout(2000);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

// 4. Portal Siswa & Prestasi Scene (20.7s)
async function recordScene4(browser, scene) {
  console.log(`[4/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  // Part A: Student Login Gate (7 seconds)
  await page.goto(`${BASE_URL}/join`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const nameInput = page.locator("#gate-student-name");
  if (await nameInput.count() > 0) {
    await page.fill("#gate-student-name", "Budi Pratama");
    await page.fill("#gate-student-class", "XI MIPA 1");
    await page.fill("#gate-student-pin", "1234");
    await smoothMove(page, 640, 300, 640, 450, 16);
    await safeClick(page, page.locator("button[type='submit']"), 1500);
    await page.waitForTimeout(1000);
  }

  // Part B: Achievements & Badges (remaining ~12 seconds)
  await page.goto(`${BASE_URL}/achievements`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  // Hover XP bar and streak
  await smoothMove(page, 640, 200, 420, 280, 18);
  await page.waitForTimeout(1000);
  await smoothMove(page, 420, 280, 780, 280, 18);
  await page.waitForTimeout(1000);

  // Scroll through badges
  await smoothScroll(page, 300, 1400);
  await page.waitForTimeout(1500);
  await smoothScroll(page, -300, 1200);
  await page.waitForTimeout(1000);

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

// 5. Dashboard Guru & Live Board Scene (17.5s)
async function recordScene5(browser, scene) {
  console.log(`[5/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  // Part A: Teacher Gate & Dashboard (6 seconds)
  await page.goto(`${BASE_URL}/teacher`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  const pinInput = page.locator("#teacher-pin");
  if (await pinInput.count() > 0) {
    await pinInput.fill("2025");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1200);
  }

  // Part B: Host Live Board (remaining ~10 seconds)
  await page.goto(`${BASE_URL}/host`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  // Choose 5 soal
  const countBtn = page.locator("button:has-text('5 soal')").first();
  if (await countBtn.count() > 0) {
    await safeClick(page, countBtn, 1200);
    await page.waitForTimeout(300);
  }

  // Choose 20 detik
  const timerBtn = page.locator("button:has-text('20 detik')").first();
  if (await timerBtn.count() > 0) {
    await safeClick(page, timerBtn, 1200);
    await page.waitForTimeout(300);
  }

  // Click 'Buat Sesi'
  const createBtn = page.locator("button:has-text('Buat Sesi')").first();
  if (await createBtn.count() > 0) {
    const crbox = await createBtn.boundingBox();
    if (crbox) {
      await smoothMove(page, 500, 480, crbox.x + crbox.width / 2, crbox.y + crbox.height / 2, 16);
      await page.waitForTimeout(300);
      await safeClick(page, createBtn, 2000);
      await page.waitForTimeout(2000);
    }
  }

  // Hover over the generated Room Code and QR Code
  await smoothMove(page, 640, 500, 640, 340, 20);
  await page.waitForTimeout(2000);

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

// 6. Penutup & Call to Action Scene (13.9s)
async function recordScene6(browser, scene) {
  console.log(`[6/6] Recording ${scene.id} (${scene.scene_duration}s)...`);
  const outDir = `video_project/raw_videos/${scene.id}`;
  mkdirSync(outDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await addMouseHelper(page);

  const startTime = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  // Mouse over web domain pill
  const domainPill = page.locator("text='anatomi.apotiku.id'").first();
  if (await domainPill.count() > 0) {
    const pbox = await domainPill.boundingBox();
    if (pbox) {
      await smoothMove(page, 200, 200, pbox.x + pbox.width / 2, pbox.y + pbox.height / 2, 18);
      await page.waitForTimeout(1000);
    }
  }

  // Hover over hero primary button 'Mulai Eksplorasi 3D'
  const ctaBtn = page.locator("a:has-text('Mulai Eksplorasi 3D'), button:has-text('Mulai Eksplorasi 3D')").first();
  if (await ctaBtn.count() > 0) {
    const cbox = await ctaBtn.boundingBox();
    if (cbox) {
      await smoothMove(page, 640, 250, cbox.x + cbox.width / 2, cbox.y + cbox.height / 2, 20);
      await page.waitForTimeout(2500);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  const rem = Math.max(0, scene.scene_duration - elapsed);
  if (rem > 0) await page.waitForTimeout(rem * 1000);

  await context.close();
  collectRecordedFile(scene.id);
  console.log(`  -> Completed ${scene.id}!`);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-sandbox"
    ]
  });

  const sceneMap = {
    scene_01_landing: recordScene1,
    scene_02_explore: recordScene2,
    scene_03_misi_kuis: recordScene3,
    scene_04_portal_siswa: recordScene4,
    scene_05_portal_guru: recordScene5,
    scene_06_penutup: recordScene6
  };

  for (const sc of timings) {
    const fn = sceneMap[sc.id];
    if (fn) {
      await fn(browser, sc);
    }
  }

  await browser.close();
  console.log("=== All 6 scene recordings finished successfully! ===");
}

main().catch(console.error);
