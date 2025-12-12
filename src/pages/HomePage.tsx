import { useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import QuestionForm from "./components/QuestionForm";
import RealtimeAnswers from "./components/RealtimeAnswer";

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="flex flex-col h-screen max-h-[95vh] p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isDark 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 border border-gray-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            {isDark ? (
              <>
                <MdLightMode size={20} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MdDarkMode size={20} />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 h-full">
          <div className="lg:col-span-3 h-full overflow-auto">
            <QuestionForm isDark={isDark} />
          </div>

          <div className="lg:col-span-9 flex flex-col h-full overflow-auto">
            <RealtimeAnswers isDark={isDark} />
          </div>
        </div>
      </div>
    </div>

  );
}