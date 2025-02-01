import { useState } from "react";
import "./output.css";
import "./input.css";
import { ToastContainer, Bounce } from "react-toastify";
import { Analytics } from "@vercel/analytics/react";
import "react-toastify/dist/ReactToastify.css";
import FloatingActionButton from "./components/FloatingActionButton";
import AskAIMenu from "./components/AskAIMenu";
import Header from "./components/Header";
import SelectMenu from "./components/SelectMenu";
import UploadSoalMenu from "./components/UploadSoalMenu";

function App() {
  const [selectedMenu, setSelectedMenu] = useState<string>("soal");

  return (
    <div className="bg-white text-black dark:bg-dark-gray dark:text-white">
      <Header />

      <div className="h-[53rem] w-full p-5 sm:p-10 lg:p-5 flex flex-col">
        <SelectMenu
          selectedMenu={selectedMenu}
          setSelectedMenu={setSelectedMenu}
        />

        {selectedMenu == "soal" && <UploadSoalMenu />}

        {selectedMenu == "ask_ai" && <AskAIMenu />}

        <FloatingActionButton />

        <Analytics />

        <ToastContainer
          position="top-right"
          autoClose={1200}
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
    </div>
  );
}

export default App;
