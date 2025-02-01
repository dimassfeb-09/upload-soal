import React, { useState } from "react";
import supabase from "../utils/supabase";
import { toast } from "react-toastify";
import MatkulSelect from "./MatkulSelect";
import SubmitButton from "./SubmitButton";

interface FormUploadSoalProps {
  selectedMatkul: number;
  setSelectedMatkul: (value: number) => void;
  onSubmit: () => void;
}

interface FormFieldsUploadSoal {
  source: string;
  question: string;
  selectedAnswer: string;
}

export default function FormUploadSoal(props: FormUploadSoalProps) {
  const { onSubmit, selectedMatkul, setSelectedMatkul } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formFields, setFormFields] = useState<FormFieldsUploadSoal>({
    question: "",
    selectedAnswer: "",
    source: "",
  });

  const convertLineBreaksToHtml = (text: string) => {
    return text.replace(/\n/g, "<br>");
  };

  const clearFormFields = () => {
    setFormFields({
      question: "",
      selectedAnswer: "",
      source: "",
    });
  };

  const validateRequiredFields = () => {
    let hasError = false;
    let message = "";

    if (selectedMatkul === 0) {
      message = "Pilih mata kuliah terlebih dahulu";
      hasError = true;
    } else if (formFields.question === "") {
      message = "Soal tidak boleh kosong";
      hasError = true;
    } else if (formFields.selectedAnswer === "") {
      message = "Pilih salah satu jawaban yang benar";
      hasError = true;
    }

    if (hasError) {
      toast.error(message);
      return false;
    }

    return true;
  };

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
    } catch (error) {
      console.error("Error adding new question:", error);
      throw error;
    }
  };

  const submitQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateRequiredFields()) {
      setIsLoading(false);
      return;
    }

    const formattedQuestion = convertLineBreaksToHtml(formFields.question);

    try {
      await addNewQuestion(
        formattedQuestion,
        formFields.selectedAnswer,
        selectedMatkul,
        formFields.source
      );
      clearFormFields();
      toast.success("Berhasil tambah soal baru!");
    } catch (error) {
      toast.error("Gagal kirim soal, kirim ulang!");
    } finally {
      onSubmit();
      setIsLoading(false);
    }
  };

  const updateSelectedMatkul = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    setSelectedMatkul(selectedId);
  };

  return (
    <div>
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" text-xl">Lagi ngirim soal, bentar yaa...</div>
        </div>
      )}
      <form
        className={`w-full flex flex-col gap-5 ${
          isLoading ? "pointer-events-none opacity-50" : ""
        }`}
        onSubmit={submitQuestion}
      >
        <div className="p-5 border-2 rounded-md">
          <MatkulSelect
            selectedOption={selectedMatkul}
            onOptionChange={updateSelectedMatkul}
          />
        </div>

        <div className="border-2 p-5 rounded-md">
          <div className="mb-6">
            <label htmlFor="source" className="block mb-2 text-sm font-medium ">
              Sumber / Pengirim{" "}
              <span className="text-red-500 font-bold">(OPSIONAL)</span>
            </label>
            <input
              type="text"
              id="source"
              value={formFields.source}
              className="border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:placeholder-gray-400 dark: dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="Masukkan sumber, sertakan link jika ada"
              onChange={(e) =>
                setFormFields({ ...formFields, source: e.target.value })
              }
            />
          </div>
          <div className="mt-5 text-sm ">
            <label htmlFor="editor" className="font-bold">
              Soal
            </label>
            <div className="w-full mb-4 mt-2 border border-gray-200 rounded-lg   dark:border-gray-600">
              <div className="bg-white rounded-b-lg  rounded-md">
                <textarea
                  id="editor"
                  rows={4}
                  className="rounded-md p-5 block w-full text-sm text-gray-800 bg-white border  focus:ring-0 dark: dark:placeholder-gray-400"
                  placeholder="Paste di sini soalnya"
                  value={formFields.question}
                  onChange={(e) =>
                    setFormFields({ ...formFields, question: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <div>
            <h1 className=" font-bold text-sm">Pilih jawaban yang bener!</h1>
            <div className="border rounded-md p-5 mt-3 ">
              <div className="grid grid-cols-4 gap-4 ">
                {["A", "B", "C", "D"].map((option) => (
                  <div
                    key={option}
                    className="flex items-center ps-4 border border-gray-200 rounded"
                  >
                    <input
                      id={`bordered-radio-${option}`}
                      type="radio"
                      value={option}
                      name="bordered-radio"
                      className="w-4 h-4 text-blue-600  border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 "
                      checked={formFields.selectedAnswer === option}
                      onChange={(e) =>
                        setFormFields({
                          ...formFields,
                          selectedAnswer: e.target.value,
                        })
                      }
                    />
                    <label
                      htmlFor={`bordered-radio-${option}`}
                      className="w-full py-4 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SubmitButton isLoading={isLoading} />
        </div>
      </form>
    </div>
  );
}
