import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const PORT = Number(process.env.E2E_PORT ?? 3007);
const BASE = `http://localhost:${PORT}`;
const PIN = "1234";

let pass = 0;
const failures = [];

function check(name, cond, extra = "") {
  if (cond) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

async function visible(locator, timeout = 10000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function gone(locator, timeout = 6000) {
  try {
    await locator.first().waitFor({ state: "hidden", timeout });
    return true;
  } catch {
    return false;
  }
}

async function scanA11y(page, label) {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const v = res.violations.filter((x) => x.nodes.length > 0);
  check(
    `a11y ${label}`,
    v.length === 0,
    v.map((x) => `${x.id}×${x.nodes.length}`).join(", "),
  );
  for (const x of v) {
    console.log(`       [${x.id}] ${x.help}`);
    for (const n of x.nodes.slice(0, 3))
      console.log(`         → ${n.target.join(" ")}`);
  }
}

async function waitForHealth(timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/healthz`);
      if (r.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  const server = spawn("node", ["server/index.mjs"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      TEACHER_PIN: PIN,
      STUDENTS_FILE: `server/data/students-e2e-${PORT}.json`,
    },
    stdio: "ignore",
  });

  const cleanup = () => {
    try {
      spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      /* ignore */
    }
    try {
      rmSync(`server/data/students-e2e-${PORT}.json`, { force: true });
    } catch {
      /* ignore */
    }
  };

  try {
    if (!(await waitForHealth())) throw new Error("Server tidak siap (healthz gagal).");

    const browser = await chromium.launch({
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--no-sandbox",
      ],
    });
    const context = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1366, height: 900 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(25000);

    const navTo = async (p, route) => {
      await p.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    };

    // ---------- Landing ----------
    await navTo(page, "/");
    await page.waitForSelector("h1");
    check("landing judul halaman", (await page.title()).includes("Beranda"));
    check("landing h1 tampil", await visible(page.getByRole("heading", { level: 1 })));

    await page.keyboard.press("Tab");
    const firstFocus = await page.evaluate(() =>
      globalThis.document.activeElement?.textContent?.trim(),
    );
    check("skip link fokus pertama", firstFocus === "Lewati ke konten utama", firstFocus ?? "");
    await page.keyboard.press("Enter");
    const mainFocused = await page.evaluate(() => globalThis.document.activeElement?.id);
    check("skip link pindah ke main", mainFocused === "main-content", mainFocused ?? "");
    await scanA11y(page, "/");

    // ---------- Explore ----------
    await navTo(page, "/explore");
    await page.waitForSelector('aside[aria-label="Panel kontrol model 3D"]');
    check("explore judul halaman", (await page.title()).includes("Jelajah 3D"));
    check(
      "explore region 3D ada",
      await visible(page.getByRole("region", { name: "Model anatomi 3D interaktif" }), 20000),
    );
    await page.getByRole("button", { name: /^Jantung\b/ }).first().click();
    check(
      "explore pilih organ -> panel detail",
      await visible(page.getByRole("heading", { name: "Jantung", exact: true })),
    );
    await page.fill("#organ-search", "hati");
    const results = page.getByRole("group", { name: "Hasil pencarian organ" });
    check("explore pencarian menampilkan hasil", await visible(results));
    await results.getByRole("button").first().click();
    check(
      "explore hasil pencarian membuka organ",
      await visible(page.getByRole("heading", { name: "Hati", exact: true })),
    );
    await page.getByRole("button", { name: "Mode Organ" }).click();
    check(
      "explore ganti mode organ",
      (await page.getByRole("button", { name: "Mode Organ" }).getAttribute("aria-pressed")) ===
        "true",
    );
    await scanA11y(page, "/explore");

    // ---------- Missions (Gate & keyboard / mode teks) ----------
    await navTo(page, "/missions");
    check(
      "gate siswa menahan akses manual sebelum login",
      await visible(page.getByRole("heading", { name: "Akses Khusus Siswa" })),
    );
    await page.fill("#gate-student-name", "Alya Evaluasi");
    await page.fill("#gate-student-class", "XI MIPA 1");
    await page.fill("#gate-student-pin", "4321");
    await page.getByRole("button", { name: "Masuk Sebagai Siswa" }).click();
    await page.getByRole("dialog", { name: "Misi Temukan Organ" }).waitFor();
    check("gate siswa membuka fitur setelah login", true);
    check(
      "menu guru dan host tidak tampil untuk siswa",
      (await gone(page.getByRole("link", { name: "Guru" }))) &&
        (await gone(page.getByRole("link", { name: "Host" }))),
    );
    check("missions judul halaman", (await page.title()).includes("Misi"));
    await page.getByRole("button", { name: "Mulai Misi" }).click({ force: true });
    await page.getByRole("button", { name: "Mode teks" }).click({ force: true });
    const target = (
      await page
        .getByRole("status")
        .filter({ hasText: "Temukan & klik" })
        .locator(".text-gradient")
        .innerText()
    ).trim();
    await page
      .getByRole("region", { name: "Pilih organ melalui daftar (mode teks)" })
      .getByRole("button", { name: target, exact: true })
      .click({ force: true });
    check(
      "missions jawab benar via mode teks",
      await visible(page.getByText("Tepat sekali!")),
      `target=${target}`,
    );
    await scanA11y(page, "/missions");

    // ---------- Quiz ----------
    await navTo(page, "/quiz");
    await page.getByRole("button", { name: "Mulai Kuis" }).click();
    const firstOption = page.getByRole("button", { name: /^A\s/ }).first();
    await firstOption.waitFor({ state: "visible" });
    await firstOption.click();
    check(
      "quiz memberi umpan balik setelah menjawab",
      await visible(page.getByText(/Benar!|Kurang tepat/)),
    );
    // Klik Lanjut untuk soal pertama yang sudah dijawab
    await page.getByRole("button", { name: /Lanjut|Lihat Hasil/ }).click();

    // Sisa soal sampai selesai (soal 2 s/d 10)
    for (let i = 1; i <= 9; i += 1) {
      const opt = page.locator("button:not([disabled])").filter({ hasText: /^A\s/ }).first();
      try {
        await opt.waitFor({ state: "visible", timeout: 5000 });
        await opt.click();
        const lanjut = page
          .locator("button:not([disabled])")
          .filter({ hasText: /Lanjut|Lihat Hasil/ })
          .first();
        await lanjut.waitFor({ state: "visible", timeout: 5000 });
        await lanjut.click();
      } catch {
        break;
      }
    }
    await page.waitForTimeout(800);
    check(
      "quiz menampilkan hasil akhir",
      await visible(page.getByText(/dari \d+ soal benar/)),
    );
    await scanA11y(page, "/quiz");

    // ---------- Achievements ----------
    await navTo(page, "/achievements");
    check("achievements judul halaman", (await page.title()).includes("Pencapaian"));
    check(
      "achievements login siswa berhasil & tersinkron",
      await visible(page.getByText("✓ Tersinkron ke Evaluasi Guru")),
    );
    await scanA11y(page, "/achievements (logged-in)");

    // ---------- Join: validasi ----------
    const joinPage = await context.newPage();
    joinPage.setDefaultTimeout(20000);
    await joinPage.goto(`${BASE}/join`, { waitUntil: "domcontentloaded" });
    const submitBtn = joinPage.getByRole("button", { name: "Gabung" });
    check("join tombol terkunci saat kosong", await submitBtn.isDisabled());
    await joinPage.fill("#join-name", "Siswa Validasi");
    await joinPage.fill("#join-code", "ABCD");
    check("join tetap terkunci bila kode < 5", await submitBtn.isDisabled());
    await joinPage.fill("#join-code", "ZZZZZ");
    check("join aktif bila lengkap", await submitBtn.isEnabled());
    await submitBtn.click();
    check("join menampilkan error kode salah", await visible(joinPage.getByRole("alert")));
    await scanA11y(joinPage, "/join");
    await joinPage.close();

    // ---------- Teacher gate ----------
    await navTo(page, "/teacher");
    await page.locator("#teacher-pin").waitFor();
    await page.fill("#teacher-pin", "0000");
    await page.getByRole("button", { name: "Masuk sebagai Guru" }).click();
    check("gate menolak PIN salah", await visible(page.getByRole("alert")));
    await page.fill("#teacher-pin", PIN);
    await page.getByRole("button", { name: "Masuk sebagai Guru" }).click();
    check("gate menerima PIN benar", await visible(page.getByRole("heading", { name: /Rekap/ })));
    check(
      "rekap guru menampilkan evaluasi siswa yang login dengan PIN",
      await visible(page.getByText("Alya Evaluasi")),
    );
    await scanA11y(page, "/teacher");
    await page.screenshot({ path: "shot-teacher.png", timeout: 60000 });

    // ---------- Host: buat sesi ----------
    await navTo(page, "/host");
    await page.getByRole("heading", { name: "Sesi Kuis Live" }).waitFor();
    await page.screenshot({ path: "shot-host.png", timeout: 60000 });
    await page.getByRole("button", { name: "5 soal", exact: true }).click();
    await page.getByRole("button", { name: "60 detik", exact: true }).click();
    await page.getByRole("button", { name: "Buat Sesi" }).click();
    const codeBtn = page.locator('button[aria-label^="Salin kode sesi"]');
    await codeBtn.waitFor();
    const code = (await codeBtn.getAttribute("aria-label")).replace("Salin kode sesi ", "");
    check("host membuat sesi + kode", /^[A-Z0-9]{5}$/.test(code), code);
    check(
      "host menampilkan QR",
      await visible(page.getByRole("img", { name: "Kode QR untuk bergabung ke sesi" })),
    );

    // ---------- Siswa gabung ----------
    const student = await context.newPage();
    student.setDefaultTimeout(20000);
    await student.goto(`${BASE}/join?code=${code}`, { waitUntil: "domcontentloaded" });
    await student.fill("#join-name", "Siswa Uji");
    await student.getByRole("button", { name: "Gabung" }).click();
    await student.waitForURL("**/play");
    check(
      "siswa masuk lobby",
      await visible(student.getByRole("heading", { name: /Menunggu guru/ })),
    );
    check("host melihat siswa di papan", await visible(page.getByText("Siswa Uji")));

    // ---------- Mulai kuis ----------
    await page.getByRole("button", { name: "Mulai Belajar" }).click();
    check(
      "siswa melihat mode belajar",
      await visible(student.getByRole("heading", { name: "Waktu Belajar" })),
    );
    await page.getByRole("button", { name: "Mulai Kuis" }).click();
    const studentOpt = student.getByRole("button", { name: /^A\s/ }).first();
    check("siswa menerima soal", await visible(studentOpt));
    await studentOpt.click();
    check(
      "siswa melihat status terkirim",
      await visible(student.getByText(/Jawaban terkirim/)),
    );
    // ---------- Mode proyektor ----------
    await page.getByRole("button", { name: /Mode Proyektor/ }).click({ force: true });
    const dialog = page.getByRole("dialog", { name: "Mode proyektor" });
    check("proyektor terbuka sebagai dialog", await visible(dialog));
    await page.keyboard.press("Escape");
    check("proyektor tertutup dengan Esc", await gone(dialog));

    // ---------- Reveal + end ----------
    await page.getByRole("button", { name: "Tampilkan Jawaban" }).click({ force: true });
    check(
      "siswa melihat hasil jawaban",
      await visible(student.getByText(/Benar!|Kurang tepat|Tidak dijawab/)),
    );
    await page.getByRole("button", { name: "Akhiri Sesi" }).click({ force: true });
    check(
      "siswa melihat sesi selesai",
      await visible(student.getByRole("heading", { name: "Sesi Selesai" })),
    );
    check(
      "siswa menerima pembahasan jawaban",
      await visible(student.getByText("Pembahasan Jawaban")),
    );
    await scanA11y(student, "/play");
    await scanA11y(student, "/play (ended)");
    await scanA11y(page, "/host");

    // ---------- Guru: rekap tersimpan ----------
    await navTo(page, "/teacher");
    const hasSiswaUji = await visible(page.getByText("Siswa Uji"));
    if (!hasSiswaUji) {
      console.log("DEBUG /teacher URL:", page.url());
      console.log("DEBUG /teacher text:", (await page.locator("body").innerText()).slice(0, 800));
    }
    check("rekap guru menampilkan peserta", hasSiswaUji);

    await browser.close();
  } finally {
    cleanup();
  }

  console.log(`\nRESULT: ${pass} ok, ${failures.length} gagal`);
  if (failures.length) {
    console.log("Gagal:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("E2E error:", e);
  process.exit(1);
});
