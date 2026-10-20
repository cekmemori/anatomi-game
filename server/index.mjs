import express from "express";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { Server } from "socket.io";
import helmet from "helmet";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseAdapter } from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env");
if (fs.existsSync(ENV_FILE)) {
  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 3001;
const TEACHER_PIN = (process.env.TEACHER_PIN || "2025").trim();

const MAX_STUDENTS = 60;
const MAX_ROOMS = 80;
const MAX_QUESTIONS = 50;
const ROOM_TTL_MS = 1000 * 60 * 60 * 3; // 3 jam tanpa aktivitas
const HOST_GRACE_MS = 1000 * 120; // tunggu 2 menit host reconnect
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: [
          "'self'",
          "data:",
          "https://fonts.gstatic.com",
          "https://fonts.googleapis.com",
        ],
        connectSrc: [
          "'self'",
          "blob:",
          "data:",
          "ws:",
          "wss:",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
        ],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

const useHttps = Boolean(process.env.SSL_CERT && process.env.SSL_KEY);
let httpServer;
if (useHttps) {
  httpServer = createHttpsServer(
    {
      cert: fs.readFileSync(process.env.SSL_CERT),
      key: fs.readFileSync(process.env.SSL_KEY),
    },
    app,
  );
} else {
  httpServer = createServer(app);
}

function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin/native, tidak ada header Origin
  if (ALLOWED_ORIGINS.length) return ALLOWED_ORIGINS.includes(origin);
  try {
    const u = new URL(origin);
    const fwdHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
    const reqHost = req.headers.host || "";
    if (u.host === reqHost || (fwdHost && u.host === fwdHost)) return true;
    if (u.hostname === reqHost.split(":")[0] || (fwdHost && u.hostname === fwdHost.split(":")[0])) return true;
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    return false;
  } catch {
    return false;
  }
}

const io = new Server(httpServer, {
  cors: { origin: false },
  allowRequest: (req, cb) => cb(null, originAllowed(req)),
  maxHttpBufferSize: 1e6,
});

/** @type {Map<string, Room>} */
const rooms = new Map();

const DATA_DIR = path.join(ROOT, "server", "data");
const STUDENTS_FILE =
  process.env.STUDENTS_FILE || path.join(DATA_DIR, "students.json");

/** @type {Map<string, any>} */
const studentsStore = new Map();

const dbAdapter = new DatabaseAdapter({
  connectionString: process.env.DATABASE_URL,
  filePath: STUDENTS_FILE,
});
dbAdapter.setMemoryCacheRef(studentsStore);

async function initDatabase() {
  await dbAdapter.init();
  const loaded = await dbAdapter.loadAll();
  for (const [k, v] of loaded.entries()) {
    studentsStore.set(k, v);
  }
  console.log(` [DB] Memuat ${studentsStore.size} data siswa ke memori.`);
}
initDatabase().catch((e) => console.error(" [DB] Error initDatabase:", e));

function saveStudentsStore(studentToUpsert = null) {
  if (studentToUpsert) {
    dbAdapter.upsertStudent(studentToUpsert);
  } else {
    dbAdapter.saveBatch([...studentsStore.values()]);
  }
}

function normalizeStudentKey(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sanitizeStringArray(arr, maxLen = 60) {
  if (!Array.isArray(arr)) return [];
  const set = new Set();
  for (const item of arr) {
    if (typeof item === "string" && item.trim()) {
      set.add(item.trim().slice(0, 40));
      if (set.size >= maxLen) break;
    }
  }
  return [...set];
}

function clampInt(val, min = 0, max = 1_000_000) {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function publicStudentProfile(st, includePin = false) {
  const out = {
    key: st.key,
    name: st.name,
    kelas: st.kelas || "",
    xp: st.xp || 0,
    coins: st.coins || 0,
    streak: st.streak || 0,
    lastActiveDay: st.lastActiveDay || null,
    discovered: Array.isArray(st.discovered) ? st.discovered : [],
    badges: Array.isArray(st.badges) ? st.badges : [],
    correctStreak: st.correctStreak || 0,
    totalCorrect: st.totalCorrect || 0,
    totalAnswered: st.totalAnswered || 0,
    missionsPlayed: st.missionsPlayed || 0,
    missionBestScore: st.missionBestScore || 0,
    quizzesCompleted: st.quizzesCompleted || 0,
    quizBestScore: st.quizBestScore || 0,
    liveSessionsCount: st.liveSessionsCount || 0,
    createdAt: st.createdAt || Date.now(),
    updatedAt: st.updatedAt || Date.now(),
  };
  if (includePin) out.pin = st.pin;
  return out;
}

function broadcastTeacherStudents() {
  const list = [...studentsStore.values()]
    .map((s) => publicStudentProfile(s, true))
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
  io.to("teachers").emit("teacher:students:update", { students: list });
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => {
  let code;
  do {
    code = Array.from(
      { length: 5 },
      () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join("");
  } while (rooms.has(code));
  return code;
};

const makeToken = () => crypto.randomBytes(24).toString("base64url");

// ---- Rate limiter sederhana per-socket ----
const buckets = new Map();
function allow(socket, name, max, windowMs) {
  let m = buckets.get(socket.id);
  if (!m) {
    m = new Map();
    buckets.set(socket.id, m);
  }
  const now = Date.now();
  let b = m.get(name);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    m.set(name, b);
  }
  b.count += 1;
  return b.count <= max;
}

function touch(room) {
  room.updatedAt = Date.now();
}

function isHost(room, token) {
  return Boolean(room && token) && room.hostToken === token;
}

function roomSummary(room) {
  const students = [...room.students.values()]
    .map((s) => ({
      id: s.id,
      name: s.name,
      score: s.score,
      answered: Object.keys(s.answers).length,
      connected: s.connected,
      answers: s.answers,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    code: room.code,
    stage: room.stage,
    qIndex: room.qIndex,
    total: room.questions.length,
    revealed: room.revealed,
    students,
  };
}

function publicQuestion(room, index) {
  const q = room.questions[index];
  if (!q) return null;
  return { id: q.id, prompt: q.prompt, options: q.options, system: q.system };
}

function hostUpdate(room) {
  io.to(room.code + ":host").emit("host:update", roomSummary(room));
  io.to(room.code + ":host").emit("host:question", {
    index: room.qIndex,
    total: room.questions.length,
    revealed: room.revealed,
    qEndsAt: room.qEndsAt,
    question: room.qIndex >= 0 ? publicQuestion(room, room.qIndex) : null,
    correctIndex:
      room.revealed && room.qIndex >= 0 ? room.questions[room.qIndex].answer : null,
    explain:
      room.revealed && room.qIndex >= 0 ? room.questions[room.qIndex].explain : null,
  });
}

function studentUpdate(room, student) {
  const sockId = student.socketId;
  if (!sockId) return;
  const q = room.qIndex >= 0 ? room.questions[room.qIndex] : null;
  const answered = student.answers[room.qIndex];
  io.to(sockId).emit("student:update", {
    stage: room.stage,
    qIndex: room.qIndex,
    total: room.questions.length,
    revealed: room.revealed,
    qEndsAt: room.qEndsAt,
    question: q && room.stage === "quiz" ? publicQuestion(room, room.qIndex) : null,
    correctIndex: room.revealed && q ? q.answer : null,
    explain: room.revealed && q ? q.explain : null,
    yourAnswer: answered ? answered.choice : null,
    yourScore: student.score,
  });
}

function broadcastStudents(room) {
  for (const s of room.students.values()) studentUpdate(room, s);
}

function broadcastAll(room) {
  hostUpdate(room);
  broadcastStudents(room);
}

function clampDuration(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n), 300_000);
}

function armTimer(room) {
  room.qEndsAt = room.durationMs > 0 ? Date.now() + room.durationMs : 0;
}

function emitQuestionList(room) {
  io.to(room.code + ":host").emit("host:questionlist", {
    durationMs: room.durationMs,
    questions: room.questions.map((q, i) => ({
      index: i,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explain: q.explain,
      system: q.system,
    })),
  });
}

function studentReview(room, student) {
  return room.questions.map((q, i) => {
    const a = student.answers[i];
    return {
      index: i,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.answer,
      chosen: a ? a.choice : null,
      correct: Boolean(a && a.correct),
      explain: q.explain,
    };
  });
}

function sanitizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const q of input.slice(0, MAX_QUESTIONS)) {
    if (!q || typeof q !== "object") continue;
    const prompt = String(q.prompt ?? "").slice(0, 500).trim();
    const options = Array.isArray(q.options)
      ? q.options.slice(0, 6).map((o) => String(o).slice(0, 300))
      : [];
    const answer = Number.isInteger(q.answer) ? q.answer : -1;
    if (!prompt || options.length < 2 || answer < 0 || answer >= options.length) continue;
    out.push({
      id: String(q.id ?? `q${out.length}`).slice(0, 60),
      prompt,
      options,
      answer,
      explain: String(q.explain ?? "").slice(0, 800),
      system: String(q.system ?? "").slice(0, 40),
    });
  }
  return out;
}

function attachHost(socket, room) {
  room.hostSocketId = socket.id;
  room.hostDisconnectedAt = 0;
  socket.join(room.code + ":host");
  socket.data.room = room.code;
  socket.data.role = "host";
}

function deleteRoom(room) {
  io.to(room.code + ":students").emit("session:hostleft");
  rooms.delete(room.code);
}

io.on("connection", (socket) => {
  socket.on("host:auth", ({ pin } = {}, ack) => {
    if (!allow(socket, "auth", 10, 30_000)) {
      if (typeof ack === "function") ack({ ok: false, error: "Terlalu banyak percobaan." });
      return;
    }
    const ok = String(pin ?? "").trim() === TEACHER_PIN;
    if (typeof ack === "function") ack(ok ? { ok: true } : { ok: false, error: "PIN salah." });
  });

  socket.on("host:create", ({ pin, durationMs } = {}, ack) => {
    const fail = (error) => typeof ack === "function" && ack({ ok: false, error });
    if (!allow(socket, "create", 5, 60_000)) return fail("Terlalu banyak sesi dibuat.");
    if (String(pin ?? "").trim() !== TEACHER_PIN) return fail("PIN guru salah.");
    if (rooms.size >= MAX_ROOMS) return fail("Server penuh, coba lagi nanti.");
    const code = makeCode();
    const room = {
      code,
      hostToken: makeToken(),
      hostSocketId: socket.id,
      hostDisconnectedAt: 0,
      stage: "lobby",
      questions: [],
      qIndex: -1,
      revealed: false,
      durationMs: clampDuration(durationMs),
      qEndsAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      students: new Map(),
    };
    rooms.set(code, room);
    attachHost(socket, room);
    if (typeof ack === "function") ack({ ok: true, code, token: room.hostToken });
    hostUpdate(room);
  });

  socket.on("host:resume", ({ code, token } = {}, ack) => {
    const room = rooms.get(String(code || "").toUpperCase().trim());
    if (!isHost(room, token)) {
      if (typeof ack === "function") ack({ ok: false });
      return;
    }
    attachHost(socket, room);
    touch(room);
    if (typeof ack === "function") ack({ ok: true, code: room.code });
    broadcastAll(room);
    emitQuestionList(room);
  });

  socket.on("host:questions", ({ code, token, questions } = {}, ack) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) {
      if (typeof ack === "function") ack({ ok: false, error: "Sesi tidak ditemukan." });
      return;
    }
    room.questions = sanitizeQuestions(questions);
    room.qIndex = -1;
    room.revealed = false;
    room.qEndsAt = 0;
    touch(room);
    if (typeof ack === "function") ack({ ok: true, total: room.questions.length });
    hostUpdate(room);
    emitQuestionList(room);
  });

  socket.on("host:config", ({ code, token, durationMs } = {}, ack) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) {
      if (typeof ack === "function") ack({ ok: false });
      return;
    }
    room.durationMs = clampDuration(durationMs);
    touch(room);
    if (typeof ack === "function") ack({ ok: true, durationMs: room.durationMs });
    emitQuestionList(room);
    hostUpdate(room);
  });

  socket.on("host:stage", ({ code, token, stage } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    if (!["lobby", "study", "quiz", "ended"].includes(stage)) return;
    room.stage = stage;
    if (stage === "quiz" && room.qIndex < 0) {
      room.qIndex = 0;
      room.revealed = false;
      armTimer(room);
    }
    if (stage === "lobby" || stage === "study") {
      room.qIndex = -1;
      room.revealed = false;
      room.qEndsAt = 0;
    }
    touch(room);
    broadcastAll(room);
  });

  socket.on("host:next", ({ code, token } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    if (room.qIndex + 1 < room.questions.length) {
      room.qIndex += 1;
      room.revealed = false;
      armTimer(room);
    }
    touch(room);
    broadcastAll(room);
  });

  socket.on("host:prev", ({ code, token } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    if (room.qIndex > 0) {
      room.qIndex -= 1;
      room.revealed = false;
      armTimer(room);
    }
    touch(room);
    broadcastAll(room);
  });

  socket.on("host:reveal", ({ code, token } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    room.revealed = true;
    room.qEndsAt = 0;
    touch(room);
    broadcastAll(room);
  });

  socket.on("host:end", ({ code, token } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    room.stage = "ended";
    room.revealed = true;
    room.qEndsAt = 0;
    touch(room);
    const leaderboard = roomSummary(room).students;
    for (const s of room.students.values()) {
      const stKey = normalizeStudentKey(s.name);
      const stProfile = studentsStore.get(stKey);
      if (stProfile && Object.keys(s.answers).length > 0) {
        stProfile.liveSessionsCount = (stProfile.liveSessionsCount || 0) + 1;
        stProfile.updatedAt = Date.now();
      }
      if (s.socketId) {
        io.to(s.socketId).emit("session:ended", {
          leaderboard,
          review: studentReview(room, s),
        });
      }
    }
    saveStudentsStore();
    broadcastTeacherStudents();
    broadcastAll(room);
  });

  socket.on("host:kickstudent", ({ code, token, studentId } = {}) => {
    const room = rooms.get(code);
    if (!isHost(room, token)) return;
    const s = room.students.get(studentId);
    if (s?.socketId) io.to(s.socketId).emit("session:kicked");
    room.students.delete(studentId);
    touch(room);
    broadcastAll(room);
  });

  socket.on("student:login", ({ name, pin, kelas, progress } = {}, ack) => {
    const fail = (error) => typeof ack === "function" && ack({ ok: false, error });
    if (!allow(socket, "student_login", 25, 60_000)) {
      return fail("Terlalu banyak percobaan login. Tunggu sebentar.");
    }
    const cleanName = String(name ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 32);
    const cleanPin = String(pin ?? "")
      .trim()
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 12);
    const cleanKelas = String(kelas ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 24);
    if (cleanName.length < 2) return fail("Nama siswa minimal 2 karakter.");
    if (cleanPin.length < 4) return fail("PIN siswa minimal 4 karakter/angka.");

    const key = normalizeStudentKey(cleanName);
    let st = studentsStore.get(key);
    let isNew = false;
    const now = Date.now();

    if (!st) {
      isNew = true;
      st = {
        key,
        name: cleanName,
        kelas: cleanKelas,
        pin: cleanPin,
        xp: 0,
        coins: 0,
        streak: 1,
        lastActiveDay: new Date().toDateString(),
        discovered: [],
        badges: [],
        correctStreak: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        missionsPlayed: 0,
        missionBestScore: 0,
        quizzesCompleted: 0,
        quizBestScore: 0,
        liveSessionsCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      studentsStore.set(key, st);
    } else {
      if (st.pin !== cleanPin) {
        return fail(
          "PIN tidak sesuai untuk nama siswa ini. Gunakan PIN saat pertama kali masuk atau minta Guru mereset PIN.",
        );
      }
      st.name = cleanName;
      if (cleanKelas) st.kelas = cleanKelas;
      st.updatedAt = now;
    }

    if (!isNew && progress && typeof progress === "object") {
      st.xp = Math.max(st.xp, clampInt(progress.xp, 0, 1_000_000));
      st.coins = Math.max(st.coins, clampInt(progress.coins, 0, 1_000_000));
      st.streak = Math.max(st.streak, clampInt(progress.streak, 0, 10_000));
      if (typeof progress.lastActiveDay === "string") {
        st.lastActiveDay = progress.lastActiveDay.slice(0, 40);
      }
      st.discovered = sanitizeStringArray([
        ...(st.discovered || []),
        ...(Array.isArray(progress.discovered) ? progress.discovered : []),
      ]);
      st.badges = sanitizeStringArray([
        ...(st.badges || []),
        ...(Array.isArray(progress.badges) ? progress.badges : []),
      ]);
      st.correctStreak = Math.max(
        st.correctStreak,
        clampInt(progress.correctStreak, 0, 10_000),
      );
      st.totalCorrect = Math.max(
        st.totalCorrect,
        clampInt(progress.totalCorrect, 0, 100_000),
      );
      st.totalAnswered = Math.max(
        st.totalAnswered,
        st.totalCorrect,
        clampInt(progress.totalAnswered, 0, 100_000),
      );
      st.missionsPlayed = Math.max(
        st.missionsPlayed || 0,
        clampInt(progress.missionsPlayed, 0, 100_000),
      );
      st.missionBestScore = Math.max(
        st.missionBestScore || 0,
        clampInt(progress.missionBestScore, 0, 10_000),
      );
      st.quizzesCompleted = Math.max(
        st.quizzesCompleted || 0,
        clampInt(progress.quizzesCompleted, 0, 100_000),
      );
      st.quizBestScore = Math.max(
        st.quizBestScore || 0,
        clampInt(progress.quizBestScore, 0, 100),
      );
    }

    saveStudentsStore();
    broadcastTeacherStudents();
    if (typeof ack === "function") {
      ack({ ok: true, isNew, student: publicStudentProfile(st, false) });
    }
  });

  socket.on("student:sync", ({ name, pin, kelas, progress } = {}, ack) => {
    const fail = (error) => typeof ack === "function" && ack({ ok: false, error });
    if (!allow(socket, "student_sync", 120, 60_000)) return fail("Terlalu sering sinkronisasi.");
    const key = normalizeStudentKey(name);
    const cleanPin = String(pin ?? "").trim();
    const st = studentsStore.get(key);
    if (!st || st.pin !== cleanPin) return fail("Sesi siswa tidak valid.");

    if (typeof kelas === "string" && kelas.trim()) {
      st.kelas = kelas.trim().slice(0, 24);
    }
    if (progress && typeof progress === "object") {
      st.xp = clampInt(progress.xp, 0, 1_000_000);
      st.coins = clampInt(progress.coins, 0, 1_000_000);
      st.streak = clampInt(progress.streak, 0, 10_000);
      if (typeof progress.lastActiveDay === "string") {
        st.lastActiveDay = progress.lastActiveDay.slice(0, 40);
      }
      st.discovered = sanitizeStringArray(progress.discovered);
      st.badges = sanitizeStringArray(progress.badges);
      st.correctStreak = clampInt(progress.correctStreak, 0, 10_000);
      st.totalCorrect = clampInt(progress.totalCorrect, 0, 100_000);
      st.totalAnswered = Math.max(
        st.totalCorrect,
        clampInt(progress.totalAnswered, 0, 100_000),
      );
      st.missionsPlayed = clampInt(progress.missionsPlayed, 0, 100_000);
      st.missionBestScore = clampInt(progress.missionBestScore, 0, 10_000);
      st.quizzesCompleted = clampInt(progress.quizzesCompleted, 0, 100_000);
      st.quizBestScore = clampInt(progress.quizBestScore, 0, 100);
    }
    st.updatedAt = Date.now();
    saveStudentsStore();
    broadcastTeacherStudents();
    if (typeof ack === "function") {
      ack({ ok: true, student: publicStudentProfile(st, false) });
    }
  });

  socket.on("teacher:students:list", ({ pin } = {}, ack) => {
    if (String(pin ?? "").trim() !== TEACHER_PIN) {
      if (typeof ack === "function") ack({ ok: false, error: "PIN guru salah." });
      return;
    }
    socket.join("teachers");
    const list = [...studentsStore.values()]
      .map((s) => publicStudentProfile(s, true))
      .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name));
    if (typeof ack === "function") ack({ ok: true, students: list });
  });

  socket.on("teacher:student:resetpin", ({ pin, key, newPin } = {}, ack) => {
    if (String(pin ?? "").trim() !== TEACHER_PIN) {
      if (typeof ack === "function") ack({ ok: false, error: "PIN guru salah." });
      return;
    }
    const cleanPin = String(newPin ?? "")
      .trim()
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 12);
    if (cleanPin.length < 4) {
      if (typeof ack === "function") ack({ ok: false, error: "PIN baru minimal 4 karakter." });
      return;
    }
    const st = studentsStore.get(String(key ?? ""));
    if (!st) {
      if (typeof ack === "function") ack({ ok: false, error: "Data siswa tidak ditemukan." });
      return;
    }
    st.pin = cleanPin;
    st.updatedAt = Date.now();
    saveStudentsStore();
    broadcastTeacherStudents();
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("teacher:student:delete", ({ pin, key } = {}, ack) => {
    if (String(pin ?? "").trim() !== TEACHER_PIN) {
      if (typeof ack === "function") ack({ ok: false, error: "PIN guru salah." });
      return;
    }
    const cleanKey = String(key ?? "");
    studentsStore.delete(cleanKey);
    dbAdapter.deleteStudent(cleanKey);
    broadcastTeacherStudents();
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("teacher:students:clear", ({ pin } = {}, ack) => {
    if (String(pin ?? "").trim() !== TEACHER_PIN) {
      if (typeof ack === "function") ack({ ok: false, error: "PIN guru salah." });
      return;
    }
    studentsStore.clear();
    dbAdapter.clearStudents();
    broadcastTeacherStudents();
    if (typeof ack === "function") ack({ ok: true });
  });

  socket.on("student:join", ({ code, name, studentId, token } = {}, ack) => {
    const fail = (error) => typeof ack === "function" && ack({ ok: false, error });
    if (!allow(socket, "join", 30, 60_000)) return fail("Terlalu banyak percobaan bergabung.");
    const room = rooms.get(String(code || "").toUpperCase().trim());
    if (!room) return fail("Kode sesi salah atau sesi sudah berakhir.");
    const clean = String(name ?? "").trim().slice(0, 24);
    if (!clean) return fail("Nama tidak boleh kosong.");

    let student = studentId ? room.students.get(studentId) : null;
    const reattach = student && token && student.token === token;

    if (!reattach) {
      if (room.students.size >= MAX_STUDENTS) return fail("Sesi penuh.");
      const id = `s-${crypto.randomBytes(6).toString("hex")}`;
      student = {
        id,
        token: makeToken(),
        name: clean,
        score: 0,
        answers: {},
        connected: true,
        socketId: socket.id,
      };
      room.students.set(id, student);
    } else {
      student.name = clean || student.name;
      student.connected = true;
      student.socketId = socket.id;
    }

    socket.join(room.code + ":students");
    socket.data.room = room.code;
    socket.data.role = "student";
    socket.data.studentId = student.id;
    touch(room);
    if (typeof ack === "function")
      ack({ ok: true, studentId: student.id, token: student.token, code: room.code });
    broadcastAll(room);
  });

  socket.on("student:answer", ({ code, qIndex, choice } = {}) => {
    const room = rooms.get(code);
    if (!room) return;
    const student = room.students.get(socket.data.studentId);
    if (!student || student.socketId !== socket.id) return;
    if (room.stage !== "quiz" || room.revealed) return;
    if (qIndex !== room.qIndex || qIndex < 0) return;
    if (student.answers[qIndex]) return;
    const q = room.questions[qIndex];
    if (!q) return;
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return;
    const correct = choice === q.answer;
    student.answers[qIndex] = { choice, correct };
    if (correct) student.score += 1;
    touch(room);
    hostUpdate(room);
    studentUpdate(room, student);
  });

  socket.on("student:leave", ({ code } = {}) => {
    const room = rooms.get(code);
    if (!room) return;
    const student = room.students.get(socket.data.studentId);
    if (student) {
      room.students.delete(student.id);
      touch(room);
      hostUpdate(room);
    }
    socket.leave(code + ":students");
  });

  socket.on("disconnect", () => {
    buckets.delete(socket.id);
    const code = socket.data.room;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    if (socket.data.role === "host" && room.hostSocketId === socket.id) {
      room.hostSocketId = null;
      room.hostDisconnectedAt = Date.now();
      setTimeout(() => {
        const r = rooms.get(code);
        if (r && !r.hostSocketId) deleteRoom(r);
      }, HOST_GRACE_MS);
      return;
    }
    if (socket.data.role === "student") {
      const student = room.students.get(socket.data.studentId);
      if (student && student.socketId === socket.id) {
        student.connected = false;
        student.socketId = null;
        hostUpdate(room);
      }
    }
  });
});

// Bersihkan sesi lama tanpa aktivitas.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (now - room.updatedAt > ROOM_TTL_MS) {
      io.to(room.code + ":students").emit("session:hostleft");
      rooms.delete(room.code);
    }
  }
}, 60_000).unref?.();

// Auto-tampilkan jawaban saat timer soal habis.
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.stage === "quiz" && !room.revealed && room.qEndsAt > 0 && now >= room.qEndsAt) {
      room.revealed = true;
      room.qEndsAt = 0;
      touch(room);
      broadcastAll(room);
    }
  }
}, 500).unref?.();

app.use(
  express.static(DIST, {
    extensions: ["html"],
    setHeaders(res, filePath) {
      const base = path.basename(filePath);
      if (
        base === "sw.js" ||
        base === "index.html" ||
        base === "manifest.webmanifest" ||
        base.startsWith("workbox-")
      ) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }),
);

// Jika tab browser lama meminta chunk JS hasil build sebelumnya yang sudah diganti,
// kirim modul JS kecil yang memicu reload otomatis (bukan index.html ber-MIME text/html).
app.get("/assets/:file", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (req.params.file.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res
      .status(200)
      .send("window.location.reload(); export default function(){ return null; }\n");
    return;
  }
  res.status(404).end();
});

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, rooms: rooms.size, https: useHttps }),
);

app.use((_req, res) => {
  const index = path.join(DIST, "index.html");
  if (fs.existsSync(index)) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(index);
  } else {
    res.status(404).send("Build belum ada. Jalankan: npm run build");
  }
});

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) out.push(net.address);
    }
  }
  return out;
}

function startListening() {
  httpServer.listen(PORT, "0.0.0.0", () => {
    const scheme = useHttps ? "https" : "http";
    const lines = [
      "",
      "  AnatomiVerse — server sesi kuis (LAN)",
      `  Mode      : ${scheme.toUpperCase()}${useHttps ? "" : " (tanpa HTTPS: PWA & tombol salin nonaktif di HP)"}`,
      `  Lokal     : ${scheme}://localhost:${PORT}`,
      ...lanAddresses().map((ip) => `  LAN       : ${scheme}://${ip}:${PORT}`),
      "",
      "  Guru  -> buka /host, masukkan PIN guru untuk membuat sesi.",
      "  Siswa -> buka /join dan masukkan nama + kode.",
      "",
    ];
    console.log(lines.join("\n"));
  });
}

let retriedListen = false;
httpServer.on("error", async (err) => {
  if (err && err.code === "EADDRINUSE" && !retriedListen) {
    retriedListen = true;
    try {
      const { execSync } = await import("node:child_process");
      if (process.platform === "win32") {
        const out = execSync(`netstat -ano | findstr :${PORT}`, {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
        const pids = new Set();
        for (const line of out.split(/\r?\n/)) {
          const parts = line.trim().split(/\s+/);
          if (parts[1]?.endsWith(`:${PORT}`) && parts[3] === "LISTENING") {
            const pid = Number(parts[4]);
            if (pid && pid !== process.pid) pids.add(pid);
          }
        }
        for (const pid of pids) {
          try {
            process.kill(pid);
          } catch {
            /* ignore */
          }
        }
      } else {
        execSync(`fuser -k ${PORT}/tcp || true`, { stdio: "ignore" });
      }
      setTimeout(() => startListening(), 350);
      return;
    } catch {
      /* fallback ke pesan error di bawah */
    }
  }
  console.error(
    `\n[Server Error] Port ${PORT} sedang dipakai proses lain (${err?.code ?? err}).`,
  );
  process.exit(1);
});

startListening();
