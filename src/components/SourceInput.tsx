import React from "react";

interface SourceInputProps {
  source: string;
  onSourceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SourceInput: React.FC<SourceInputProps> = ({
  source,
  onSourceChange,
}) => {
  return (
    <div>
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
          onChange={onSourceChange}
        />
      </div>
    </div>
  );
};

export default SourceInput;
