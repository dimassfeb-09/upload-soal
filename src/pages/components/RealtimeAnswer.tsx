import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdTableChart,
  MdArrowUpward,
  MdArrowDownward,
  MdRefresh,
  MdSearch,
  MdSmartToy,
  MdAutoAwesome,
  MdContentCopy,
} from "react-icons/md";
import supabase from "../../utils/supabase";
import { useSearchParams } from "react-router-dom";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Soal {
  id: number;
  question: string;
  answer: string;
  source: string;
  correct_counts: number;
  incorrect_counts: number;
  created_at: string;
}

export default function RealtimeAnswers() {
  const REFRESH_SECONDS = 5;
  const itemsPerPage = 10;

  const [searchParams, setSearchParams] = useSearchParams();
  const matkulId = searchParams.get("matkul_id");
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const [searchTerm, setSearchTerm] = useState("");
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshCountdown, setRefreshCountdown] = useState(REFRESH_SECONDS);

  const [matkulStatus, setMatkulStatus] = useState<
    "ok" | "hidden" | "noMatkul"
  >(!matkulId ? "noMatkul" : "ok");

  const isFetchingRef = useRef(false);

  // ref input search (untuk CTRL+F / CMD+F)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ref untuk akses nilai searchTerm terbaru di event handler
  const searchTermRef = useRef(searchTerm);
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  // ✅ helper toast
  const notify = {
    success: (msg: string) => toast.success(msg, { autoClose: 1500 }),
    info: (msg: string) => toast.info(msg, { autoClose: 1500 }),
    error: (msg: string) => toast.error(msg, { autoClose: 2000 }),
  };

  const fetchQuestions = async () => {
    if (!matkulId) {
      setMatkulStatus("noMatkul");
      setQuestions([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);

      const { data: matkulData, error: matkulError } = await supabase
        .from("matkul")
        .select("is_visible")
        .eq("id", parseInt(matkulId))
        .single();

      if (matkulError || !matkulData?.is_visible) {
        setQuestions([]);
        setTotal(0);
        setMatkulStatus("hidden");
        return;
      }

      setMatkulStatus("ok");

      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;

      let query = supabase
        .from("soal")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(start, end)
        .eq("matkul_id", parseInt(matkulId));

      if (searchTerm.trim()) {
        query = query.ilike("question", `%${searchTerm.trim()}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching questions:", error);
        return;
      }

      setQuestions(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // ✅ Vote Optimistic: langsung naikkan di UI, tanpa fetch ulang
  const vote = async (id: number, type: "correct" | "incorrect") => {
    notify.info(type === "correct" ? "Anda memberi vote Correct" : "Anda memberi vote Wrong");

    // Simpan snapshot untuk rollback
    const prev = questions.find((q) => q.id === id);
    if (!prev) return;

    // 1) Optimistic update UI
    setQuestions((curr) =>
      curr.map((q) => {
        if (q.id !== id) return q;
        if (type === "correct") {
          return { ...q, correct_counts: (q.correct_counts || 0) + 1 };
        }
        return { ...q, incorrect_counts: (q.incorrect_counts || 0) + 1 };
      }),
    );

    // 2) Update server
    try {
      // Ambil nilai terbaru dari server (optional). Tapi biar sederhana:
      // kita update berdasarkan nilai yang sudah ada di "prev" snapshot.
      const updates =
        type === "correct"
          ? { correct_counts: (prev.correct_counts || 0) + 1 }
          : { incorrect_counts: (prev.incorrect_counts || 0) + 1 };

      const { error } = await supabase.from("soal").update(updates).eq("id", id);
      if (error) throw error;

      // sukses: tidak perlu fetch ulang
      setRefreshCountdown(REFRESH_SECONDS);
    } catch (err) {
      console.error(err);

      // 3) rollback kalau gagal
      setQuestions((curr) =>
        curr.map((q) => {
          if (q.id !== id) return q;
          return prev; // balik ke snapshot
        }),
      );

      notify.error("Gagal mengirim vote");
    }
  };

  /** ===================== WEB-APP SAFE "ASK" + COPY ===================== */
  const htmlToPlainText = (html: string) => {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return (doc.body?.textContent || "").trim();
    } catch {
      return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
  };

  const copyPrompt = async (questionHtml: string) => {
    const text = htmlToPlainText(questionHtml);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      notify.success("Berhasil dicopy");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
        notify.success("Berhasil dicopy");
      } catch {
        notify.error("Gagal copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const askGoogle = (questionHtml: string) => {
    const qText = htmlToPlainText(questionHtml);
    if (!qText) return;
    notify.info("Membuka Google…");
    const url = `https://www.google.com/search?hl=id&q=${encodeURIComponent(qText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const askChatGPT = (questionHtml: string) => {
    const prompt = htmlToPlainText(questionHtml);
    if (!prompt) return;
    notify.info("Membuka ChatGPT…");
    const url = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const askGemini = async (questionHtml: string) => {
    await copyPrompt(questionHtml);
    notify.info("Membuka Gemini…");
    window.open("https://gemini.google.com/", "_blank", "noopener,noreferrer");
  };
  /** =================================================================== */

  /** ===================== CTRL/CMD+F: FOCUS + AUTO PASTE CLIPBOARD ===================== */
  const normalizeClipboardText = (t: string) => t.replace(/\s+/g, " ").trim();

  const focusAndSelectSearch = () => {
    searchInputRef.current?.focus();
    setTimeout(() => searchInputRef.current?.select(), 0);
  };

  const tryPasteClipboardReplaceSearch = async () => {
    if (!navigator.clipboard?.readText) return false;

    try {
      const text = normalizeClipboardText(await navigator.clipboard.readText());
      if (!text) return false;

      setSearchTerm(text);
      requestAnimationFrame(() => searchInputRef.current?.select());
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const isFind = (e.ctrlKey || e.metaKey) && key === "f";
      if (!isFind) return;

      e.preventDefault();
      focusAndSelectSearch();
      void tryPasteClipboardReplaceSearch();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  /** =================================================================== */

  useEffect(() => {
    fetchQuestions();
    setRefreshCountdown(REFRESH_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matkulId, page, searchTerm]);

  // Auto refresh (optional) - tetap aman walau vote optimistic
  useEffect(() => {
    let countdown = REFRESH_SECONDS;
    setRefreshCountdown(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setRefreshCountdown(countdown);

      if (countdown <= 0) {
        fetchQuestions();
        countdown = REFRESH_SECONDS;
        setRefreshCountdown(countdown);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matkulId, page, searchTerm]);

  const goToPage = (newPage: number) => {
    const safePage = Math.min(Math.max(newPage, 1), totalPages);
    const params: Record<string, string> = { page: String(safePage) };
    if (matkulId) params.matkul_id = matkulId;
    setSearchParams(params);
  };

  const pageItems = useMemo(() => {
    const maxButtons = 7;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const items: (number | "...")[] = [];
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);

    items.push(1);
    if (left > 2) items.push("...");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push("...");
    items.push(totalPages);

    return items;
  }, [page, totalPages]);

  const CardRow = ({ q }: { q: Soal }) => {
    const totalVotes = (q.correct_counts || 0) + (q.incorrect_counts || 0);
    const correctPct = totalVotes > 0 ? (q.correct_counts / totalVotes) * 100 : 0;
    const wrongPct = totalVotes > 0 ? (q.incorrect_counts / totalVotes) * 100 : 0;

    return (
      <div className="rounded-xl border p-4 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {q.answer}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">ID: {q.id}</span>
            </div>

            <div
              className="mt-2 text-sm text-gray-900 dark:text-gray-100 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: q.question }}
            />
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
            <div className="h-full bg-teal-500" style={{ width: `${correctPct}%` }} />
            <div className="h-full bg-red-500" style={{ width: `${wrongPct}%` }} />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-teal-500" />
                {q.correct_counts} Correct
              </span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-red-500" />
                {q.incorrect_counts} Wrong
              </span>
            </div>
            <span className="truncate max-w-[45%]">Sumber: {q.source || "-"}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 active:scale-[0.99] transition"
            onClick={() => vote(q.id, "correct")}
          >
            <MdArrowUpward /> Correct
          </button>
          <button
            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-[0.99] transition"
            onClick={() => vote(q.id, "incorrect")}
          >
            <MdArrowDownward /> Wrong
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => askGoogle(q.question)}
            title="Cari pertanyaan ini di Google"
          >
            <MdSearch /> Google
          </button>

          <button
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => askChatGPT(q.question)}
            title="Buka ChatGPT dengan prompt ini"
          >
            <MdSmartToy /> ChatGPT
          </button>

          <button
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => askGemini(q.question)}
            title="Buka Gemini (prompt akan dicopy dulu)"
          >
            <MdAutoAwesome /> Gemini
          </button>

          <button
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => copyPrompt(q.question)}
            title="Copy prompt"
          >
            <MdContentCopy /> Copy
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 flex flex-col overflow-hidden transition-colors duration-200 min-h-[420px]">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <span className="text-teal-600 bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
            <MdTableChart size={22} />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Monitor Jawaban
            </h3>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Auto refresh dalam {refreshCountdown} detik (tiap {REFRESH_SECONDS} detik)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari (CTRL + F / COMMAND + F)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[320px] md:w-[360px] lg:w-[420px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchTerm("");
                goToPage(1);
                setRefreshCountdown(REFRESH_SECONDS);
                notify.info("Pencarian dikosongkan");
              }}
              disabled={!searchTerm.trim() || loading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
              title="Kosongkan pencarian"
            >
              Clear
            </button>

            <button
              onClick={() => {
                fetchQuestions();
                setRefreshCountdown(REFRESH_SECONDS);
                notify.info("Data di-refresh");
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
              title="Refresh sekarang"
            >
              <MdRefresh size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Mobile cards */}
        <div className="block md:hidden p-3 sm:p-4 overflow-auto h-full">
          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <CardRow key={q.id} q={q} />
            ))}
          </div>
        </div>

        {/* Table (md+) */}
        <div className="hidden md:block h-full overflow-auto">
          <div className="min-w-[980px]">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-16">
                    ID
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-20">
                    Jawaban
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Pertanyaan
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-56">
                    Vote
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-64">
                    Action
                  </th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 w-56">
                    Sumber / Pengirim
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {questions.map((q) => {
                  const totalVotes = (q.correct_counts || 0) + (q.incorrect_counts || 0);
                  const correctPct = totalVotes > 0 ? (q.correct_counts / totalVotes) * 100 : 0;
                  const wrongPct = totalVotes > 0 ? (q.incorrect_counts / totalVotes) * 100 : 0;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 align-top">
                        {q.id}
                      </td>

                      <td className="py-4 px-6 align-top">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                          {q.answer}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white align-top break-words">
                        <div className="flex items-start gap-2">
                          <div
                            className="min-w-0 flex-1"
                            dangerouslySetInnerHTML={{ __html: q.question }}
                          />
                          <button
                            className="shrink-0 mt-0.5 p-2 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition"
                            onClick={() => copyPrompt(q.question)}
                            title="Copy pertanyaan"
                          >
                            <MdContentCopy />
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                              <div className="h-full bg-teal-500" style={{ width: `${correctPct}%` }} />
                              <div className="h-full bg-red-500" style={{ width: `${wrongPct}%` }} />
                            </div>
                            <div className="flex gap-3 text-[10px] mt-0.5 text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-teal-500" />
                                {q.correct_counts} Correct
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-red-500" />
                                {q.incorrect_counts} Wrong
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col lg:flex-row gap-2">
                            <button
                              className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                              onClick={() => vote(q.id, "correct")}
                            >
                              <MdArrowUpward /> Correct
                            </button>
                            <button
                              className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                              onClick={() => vote(q.id, "incorrect")}
                            >
                              <MdArrowDownward /> Wrong
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 align-top">
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
                            onClick={() => askGoogle(q.question)}
                            title="Cari pertanyaan ini di Google"
                          >
                            <MdSearch /> Google
                          </button>

                          <button
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
                            onClick={() => askChatGPT(q.question)}
                            title="Buka ChatGPT dengan prompt ini"
                          >
                            <MdSmartToy /> ChatGPT
                          </button>

                          <button
                            className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
                            onClick={() => askGemini(q.question)}
                            title="Buka Gemini (prompt akan dicopy dulu)"
                          >
                            <MdAutoAwesome /> Gemini (Copy & Open)
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-sm font-medium text-gray-600 dark:text-gray-400 align-top break-words">
                        {q.source || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {(matkulStatus === "hidden" || matkulStatus === "noMatkul") && (
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md flex items-center justify-center z-20 shadow-inner rounded-lg p-4">
            <span className="text-gray-700 dark:text-gray-200 font-semibold text-base sm:text-lg text-center leading-relaxed">
              {matkulStatus === "hidden"
                ? "Mata kuliah ini tidak tersedia atau disembunyikan."
                : "Silahkan pilih mata kuliah terlebih dahulu."}
            </span>
          </div>
        )}
      </div>

      {/* Footer pagination */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Menampilkan {(page - 1) * itemsPerPage + 1}-
          {Math.min(page * itemsPerPage, total)} dari {total} soal
        </span>

        <div className="flex gap-1 flex-wrap justify-center sm:justify-end">
          <button
            className="px-3 py-1 rounded-lg border text-sm border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
            disabled={page === 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>

          {pageItems.map((it, idx) =>
            it === "..." ? (
              <span
                key={`dots-${idx}`}
                className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400"
              >
                …
              </span>
            ) : (
              <button
                key={it}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  it === page
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => goToPage(it)}
              >
                {it}
              </button>
            ),
          )}

          <button
            className="px-3 py-1 rounded-lg border text-sm border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
