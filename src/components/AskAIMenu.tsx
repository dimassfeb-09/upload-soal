import { useState, useEffect, useRef } from "react";
import { ModelsGroq } from "../types/ModelsGroq";
import axios from "axios";
import { toast } from "react-toastify";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
}

const AskAIMenu = () => {
  const [isSettingHidden, setIsSettingHidden] = useState<boolean>(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const [apiKey, setApiKey] = useState<string>("");
  const [optionModelsGroq, setOptionModelsGroq] = useState<ModelsGroq[]>([]);
  const [selectedModels, setSelectedModels] = useState<string>(
    "llama-3.3-70b-versatile"
  );
  const [loadingAskGroq, setLoadingAskGroq] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    const newMessage: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
    };

    setMessages([...messages, newMessage]);
    setInput("");
    askGroq(input);
  };

  const handleKeyPress = (event: any) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const askGroq = async (message: string): Promise<void> => {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    setLoadingAskGroq(true);
    try {
      const response = await axios.post(
        url,
        {
          model: selectedModels,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const formattedMessage = content
        .replace(/\n/g, "<br />")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

      // Set AI response to state

      // Add bot response to messages
      const botMessage: Message = {
        id: Date.now(),
        text: formattedMessage,
        sender: "bot",
      };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, botMessage];
        localStorage.setItem("messages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    } catch (e) {
      toast.error("Gagal mendapatkan jawaban AI");

      // Add fallback bot message to messages
      const botMessage: Message = {
        id: Date.now(),
        text: "Gagal mendapatkan jawaban AI",
        sender: "bot",
      };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, botMessage];
        localStorage.setItem("messages", JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    } finally {
      setLoadingAskGroq(false); // stop loading state after receiving response
    }
  };

  const fetchModelsGroq = async () => {
    if (!apiKey) return; // Only fetch models if API Key is provided

    const url = "https://api.groq.com/openai/v1/models";

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      const activeModels = response.data.data.filter(
        (model: ModelsGroq) => model.active !== false
      );
      setOptionModelsGroq(activeModels);
    } catch (e: any) {
      if (e.response.data.error.code == "invalid_api_key") {
        return toast.error(
          "API key tidak valid, coba generate atau cek kembali"
        );
      }

      toast.error("Gagal mendapatkan models");
    }
  };

  const handleSetApiKey = (apiKey: string) => {
    setApiKey(apiKey);
    localStorage.setItem("api_key_groq", apiKey);
  };

  useEffect(() => {
    const apiKey = localStorage.getItem("api_key_groq");
    if (apiKey) {
      setApiKey(apiKey);
    }

    const messages = localStorage.getItem("messages");
    if (messages) {
      const messagesList = JSON.parse(messages);
      setMessages(messagesList);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      fetchModelsGroq();
    }
  }, [apiKey]);

  return (
    <div className="flex flex-col items-center mt-4 ">
      <div className="w-full h-[46rem] bg-white dark:bg-dark-gray border  shadow-xl rounded-lg overflow-hidden">
        <div className="p-4 flex flex-col h-full justify-between">
          <div
            className="cursor-pointer bg-blue-500 mb-3 px-5 py-1 flex items-center gap-5 w-max"
            onClick={() => setIsSettingHidden(!isSettingHidden)}
          >
            {!isSettingHidden ? "Show Setting" : "Hidden Setting"}
          </div>
          {isSettingHidden && (
            <div className="flex flex-col border-b mb-2 md:flex-row gap-3">
              <div className="w-full md:w-3/4">
                <label htmlFor="apiKey" className="block text-sm font-medium">
                  API Key:
                </label>
                <input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => handleSetApiKey(e.target.value)}
                  className="text-gray-500 mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your API key"
                />

                <p className="text-sm text-red-500">
                  Untuk menggunakan AI, masukkan API Key yang dapat Anda buat di{" "}
                  <a
                    className="text-blue-500"
                    href="https://console.groq.com/keys"
                  >
                    https://console.groq.com/keys
                  </a>
                  .
                </p>
              </div>

              {/* Dropdown Model Selection */}
              <div className="w-full mb-4 md:w-1/4">
                <label
                  htmlFor="modelSelect"
                  className="block text-sm font-medium"
                >
                  Select Model:
                </label>
                <select
                  id="modelSelect"
                  value={selectedModels}
                  onChange={(e) => setSelectedModels(e.target.value)}
                  className="mt-1 text-gray-500 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!apiKey} // Disable the model select until API Key is provided
                >
                  {optionModelsGroq.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.id} - {model.owned_by}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[35rem] mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-xs ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  {/* Use dangerouslySetInnerHTML for bot */}
                  {message.sender === "bot" ? (
                    <p dangerouslySetInnerHTML={{ __html: message.text }} />
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {/* Reference to scroll to the bottom */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex mt-4">
            <textarea
              value={input}
              onKeyPress={handleKeyPress} // Detect Enter key press
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 w-[90%] p-2 border text-gray-500 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              disabled={!apiKey} // Disable input until API Key is provided
              cols={10} // Set max columns to 10
            />

            <button
              onClick={handleSendMessage}
              className="ml-2 p-2 w-[7rem] text-white bg-blue-500  rounded-lg hover:bg-blue-600"
              disabled={!apiKey} // Disable button until API Key is provided
            >
              {loadingAskGroq ? "Loading..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskAIMenu;
