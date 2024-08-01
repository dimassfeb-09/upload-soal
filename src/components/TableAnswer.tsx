import React, { useState, useEffect } from 'react';
import supabase from './../utils/supabase';
import { toast, Bounce, ToastContainer } from 'react-toastify';
import { AnswerData } from '../types/AnswerData';

interface TableAnswerProps {
    data: AnswerData[];
    setData: React.Dispatch<React.SetStateAction<AnswerData[]>>;
    matkul_id: number;
    matkul_name: string;
}

const TableAnswer: React.FC<TableAnswerProps> = ({ matkul_id, data, matkul_name, setData }) => {
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Fetch data from Supabase
    const fetchData = async () => {
        try {
            const { data: fetchedData, error } = await supabase
                .from('soal')
                .select('*')
                .eq('matkul_id', matkul_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setData(fetchedData || []);
            setLastUpdated(new Date().toLocaleString());
        } catch (error) {
            toast.error('Failed to fetch data');
        }
    };

    // Fetch data and send a success message
    const fetchAndSendingMessage = async () => {
        try {
            await fetchData();
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            toast.success('Ada soal baru nih!');
        }
    };

    // Set up real-time subscription
    const listeningNewData = () => {
        const channel = supabase.channel(`room-${matkul_id}`);
        channel
            .on('broadcast', { event: 'new-soal' }, () => fetchAndSendingMessage())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    useEffect(() => {
        if (matkul_id !== 0) {
            fetchData();
            listeningNewData();
        }
    }, [matkul_id]);

    useEffect(() => {
        if (data.length > 0) {
            const highlightIndex = 0;
            setHighlightedRow(highlightIndex);

            const timer = setTimeout(() => {
                setHighlightedRow(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [data]);

    const filteredData = data.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative overflow-x-auto mt-20 border rounded-md p-5">
            <div className="text-3xl font-bold text-white">
                JAWABAN REALTIME MATKUL: {matkul_name} <div className="text-orange-500 font-bold">
                    Otomatis update ketika ada data baru!!!
                </div>
            </div>

            <div className='text-white font-bold'>{lastUpdated != '' ? `Terakhir Update: ${lastUpdated}` : ''}</div>

            <input
                type="text"
                placeholder="Bisa search di sini atau CTRL + F"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-3 p-2 border rounded-md w-full"
            />

            <table className="w-full mt-5 text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                    <tr>
                        <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                            Jawaban
                            <p className="text-orange-500 font-bold">belum tentu bener, dicek dulu ya!</p>
                        </th>
                        <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                            Soal
                            <p className="text-orange-500">terbaru paling atas</p>
                        </th>

                        <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                            Sumber
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Dikirim pada
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                Data is Empty
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((item, index) => (
                            <tr
                                key={item.id}
                                className={`border-b dark:border-gray-700 ${highlightedRow === index
                                    ? 'bg-gray-200 dark:bg-gray-600'
                                    : 'bg-white dark:bg-gray-800'
                                    }`}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                                    {item.answer}
                                </td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                                    <div dangerouslySetInnerHTML={{ __html: item.question }} />
                                </th>
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                                    {item.source}
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(item.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <ToastContainer
                position="top-right"
                autoClose={5000}
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
