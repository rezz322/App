import React from 'react';
import DayState from './DayState';
import { DayStateItem } from '../types/task';

interface CalendarGridProps {
  dayNames: string[];
  daysState: DayStateItem[];
  offset: number;
  loading: boolean;
  error: string | null;
  onDayClick: (day: number, year: number, month: number) => Promise<void>;
  onDayDelete: (id: number) => Promise<void>;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  dayNames,
  daysState,
  offset,
  loading,
  error,
  onDayClick,
  onDayDelete
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="text-center py-20 text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="text-center py-20 text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="grid grid-cols-7 text-center font-bold mb-4 text-gray-500">
        {dayNames.map((name) => (<div key={name}>{name}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-32 bg-gray-50/50 rounded-lg" />
        ))}
        {daysState.map((d) => (
          <DayState
            key={d.day}
            dayNumber={d.day}
            isWeekend={d.isWeekend}
            totalHours={d.totalHours}
            yer={d.yer}
            month={d.month}
            taskNames={d.tasks}
            isWorkingPeriod={d.isWorking}
            onDayClick={onDayClick}
            ondaydelete={onDayDelete}
            color={d.color}
            offerId={d.offerId} 
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
