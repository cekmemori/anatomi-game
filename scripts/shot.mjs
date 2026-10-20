import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

const server = spawn("node", ["server/index.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "ignore",
});

function done(code) {
  try {
    server.kill();
  } catch {
    /* ignore */
  }
  process.exit(code);
}

const health = async () => {
  for (let i = 0; i < 60; i += 1) {
    try {
      const r = await fetch(`${BASE}/healthz`);
      if (r.ok) return;
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("no server");
};

try {
  await health();
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--no-sandbox",
    ],
  });
  const ctx = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 900, height: 900 },
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log("PAGE-ERR:", m.text().slice(0, 160));
  });
  page.on("pageerror", (e) => console.log("PAGE-EXC:", String(e).slice(0, 160)));
  await page.goto(`${BASE}/explore`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas");
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(500);
    const ready = await page.evaluate(() => {
      let n = 0;
      globalThis.__scene?.traverse((o) => {
        if (o.isMesh && o.visible) n += 1;
      });
      return n > 100;
    });
    if (ready) break;
  }
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const scene = globalThis.__scene;
    if (!scene) return { error: "no scene" };
    const body = { min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] };
    const add = (x, y, z) => {
      body.min[0] = Math.min(body.min[0], x);
      body.min[1] = Math.min(body.min[1], y);
      body.min[2] = Math.min(body.min[2], z);
      body.max[0] = Math.max(body.max[0], x);
      body.max[1] = Math.max(body.max[1], y);
      body.max[2] = Math.max(body.max[2], z);
    };
    const markers = [];
    let meshCount = 0;
    scene.traverse((o) => {
      if (o.userData && o.userData.__marker) {
        const p = o.getWorldPosition(new o.position.constructor());
        markers.push([Number(p.x.toFixed(3)), Number(p.y.toFixed(3)), Number(p.z.toFixed(3))]);
      }
      const m = o;
      if (m.isMesh && m.visible) {
        meshCount += 1;
        m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox;
        m.updateWorldMatrix(true, false);
        for (const cx of [bb.min.x, bb.max.x])
          for (const cy of [bb.min.y, bb.max.y])
            for (const cz of [bb.min.z, bb.max.z]) {
              const v = new o.position.constructor(cx, cy, cz).applyMatrix4(m.matrixWorld);
              add(v.x, v.y, v.z);
            }
      }
    });
    return { meshCount, body, markers };
  });
  console.log("BODY:", JSON.stringify(info.body));
  console.log("MESHES:", info.meshCount);
  for (const m of info.markers ?? []) console.log("  MARKER", m.join(", "));

  const cdp = await ctx.newCDPSession(page);
  const shoot = async (file) => {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(data, "base64"));
  };
  await shoot("shot-front.png");

  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 300, box.y + box.height / 2, { steps: 24 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
  await shoot("shot-side.png");

  await browser.close();
  done(0);
} catch (e) {
  console.error(e);
  done(1);
}
