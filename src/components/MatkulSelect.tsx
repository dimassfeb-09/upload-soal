import React, { useState, useEffect } from 'react';
import supabase from './../utils/supabase';

interface MatkulSelectProps {
    selectedOption: number;
    setSelectedMatkulName: React.Dispatch<React.SetStateAction<string>>;
    onOptionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

interface MatkulData {
    id: number;
    name: string;
}

const MatkulSelect: React.FC<MatkulSelectProps> = ({ selectedOption, setSelectedMatkulName, onOptionChange }) => {
    const [matkulOptions, setMatkulOptions] = useState<MatkulData[]>([]);

    useEffect(() => {
        const fetchMatkulData = async () => {
            try {
                const { data: matkulData, error } = await supabase
                    .from('matkul')
                    .select('id, name');

                if (error) throw error;
                setMatkulOptions(matkulData || []);
            } catch (error) {
                console.error('Error fetching matkul data:', error);
            }
        };

        fetchMatkulData();
    }, []);

    useEffect(() => {
        const selectedMatkul = matkulOptions.find(matkul => matkul.id === selectedOption);
        if (selectedMatkul) {
            setSelectedMatkulName(selectedMatkul.name);
        }
    }, [selectedOption, matkulOptions, setSelectedMatkulName]);

    return (
        <div className="w-full">
            <label htmlFor="matkul" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white ">
                Pilih Matkul
            </label>
            <select
                id="matkul"
                value={selectedOption}
                onChange={onOptionChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-white dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
            >
                <option value={0}>Pilih Matkul</option>
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
