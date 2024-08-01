import React, { useState } from 'react';
import './output.css';
import './input.css';
import Question from './components/Question';
import { toast } from 'react-toastify';
import RadioAnswer from './components/RadioAnswer';
import TableAnswer from './components/TableAnswer';
import supabase from './utils/supabase';
import 'react-toastify/dist/ReactToastify.css';
import MatkulSelect from './components/MatkulSelect';
import { AnswerData } from './types/AnswerData';
import FloatingActionButton from './components/FloatingActionButton'; // Import the FAB component

function App() {
  const [question, setQuestion] = useState<string>('');
  const [data, setData] = useState<AnswerData[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [selectedMatkul, setSelectedMatkul] = useState<number>(0);
  const [source, setSource] = useState<string>('');
  const [selectedMatkulName, setSelectedMatkulName] = useState<string>('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(e.target.value);
  };

  const handleSelectedMatkulChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value, 10);
    setSelectedMatkul(selectedId);
    setSelectedMatkulName(e.target.options[e.target.selectedIndex].text);
    setData([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formattedQuestion = formatText(question);

    try {
      await insertNewData(formattedQuestion, selectedAnswer, selectedMatkul);
      setQuestion('');
      setSelectedAnswer('');
      setSource('');
      toast.success("Berhasil tambah soal baru!");
    } catch (error) {
      console.error('Error inserting data:', error);
    } finally {
      await fetchData();
      scrollToTop(); // Scroll to top after data is fetched
    }
  };

  const fetchData = async () => {
    try {
      const { data: fetchedData, error } = await supabase
        .from('soal')
        .select('*')
        .eq('matkul_id', selectedMatkul)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(fetchedData || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
  };

  const insertNewData = async (question: string, answer: string, matkul_id: number) => {
    try {
      question = formatText(question);
      const { error } = await supabase
        .from('soal')
        .insert([{ question, answer, matkul_id, source }]);
      SendMessagesNewSoal();
      if (error) throw error;
    } catch (error) {
      console.error('Error inserting new data:', error);
      throw error;
    }
  };

  const formatText = (text: string) => {
    return text.replace(/\n/g, '<br>');
  };

  const SendMessagesNewSoal = () => {
    // Join a room/topic. Can be anything except for 'realtime'.
    const channelB = supabase.channel(`room-${selectedMatkul}`)

    channelB.subscribe((status) => {
      // Wait for successful connection
      if (status !== 'SUBSCRIBED') {
        return null
      }

      // Send a message once the client is subscribed
      channelB.send({
        type: 'broadcast',
        event: 'new-soal',
        payload: { message: 'Ada soal baru nih!' },
      })
    })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-700 h-auto w-full p-5 sm:p-10 md:p-20">
      <h1 className='text-3xl font-bold text-white'>
        DARI PADA CEK GAMBAR SATU-SATU MENDING COPY PASTE SINI SOAL-NYA
      </h1>

      <div>
        <p className='text-orange-500 font-bold'>Download Extention Absolute Enable Right Click & Copy dulu <a className='text-blue-500 underline' target='_blank' href="https://chromewebstore.google.com/detail/absolute-enable-right-cli/jdocbkpgdakpekjlhemmfcncgdjeiika?hl=en">di sini</a>
        </p>
      </div>

      <form className='mt-5 border rounded-md p-10' onSubmit={handleSubmit}>

        <MatkulSelect
          selectedOption={selectedMatkul}
          setSelectedMatkulName={setSelectedMatkulName}
          onOptionChange={handleSelectedMatkulChange}
        />
        <h1 className='text-4xl text-white font-bold mt-10'>INPUT SOAL</h1>
        <div className='mt-5'>
          <label htmlFor="source" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Sumber (Coursehero/Vclass) <span className='text-red-500 font-bold'>(OPSIONAL)</span></label>
          <input
            type="text"
            id="source"
            className="bg-gray-50 border border-white text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-white dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Masukkan sumber, sertakan link jika ada"
            onChange={(e) => setSource(e.target.value)} />
        </div>
        <Question
          text={question}
          onTextChange={handleTextChange}
        />
        <RadioAnswer
          selectedOption={selectedAnswer}
          onOptionChange={handleOptionChange}
        />
        <button type="submit" className="inline-flex items-center px-5 py-2.5 mt-5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800">
          Kirim Broooooo Asiaaaap!!!
        </button>
      </form>

      <TableAnswer
        data={data}
        setData={setData}
        matkul_id={selectedMatkul}
        matkul_name={selectedMatkulName}
      />

      {/* Add the Floating Action Button */}
      <FloatingActionButton onClick={scrollToTop} />
    </div>
  );
}

export default App;
