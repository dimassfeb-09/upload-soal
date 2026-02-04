import { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import QuestionForm from "./components/QuestionForm";
import RealtimeAnswers from "./components/RealtimeAnswer";

export default function HomePage() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    // ✅ toggle class dark di <html>
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="min-h-dvh bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-10 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Untuk dapat copy-paste soal, kamu dapat gunakan ekstensi ini:{" "}
            <a
              href="https://chrome.google.com/webstore/detail/enable-right-click-allow/mlloloooolpffjkjaclpfpeednngpjon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Enable Right Click & Allow Copy
            </a>
          </div>

          <button
            onClick={() => setIsDark((v) => !v)}
            className="
              flex items-center justify-center gap-2
              w-full sm:w-auto px-4 py-2 rounded-lg font-medium
              transition-all border shadow-sm
              bg-white text-gray-700 border-gray-200 hover:bg-gray-50
              dark:bg-gray-800 dark:text-yellow-400 dark:border-gray-700 dark:hover:bg-gray-700
            "
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

        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12 min-h-[calc(100dvh-140px)]">
          <div className="lg:col-span-4 xl:col-span-3">
            <QuestionForm />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <RealtimeAnswers />
          </div>
        </div>
      </div>
    </div>
  );
}