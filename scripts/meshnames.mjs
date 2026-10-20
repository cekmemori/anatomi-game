import fs from "fs";
import path from "path";

const dir = process.argv[2] ?? "public/models/organs";
const wanted = (process.argv[3] ?? "").split(",").filter(Boolean);
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".glb"))
  .filter((f) => wanted.length === 0 || wanted.includes(path.basename(f, ".glb")))
  .map((f) => path.join(dir, f));

for (const f of files) {
  const buf = fs.readFileSync(f);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const nodes = json.nodes ?? [];
  const names = [];
  for (const n of nodes) {
    if (n.mesh === undefined) continue;
    names.push(n.name ?? "(unnamed)");
  }
  console.log("\n== " + path.basename(f) + " (" + names.length + " meshes) ==");
  for (const n of names) console.log("  " + n);
}
