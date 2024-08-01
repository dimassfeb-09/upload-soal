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

    const clearSearchQuery = () => {
        setSearchQuery('');
    }

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
        (item.question?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.answer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.source?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="mt-5 xl:mt-0 border rounded-md p-5 h-full flex flex-col">
            <div className="text-3xl font-bold text-white">
                Real-Time Jawaban <span className='text-red-500'>{matkul_name}</span>
                <div className="text-orange-500 font-bold mt-2">
                    Data otomatis terupdate ketika ada data baru.
                </div>
            </div>

            <div className='text-white font-bold mt-3'>{lastUpdated !== '' ? `Last Updated: ${lastUpdated}` : ''}</div>
            <div className="flex items-center mt-3 px-2 h-10 border rounded-md w-full bg-white">
                <div className='ml-2'>🔍</div>
                <input
                    type="text"
                    placeholder="Search here or use CTRL + F"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full ml-5 px-2 border-none focus:border-none"
                    aria-label="Search"
                    role="searchbox"
                />
                {
                    searchQuery ? <div className='mr-2 cursor-pointer' onClick={clearSearchQuery}>X</div> : null
                }
            </div>

            <div className="flex-1 mt-5 overflow-x-auto overflow-y-auto hide-scrollbar">
                <div className='xl:h-[1em]'>
                    <table className="relative w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                        <thead className="sticky top-0 text-xs text-gray-700 uppercase bg-dark-gray dark:bg-dark-gray dark:text-gray-400 border-b border-gray-300 dark:border-gray-600 z-10">
                            <tr>
                                <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                                    #
                                </th>
                                <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                                    Jawaban
                                </th>
                                <th scope="col" className="px-6 py-3 border-r border-gray-300 dark:border-gray-600">
                                    Soal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
                                            <div className='bg-blue-600 p-1 w-min h-min rounded-full text-xs'>{item.id}</div>
                                            <div className='mt-3'>{new Date(item.created_at).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-2xl font-bold text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                                            {item.answer}
                                        </td>
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white border-r border-gray-300 dark:border-gray-600">
                                            <div dangerouslySetInnerHTML={{ __html: item.question || '' }} />
                                            <div className='mt-5'>
                                                {item.source !== '' && (
                                                    <>
                                                        Sumber <span className='text-blue-400'>{item.source}</span>
                                                    </>
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>




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
