import React, { useState, useEffect, useCallback, useRef } from "react";
import supabase from "./../utils/supabase";
import { toast, Bounce, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { AnswerData } from "../types/AnswerData";
import BarCorrectChart from "./BarCorrectChart";

interface TableAnswerProps {
  data: AnswerData[];
  setData: React.Dispatch<React.SetStateAction<AnswerData[]>>;
  matkul_id: number;
  matkul_name: string;
}

interface VoteCount {
  correct: number;
  incorrect: number;
}

const TableAnswer: React.FC<TableAnswerProps> = ({
  matkul_id,
  data,
  matkul_name,
  setData,
}) => {
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [voteCounts, setVoteCounts] = useState<Record<number, VoteCount>>({});
  const [dataUpdated, setDataUpdated] = useState<boolean>(false);
  const [timeCloseToast, setTimeCloseToast] = useState<number>(500);

  const inputSearchRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
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
      console.log("Failed to fetch data");
    }
  }, [matkul_id, setData]);

  const fetchVoteCounts = async () => {
    try {
      const soalIds = data.map((item) => item.id);

      if (soalIds.length === 0) return;

      const { data: votes, error } = await supabase.rpc("get_vote_counts_v1", {
        soal_ids: soalIds,
      });

      if (error) throw error;

      const counts: Record<number, VoteCount> = {};

      votes?.forEach(
        (vote: { soal_id: number; count: number; is_correct: boolean }) => {
          const soalId =
            typeof vote.soal_id === "string"
              ? parseInt(vote.soal_id, 10)
              : vote.soal_id;
          const count =
            typeof vote.count === "string"
              ? parseInt(vote.count, 10)
              : vote.count;

          if (!counts[soalId]) {
            counts[soalId] = { correct: 0, incorrect: 0 };
          }
          if (vote.is_correct) {
            counts[soalId].correct = count;
          } else {
            counts[soalId].incorrect = count;
          }
        }
      );

      setVoteCounts(counts);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      console.log("Failed to fetch vote counts");
    }
  };

  const fetchAndSendSuccessMessage = useCallback(
    async (message: string) => {
      try {
        await fetchData();
        await fetchVoteCounts();
        toast.success(message);
        setDataUpdated(false);
      } catch (error) {
        console.log("Failed to fetch data");
      }
    },
    [fetchData, fetchVoteCounts]
  );

  useEffect(() => {
    if (matkul_id !== 0) {
      fetchData();
      listeningNewData();
    }
  }, [matkul_id]);

  const subscribeToNewData = useCallback(() => {
    console.log("execcc");

    const channel = supabase.channel(`room-${matkul_id}`);

    channel
      .on("broadcast", { event: "new-soal" }, () => {
        if (dataUpdated) {
          fetchAndSendSuccessMessage("Ada soal baru nih!");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matkul_id, fetchAndSendSuccessMessage, dataUpdated]);

  const subscribeToVote = useCallback(() => {
    const channel = supabase.channel(`room-${matkul_id}`);

    channel
      .on("broadcast", { event: "new-vote" }, (payload) => {
        fetchAndSendSuccessMessage(
          `Ada vote baru nih! ID-${payload.payload.soal_id}`
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matkul_id, fetchVoteCounts]);

  const clearSearchQuery = () => setSearchQuery("");

  useEffect(() => {
    if (matkul_id !== 0) {
      fetchData();
      const unsubscribeNewData = subscribeToNewData();
      const unsubscribeVote = subscribeToVote();
      return () => {
        unsubscribeNewData();
        unsubscribeVote();
      };
    }
  }, [matkul_id, fetchData, subscribeToNewData, subscribeToVote]);

  useEffect(() => {
    fetchVoteCounts();
  }, [data]);

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
        inputSearchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyCTRLF);
    return () => {
      window.removeEventListener("keydown", handleKeyCTRLF);
    };
  }, []);

  const handleSearchActive = () => {
    setTimeCloseToast(500);
    toast.info("Pencarian Aktif");
  };

  const handleAnswer = async (isCorrect: boolean, soalId: number) => {
    try {
      const { error } = await supabase
        .from("correct_answer")
        .insert([{ is_correct: isCorrect, soal_id: soalId }]);

      if (error) throw error;
      toast.success(`Vote recorded for question ${soalId}!`);
      await fetchVoteCounts();
      sendMessagesNewVote(soalId);
    } catch (error) {
      console.log("Failed to record answer");
    }
  };

  // Fetch data and send a success message
  const fetchAndSendingMessage = async () => {
    try {
      await fetchData();
    } catch (error) {
      console.log("Failed to fetch data");
    } finally {
      toast.success("Ada soal baru nih!");
    }
  };

  const confirmAnswer = (isCorrect: boolean, soalId: number) => {
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
        handleAnswer(isCorrect, soalId);
      }
    });
  };

  const listeningNewData = () => {
    const channel = supabase.channel(`room-${matkul_id}`);
    channel
      .on("broadcast", { event: "new-soal" }, () => fetchAndSendingMessage())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessagesNewVote = (soalId: number) => {
    const channel = supabase.channel(`room-${matkul_id}`);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "new-vote",
          payload: { message: "New vote received!", soal_id: soalId },
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="mt-5 xl:mt-0 border rounded-md p-5 h-full flex flex-col">
      <div className="text-3xl font-bold text-white">
        Real-Time Jawaban <span className="text-red-500">{matkul_name}</span>
        <div className="font-bold text-lg mt-2">
          Data automatically updates when new data is available.
        </div>
      </div>

      <div className="text-white font-bold mt-3">
        {lastUpdated && `Last Updated: ${lastUpdated}`}
      </div>

      <div className="input-section group flex items-center mt-3 pl-2 h-10 border-2 rounded-lg w-full bg-white group-focus-within:border-pink-700 group-focus-within:border-4">
        <div className="ml-2">🔍</div>
        <input
          type="text"
          ref={inputSearchRef}
          placeholder="Cari di sini. Dapat menggunakan CTRL+F atau ⌘+F"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-full ml-2 px-2 border-gray-500 rounded-lg outline-none caret-blue-700"
          aria-label="Search"
          onFocus={handleSearchActive}
          role="searchbox"
        />
        {searchQuery && (
          <div
            className="cursor-pointer text-xs pr-2"
            onClick={clearSearchQuery}
          >
            ❌
          </div>
        )}
      </div>

      <div className="flex-1 mt-5 overflow-x-auto overflow-y-auto hide-scrollbar">
        <div className="xl:h-[1em]">
          <table className="relative w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
            <thead className="sticky top-0 text-xs text-gray-700 uppercase bg-dark-gray dark:bg-dark-gray dark:text-gray-400 border-b border-gray-300 dark:border-gray-600 z-10">
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
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                      <div className="flex flex-col">
                        <div className="bg-blue-600 p-2 w-min h-min rounded-full text-xs text-white flex items-center justify-center">
                          ID-{item.id}
                        </div>

                        <BarCorrectChart
                          correctCount={voteCounts[item.id]?.correct || 0}
                          incorrectCount={voteCounts[item.id]?.incorrect || 0}
                        />
                      </div>

                      <div className="mt-3">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-4xl font-bold text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                      <div className="text-center">{item.answer}</div>
                      <hr className="mt-5" />
                      <div className="flex flex-col justify-center items-center text-sm mt-2">
                        <div>Vote</div>
                        <div className="flex gap-3 mt-2">
                          <button
                            className="bg-teal-500 px-2 py-1"
                            onClick={() => confirmAnswer(true, item.id)}
                          >
                            Benar
                          </button>
                          <button
                            className="bg-red-500 px-2 py-1"
                            onClick={() => confirmAnswer(false, item.id)}
                          >
                            Salah
                          </button>
                        </div>
                      </div>
                    </td>
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.question || "",
                        }}
                      />
                      {item.source && (
                        <div className="mt-5">
                          Source:{" "}
                          <span className="text-blue-400">{item.source}</span>
                        </div>
                      )}
                    </th>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={timeCloseToast}
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
