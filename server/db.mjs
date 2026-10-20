import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

export class DatabaseAdapter {
  constructor(options = {}) {
    this.connectionString = options.connectionString || process.env.DATABASE_URL;
    this.filePath = options.filePath || path.join(process.cwd(), "server", "data", "students.json");
    this.pool = null;
    this.usePostgres = false;
  }

  async init() {
    if (this.connectionString) {
      try {
        this.pool = new Pool({
          connectionString: this.connectionString,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 4000,
        });

        // Test connection
        const client = await this.pool.connect();
        await this.createTables(client);
        client.release();

        this.usePostgres = true;
        console.log(" [DB] Terhubung ke PostgreSQL database:", this.sanitizeConnString(this.connectionString));
        return;
      } catch (err) {
        console.warn(" [DB] Gagal tersambung ke PostgreSQL (" + err.message + "). Fallback otomatis ke JSON file storage.");
        this.usePostgres = false;
        if (this.pool) {
          await this.pool.end().catch(() => {});
          this.pool = null;
        }
      }
    } else {
      console.log(" [DB] DATABASE_URL tidak diatur. Menggunakan penyimpanan berkas JSON:", this.filePath);
    }
  }

  sanitizeConnString(str) {
    try {
      const u = new URL(str);
      if (u.password) u.password = "******";
      return u.toString();
    } catch {
      return "postgresql://***";
    }
  }

  async createTables(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        key VARCHAR(128) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        kelas VARCHAR(64) DEFAULT '',
        pin VARCHAR(32) NOT NULL,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 1,
        last_active_day VARCHAR(64),
        discovered JSONB DEFAULT '[]'::jsonb,
        badges JSONB DEFAULT '[]'::jsonb,
        correct_streak INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        total_answered INTEGER DEFAULT 0,
        missions_played INTEGER DEFAULT 0,
        mission_best_score INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        quiz_best_score INTEGER DEFAULT 0,
        live_sessions_count INTEGER DEFAULT 0,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_students_xp ON students(xp DESC);
    `);
  }

  async loadAll() {
    if (this.usePostgres) {
      try {
        const { rows } = await this.pool.query("SELECT * FROM students");
        const map = new Map();
        for (const r of rows) {
          map.set(r.key, {
            key: r.key,
            name: r.name,
            kelas: r.kelas || "",
            pin: r.pin,
            xp: Number(r.xp) || 0,
            coins: Number(r.coins) || 0,
            streak: Number(r.streak) || 1,
            lastActiveDay: r.last_active_day,
            discovered: Array.isArray(r.discovered) ? r.discovered : [],
            badges: Array.isArray(r.badges) ? r.badges : [],
            correctStreak: Number(r.correct_streak) || 0,
            totalCorrect: Number(r.total_correct) || 0,
            totalAnswered: Number(r.total_answered) || 0,
            missionsPlayed: Number(r.missions_played) || 0,
            missionBestScore: Number(r.mission_best_score) || 0,
            quizzesCompleted: Number(r.quizzes_completed) || 0,
            quizBestScore: Number(r.quiz_best_score) || 0,
            liveSessionsCount: Number(r.live_sessions_count) || 0,
            createdAt: Number(r.created_at) || Date.now(),
            updatedAt: Number(r.updated_at) || Date.now(),
          });
        }
        return map;
      } catch (err) {
        console.error(" [DB] Error loadAll dari PostgreSQL:", err.message);
      }
    }

    // JSON file fallback
    const map = new Map();
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        if (Array.isArray(raw)) {
          for (const item of raw) {
            if (item && typeof item.key === "string") {
              map.set(item.key, item);
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
    return map;
  }

  async upsertStudent(st) {
    if (this.usePostgres) {
      try {
        await this.pool.query(
          `INSERT INTO students (
            key, name, kelas, pin, xp, coins, streak, last_active_day,
            discovered, badges, correct_streak, total_correct, total_answered,
            missions_played, mission_best_score, quizzes_completed,
            quiz_best_score, live_sessions_count, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
          ON CONFLICT (key) DO UPDATE SET
            name = EXCLUDED.name,
            kelas = EXCLUDED.kelas,
            pin = EXCLUDED.pin,
            xp = EXCLUDED.xp,
            coins = EXCLUDED.coins,
            streak = EXCLUDED.streak,
            last_active_day = EXCLUDED.last_active_day,
            discovered = EXCLUDED.discovered,
            badges = EXCLUDED.badges,
            correct_streak = EXCLUDED.correct_streak,
            total_correct = EXCLUDED.total_correct,
            total_answered = EXCLUDED.total_answered,
            missions_played = EXCLUDED.missions_played,
            mission_best_score = EXCLUDED.mission_best_score,
            quizzes_completed = EXCLUDED.quizzes_completed,
            quiz_best_score = EXCLUDED.quiz_best_score,
            live_sessions_count = EXCLUDED.live_sessions_count,
            updated_at = EXCLUDED.updated_at`,
          [
            st.key,
            st.name,
            st.kelas || "",
            st.pin,
            st.xp || 0,
            st.coins || 0,
            st.streak || 1,
            st.lastActiveDay || null,
            JSON.stringify(Array.isArray(st.discovered) ? st.discovered : []),
            JSON.stringify(Array.isArray(st.badges) ? st.badges : []),
            st.correctStreak || 0,
            st.totalCorrect || 0,
            st.totalAnswered || 0,
            st.missionsPlayed || 0,
            st.missionBestScore || 0,
            st.quizzesCompleted || 0,
            st.quizBestScore || 0,
            st.liveSessionsCount || 0,
            st.createdAt || Date.now(),
            st.updatedAt || Date.now(),
          ],
        );
        return;
      } catch (err) {
        console.error(" [DB] Error upsert PostgreSQL:", err.message);
      }
    }

    // JSON file fallback
    this.scheduleJsonSave();
  }

  async deleteStudent(key) {
    if (this.usePostgres) {
      try {
        await this.pool.query("DELETE FROM students WHERE key = $1", [key]);
      } catch (err) {
        console.error(" [DB] Error delete PostgreSQL:", err.message);
      }
    }
    this.scheduleJsonSave();
  }

  async clearStudents() {
    if (this.usePostgres) {
      try {
        await this.pool.query("TRUNCATE TABLE students");
      } catch (err) {
        console.error(" [DB] Error truncate PostgreSQL:", err.message);
      }
    }
    this.scheduleJsonSave();
  }

  async saveBatch(studentsList) {
    if (this.usePostgres) {
      for (const st of studentsList) {
        await this.upsertStudent(st);
      }
      return;
    }
    this.scheduleJsonSave();
  }

  setMemoryCacheRef(map) {
    this._memoryCache = map;
  }

  scheduleJsonSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        if (!this._memoryCache) return;
        fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
        const data = JSON.stringify([...this._memoryCache.values()], null, 2);
        fs.writeFileSync(this.filePath, data, "utf8");
      } catch {
        /* ignore write error */
      }
    }, 150);
    this._saveTimer.unref?.();
  }
}
