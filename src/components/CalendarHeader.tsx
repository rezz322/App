import React from 'react';

interface CalendarHeaderProps {
  monthName: string;
  year: number;
  selectedDilytsia: "field1" | "field2" | "field3";
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDilytsiaChange: (value: "field1" | "field2" | "field3") => void;
  onReset: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  monthName,
  year,
  selectedDilytsia,
  onPreviousMonth,
  onNextMonth,
  onDilytsiaChange,
  onReset
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Календар роботи</h1>
        <div className="flex items-center mt-2">
          <button onClick={onPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors">&lt;</button>
          <p className="text-gray-600 mx-4 font-semibold">{monthName} {year}</p>
          <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition-colors">&gt;</button>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <select
          className="block appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
          value={selectedDilytsia}
          onChange={(e) => onDilytsiaChange(e.target.value as any)}
        >
          <option value="field1">Дільниця 1</option>
          <option value="field2">Дільниця 2</option>
          <option value="field3">Дільниця 3</option>
        </select>
        <button onClick={onReset} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 text-sm transition-colors shadow">Скинути зміни</button>
      </div>
    </div>
  );
};

export default CalendarHeader;
