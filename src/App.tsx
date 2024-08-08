import React, { useState, useEffect, useCallback } from "react";
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
import SourceInput from "./components/SourceInput";
import SubmitButton from "./components/SubmitButton";
import { NewsItem } from "./types/NewsItem";
import OptionQuestion from "./components/OptionQuestion";

function App() {
  const [data, setData] = useState<AnswerData[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [option, setOption] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedMatkul, setSelectedMatkul] = useState<number>(0);
  const [source, setSource] = useState<string>("");
  const [selectedMatkulName, setSelectedMatkulName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from("news")
          .select("id, text, created_at");

        if (error) {
          throw error;
        }

        setNews(data || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchNews();
  }, []);

  const updateQuestionText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const updateSelectedAnswer = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(e.target.value);
  };

  const updateSelectedMatkul = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    setSelectedMatkul(selectedId);
    setSelectedMatkulName(e.target.options[e.target.selectedIndex].text);
    setData([]);
  };

  const submitQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateRequiredFields()) {
      setIsLoading(false);
      return;
    }

    const formattedQuestion = convertLineBreaksToHtml(question);

    try {
      await addNewQuestion(
        formattedQuestion,
        selectedAnswer,
        selectedMatkul,
        source
      );
      clearFormFields();
      toast.success("Berhasil tambah soal baru!");
    } catch (error) {
      toast.error("Gagal kirim soal, kirim ulang!");
    } finally {
      await loadAnswers();
      scrollToTopOfPage();
      setIsLoading(false);
    }
  };

  const loadAnswers = useCallback(async () => {
    try {
      const { data: fetchedData, error } = await supabase
        .from("soal")
        .select("*")
        .eq("matkul_id", selectedMatkul)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch answers: ${error.message}`);
      }

      setData(fetchedData || []);
    } catch (error) {
      console.error("Error fetching answers:", error);
      toast.error("Failed to load answers. Please try again.");
    }
  }, [selectedMatkul]);

  const addNewQuestion = async (
    question: string,
    answer: string,
    matkul_id: number,
    source?: string
  ) => {
    try {
      const { error } = await supabase
        .from("soal")
        .insert([{ question, answer, matkul_id, source, option }]);

      if (error) throw error;

      broadcastNewQuestionNotification();
    } catch (error) {
      console.error("Error adding new question:", error);
      throw error;
    }
  };

  const convertLineBreaksToHtml = (text: string) => {
    return text.replace(/\n/g, "<br>");
  };

  const broadcastNewQuestionNotification = () => {
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

  const scrollToTopOfPage = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateRequiredFields = () => {
    let hasError = false;
    let message = "";

    if (selectedMatkul === 0) {
      message = "Pilih mata kuliah terlebih dahulu";
      hasError = true;
    } else if (question === "") {
      message = "Soal tidak boleh kosong";
      hasError = true;
    } else if (option.length < 4) {
      message = `Anda baru memasukkan ${option.length} opsi. Masukkan ${
        4 - option.length
      } lagi.`;
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

  const clearOption = () => {
    setOption([]);
  };

  const clearFormFields = () => {
    setQuestion("");
    setSelectedAnswer("");
    setSource("");
    setOption([]);
  };

  useEffect(() => {
    if (selectedMatkul !== 0) {
      loadAnswers();
    }
  }, [selectedMatkul, loadAnswers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matkulParam = params.get("matkul_id");
    if (matkulParam) {
      const matkulId = parseInt(matkulParam, 10);
      setSelectedMatkul(matkulId);
      loadAnswers();
    }
  }, [loadAnswers]);

  return (
    <>
      <div className="min-h-screen bg-dark-gray w-full p-5 sm:p-10 lg:p-5 flex flex-col">
        {news.map((item) => (
          <div
            key={item.id}
            className="w-full px-5 py-3 bg-[#fff3cd] mb-5 rounded-md"
          >
            ❗{item.text}
          </div>
        ))}

        <div className="xl:flex lg:gap-5 h-full">
          <div className="relative w-full xl:w-1/2 flex flex-col gap-5">
            {isLoading && (
              <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="text-white text-xl">
                  Lagi ngirim soal, bentar yaa...
                </div>
              </div>
            )}
            <form
              className={`w-full flex flex-col gap-5 ${
                isLoading ? "pointer-events-none opacity-50" : ""
              }`}
              onSubmit={submitQuestion}
            >
              <div className="p-5 border rounded-md">
                <MatkulSelect
                  selectedOption={selectedMatkul}
                  setSelectedMatkulName={setSelectedMatkulName}
                  onOptionChange={updateSelectedMatkul}
                />
              </div>

              <div className="border p-5 rounded-md">
                <SourceInput
                  source={source}
                  onSourceChange={(e) => setSource(e.target.value)}
                />
                <Question text={question} onTextChange={updateQuestionText} />

                <OptionQuestion
                  text={option.join("\n")}
                  onTextChange={(lines) => setOption(lines)}
                  onClear={clearOption}
                />

                <RadioAnswer
                  optionQuestion={option}
                  selectedOption={selectedAnswer}
                  onOptionChange={updateSelectedAnswer}
                />

                <SubmitButton isLoading={isLoading} />
              </div>
            </form>
          </div>

          <div className="w-full xl:w-1/2 flex-1">
            <TableAnswer
              data={data}
              setData={setData}
              matkul_id={selectedMatkul}
              matkul_name={selectedMatkulName}
            />
          </div>
        </div>

        <FloatingActionButton onClick={scrollToTopOfPage} />

        <Analytics />
      </div>
    </>
  );
}

export default App;
