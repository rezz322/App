import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline'


interface DayStateProps {
  dayNumber: number;
  isWeekend?: boolean;
  totalHours?: number;
  taskNames?: string; 
  isWorkingPeriod?: boolean;
  yer:number;
  month:number;
  color:number;
  
  // ВИПРАВЛЕНО: ondaydelete очікує лише number (id)
  ondaydelete?: (id: number) => Promise<void>; 
  onDayClick?: (day: number,yer:number, month:number) => Promise<void>;
  offerId:number | null; // ID кастомного вихідного
}

const tailwindColors500 = [
   "bg-orange-500", "bg-amber-400", "bg-yellow-500", "bg-lime-600", 
  "bg-green-500", "bg-teal-400", "bg-cyan-600", "bg-blue-500", "bg-indigo-400", 
  "bg-purple-600", "bg-pink-500"      
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
      bgColor = 'bg-red-300 hover:bg-red-400'; // Змінив колір для кращої видимості
    } else if (isWeekend) {
      bgColor = 'bg-red-100';
    } else if (isWorkingPeriod) {
      const safeColorIndex = color % tailwindColors500.length;
      bgColor = `${tailwindColors500[safeColorIndex]} text-white`;
    } 

  const handleDayClick = () => {
    if (!isWeekend  && onDayClick) {
      console.log(`Створення кастомного вихідного для дня: ${dayNumber}`);
      onDayClick(dayNumber, yer, month);
    }

  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation(); 
        
      if (isCustomWeekend && ondaydelete) {
          console.log(`Видалення кастомного вихідного з ID: ${offerId}`);
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
        
        {/* Відображення тексту "Вихідний" */}
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
            <span>{totalHours.toFixed(1)}r</span>
          </div>
          <div className="text-xs">
            <p>{taskNames}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayState;