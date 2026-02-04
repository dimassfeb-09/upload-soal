import { useEffect, useMemo, useState } from "react";
import { MdEditDocument } from "react-icons/md";
import supabase from "../../utils/supabase";
import { useLocation, useNavigate } from "react-router-dom";

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

  // --- helper: format visible_time ke WIB untuk ditampilkan di option ---
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

  // --- ambil data matkul yang belum lewat invisible_time (atau invisible_time null) ---
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

  // --- cari matkul terpilih + cek apakah sudah mulai ---
  const selectedMatkul = useMemo(() => {
    return subjects.find((s) => String(s.id) === String(selectedSubject));
  }, [subjects, selectedSubject]);

  const now = useMemo(() => new Date(), []);
  const isBeforeStart = useMemo(() => {
    if (!selectedMatkul?.visible_time) return false; // kalau null, anggap boleh submit
    return new Date() < new Date(selectedMatkul.visible_time);
  }, [selectedMatkul]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      alert("Pilih subject dulu!");
      return;
    }

    // kalau matkulnya tidak ada di list (mis. sudah hidden), blok
    if (!selectedMatkul) {
      alert("Mata kuliah tidak tersedia / sudah tidak aktif.");
      return;
    }

    // blok submit kalau belum jam mulai
    if (selectedMatkul.visible_time && new Date() < new Date(selectedMatkul.visible_time)) {
      alert(`Belum bisa submit. Mulai: ${formatStartWIB(selectedMatkul.visible_time)}`);
      return;
    }

    if (!question.trim() || !selectedAnswer) {
      alert("Lengkapi soal dan jawaban!");
      return;
    }

    const subjectId = selectedSubject;

    try {
      const formattedQuestion = question.replace(/\n/g, "<br>");

      const { error } = await supabase.from("soal").insert([
        {
          matkul_id: subjectId,
          source,
          question: formattedQuestion,
          answer: selectedAnswer,
        },
      ]);

      if (error) throw error;

      alert("Soal berhasil dikirim!");

      setQuestion("");
      setSelectedAnswer("");
      setSource("");

      const params = new URLSearchParams(location.search);
      params.set("matkul_id", subjectId);
      params.set("page", "1");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim soal");
    }
  };

  const handleChangeSubject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSubject(value);

    if (value) localStorage.setItem("selected_matkul_id", value);
    else localStorage.removeItem("selected_matkul_id");

    const searchParams = new URLSearchParams(location.search);
    if (value) searchParams.set("matkul_id", value);
    else searchParams.delete("matkul_id");

    searchParams.set("page", "1");
    navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true });
  };

  return (
    <div className="rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-4 sm:p-6 flex flex-col transition-colors duration-200 min-h-[420px]">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <MdEditDocument size={22} />
        </span>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Soal</h3>
      </div>

      <form
        className="flex flex-col gap-4 sm:gap-5 h-full"
        onSubmit={(e) => {
          e.preventDefault();

          // cegah confirm kalau memang belum boleh submit
          if (selectedMatkul?.visible_time && new Date() < new Date(selectedMatkul.visible_time)) {
            alert(`Belum bisa submit. Mulai: ${formatStartWIB(selectedMatkul.visible_time)}`);
            return;
          }

          const confirmSubmit = window.confirm("Apakah Anda yakin ingin mengirim soal ini?");
          if (confirmSubmit) handleSubmit(e);
        }}
      >
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

              const isOngoing =
                !!start && !!end && now >= start && now < end; // sedang berlangsung

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

          {/* info tambahan (opsional, enak buat UX) */}
          {selectedMatkul?.visible_time && (
            <p className={`text-xs font-semibold ${isBeforeStart ? "text-red-600" : "text-green-600"}`}>
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
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write your question here..."
            className="w-full flex-1 min-h-[140px] rounded-lg border px-4 py-3 text-sm sm:text-base resize-y transition-all
              border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-400
              dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:hover:border-blue-500
              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
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
            type="submit"
            disabled={!!selectedMatkul?.visible_time && new Date() < new Date(selectedMatkul.visible_time)}
            className="group w-full h-12 flex items-center justify-center gap-2 rounded-lg
              bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base
              transition-all active:scale-[0.98]
              shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:active:scale-100"
          >
            <span>Kirim Soal</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
    </div>
  );
}