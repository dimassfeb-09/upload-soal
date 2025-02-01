import React from "react";

interface QuestionProps {
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Question: React.FC<QuestionProps> = ({ text, onTextChange }) => {
  return (
    <div className="mt-5 text-sm ">
      <label htmlFor="editor" className="font-bold">
        Soal
      </label>
      <div className="w-full mb-4 mt-2 border rounded-lg  ">
        <div className="rounded-b-lg  rounded-md">
          <textarea
            id="editor"
            rows={4}
            className="rounded-md p-5 block w-full text-sm border  focus:ring-0"
            placeholder="Paste di sini soalnya"
            value={text}
            onChange={onTextChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Question;
