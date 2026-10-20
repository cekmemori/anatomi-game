import { useState } from "react";
import { useCustomQuestions } from "../store/useCustomQuestions";

export default function CustomQuestions() {
  const questions = useCustomQuestions((s) => s.questions);
  const add = useCustomQuestions((s) => s.add);
  const remove = useCustomQuestions((s) => s.remove);
  const clear = useCustomQuestions((s) => s.clear);

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);
  const [explain, setExplain] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!prompt.trim() || opts.length < 2) {
      setErr("Isi pertanyaan dan minimal 2 opsi jawaban.");
      return;
    }
    if (answer >= opts.length) {
      setErr("Pilih jawaban benar yang valid.");
      return;
    }
    add({
      prompt: prompt.trim(),
      options: opts,
      answer,
      explain: explain.trim(),
      system: "custom",
    });
    setPrompt("");
    setOptions(["", "", "", ""]);
    setAnswer(0);
    setExplain("");
    setErr(null);
  };

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-muted hover:text-ink"
      >
        <span>✏️ Soal Kustom ({questions.length})</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <form onSubmit={submit} className="space-y-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pertanyaan"
              aria-label="Teks pertanyaan"
              maxLength={300}
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
            />
            <div className="grid grid-cols-2 gap-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAnswer(i)}
                    aria-label={`Tandai opsi ${String.fromCharCode(65 + i)} sebagai jawaban benar`}
                    aria-pressed={answer === i}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                      answer === i
                        ? "bg-emerald-400/25 text-emerald-200"
                        : "bg-white/10 text-muted"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input
                    value={o}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))
                    }
                    placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                    aria-label={`Teks opsi ${String.fromCharCode(65 + i)}`}
                    maxLength={150}
                    className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-xs outline-none focus:border-cyan-400/60"
                  />
                </div>
              ))}
            </div>
            <input
              value={explain}
              onChange={(e) => setExplain(e.target.value)}
              placeholder="Pembahasan (opsional)"
              aria-label="Teks pembahasan (opsional)"
              maxLength={400}
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs outline-none focus:border-cyan-400/60"
            />
            {err && (
              <p role="alert" className="text-xs text-red-300">
                {err}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-cyan-400/20 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/30"
            >
              + Tambah Soal
            </button>
          </form>

          {questions.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted">
                <span>Tersimpan</span>
                <button
                  type="button"
                  onClick={() => window.confirm("Hapus semua soal kustom?") && clear()}
                  className="hover:text-red-300"
                >
                  Hapus semua
                </button>
              </div>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-2.5 py-1.5 text-xs"
                >
                  <span className="flex-1">{q.prompt}</span>
                  <button
                    type="button"
                    onClick={() => remove(q.id)}
                    aria-label={`Hapus soal: ${q.prompt}`}
                    className="text-muted hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
