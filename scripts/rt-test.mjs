import { io } from "socket.io-client";

const URL = process.env.URL || "http://localhost:3005";
const PIN = process.env.PIN || "1234";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emitAck = (sock, ev, payload) =>
  new Promise((res) => sock.emit(ev, payload, res));

let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

const host = io(URL, { transports: ["websocket"] });
const host2 = io(URL, { transports: ["websocket"] });
const student = io(URL, { transports: ["websocket"] });

let lastUpdate = null;
let studentState = null;
host.on("host:update", (d) => (lastUpdate = d));
student.on("student:update", (d) => (studentState = d));

async function main() {
  await Promise.all([
    new Promise((r) => host.on("connect", r)),
    new Promise((r) => host2.on("connect", r)),
    new Promise((r) => student.on("connect", r)),
  ]);
  console.log("connected");

  // --- Auth ---
  const badAuth = await emitAck(host, "host:auth", { pin: "salah" });
  check("host:auth tolak PIN salah", badAuth?.ok === false);
  const goodAuth = await emitAck(host, "host:auth", { pin: PIN });
  check("host:auth terima PIN benar", goodAuth?.ok === true);

  const badCreate = await emitAck(host2, "host:create", { pin: "salah" });
  check("host:create tolak PIN salah", badCreate?.ok === false);

  const created = await emitAck(host, "host:create", { pin: PIN });
  check("host:create mengembalikan token", created?.ok === true && !!created.token);
  const code = created.code;
  const token = created.token;
  console.log("room", code);

  // --- Payload sanitize ---
  const badQuestions = [
    { prompt: "valid", options: ["a", "b"], answer: 1, explain: "e", system: "nervous" },
    { prompt: "", options: ["a"], answer: 9 }, // invalid
    { prompt: "tanpa answer index valid", options: ["a", "b", "c"], answer: 5 },
  ];
  const load = await emitAck(host, "host:questions", { code, token, questions: badQuestions });
  check("host:questions menyaring soal tidak valid", load?.total === 1, JSON.stringify(load));

  // token salah tidak boleh mengubah apa pun
  const hacked = await emitAck(host2, "host:questions", { code, token: "palsu", questions: [] });
  check("token palsu ditolak", hacked?.ok === false);

  // --- Join ---
  const badJoin = await emitAck(student, "student:join", { code: "ZZZZZ", name: "X" });
  check("join kode salah ditolak", badJoin?.ok === false);

  const join = await emitAck(student, "student:join", { code, name: "Siswa Tes" });
  check("join sukses + token siswa", join?.ok === true && !!join.token);
  const sId = join.studentId;

  // reattach dengan token salah -> siswa baru
  const hijack = await emitAck(host2, "student:join", {
    code,
    name: "Penyerang",
    studentId: sId,
    token: "palsu",
  });
  check("hijack studentId tanpa token ditolak (jadi siswa baru)", hijack?.studentId !== sId);

  // --- Alur kuis ---
  host.emit("host:stage", { code, token, stage: "quiz" });
  await wait(150);
  check("masuk quiz -> soal pertama", studentState?.stage === "quiz" && !!studentState?.question);

  student.emit("student:answer", { code, qIndex: 0, choice: 0 });
  await wait(120);
  check("jawaban salah tidak menambah skor", studentState?.yourScore === 0);

  host.emit("host:reveal", { code, token });
  await wait(120);
  check("reveal mengirim kunci jawaban", studentState?.correctIndex !== null);

  host.emit("host:end", { code, token });
  await wait(150);
  check("end -> stage ended", studentState?.stage === "ended");
  check("leaderboard terisi", Array.isArray(lastUpdate?.students));

  // --- Timer soal + review hasil ---
  const host3 = io(URL, { transports: ["websocket"] });
  const student2 = io(URL, { transports: ["websocket"] });
  let s2 = null;
  let ended = null;
  student2.on("student:update", (d) => (s2 = d));
  student2.on("session:ended", (d) => (ended = d));
  await Promise.all([
    new Promise((r) => host3.on("connect", r)),
    new Promise((r) => student2.on("connect", r)),
  ]);

  const c3 = await emitAck(host3, "host:create", { pin: PIN, durationMs: 1200 });
  await emitAck(host3, "host:questions", {
    code: c3.code,
    token: c3.token,
    questions: [
      { id: "t", prompt: "Soal timer", options: ["a", "b"], answer: 1, explain: "E", system: "nervous" },
    ],
  });
  await emitAck(student2, "student:join", { code: c3.code, name: "Timer" });
  host3.emit("host:stage", { code: c3.code, token: c3.token, stage: "quiz" });
  await wait(200);
  check("timer soal aktif (qEndsAt > 0)", s2?.qEndsAt > 0);

  student2.emit("student:answer", { code: c3.code, qIndex: 0, choice: 0 });
  await wait(2200);
  check("auto-reveal saat waktu habis", s2?.revealed === true);

  host3.emit("host:end", { code: c3.code, token: c3.token });
  await wait(200);
  check(
    "review per-soal terkirim ke siswa",
    Array.isArray(ended?.review) &&
      ended.review.length === 1 &&
      ended.review[0].chosen === 0 &&
      ended.review[0].correctIndex === 1 &&
      ended.review[0].correct === false,
  );

  // --- Student Login (Nama + PIN) & Evaluasi ---
  const stName = "Budi Uji RT";
  const stReg = await emitAck(student, "student:login", {
    name: stName,
    pin: "9876",
    kelas: "XI MIPA 2",
    progress: { xp: 150, discovered: ["heart", "brain"], totalCorrect: 4, totalAnswered: 5 },
  });
  check("student:login registrasi baru sukses", stReg?.ok === true && stReg.student?.xp === 150);

  const stWrongPin = await emitAck(student, "student:login", {
    name: stName,
    pin: "0000",
  });
  check("student:login tolak PIN salah untuk nama sama", stWrongPin?.ok === false);

  const stRightPin = await emitAck(student, "student:login", {
    name: stName,
    pin: "9876",
    progress: { xp: 240, discovered: ["heart", "brain", "lungs"], totalCorrect: 5, totalAnswered: 5 },
  });
  check("student:login terima PIN benar & merge progres", stRightPin?.ok === true && stRightPin.student?.xp === 240);

  const tList = await emitAck(host, "teacher:students:list", { pin: PIN });
  check(
    "teacher:students:list menampilkan siswa terdaftar",
    tList?.ok === true && tList.students?.some((s) => s.name === stName && s.pin === "9876"),
  );

  await emitAck(host, "teacher:student:delete", {
    pin: PIN,
    key: stName.toLowerCase(),
  });

  console.log(`\nRESULT: ${pass} ok, ${fail} gagal`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
