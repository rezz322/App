import { useState } from "react";
import DayState from "../components/DayState";
import { useTasks } from "../hooks/useTasks";
import { useCalendar } from "../hooks/useCalendar";

export default function MaterialsCalendar() {
  const { tasks, loading, error } = useTasks();
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDilytsia, setSelectedDilytsia] = useState<"field1" | "field2" | "field3">("field1");

  const { daysState, onDayClick, onDayDelete, resetCalendar } = useCalendar(tasks, currentDate, selectedDilytsia, 'materials');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goToPreviousMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDay = firstDayOfMonth.getDay();
  const offset = startingDay === 0 ? 6 : startingDay - 1;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Календар матеріалів</h1>
            <div className="flex items-center mt-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <p className="text-lg font-medium text-gray-800 px-4 min-w-[150px] text-center">
                {monthNames[month]} {year}
              </p>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                className="block appearance-none w-full bg-white border border-gray-300 hover:border-blue-400 px-4 py-2 pr-10 rounded-lg shadow-sm leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={selectedDilytsia}
                onChange={(e) => setSelectedDilytsia(e.target.value as any)}
              >
                <option value="field1">Дільниця 1</option>
                <option value="field2">Дільниця 2</option>
                <option value="field3">Дільниця 3</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 7.293 8.122 5.879 9.536 10 13.657l.65-.65z" /></svg>
              </div>
            </div>
            <button
              onClick={resetCalendar}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium shadow-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Скинути все
            </button>
          </div>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="grid grid-cols-7 text-center font-bold mb-4 text-gray-500 uppercase text-xs tracking-wider">
            {dayNames.map((name) => (<div key={name}>{name}</div>))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">Завантаження календаря...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-center my-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Error: {error}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-32 bg-gray-50/50 rounded-lg border border-transparent" />
              ))}
              {daysState.map((d) => (
                <DayState
                  key={d.day}
                  dayNumber={d.day}
                  isWeekend={d.isWeekend}
                  totalHours={d.totalHours}
                  yer={d.yer}
                  month={d.month}
                  tasks={d.tasks}
                  isWorkingPeriod={d.isWorking}
                  onDayClick={onDayClick}
                  ondaydelete={onDayDelete}
                  offerId={d.offerId}
                  materials={d.materials}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
