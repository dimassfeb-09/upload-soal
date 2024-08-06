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
import containsBadWord from "./utils/badWords";

function App() {
  const [question, setQuestion] = useState<string>("");
  const [data, setData] = useState<AnswerData[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedMatkul, setSelectedMatkul] = useState<number>(0);
  const [source, setSource] = useState<string>("");
  const [selectedMatkulName, setSelectedMatkulName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

    if (containsBadWord(question)) {
      setIsLoading(false);
      toast.error("SPAM, JANGAN GUNAKAN KATA-KATA KOTOR. GUNAKAN DENGAN BIJAK, BODOH!");
      return;
    }

    const formattedQuestion = convertLineBreaksToHtml(question);

    try {
      await addNewQuestion(formattedQuestion, selectedAnswer, selectedMatkul);
      clearFormFields();
      toast.success("Berhasil tambah soal baru!");
    } catch (error) {
      toast.error("Gagal kirim soal, kirim ulang!");
      setIsLoading(false);
    } finally {
      await loadAnswers();
      scrollToTopOfPage();
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const loadAnswers = useCallback(async () => {
    console.log("hahahahahahha");
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
        .insert([{ question, answer, matkul_id, source }]);

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

  const clearFormFields = () => {
    setQuestion("");
    setSelectedAnswer("");
    setSource("");
  };

  useEffect(() => {
    console.log("execc 1");

    if (selectedMatkul !== 0) {
      loadAnswers();
    }
  }, [selectedMatkul, loadAnswers]);

  useEffect(() => {
    console.log("execc 2");
    const params = new URLSearchParams(window.location.search);
    const matkulParam = params.get("matkul_id");
    if (matkulParam) {
      const matkulId = parseInt(matkulParam, 10);
      setSelectedMatkul(matkulId);
      loadAnswers();
    }
  }, [loadAnswers]);

  useEffect(() => {
    console.log("execc 3");

    if (selectedMatkul !== 0) {
      loadAnswers();
    }
  }, [loadAnswers, selectedMatkul]);

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
      <div className="min-h-screen bg-dark-gray w-full p-5 sm:p-10 lg:p-5 flex flex-col">
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
                <RadioAnswer
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
