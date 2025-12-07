import React, { useState } from 'react';

interface DayStateProps {
  dayNumber: number;
  isWeekend?: boolean;
  totalHours?: number;
  taskNames?: string; 
  isWorkingPeriod?: boolean;
  yer:number;
  month:number;
  color:number;

  onDayClick?: (day: number,yer:number, month:number) => void;
}

const tailwindColors500 = [

  "bg-red-600",      // Красный (насыщенный)
  "bg-orange-500",   // Оранжевый
  "bg-amber-400",    // Янтарный (светлый)
  "bg-yellow-500",   // Желтый
  "bg-lime-600",     // Лаймовый (насыщенный)
  "bg-green-500",    // Зеленый
  "bg-teal-400",     // Бирюзовый (светлый)
  "bg-cyan-600",     // Голубой (насыщенный)
  "bg-blue-500",     // Синий
  "bg-indigo-400",   // Индиго (светлый)
  "bg-purple-600",   // Фиолетовый (насыщенный)
  "bg-pink-500"      // Розовый
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
  color

}) => {
  const [isClicked, setIsClicked] = useState(false);

  let bgColor = 'bg-blue-50'; 
  
  if (isClicked) {
    bgColor = 'bg-red-400';
  } else if (isWeekend) {
    bgColor = 'bg-red-100';
  } else if (isWorkingPeriod) {
    console.log("collor:  " , color);
    
    bgColor =tailwindColors500[color];
  } 


  const handleClick = () => {
    setIsClicked(!isClicked);

    if (onDayClick) {
      console.log(dayNumber,typeof(yer) , yer, month);
      
      onDayClick(dayNumber, yer, month);
    }
  };

  return (
    <div className={`rounded-lg p-4 h-32 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg ${bgColor}`} onClick={handleClick}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">{dayNumber}</span>
        {(isWeekend || isClicked) && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">Вихідний</span>
        )}
      </div>

      {(!isWeekend && !isClicked) && (
        <div className="flex-grow flex items-center justify-center text-blue-600 text-lg">
          {!isWorkingPeriod && "Вільно"}
        </div>
      )}

      {!isWeekend && !isClicked && totalHours && totalHours > 0 && (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{totalHours.toFixed(1)}r</span>
          </div>
          
          <div className="text-xs text-gray-600">
            <p>{taskNames}</p>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default DayState;
