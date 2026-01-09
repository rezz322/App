import React from "react";

interface DayStateProps {
  dayNumber: number;
  isWeekend: boolean;
  totalHours: number;
  yer: number;
  month: number;
  taskNames: string;
  isWorkingPeriod: boolean;
  onDayClick: (day: number, yer: number, month: number) => void;
  ondaydelete: (id: number) => void;
  color: number;
  offerId: number | null;
}

const DayState: React.FC<DayStateProps> = ({
  dayNumber,
  isWeekend,
  totalHours,
  yer,
  month,
  taskNames,
  isWorkingPeriod,
  onDayClick,
  ondaydelete,
  color,
  offerId,
}) => {
  const getBackgroundColor = () => {
    if (isWorkingPeriod) {
      switch (color) {
        case 1: return "bg-blue-400 border-blue-200";
        case 2: return "bg-green-400 border-green-200";
        case 3: return "bg-purple-400 border-purple-200";
        case 4: return "bg-yellow-400 border-yellow-200";
        case 5: return "bg-black border-black";
        default: return "bg-blue-400 border-blue-100";
      }
    }
    if (isWeekend) return "bg-red-400 border-red-200 opacity-60";
    return "bg-gray-100 border-gray-100 hover:bg-gray-50";
  };

  const getTextColor = () => {
    if (isWorkingPeriod) return "text-blue-900";
    if (isWeekend) return "text-gray-400";
    return "text-gray-700";
  };

  return (
    <div
      onClick={() => !offerId && onDayClick(dayNumber, yer, month)}
      className={`min-h-32 p-2 border rounded-lg transition-all cursor-pointer relative group ${getBackgroundColor()}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`text-sm font-bold ${getTextColor()}`}>{dayNumber}</span>
        {totalHours > 0 && (
          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
            {totalHours} год
          </span>
        )}
        {offerId && (
          <button
            onClick={(e) => { e.stopPropagation(); ondaydelete(offerId); }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-1 overflow-hidden">
        {taskNames && taskNames.split(',').map((name, i) => (
          <div key={i} className="text-[10px] truncate leading-tight bg-white/50 rounded px-1 py-0.5 mb-1" title={name.trim()}>
            {name.trim()}
          </div>
        ))}
      </div>

      {isWeekend && !isWorkingPeriod && !offerId && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wider rotate-45">Вихідний</span>
        </div>
      )}
    </div>
  );
};

export default DayState;