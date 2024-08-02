import React, { useState, useEffect } from "react";
import "./output.css";
import "./input.css";
import Question from "./components/Question";
import { toast } from "react-toastify";
import { Analytics } from "@vercel/analytics/react";
import RadioAnswer from "./components/RadioAnswer";
import TableAnswer from "./components/TableAnswer";
import supabase from "./utils/supabase";
import "react-toastify/dist/ReactToastify.css";
import MatkulSelect from "./components/MatkulSelect";
import { AnswerData } from "./types/AnswerData";
import FloatingActionButton from "./components/FloatingActionButton";

function App() {
  const [question, setQuestion] = useState<string>("");
  const [data, setData] = useState<AnswerData[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedMatkul, setSelectedMatkul] = useState<number>(() => {
    const savedMatkul = localStorage.getItem("selectedMatkul");
    return savedMatkul ? parseInt(savedMatkul, 10) : 0;
  });
  const [source, setSource] = useState<string>("");
  const [selectedMatkulName, setSelectedMatkulName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleSelectedAnswerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedAnswer(e.target.value);
  };

  const handleSelectedMatkulChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedId = parseInt(e.target.value, 10);
    setSelectedMatkul(selectedId);
    setSelectedMatkulName(e.target.options[e.target.selectedIndex].text);
    setData([]);
    localStorage.setItem("selectedMatkul", selectedId.toString());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!handleRequiredField()) return;

    const formattedQuestion = formatText(question);

    try {
      await insertNewData(formattedQuestion, selectedAnswer, selectedMatkul);
      resetForm();
      toast.success("Berhasil tambah soal baru!");
    } catch (error) {
      console.error("Error inserting data:", error);
      setIsLoading(true);
    } finally {
      setIsLoading(false);
      await fetchData();
      scrollToTop();
    }
  };

  const fetchData = async () => {
    try {
      const { data: fetchedData, error } = await supabase
        .from("soal")
        .select("*")
        .eq("matkul_id", selectedMatkul)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(fetchedData || []);
    } catch (error) {
      console.log("failed to fetch data");
    }
  };

  const insertNewData = async (
    question: string,
    answer: string,
    matkul_id: number
  ) => {
    try {
      const { error } = await supabase
        .from("soal")
        .insert([{ question, answer, matkul_id, source }]);
      if (error) throw error;
      sendMessagesNewSoal();
    } catch (error) {
      console.error("Error inserting new data:", error);
      throw error;
    }
  };

  const formatText = (text: string) => {
    return text.replace(/\n/g, "<br>");
  };

  const sendMessagesNewSoal = () => {
    const channelB = supabase.channel(`room-${selectedMatkul}`);
    channelB.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channelB.send({
          type: "broadcast",
          event: "new-soal",
          payload: { message: "Ada soal baru nih!" },
        });
      }
    });

    return () => {
      supabase.removeChannel(channelB);
    };
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRequiredField = () => {
    let hasError = false;
    let message = "";

    if (selectedMatkul === 0) {
      message = "Pilih mata kuliah terlebih dahulu";
      hasError = true;
    } else if (question === "") {
      message = "Soal tidak boleh kosong";
      hasError = true;
    } else if (selectedAnswer === "") {
      message = "Pilih salah satu jawaban yang benar";
      hasError = true;
    }

    if (hasError) {
      toast.error(message);
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setQuestion("");
    setSelectedAnswer("");
    setSource("");
  };

  useEffect(() => {
    fetchData();
  }, [selectedMatkul]);

  return (
    <>
      <header className="w-full bg-dark-gray p-3">
        <h1 className="text-3xl font-bold text-white">
          DARI PADA CEK GAMBAR SATU-SATU MENDING COPY PASTE SINI SOAL-NYA
        </h1>

        <p className="text-orange-500 font-bold">
          Download Extention Absolute Enable Right Click & Copy dulu{" "}
          <a
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://chromewebstore.google.com/detail/absolute-enable-right-cli/jdocbkpgdakpekjlhemmfcncgdjeiika?hl=en"
          >
            di sini
          </a>
        </p>
      </header>
      <div className="min-h-screen  bg-dark-gray w-full p-5 sm:p-10 lg:p-5 flex flex-col">
        <div className="xl:flex lg:gap-5 h-full">
          <form
            className="w-full xl:w-1/2 flex flex-col gap-5"
            onSubmit={handleSubmit}
          >
            <div className="p-5 border rounded-md">
              <MatkulSelect
                selectedOption={selectedMatkul}
                setSelectedMatkulName={setSelectedMatkulName}
                onOptionChange={handleSelectedMatkulChange}
              />
            </div>
            <div className="border rounded-md p-5">
              <h1 className="text-4xl text-white font-bold mb-5">INPUT SOAL</h1>
              <div className="mb-6">
                <label
                  htmlFor="source"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Sumber / Pengirim{" "}
                  <span className="text-red-500 font-bold">(OPSIONAL)</span>
                </label>
                <input
                  type="text"
                  id="source"
                  value={source}
                  className="bg-gray-50 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Masukkan sumber, sertakan link jika ada"
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>

              <Question text={question} onTextChange={handleQuestionChange} />
              <RadioAnswer
                selectedOption={selectedAnswer}
                onOptionChange={handleSelectedAnswerChange}
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center justify-center w-full py-2.5 mt-5 text-lg font-medium text-center text-white ${
                  isLoading ? "bg-gray-500" : "bg-blue-700 hover:bg-blue-800"
                } rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900`}
              >
                {isLoading ? "Loading...." : "Kirim"}
              </button>
            </div>
          </form>

          <div className="w-full xl:w-1/2 flex-1">
            <TableAnswer
              data={data}
              setData={setData}
              matkul_id={selectedMatkul}
              matkul_name={selectedMatkulName}
            />
          </div>
        </div>

        <FloatingActionButton onClick={scrollToTop} />

        <Analytics />
      </div>
    </>
  );
}

export default App;
