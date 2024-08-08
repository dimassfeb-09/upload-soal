import React from "react";

interface RadioAnswerProps {
  optionQuestion: string[];
  selectedOption: string;
  onOptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioAnswer: React.FC<RadioAnswerProps> = ({
  optionQuestion,
  selectedOption,
  onOptionChange,
}) => {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div>
      <h1 className="text-white font-bold text-sm mt-5">
        Pilih jawaban yang bener!
      </h1>
      <div className="border rounded-md p-5 mt-3 bg-gray-700">
        <div className="grid grid-cols-4 gap-4">
          {optionLabels.map((label, index) => {
            const option = optionQuestion[index] || "";

            const isChecked = selectedOption === label;
            const backgroundColor = isChecked ? "bg-blue-500" : "bg-gray-700";
            const textColor = isChecked ? "text-white" : "text-gray-300";

            return (
              <div
                key={`${label}-${index}`}
                className={`flex items-center ps-4 border border-gray-200 rounded ${backgroundColor} ${textColor}`}
              >
                <input
                  id={`bordered-radio-${label}-${index}`}
                  type="radio"
                  value={label}
                  name="bordered-radio"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-dark-gray dark:border-gray-600"
                  checked={selectedOption === label}
                  onChange={onOptionChange}
                />
                <label
                  htmlFor={`bordered-radio-${label}-${index}`}
                  className="w-full py-4 ms-2 text-sm font-medium"
                >
                  {label}. {option || ""}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RadioAnswer;
