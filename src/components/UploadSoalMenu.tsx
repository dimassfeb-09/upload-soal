import { useCallback, useEffect, useState } from "react";
import { AnswerData } from "../types/AnswerData";
import TableAnswer from "./TableAnswer";
import supabase from "../utils/supabase";
import { toast } from "react-toastify";
import FormUploadSoal from "./FormUploadSoal";

export default function UploadSoalMenu() {
  const [selectedMatkul, setSelectedMatkul] = useState<number>(0);

  const [answerData, setAnswerData] = useState<AnswerData[]>([]);

  const loadAnswers = useCallback(async () => {
    if (!selectedMatkul) return; // Hindari pemanggilan jika selectedMatkul tidak valid

    try {
      const { data, error } = await supabase
        .from("soal")
        .select("*")
        .eq("matkul_id", selectedMatkul)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      setAnswerData(data || []);
    } catch (error) {
      console.error("Error fetching answers:", error);
      toast.error("Failed to load answers. Please try again.");
    }
  }, [selectedMatkul]);

  useEffect(() => {
    loadAnswers();
  }, [loadAnswers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matkulParam = params.get("matkul_id");
    if (matkulParam) {
      const matkulId = parseInt(matkulParam, 10);
      setSelectedMatkul(matkulId);
      loadAnswers();
    }
  }, [loadAnswers]);

  useEffect(() => {
    if (selectedMatkul !== 0) {
      loadAnswers();
    }
  }, [loadAnswers, selectedMatkul]);

  const broadcastNewVoteNotification = useCallback(() => {
    const channel = supabase.channel(`vote-room-${selectedMatkul}`);

    channel
      .send({
        type: "broadcast",
        event: "new-vote",
        payload: { message: "Ada vote baru nih!" },
      })
      .catch((error: any) => console.error("Failed to broadcast vote:", error));
  }, [selectedMatkul]);

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

  const onSubmitForm = () => {
    broadcastNewVoteNotification();
    broadcastNewQuestionNotification();
    loadAnswers();
  };

  return (
    <div className="xl:flex lg:gap-5 h-full mt-5 bg-white dark:bg-dark-gray">
      <div className="relative w-full xl:w-1/2 flex flex-col gap-5">
        <FormUploadSoal
          selectedMatkul={selectedMatkul}
          setSelectedMatkul={setSelectedMatkul}
          onSubmit={onSubmitForm}
        />
      </div>

      <div className="w-full xl:w-1/2 flex-1 bg-white dark:bg-dark-gray">
        <TableAnswer
          data={answerData}
          setData={setAnswerData}
          matkul_id={selectedMatkul}
        />
      </div>
    </div>
  );
}
