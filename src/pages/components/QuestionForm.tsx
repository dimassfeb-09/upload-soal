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

  const [selectedSubject, setSelectedSubject] =
    useState<string>(initialSubject);
  const [source, setSource] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");

  const [openConfirm, setOpenConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const [notif, setNotif] = useState<string>("");
  const showNotif = (msg: string) => {
    setNotif(msg);
    window.setTimeout(() => setNotif(""), 2000);
  };

  // =========================
  // ✅ TIME PARSER (anti timezone mismatch)
  // =========================
  const parseTime = (raw?: string | null) => {
    if (!raw) return null;

    let s = String(raw).trim().replace(" ", "T");

    // kalau tidak ada timezone, anggap WIB
    const hasTz = /([zZ]|[+-]\d{2}:\d{2})$/.test(s);
    if (!hasTz) s = `${s}+07:00`;

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const formatWIB = (iso?: string | null) => {
    if (!iso) return "-";
    const d = parseTime(iso);
    if (!d) return "-";

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

  const isExpired = (m: any) => {
    const end = parseTime(m?.invisible_time);
    if (!end) return false;
    return new Date() >= end;
  };

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

  const availableSubjects = useMemo(() => {
    return (subjects || []).filter((s) => !isExpired(s));
  }, [subjects]);

  const selectedMatkul = useMemo(() => {
    return availableSubjects.find(
      (s) => String(s.id) === String(selectedSubject),
    );
  }, [availableSubjects, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) return;

    const stillExists = availableSubjects.some(
      (s) => String(s.id) === String(selectedSubject),
    );

    if (!stillExists) {
      setSelectedSubject("");
      localStorage.removeItem("selected_matkul_id");

      const searchParams = new URLSearchParams(location.search);
      searchParams.delete("matkul_id");
      searchParams.set("page", "1");
      navigate(
        { pathname: location.pathname, search: searchParams.toString() },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSubjects, selectedSubject]);

  const isBeforeStart = useMemo(() => {
    const start = parseTime(selectedMatkul?.visible_time);
    if (!start) return false;
    return new Date() < start;
  }, [selectedMatkul]);

  const isDisabledByTime = useMemo(() => {
    const start = parseTime(selectedMatkul?.visible_time);
    if (!start) return false;
    return new Date() < start;
  }, [selectedMatkul]);

  const setSubjectById = (value: string) => {
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

  // =========================
  // ✅ SEARCHABLE SUBJECT DROPDOWN
  // =========================
  const [subjectSearch, setSubjectSearch] = useState("");
  const [openSubjectDropdown, setOpenSubjectDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMatkul?.name) setSubjectSearch(String(selectedMatkul.name));
    if (!selectedSubject) setSubjectSearch("");
  }, [selectedMatkul, selectedSubject]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = dropdownRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpenSubjectDropdown(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();

    const typedIsSelectedName =
      selectedMatkul?.name &&
      q === String(selectedMatkul.name).trim().toLowerCase();

    if (!q || typedIsSelectedName) return availableSubjects;

    return availableSubjects.filter((v) => {
      const name = String(v.name ?? "").toLowerCase();
      return name.includes(q);
    });
  }, [subjectSearch, availableSubjects, selectedMatkul]);

  const onSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpenSubjectDropdown(false);
      (e.target as HTMLInputElement).blur();
    }
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

  const openConfirmDialog = () => {
    if (!selectedMatkul) {
      alert("Pilih subject dulu / mata kuliah sudah tidak aktif.");
      return;
    }
    if (isDisabledByTime) {
      alert(
        `Belum bisa submit. Mulai: ${formatWIB(selectedMatkul?.visible_time)}`,
      );
      return;
    }
    setOpenConfirm(true);
  };

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

    const start = parseTime(selectedMatkul.visible_time);
    if (start && new Date() < start) {
      alert(
        `Belum bisa submit. Mulai: ${formatWIB(selectedMatkul.visible_time)}`,
      );
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

      toast.success("Berhasil telah submit!", { autoClose: 2000 });

      setQuestion("");
      setSelectedAnswer("");
      setSource("");

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

      <form
        className="flex flex-col gap-4 sm:gap-5 h-full"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Subject */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Mata Kuliah (Required)
          </label>

          <div ref={dropdownRef} className="relative">
            {/* Search Input */}
            <div className="relative">
              <input
                value={subjectSearch}
                onChange={(e) => {
                  setSubjectSearch(e.target.value);
                  setOpenSubjectDropdown(true);
                }}
                onFocus={() => setOpenSubjectDropdown(true)}
                onKeyDown={onSubjectKeyDown}
                placeholder="Search mata kuliah..."
                className="w-full rounded-lg border px-4 py-3 text-sm sm:text-base transition-all
          border-gray-300 bg-white text-gray-900 placeholder:text-gray-400
          hover:border-blue-400
          dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400
          dark:hover:border-blue-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />

              {/* hint kecil */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-300">
                ESC
              </div>
            </div>

            {/* Dropdown */}
            {openSubjectDropdown && (
              <div
                className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-xl
          border-gray-200 dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Header kecil */}
                <div className="px-4 py-2 text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                  Hasil: {filteredSubjects.length}
                </div>

                <div className="max-h-80 overflow-auto">
                  {filteredSubjects.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                      Tidak ada mata kuliah yang cocok.
                    </div>
                  ) : (
                    filteredSubjects.map((v) => {
                      const now = new Date();
                      const start = parseTime(v.visible_time);
                      const end = parseTime(v.invisible_time);

                      const isOngoing =
                        !!start && !!end && now >= start && now < end;
                      const isNotStarted = !!start && now < start;

                      const status = isOngoing
                        ? {
                            text: "🟢 Sedang berlangsung",
                            cls: "text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/30",
                          }
                        : isNotStarted
                          ? {
                              text: "⏳ Belum mulai",
                              cls: "text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/30",
                            }
                          : null;

                      const startLabel = formatWIB(v.visible_time);
                      const endLabel = formatWIB(v.invisible_time);

                      const isSelected =
                        String(v.id) === String(selectedSubject);

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSubjectById(String(v.id));
                            setSubjectSearch(String(v.name ?? ""));
                            setOpenSubjectDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 transition-colors
                    hover:bg-blue-50 dark:hover:bg-gray-700/50
                    ${isSelected ? "bg-blue-50 dark:bg-gray-700/50" : "bg-transparent"}
                    border-b border-gray-100 dark:border-gray-700`}
                        >
                          {/* Row 1: Title + Badge (FIX: judul wrap + badge turun di mobile) */}
                          <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                            {/* Title: wrap (tidak truncate) */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white whitespace-normal break-words leading-snug">
                                {v.name}
                              </div>
                            </div>

                            {/* Badge: tidak makan ruang judul di mobile */}
                            {status && (
                              <span
                                className={`self-start sm:self-auto shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${status.cls}`}
                              >
                                {status.text}
                              </span>
                            )}
                          </div>

                          {/* Row 2: Times (clean grid) */}
                          <div className="mt-2 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                            <div className="font-semibold text-gray-500 dark:text-gray-300">
                              Dimulai
                            </div>
                            <div className="whitespace-normal break-words">
                              {startLabel}
                            </div>

                            <div className="font-semibold text-gray-500 dark:text-gray-300">
                              Berakhir
                            </div>
                            <div className="whitespace-normal break-words">
                              {endLabel}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info matkul terpilih */}
          {selectedMatkul?.visible_time && (
            <p
              className={`text-xs font-semibold ${
                isBeforeStart ? "text-red-600" : "text-green-600"
              }`}
            >
              Mulai: {formatWIB(selectedMatkul.visible_time)}
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
