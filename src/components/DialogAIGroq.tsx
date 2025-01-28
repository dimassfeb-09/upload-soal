type DialogAIGroqProps = {
  message: string;
  handleDialog: (isVisible: boolean) => void;  
};

export default function DialogAIGroq({ message, handleDialog }: DialogAIGroqProps) {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: message }} />


        <div className="flex justify-end space-x-4">
          <button
            onClick={() => handleDialog(false)} // Close dialog on button click
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}
