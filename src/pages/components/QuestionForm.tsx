import { useEffect, useState } from "react";
import { MdEditDocument } from "react-icons/md";
import supabase from "../../utils/supabase";
import { useNavigate } from "react-router-dom";

interface QuestionFormProps {
  isDark: boolean;
}

export default function QuestionForm({ isDark }: QuestionFormProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State untuk form
  const [selectedSubject, setSelectedSubject] = useState('');
  const [source, setSource] = useState('');
  const [question, setQuestion] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matkul')
        .select('*')
        .eq('is_visible', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching subjects:', error);
        return;
      }

      setSubjects(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      alert('Pilih subject dulu!');
      return;
    }
    if (!question.trim() || !selectedAnswer) {
      alert('Lengkapi soal dan jawaban!');
      return;
    }

    try {
      setLoading(true);
      const formattedQuestion = question.replace(/\n/g, "<br>");

      const { error } = await supabase.from('soal').insert([
        {
          matkul_id: selectedSubject,
          source: source,
          question: formattedQuestion,
          answer: selectedAnswer,
        },
      ]);

      if (error) throw error;

      alert('Soal berhasil dikirim!');

      setQuestion('');
      setSelectedAnswer('');
      setSource('');
      setSelectedSubject('');

      const params = new URLSearchParams(location.search);
      params.set("matkul_id", selectedSubject.toString());
      navigate({ search: params.toString() }, { replace: true });
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim soal');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSubject = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSubject(value);

    const searchParams = new URLSearchParams(location.search);
    if (value) {
      searchParams.set("matkul_id", value);
    } else {
      searchParams.delete("matkul_id");
    }

    // Set page kembali ke 0
    searchParams.set("page", "0");

    // Update URL tanpa reload
    navigate(
      { pathname: location.pathname, search: searchParams.toString() },
      { replace: true }
    );
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6 flex flex-col h-full transition-colors duration-200`}>
      <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
          <MdEditDocument size={24} />
        </span>
        <h3 className={`text-lg font-bold leading-tight tracking-[-0.015em] ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Soal
        </h3>
      </div>

      <form 
          className="flex flex-col gap-5 h-full" 
          onSubmit={(e) => {
            e.preventDefault();
            const confirmSubmit = window.confirm("Apakah Anda yakin ingin mengirim soal ini?");
            if (confirmSubmit) {
              handleSubmit(e);
            }
          }}
        >
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Mata Kuliah (Required)
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={handleChangeSubject}
              className={`w-full appearance-none rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white hover:border-blue-500' : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400'} px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer`}
            >
              <option value={0}>Select a subject</option>
              {subjects.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Source */}
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sumber / Pengirim (Optional)
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Dr. Smith, Textbook Vol 2"
            className={`w-full rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 hover:border-blue-500' : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-400'} px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
          />
        </div>

        <div className="flex flex-col gap-2 grow">
          <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Konten Pertanyaan
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Write your question here..."
            className={`w-full flex-1 min-h-[140px] rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 hover:border-blue-500' : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-400'} px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-y`}
          />
        </div>

        {/* Answer Key */}
        <div className="flex flex-col gap-3 pt-2">
          <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Jawaban Benar
          </label>
          <div className="grid grid-cols-4 gap-3">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <label key={letter} className="cursor-pointer group relative">
                <input
                  type="radio"
                  name="answer_key"
                  value={letter}
                  checked={selectedAnswer === letter}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="peer sr-only"
                />
                <div className={`flex h-12 items-center justify-center rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-lg font-bold transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-600 shadow-sm hover:border-blue-400`}>
                  {letter}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-0 mt-auto">
          <button
            type="submit"
            className="group w-full h-12 flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <span>Kirim Soal</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <div className="text-center">
          <span
            onClick={() => {
              setSource('');
              setQuestion('');
              setSelectedAnswer('');
            }}
            className="text-red-600 dark:text-red-400 cursor-pointer hover:underline font-semibold"
          >
            Hapus Semua Field
          </span>
        </div>
      </form>
    </div>
  );
}
