import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./../utils/supabase";

interface MatkulSelectProps {
  selectedOption: number;
  onOptionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface MatkulData {
  id: number;
  name: string;
}

const MatkulSelect: React.FC<MatkulSelectProps> = ({
  selectedOption,
  onOptionChange,
}) => {
  const [matkulOptions, setMatkulOptions] = useState<MatkulData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatkulData = async () => {
      try {
        const { data: matkulData, error } = await supabase
          .from("matkul")
          .select("id, name")
          .eq("is_visible", true);

        if (error) throw error;
        setMatkulOptions(matkulData || []);
      } catch (error) {
        console.error("Error fetching matkul data:", error);
      }
    };

    fetchMatkulData();
  }, []);

  useEffect(() => {
    const selectedMatkul = matkulOptions.find(
      (matkul) => matkul.id === selectedOption
    );
    if (selectedMatkul) {
      navigate(`?matkul_id=${selectedOption}`);
    }
  }, [selectedOption, matkulOptions, navigate]);

  return (
    <div className="w-full">
      <label htmlFor="matkul" className="block mb-2 text-sm font-medium ">
        Pilih Mata Kuliah <span className="text-red-500">*WAJIB</span>
      </label>
      <select
        id="matkul"
        value={selectedOption}
        onChange={onOptionChange}
        className="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:border-white dark:placeholder-gray-400 dark: dark:focus:ring-blue-500 dark:focus:border-blue-500"
        required
      >
        <option value={0}>Pilih Mata Kuliah Dulu</option>
        {matkulOptions.map((matkul) => (
          <option key={matkul.id} value={matkul.id}>
            {matkul.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MatkulSelect;
