type DialogAIGroqProps = {
  message: string;
  handleDialog: (isVisible: boolean) => void;
};

export default function DialogAIGroq({
  message,
  handleDialog,
}: DialogAIGroqProps) {
  return (
    <div className="fixed bg-white inset-0 flex items-center justify-center  bg-opacity-50 px-[100px] py-[100px]">
      <div className=" p-6 rounded-lg shadow-2xl w-full h-full max-w-5xl max-h-full relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => handleDialog(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p
            className="text-gray-700 text-lg text-center"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-4 pb-4">
          <button
            onClick={() => handleDialog(false)}
            className="px-6 py-2 bg-blue-500  rounded-lg shadow-md hover:bg-blue-600 transition-all duration-300"
          >
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}
