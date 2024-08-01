import React from 'react';

interface RadioAnswerProps {
    selectedOption: string;
    onOptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const RadioAnswer: React.FC<RadioAnswerProps> = ({ selectedOption, onOptionChange }) => {
    return (
        <div>
            <h1 className='text-white font-bold text-sm'>Pilih jawaban yang bener!</h1>
            <div className='border rounded-md p-5 mt-3 bg-gray-700'>
                <div className='grid grid-cols-4 gap-4 '>
                    {['A', 'B', 'C', 'D'].map(option => (
                        <div key={option} className="flex items-center ps-4 border border-gray-200 rounded">
                            <input
                                id={`bordered-radio-${option}`}
                                type="radio"
                                value={option}
                                name="bordered-radio"
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-dark-gray dark:border-gray-600"
                                checked={selectedOption === option}
                                onChange={onOptionChange}
                            />
                            <label htmlFor={`bordered-radio-${option}`} className="w-full py-4 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                {option}
                            </label>
                        </div>
                    ))}
                </div>
            </div></div>
    );
};

export default RadioAnswer;
