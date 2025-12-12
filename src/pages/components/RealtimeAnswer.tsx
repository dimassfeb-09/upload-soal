import { useEffect, useState } from "react";
import { MdTableChart } from "react-icons/md";
import supabase from "../../utils/supabase";
import { useSearchParams } from "react-router-dom";
import { MdArrowUpward, MdArrowDownward } from "react-icons/md";

interface Soal {
  id: number;
  question: string;
  answer: string;
  source: string;
  correct_counts: number;
  incorrect_counts: number;
  created_at: string;
}

export default function RealtimeAnswers({ isDark }: { isDark: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [refreshCountdown, setRefreshCountdown] = useState(15);
  const itemsPerPage = 10;

  const [searchParams, setSearchParams] = useSearchParams();
  const matkulId = searchParams.get("matkul_id");
  const page = Number(searchParams.get("page")) || 1; // ambil langsung dari URL

  const [matkulStatus, setMatkulStatus] = useState<"ok" | "hidden" | "noMatkul">(
    !matkulId ? "noMatkul" : "ok"
  );

  const fetchQuestions = async () => {
    if (!matkulId) {
      setMatkulStatus("noMatkul");
      setQuestions([]);
      setTotal(0);
      return;
    }

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
        setMatkulStatus(matkulError ? "hidden" : "hidden");
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
        query = query.ilike("question", `%${searchTerm}%`);
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
    }
  };

  const vote = async (id: number, type: "correct" | "incorrect") => {
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from("soal")
        .select("correct_counts, incorrect_counts")
        .eq("id", id)
        .single();

      if (fetchError) return;

      const updates: { correct_counts?: number; incorrect_counts?: number } = {};
      if (type === "correct") updates.correct_counts = (currentData?.correct_counts || 0) + 1;
      else updates.incorrect_counts = (currentData?.incorrect_counts || 0) + 1;

      const { error } = await supabase.from("soal").update(updates).eq("id", id);
      if (error) return;

      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  // fetchQuestions otomatis saat matkulId, page, atau searchTerm berubah
  useEffect(() => {
    fetchQuestions();

    let countdown = 15;
    setRefreshCountdown(countdown);

    const interval = setInterval(() => {
      countdown -= 1;
      setRefreshCountdown(countdown);
      if (countdown <= 0) {
        fetchQuestions();
        countdown = 15;
        setRefreshCountdown(countdown);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matkulId, page, searchTerm]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const goToPage = (newPage: number) => {
    const params: any = { page: String(newPage) };
    if (matkulId) params.matkul_id = matkulId;
    setSearchParams(params);
  };

  return (
    <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-xl shadow-lg border ${isDark ? "border-gray-700" : "border-gray-200"} flex flex-col h-full overflow-hidden transition-colors duration-200 relative`}>
      {/* Header */}
      <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className="text-teal-600 bg-teal-100 dark:bg-teal-900/30 p-2 rounded-lg">
            <MdTableChart size={24} />
          </span>
          <div>
            <h3 className={`text-lg font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>Monitor Jawaban</h3>
            <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Diperbarui dalam {refreshCountdown} detik</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="Cari pertanyaan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`px-3 py-2 rounded-lg border max-w-[500px] ${isDark ? "border-gray-600 bg-gray-700 text-white placeholder:text-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"}`}
          />
          <button
            onClick={() => fetchQuestions()}
            className={`px-4 py-2 rounded-lg border ${isDark ? "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"}`}
          >
            Cari
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className={`${isDark ? "bg-gray-900/50" : "bg-gray-50"} sticky top-0 z-10 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <tr>
              <th className={`py-4 px-6 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"} w-16`}>ID</th>
              <th className={`py-4 px-6 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"} w-20`}>Jawaban</th>
              <th className={`py-4 px-6 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>Pertanyaan</th>
              <th className={`py-4 px-6 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"} w-48`}>Vote</th>
              <th className={`py-4 px-6 text-xs font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"} w-48`}>Sumber / Pengirim</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
            {questions.map((q) => {
              const totalVotes = q.correct_counts + q.incorrect_counts;
              return (
                <tr key={q.id} className={`${isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} transition-colors group`}>
                  <td className={`py-4 px-6 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"} align-top`}>{q.id}</td>
                  <td className="py-4 px-6 align-top">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{q.answer}</span>
                  </td>
                  <td className={`py-4 px-6 text-sm ${isDark ? "text-white" : "text-gray-900"} align-top`} dangerouslySetInnerHTML={{ __html: q.question }} />
                  <td className="py-4 px-6 flex flex-col gap-1.5 w-full align-top">
                    <div className={`h-2 w-full rounded-full overflow-hidden flex ${isDark ? "bg-gray-700" : "bg-gray-200"}`}>
                      <div className="h-full bg-teal-500" style={{ width: `${totalVotes > 0 ? (q.correct_counts / totalVotes) * 100 : 0}%` }} />
                      <div className="h-full bg-red-500" style={{ width: `${totalVotes > 0 ? (q.incorrect_counts / totalVotes) * 100 : 0}%` }} />
                    </div>
                    <div className={`flex gap-3 text-[10px] mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-teal-500" />
                        {q.correct_counts} Correct
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-red-500" />
                        {q.incorrect_counts} Wrong
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 align-top flex flex-col gap-2">
                    <button
                      className="flex items-center gap-1 px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                      onClick={() => vote(q.id, "correct")}
                    >
                      <MdArrowUpward /> Correct
                    </button>
                    <button
                      className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      onClick={() => vote(q.id, "incorrect")}
                    >
                      <MdArrowDownward /> Wrong
                    </button>
                  </td>
                  <td className={`py-4 px-6 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"} align-top`}>{q.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

      {(matkulStatus === "hidden" || matkulStatus === "noMatkul") && (
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md flex items-center justify-center z-20 shadow-inner rounded-lg p-4">
          <span className="text-gray-700 dark:text-gray-200 font-semibold text-lg text-center leading-relaxed">
            {matkulStatus === "hidden"
              ? "Mata kuliah ini tidak tersedia atau disembunyikan."
              : "Silahkan pilih mata kuliah terlebih dahulu."}
          </span>
        </div>
      )}

      </div>

      {/* Footer pagination */}
      <div className={`p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"} flex flex-col sm:flex-row justify-between items-center gap-2`}>
        <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, total)} dari {total} soal
        </span>

        <div className="flex gap-1 flex-wrap">
          <button
            className={`px-3 py-1 rounded-lg border ${isDark ? "border-gray-600 hover:bg-gray-700 text-gray-400" : "border-gray-300 hover:bg-gray-100 text-gray-600"} disabled:opacity-50`}
            disabled={page === 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded-lg border ${i === page ? "bg-blue-500 text-white" : isDark ? "border-gray-600 text-gray-400 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
              onClick={() => goToPage(i)}
            >
              {i}
            </button>
          ))}

          <button
            className={`px-3 py-1 rounded-lg border ${isDark ? "border-gray-600 hover:bg-gray-700 text-gray-400" : "border-gray-300 hover:bg-gray-100 text-gray-600"} disabled:opacity-50`}
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
