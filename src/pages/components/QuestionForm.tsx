import { useEffect, useMemo, useRef, useState } from "react";
import { MdEditDocument } from "react-icons/md";
import supabase from "../../utils/supabase";
import { useLocation, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmDialog from "./ConfirmDialog";


export default function QuestionForm() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const initialSubject = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("matkul_id");
    if (fromUrl) return fromUrl;

    const fromStorage = localStorage.getItem("selected_matkul_id");
    return fromStorage ?? "";
  }, []);

  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [source, setSource] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  // ✅ dialog confirm + loading submit
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ref textarea + notif kecil
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const [notif, setNotif] = useState<string>("");
  const showNotif = (msg: string) => {
    setNotif(msg);
    window.setTimeout(() => setNotif(""), 2000);
  };

  // helper: format visible_time ke WIB untuk ditampilkan di option
  const formatStartWIB = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formatter.format(d)} WIB`;
  };

  // ambil data matkul yang belum lewat invisible_time (atau invisible_time null)
  const fetchSubjects = async () => {
    try {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("matkul")
        .select("*")
        .eq("is_visible", true)
        .or(`invisible_time.is.null,invisible_time.gt.${nowIso}`)
        .order("visible_time", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching subjects:", error);
        return;
      }

      setSubjects(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const isShortcut = (e.ctrlKey || e.metaKey) && e.shiftKey && key === "e";
      if (!isShortcut) return;

      e.preventDefault();
      questionRef.current?.focus();
      void pasteClipboardIntoTextarea();
    };

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSubject = params.get("matkul_id") ?? "";

    setSelectedSubject(urlSubject);

    if (urlSubject) localStorage.setItem("selected_matkul_id", urlSubject);
    else localStorage.removeItem("selected_matkul_id");
  }, [location.search]);

  // cari matkul terpilih + cek apakah sudah mulai
  const selectedMatkul = useMemo(() => {
    return subjects.find((s) => String(s.id) === String(selectedSubject));
  }, [subjects, selectedSubject]);

  const isBeforeStart = useMemo(() => {
    if (!selectedMatkul?.visible_time) return false;
    return new Date() < new Date(selectedMatkul.visible_time);
  }, [selectedMatkul]);

  // subject belum dibuka?
  const isDisabledByTime = useMemo(() => {
    return (
      !!selectedMatkul?.visible_time &&
      new Date() < new Date(selectedMatkul.visible_time)
    );
  }, [selectedMatkul]);

  const handleChangeSubject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSubject(value);

    if (value) localStorage.setItem("selected_matkul_id", value);
    else localStorage.removeItem("selected_matkul_id");

    const searchParams = new URLSearchParams(location.search);
    if (value) searchParams.set("matkul_id", value);
    else searchParams.delete("matkul_id");

    searchParams.set("page", "1");
    navigate(
      { pathname: location.pathname, search: searchParams.toString() },
      { replace: true },
    );
  };

  // CTRL+SHIFT+E / CMD+SHIFT+E -> paste clipboard ke textarea pertanyaan
  const normalizeClipboardText = (t: string) => t.replace(/\r\n/g, "\n");

  const pasteClipboardIntoTextarea = async () => {
    if (!navigator.clipboard?.readText) {
      showNotif("Clipboard tidak didukung di browser ini.");
      return;
    }

    try {
      const textRaw = await navigator.clipboard.readText();
      const text = normalizeClipboardText(textRaw || "").trim();

      if (!text) {
        showNotif("Tidak ada teks yang dicopy.");
        return;
      }

      setQuestion(text);

      requestAnimationFrame(() => {
        const el = questionRef.current;
        if (!el) return;
        el.focus();
        const pos = text.length;
        el.setSelectionRange(pos, pos);
      });

      showNotif("Teks dipaste dari clipboard.");
    } catch {
      showNotif("Tidak bisa akses clipboard. Coba Ctrl+V manual.");
    }
  };

  // ✅ Buka confirm dialog (tetap ada pengecekan "belum dibuka")
  const openConfirmDialog = () => {
    if (isDisabledByTime) {
      alert(`Belum bisa submit. Mulai: ${formatStartWIB(selectedMatkul?.visible_time)}`);
      return;
    }
    setOpenConfirm(true);
  };

  // ✅ Submit asli setelah user klik "Ya, kirim" di dialog
  const submitConfirmed = async () => {
    if (isSubmitting) return;

    if (!selectedSubject) {
      alert("Pilih subject dulu!");
      return;
    }

    if (!selectedMatkul) {
      alert("Mata kuliah tidak tersedia / sudah tidak aktif.");
      return;
    }

    if (
      selectedMatkul.visible_time &&
      new Date() < new Date(selectedMatkul.visible_time)
    ) {
      alert(`Belum bisa submit. Mulai: ${formatStartWIB(selectedMatkul.visible_time)}`);
      return;
    }

    if (!question.trim() || !selectedAnswer) {
      alert("Lengkapi soal dan jawaban!");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedQuestion = question.replace(/\n/g, "<br>");

      const { error } = await supabase.from("soal").insert([
        {
          matkul_id: selectedSubject,
          source,
          question: formattedQuestion,
          answer: selectedAnswer,
        },
      ]);

      if (error) throw error;

      // ✅ toast sukses (tanpa alert)
      toast.success("Berhasil telah submit!", { autoClose: 2000 });

      setQuestion("");
      setSelectedAnswer("");
      setSource("");

      // tutup dialog
      setOpenConfirm(false);

      const params = new URLSearchParams(location.search);
      params.set("matkul_id", selectedSubject);
      params.set("page", "1");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      );
    } catch (err) {
      console.error(err);

      // ✅ toast error (tanpa alert)
      toast.error("Gagal mengirim soal", { autoClose: 2500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6 flex flex-col transition-colors duration-200 min-h-[420px]">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <MdEditDocument size={22} />
        </span>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          Soal
        </h3>
      </div>

      {/* Form untuk layout saja */}
      <form className="flex flex-col gap-4 sm:gap-5 h-full" onSubmit={(e) => e.preventDefault()}>
        {/* Subject */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Mata Kuliah (Required)
          </label>

          <select
            value={selectedSubject}
            onChange={handleChangeSubject}
            className="w-full appearance-none rounded-lg border px-4 py-3 text-sm sm:text-base transition-all cursor-pointer
              border-gray-300 bg-white text-gray-900 hover:border-blue-400
              dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:border-blue-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Select a subject</option>

            {subjects.map((v) => {
              const now = new Date();
              const start = v.visible_time ? new Date(v.visible_time) : null;
              const end = v.invisible_time ? new Date(v.invisible_time) : null;

              const isOngoing = !!start && !!end && now >= start && now < end;
              const startLabel = start ? formatStartWIB(v.visible_time) : "";

              const suffix = isOngoing
                ? " - 🟢 Sedang berlangsung"
                : startLabel
                  ? ` - Dibuka ${startLabel}`
                  : "";

              return (
                <option key={v.id} value={String(v.id)}>
                  {v.name}
                  {suffix}
                </option>
              );
            })}
          </select>

          {selectedMatkul?.visible_time && (
            <p
              className={`text-xs font-semibold ${
                isBeforeStart ? "text-red-600" : "text-green-600"
              }`}
            >
              Mulai: {formatStartWIB(selectedMatkul.visible_time)}
              {isBeforeStart ? " (belum dibuka)" : " (sudah dibuka)"}
            </p>
          )}
        </div>

        {/* Source */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Sumber / Pengirim (Optional)
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Dr. Smith, Textbook Vol 2"
            className="w-full rounded-lg border px-4 py-3 text-sm sm:text-base transition-all
              border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-400
              dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:hover:border-blue-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Question */}
        <div className="flex flex-col gap-2 grow">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Konten Pertanyaan
          </label>

          <textarea
            ref={questionRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write your question here... (Ctrl+Shift+E untuk paste clipboard)"
            className="w-full flex-1 min-h-[140px] rounded-lg border px-4 py-3 text-sm sm:text-base resize-y transition-all
              border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-400
              dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:hover:border-blue-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />

          {notif && (
            <div
              className="rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200"
              role="status"
              aria-live="polite"
            >
              {notif}
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <span>
              <span className="font-semibold">Ctrl + Shift + E</span> (Windows)
            </span>
            /{" "}
            <span>
              <span className="font-semibold">Command + Shift + E</span> (Mac)
            </span>
          </p>
        </div>

        {/* Answer */}
        <div className="flex flex-col gap-3 pt-1">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Jawaban Benar
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["A", "B", "C", "D"].map((letter) => (
              <label key={letter} className="cursor-pointer group relative">
                <input
                  type="radio"
                  name="answer_key"
                  value={letter}
                  checked={selectedAnswer === letter}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="peer sr-only"
                />
                <div
                  className="flex h-12 items-center justify-center rounded-lg border text-lg font-bold transition-all shadow-sm
                    border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-400
                    dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
                    peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-600"
                >
                  {letter}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={openConfirmDialog}
            disabled={isDisabledByTime || isSubmitting}
            className="group w-full h-12 flex items-center justify-center gap-2 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base
              transition-all active:scale-[0.98]
              shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100"
          >
            <span>{isSubmitting ? "Mengirim..." : "Kirim Soal"}</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <div className="text-center mt-3">
            <span
              onClick={() => {
                setSource("");
                setQuestion("");
                setSelectedAnswer("");
              }}
              className="text-red-600 dark:text-red-400 cursor-pointer hover:underline font-semibold text-sm"
            >
              Hapus Semua Field
            </span>
          </div>
        </div>
      </form>

      {/* ✅ Confirm Dialog manual */}
      <ConfirmDialog
        open={openConfirm}
        title="Kirim soal ini?"
        description="Pastikan pertanyaan dan jawaban sudah benar. Setelah dikirim, soal akan tersimpan."
        confirmText="Ya, kirim"
        cancelText="Batal"
        loading={isSubmitting}
        onCancel={() => setOpenConfirm(false)}
        onConfirm={submitConfirmed}
      />
    </div>
  );
}
