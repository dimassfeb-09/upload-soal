import React, { useState, useEffect, useCallback, useRef } from "react";
import supabase from "./../utils/supabase";
import { toast, Bounce, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AnswerData } from "../types/AnswerData";
import { RealtimeChannel } from "@supabase/supabase-js";
import BarCorrectChart from "./BarCorrectChart";
import Swal from "sweetalert2";
import containsBadWord from "../utils/badWords";

interface TableAnswerProps {
  data: AnswerData[];
  setData: React.Dispatch<React.SetStateAction<AnswerData[]>>;
  matkul_id: number;
  matkul_name: string;
}

type SoalData = {
  correct_counts: number;
  incorrect_counts: number;
};

const TableAnswer: React.FC<TableAnswerProps> = ({
  matkul_id,
  data,
  matkul_name,
  setData,
}) => {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);
  const inputSearchRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const voteChannelRef = useRef<RealtimeChannel | null>(null);

  const fetchAnswers = useCallback(async () => {
    try {
      const { data: fetchedData, error } = await supabase
        .from("soal")
        .select("*")
        .eq("matkul_id", matkul_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(fetchedData || []);
      setLastUpdated(new Date().toLocaleString());
      setDataUpdated(true);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to fetch data");
    }
  }, [matkul_id, setData]);

  const fetchAnswersAndNotifySuccess = useCallback(
    async (message: string) => {
      try {
        await fetchAnswers();
        toast.success(message);
        setDataUpdated(false);
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to fetch data");
      }
    },
    [fetchAnswers]
  );

  const createNewAnswerSubscription = useCallback(() => {
    const channel = supabase.channel(`room-${matkul_id}`);

    channel
      .on("broadcast", { event: "new-soal" }, () => {
        if (dataUpdated) {
          fetchAnswersAndNotifySuccess("Ada soal baru nih!");
        }
      })
      .subscribe();

    return channel;
  }, [matkul_id, fetchAnswersAndNotifySuccess, dataUpdated]);

  const createVoteSubscription = useCallback(() => {
    const channel = supabase.channel(`vote-room-${matkul_id}`);

    channel
      .on("broadcast", { event: "new-vote" }, (payload: any) => {
        toast.info(payload.message);
        fetchAnswers();
      })
      .subscribe();

    return channel;
  }, [matkul_id, fetchAnswers]);

  const broadcastNewVoteNotification = useCallback(() => {
    const channel = supabase.channel(`vote-room-${matkul_id}`);

    channel
      .send({
        type: "broadcast",
        event: "new-vote",
        payload: { message: "Ada vote baru nih!" },
      })
      .catch((error: any) => console.error("Failed to broadcast vote:", error));
  }, [matkul_id]);

  const handleVoteAnswer = async (isCorrect: boolean, soalId: number) => {
    try {
      const columnToUpdate: "correct_counts" | "incorrect_counts" = isCorrect
        ? "correct_counts"
        : "incorrect_counts";

      const { data, error: fetchError } = await supabase
        .from("soal")
        .select(columnToUpdate)
        .eq("id", soalId)
        .single();

      if (fetchError) throw fetchError;

      if (!data) throw new Error("Data not found");

      const currentCount = (data as SoalData)[columnToUpdate];

      if (typeof currentCount !== "number")
        throw new Error("Invalid data type for count");

      const newCount = currentCount + 1;

      const { error: updateError } = await supabase
        .from("soal")
        .update({ [columnToUpdate]: newCount })
        .eq("id", soalId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("Failed to record answer", error);
      toast.error("Failed to record answer");
    } finally {
      broadcastNewVoteNotification();
      toast.success(`Vote recorded for question ${soalId}!`);
    }
  };

  const confirmVoteAnswer = (isCorrect: boolean, soalId: number) => {
    Swal.fire({
      title: "CONFIRM?",
      text: "PASTIKAN SEBELUM MELAKUKAN VOTE, JANGAN ASAL.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        handleVoteAnswer(isCorrect, soalId);
      }
    });
  };

  useEffect(() => {
    if (matkul_id !== 0) {
      fetchAnswers();
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      subscriptionRef.current = createNewAnswerSubscription();

      if (voteChannelRef.current) {
        supabase.removeChannel(voteChannelRef.current);
      }
      voteChannelRef.current = createVoteSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (voteChannelRef.current) {
        supabase.removeChannel(voteChannelRef.current);
      }
    };
  }, [
    matkul_id,
    fetchAnswers,
    createNewAnswerSubscription,
    createVoteSubscription,
  ]);

  useEffect(() => {
    if (data.length > 0) {
      setHighlightedRow(0);
      const timer = setTimeout(() => setHighlightedRow(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  useEffect(() => {
    const handleKeyCTRLF = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        const input = inputSearchRef.current;
        if (input) {
          input.focus();
          input.setSelectionRange(0, input.value.length);
        }
      }
    };

    window.addEventListener("keydown", handleKeyCTRLF);
    return () => {
      window.removeEventListener("keydown", handleKeyCTRLF);
    };
  }, [searchQuery]);

  const handleSearchActive = () => {
    toast.info("Pencarian Aktif");
  };

  const filteredData = data.filter(
    (item) =>
      (item.question?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (item.answer?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.source?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-5 mt-5 border rounded-md xl:mt-0">
      <div className="text-3xl font-bold text-white">
        Real-Time Jawaban <span className="text-orange-500">{matkul_name}</span>
        <div className="mt-2 text-lg font-bold">
          Data otomatis update ketika terdapat data baru.
        </div>
      </div>

      <div className="mt-3 font-bold text-white">
        {lastUpdated && `Last Updated: ${lastUpdated}`}
      </div>

      <div className="flex items-center w-full h-10 pl-2 mt-3 bg-white border-2 rounded-lg input-section group group-focus-within:border-pink-700 group-focus-within:border-4">
        <div className="ml-2">🔍</div>
        <input
          type="text"
          ref={inputSearchRef}
          placeholder="Cari di sini. Dapat menggunakan CTRL+F atau ⌘+F"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-full px-2 ml-2 border-gray-500 rounded-lg outline-none caret-blue-700"
          aria-label="Search"
          onFocus={handleSearchActive}
          role="searchbox"
        />
        {searchQuery && (
          <div
            className="pr-2 text-xs cursor-pointer"
            onClick={() => setSearchQuery("")}
          >
            ❌
          </div>
        )}
      </div>

      <div className="flex-1 mt-5 overflow-x-auto overflow-y-auto hide-scrollbar">
        <div className="xl:h-[1em]">
          <table className="relative w-full text-sm text-left text-gray-500 border border-gray-300 rtl:text-right dark:text-gray-400 dark:border-gray-600">
            <thead className="sticky top-0 z-10 text-xs text-gray-700 uppercase border-b border-gray-300 bg-dark-gray dark:bg-dark-gray dark:text-gray-400 dark:border-gray-600">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 border-r border-gray-300 dark:border-gray-600"
                >
                  #
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 border-r border-gray-300 dark:border-gray-600"
                >
                  Jawaban
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 border-r border-gray-300 dark:border-gray-600"
                >
                  Soal
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b dark:border-gray-700 ${
                      highlightedRow === index
                        ? "bg-gray-200 dark:bg-gray-600"
                        : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-300 whitespace-nowrap dark:text-white dark:border-gray-600">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-center p-2 text-xs text-white bg-blue-600 rounded-full w-min h-min">
                          ID-{item.id}
                        </div>

                        <BarCorrectChart
                          correctCount={item.correct_counts || 0}
                          incorrectCount={item.incorrect_counts || 0}
                        />
                      </div>

                      <div className="mt-3">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "Date not available"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-4xl font-bold text-gray-900 border-r border-gray-300 whitespace-nowrap dark:text-white dark:border-gray-600">
                      <div className="text-center">
                        {item.answer || "No answer"}
                      </div>
                      <hr className="mt-5" />
                      <div className="flex flex-col items-center justify-center mt-2 text-sm">
                        <div>Vote</div>
                        <div className="flex gap-3 mt-2">
                          <button
                            className="px-2 py-1 bg-teal-500 border rounded-sm hover:bg-teal-700"
                            onClick={() => confirmVoteAnswer(true, item.id)}
                          >
                            Benar
                          </button>
                          <button
                            className="px-2 py-1 bg-red-500 border rounded-sm hover:opacity-50 hover:bg-red-700"
                            onClick={() => confirmVoteAnswer(false, item.id)}
                          >
                            Salah
                          </button>
                        </div>
                      </div>
                    </td>

                    <td
                      scope="row"
                      className="py-5 pl-5 font-medium text-gray-900 border-r border-gray-300 whitespace-nowrap dark:text-white dark:border-gray-600"
                    >
                      {(() => {
                        const result = containsBadWord(item.question || "");
                        return (
                          <>
                            <div
                              className="mt-5"
                              dangerouslySetInnerHTML={{
                                __html: result.cleanedText || "",
                              }}
                            />

                            <ul className="flex flex-col gap-3 mt-5 ">
                              {item.option && item.option.length > 0
                                ? item.option.map((v, index) => {
                                    const label = String.fromCharCode(
                                      65 + index
                                    );
                                    return (
                                      <li
                                        className={
                                          item.answer == label
                                            ? "bg-blue-600 w-min"
                                            : ""
                                        }
                                        key={index}
                                      >
                                        {label}. {v}
                                      </li>
                                    );
                                  })
                                : null}
                            </ul>

                            {item.source && (
                              <div className="mt-5">
                                Source:{" "}
                                <span className="text-blue-400">
                                  {item.source}
                                </span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
};

export default TableAnswer;
