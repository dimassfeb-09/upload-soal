import { useState } from "react";

interface OptionQuestionProps {
  text: string;
  onTextChange: (lines: string[]) => void;
  onClear: () => void;
}

const OptionQuestion: React.FC<OptionQuestionProps> = ({
  text,
  onTextChange,
  onClear,
}) => {
  const [lineCount, setLineCount] = useState<number>(
    text ? text.split("\n").length : 0
  );
  const [hasError, setHasError] = useState<boolean>(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const lines = newText.split("\n");
    const newLineCount = lines.length;

    if (newLineCount <= 4) {
      setLineCount(newLineCount);
      setHasError(false);
      onTextChange(lines);
    } else {
      setHasError(true);
    }
  };

  const handleClear = () => {
    setLineCount(0);
    setHasError(false);
    onClear();
  };

  const placeholderText = `Opsi A
Opsi B
Opsi C
Opsi D`;

  return (
    <div className="mt-5 text-sm text-white">
      <label htmlFor="editor" className="font-bold">
        Opsi Jawaban (ABCD)
        <span className="text-red-500"> {lineCount}/4</span>
      </label>
      <div className="w-full mt-2 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
        <div className="bg-white rounded-b-lg dark:bg-gray-700 rounded-md">
          <textarea
            id="editor"
            rows={4.5}
            className="rounded-md p-5 block w-full text-sm text-gray-800 bg-white border dark:bg-gray-700 focus:ring-0 dark:text-white dark:placeholder-gray-400"
            placeholder={placeholderText}
            value={text}
            onChange={handleTextChange}
          />
        </div>
      </div>
      {hasError && (
        <div className="mt-2 text-red-500">
          Maksimal 4 baris untuk opsi jawaban.
        </div>
      )}
      <div>
        {lineCount > 0 ? (
          <div
            onClick={handleClear}
            className="mt-2 text-blue-500 font-bold underline cursor-pointer"
          >
            Clear Options
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default OptionQuestion;
