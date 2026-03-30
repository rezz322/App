import React from "react";
import { TaskSummary } from "../types";
import { formatMinutesToHM } from "../utils/dateUtils";

interface DayStateProps {
  dayNumber: number;
  isWeekend: boolean;
  totalHours: number;
  yer: number;
  month: number;
  tasks: TaskSummary[];
  isWorkingPeriod: boolean;
  onDayClick: (day: number, yer: number, month: number) => void;
  ondaydelete: (id: number) => void;
  offerId: number | null;
  materials?: { name: string; color: number }[];
}

const DayState: React.FC<DayStateProps> = ({
  dayNumber,
  isWeekend,
  totalHours,
  yer,
  month,
  tasks,
  isWorkingPeriod,
  onDayClick,
  ondaydelete,
  offerId,
  materials = [],
}) => {
  const getBackgroundColor = () => {
    if (isWorkingPeriod) return "bg-blue-50 border-blue-200 hover:bg-white transition-colors text-blue-900";
    if (isWeekend) return "bg-red-400 border-red-200 opacity-60";
    return "bg-gray-100 border-gray-100 hover:bg-gray-50";
  };

  const getTextColor = () => {
    if (isWorkingPeriod) return "text-blue-900";
    if (isWeekend) return "text-gray-400";
    return "text-gray-700";
  };

  const getTaskColor = (taskColor: number) => {
    switch (taskColor) {
      case 1: return "bg-blue-100 text-blue-800 border-blue-200";
      case 2: return "bg-green-100 text-green-800 border-green-200";
      case 3: return "bg-purple-100 text-purple-800 border-purple-200";
      case 4: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 5: return "bg-pink-100 text-pink-800 border-pink-200";
      case 6: return "bg-orange-100 text-orange-800 border-orange-200";
      case 7: return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case 8: return "bg-teal-100 text-teal-800 border-teal-200";
      case 9: return "bg-rose-100 text-rose-800 border-rose-200";
      case 10: return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      onClick={() => !offerId && onDayClick(dayNumber, yer, month)}
      className={`min-h-32 p-2 border rounded-lg transition-all cursor-pointer relative group ${getBackgroundColor()}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className={`text-sm font-bold ${getTextColor()}`}>{dayNumber}</span>
        {totalHours > 0 && (
          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {formatMinutesToHM(totalHours)}
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
        {tasks && tasks.map((task, i) => (
          <div
            key={i}
            className={`text-[10px] truncate border leading-tight rounded px-1 py-0.5 mb-1 shadow-sm font-medium ${getTaskColor(task.color)}`}
            title={task.name}
          >
            {task.name} ({formatMinutesToHM(task.hours)})
          </div>
        ))}

        {materials.length > 0 && (
          <div className="mt-1 pt-1 border-t border-gray-200/50">
            {materials.map((mat, i) => (
              <div
                key={`mat-${i}`}
                className={`text-[9px] truncate border border-dashed leading-tight rounded px-1 py-0.5 mb-1 shadow-sm font-medium ${getTaskColor(mat.color)}`}
                title={`Матеріали: ${mat.name}`}
              >
                📦 {mat.name}
              </div>
            ))}
          </div>
        )}
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