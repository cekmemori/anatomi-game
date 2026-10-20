import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "fonts");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400..800&family=Inter:wght@400..700&family=Space+Grotesk:wght@500..700&display=swap";
const KEEP = new Set(["latin", "latin-ext"]);

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function main() {
  const res = await fetch(CSS_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Gagal mengambil CSS font: ${res.status}`);
  const css = await res.text();

  await fs.mkdir(OUT, { recursive: true });

  const re = /\/\*\s*([^*]+?)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  const blocks = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(css))) {
    const subset = m[1].trim();
    if (!KEEP.has(subset)) continue;
    const block = m[2];
    const family = /font-family:\s*'([^']+)'/.exec(block)?.[1] ?? "font";
    const weight = /font-weight:\s*([^;]+);/.exec(block)?.[1]?.trim() ?? "400";
    const url = /url\((https:\/\/[^)]+\.woff2)\)/.exec(block)?.[1];
    if (!url) continue;
    const file = `${slug(family)}-${slug(weight)}-${subset}.woff2`;
    const target = path.join(OUT, file);
    if (!seen.has(file)) {
      seen.add(file);
      const bin = await fetch(url);
      if (!bin.ok) throw new Error(`Gagal mengunduh ${url}`);
      await fs.writeFile(target, Buffer.from(await bin.arrayBuffer()));
      console.log("unduh", file);
    }
    blocks.push(block.replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(/fonts/${file})`));
  }

  if (!blocks.length) throw new Error("Tidak ada @font-face yang cocok.");
  await fs.writeFile(path.join(OUT, "fonts.css"), blocks.join("\n\n") + "\n");
  console.log(`selesai: ${blocks.length} @font-face, ${seen.size} file`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
