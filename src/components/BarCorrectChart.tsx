import React from "react";

interface BarChartProps {
  correctCount: number;
  incorrectCount: number;
}

const BarCorrectChart: React.FC<BarChartProps> = ({
  correctCount,
  incorrectCount,
}) => {
  // Maximum value for scaling bars
  const maxCount = Math.max(correctCount, incorrectCount, 1);

  return (
    <div className="space-y-4 w-min mt-5">
      <div className="w-full max-w-md">
        <div className="flex w-min items-end space-x-4">
          {/* Correct Answers Bar */}
          <div className="flex flex-col items-center">
            <div
              className="bg-teal-600 rounded-md text-xs text-white flex items-center justify-center"
              style={{
                width: "2rem", // Further reduced width
                height: `${(correctCount / maxCount) * 60}px`, // Further reduced height
                minHeight: "2rem", // Further reduced minimum height
              }}
            >
              {correctCount}
            </div>
            <span className="text-xs mt-1">Benar</span>
          </div>

          {/* Incorrect Answers Bar */}
          <div className="flex flex-col items-center">
            <div
              className="bg-red-600 rounded-md text-xs text-white flex items-center justify-center"
              style={{
                width: "2rem", // Further reduced width
                height: `${(incorrectCount / maxCount) * 60}px`, // Further reduced height
                minHeight: "2rem", // Further reduced minimum height
              }}
            >
              {incorrectCount}
            </div>
            <span className="text-xs mt-1">Salah</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarCorrectChart;
