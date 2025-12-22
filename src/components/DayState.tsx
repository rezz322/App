import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline'

interface DayStateProps {
  dayNumber: number;
  isWeekend?: boolean;
  totalHours?: number;
  taskNames?: string; 
  isWorkingPeriod?: boolean;
  yer: number;
  month: number;
  color: number;
  ondaydelete?: (id: number) => Promise<void>; 
  onDayClick?: (day: number, yer: number, month: number) => Promise<void>;
  offerId: number | null; 
}

const tailwindColors500 = [
  "bg-[#FF0000]", "bg-[#FF1A1A]", "bg-[#FF3333]", "bg-[#E60000]", "bg-[#CC0000]", 
  "bg-[#B30000]", "bg-[#990000]", "bg-[#800000]", "bg-[#FF4D4D]", "bg-[#FF6666]", 
  "bg-[#CD5C5C]", "bg-[#F08080]", "bg-[#FA8072]", "bg-[#E9967A]", "bg-[#FFA07A]", 
  "bg-[#DC143C]", "bg-[#B22222]",
  "bg-[#FF4500]", "bg-[#FF8C00]", "bg-[#FFA500]", "bg-[#FF7F50]", "bg-[#FF6347]", 
  "bg-[#E67E22]", "bg-[#D35400]", "bg-[#BA4A00]", "bg-[#F39C12]", "bg-[#E59866]", 
  "bg-[#DC7633]", "bg-[#D68910]", "bg-[#CA6F1E]", "bg-[#EDBB99]", "bg-[#F5B041]", 
  "bg-[#EB984E]", "bg-[#A04000]",
  "bg-[#FFD700]", "bg-[#FFFF00]", "bg-[#F1C40F]", "bg-[#F4D03F]", "bg-[#F7DC6F]", 
  "bg-[#D4AC0D]", "bg-[#B7950B]", "bg-[#9A7D0A]", "bg-[#FFDAB9]", "bg-[#F0E68C]", 
  "bg-[#BDB76B]", "bg-[#EEE8AA]", "bg-[#FFE4B5]", "bg-[#FFEFD5]", "bg-[#FFFACD]", 
  "bg-[#FAD7A0]",
  "bg-[#0000FF]", "bg-[#0000CD]", "bg-[#00008B]", "bg-[#000080]", "bg-[#4169E1]", 
  "bg-[#4682B4]", "bg-[#1E90FF]", "bg-[#00BFFF]", "bg-[#87CEEB]", "bg-[#87CEFA]", 
  "bg-[#ADD8E6]", "bg-[#B0C4DE]", "bg-[#5DADE2]", "bg-[#3498DB]", "bg-[#2E86C1]", 
  "bg-[#21618C]", "bg-[#1B4F72]",
  "bg-[#800080]", "bg-[#8B008B]", "bg-[#9400D3]", "bg-[#9932CC]", "bg-[#BA55D3]", 
  "bg-[#DA70D6]", "bg-[#EE82EE]", "bg-[#D8BFD8]", "bg-[#DDA0DD]", "bg-[#AF7AC5]", 
  "bg-[#A569BD]", "bg-[#8E44AD]", "bg-[#7D3C98]", "bg-[#6C3483]", "bg-[#5B2C6F]", 
  "bg-[#4A235A]", "bg-[#663399]",
  "bg-[#FF00FF]", "bg-[#FF1493]", "bg-[#FF69B4]", "bg-[#FFB6C1]", "bg-[#FFC0CB]", 
  "bg-[#DB7093]", "bg-[#C71585]", "bg-[#E91E63]", "bg-[#D81B60]", "bg-[#AD1457]", 
  "bg-[#880E4F]", "bg-[#F06292]", "bg-[#F48FB1]", "bg-[#F8BBD0]", "bg-[#EC407A]", 
  "bg-[#D2128E]"
];

const DayState: React.FC<DayStateProps> = ({
  dayNumber, 
  isWeekend = false, 
  totalHours,
  taskNames,
  yer,
  month,
  isWorkingPeriod = false,
  onDayClick,
  ondaydelete,
  color,
  offerId 
}) => {
  const isCustomWeekend = offerId !== null;
  
  let bgColor = 'bg-blue-50'; 
  if (isCustomWeekend) {
    bgColor = 'bg-red-300 hover:bg-red-400'; 
  } else if (isWeekend) {
    bgColor = 'bg-red-100';
  } else if (isWorkingPeriod) {
    const safeColorIndex = color % tailwindColors500.length;
    bgColor = `${tailwindColors500[safeColorIndex]} text-white`;
  } 

  const handleDayClick = () => {
    if (!isWeekend && !isCustomWeekend && onDayClick) {
      onDayClick(dayNumber, yer, month);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); 
    if (isCustomWeekend && ondaydelete) {
      ondaydelete(offerId!); 
    }
  };

  return (
    <div 
      className={`rounded-lg p-4 h-32 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg ${bgColor}`} 
      onClick={handleDayClick}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">{dayNumber}</span>
        {isCustomWeekend && (
          <button
            className="p-1 rounded-full bg-red-700 hover:bg-red-800 text-white z-10"
            onClick={handleDeleteClick} 
            title="Видалити кастомний вихідний"
          >
            <TrashIcon className="w-4 h-4"/> 
          </button>
        )}
        
        {(isWeekend || isCustomWeekend) && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCustomWeekend ? 'bg-red-700 text-white' : 'bg-red-500 text-white'}`}>
            {isCustomWeekend ? 'Кастомний В' : 'Вихідний'}
          </span>
        )}
      </div>

      {(!isWeekend && !isCustomWeekend && !isWorkingPeriod) && (
        <div className="flex-grow flex items-center justify-center text-blue-600 text-lg">
          {"Вільно"}
        </div>
      )}

      {isWorkingPeriod && totalHours && totalHours > 0 && (
        <div className={`flex flex-col space-y-1 ${bgColor.includes('text-white') ? 'text-white' : 'text-gray-700'}`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{totalHours.toFixed(1)}г</span>
          </div>
          <div className="text-xs truncate" title={taskNames}>
            <p>{taskNames}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayState;