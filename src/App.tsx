import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} newestOnTop />
    </>
  );
}

export default App;
