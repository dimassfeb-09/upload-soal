// src/index.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import supabase from "./utils/supabase";

// Define a component to handle loading and setting logic
const AppWrapper: React.FC = () => {
  const [isWebsiteActive, setIsWebsiteActive] = useState<string | null>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("name", "is_website_active")
        .single();

      if (error) {
        console.error("Error fetching setting:", error);
        setIsWebsiteActive("false"); // default to 'false' if error occurs
      } else {
        setIsWebsiteActive(data?.value ?? "false");
      }
    };

    fetchSetting();
  }, []);

  if (isWebsiteActive === null) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <img
          src="loading.svg"
          alt="Loading"
          draggable={false}
          style={{ height: "100px", width: "100px" }}
        />
      </div>
    );
  }

  if (isWebsiteActive === "false") {
    return (
      <div className="flex flex-col text-5xl justify-center items-center h-screen w-full">
        <img
          src="error_404.svg"
          alt="Error 404"
          draggable={false}
          style={{ height: "700px", width: "700px" }}
        />
      </div>
    );
  }

  return (
    <Router>
      <App />
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
