import React from "react";

interface SubmitButtonProps {
  isLoading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isLoading }) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`inline-flex items-center justify-center w-full py-2.5 mt-5 text-lg font-medium text-center  ${
        isLoading
          ? "bg-gray-500 opacity-70 cursor-not-allowed"
          : "bg-blue-700 hover:bg-blue-800"
      } text-white dark:text-white rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900`}
    >
      {isLoading ? "Loading...." : "Kirim"}
    </button>
  );
};

export default SubmitButton;
