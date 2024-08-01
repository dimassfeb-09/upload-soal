import React from 'react';

interface QuestionProps {
    text: string;
    onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const Question: React.FC<QuestionProps> = ({ text, onTextChange }) => {
    return (
        <div className='mt-5 text-sm text-white'>
            <label htmlFor="editor" className='font-bold'>Soal beserta Opsinya (ABCD)</label>
            <div className="w-full mb-4 mt-2 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <div className="bg-white rounded-b-lg dark:bg-gray-800 rounded-md">
                    <textarea
                        id="editor"
                        rows={8}
                        className="rounded-md p-5 block w-full text-sm text-gray-800 bg-white border-0 dark:bg-gray-800 focus:ring-0 dark:text-white dark:placeholder-gray-400"
                        placeholder="Paste di sini soalnya"
                        required
                        value={text}
                        onChange={onTextChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Question;
