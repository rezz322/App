import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import DayState from "../Compnents/DayState";

interface Task {
  id: number;
  name: string;
  date_materials: number;
  date_working: number;
  date_complited: number;
  field1: number;
  field2: number;
  field3: number;
  all_hour: number;
  is_comlited: number;
  collor: number;
}

interface Offer {
  id: number;
  day: number;
  month: number;
  year: number;
}

interface Message<T> {
  data: T;
  info: string;
}

type DayStateItem = {
  day: number;
  date: Date;
  isWeekend: boolean;
  totalHours: number;
  yer: number;
  month: number;
  tasks: string;
  isWorking: boolean;
  color: number;
  // НОВЕ: Ідентифікатор кастомного вихідного дня
  offerId: number | null;
};

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function skipWeekends(date: Date, customWeekendDatesSet: Set<string>) {
  while (true) {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!isWeekend(date) && !customWeekendDatesSet.has(dateKey)) {
      break;
    }
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function calculateWorkingDays(startDate: Date, hours: number, customWeekendDatesSet: Set<string>): Date {
  let currentDay = new Date(startDate);
  let remainingHours = hours;
  const DAILY_HOUR_LIMIT = 8;

  while (remainingHours > 0) {
    skipWeekends(currentDay, customWeekendDatesSet);
    
    const hoursForToday = Math.min(remainingHours, DAILY_HOUR_LIMIT);
    remainingHours -= hoursForToday;
    
    if (remainingHours > 0) {
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }
  
  return currentDay;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDilytsia, setSelectedDilytsia] = useState<
    "field1" | "field2" | "field3"
  >("field1");
  const [daysState, setDaysState] = useState<DayStateItem[]>([]);
  const [initialDaysState, setInitialDaysState] = useState<DayStateItem[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: Message<Task[]> = await invoke("get_all_task_command");
      if (response.info === "Success") {
        setTasks(response.data || []);
      } else {
        setError(`Error fetching tasks: ${response.info}`);
      }
    } catch (err) {
      setError(`Failed to fetch tasks: ${String(err)}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate, selectedDilytsia]);

  // ЗМІНЕНО: Тепер повертає Map<"YYYY-MM-DD", offer.id>
  const getCustomWeekends = async (): Promise<Map<string, number>> => {
    try {
      const response: Message<Offer[]> = await invoke("get_all_offer_command");
      if (response.info !== "Success" || !response.data) {
        console.error(`Error fetching offers: ${response.info}`);
        return new Map();
      }
      
      const customWeekendMap = new Map<string, number>();
      response.data.forEach((offer) => {
        const dateKey = `${offer.year}-${String(offer.month).padStart(2, '0')}-${String(offer.day).padStart(2, '0')}`;
        customWeekendMap.set(dateKey, offer.id);
      });
      return customWeekendMap;

    } catch (err) {
      console.error(`Failed to fetch offers: ${String(err)}`);
      return new Map();
    }
  };

  useEffect(() => {
    const buildDaysState = async () => { 
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const DAILY_HOUR_LIMIT = 8;
      
      // Отримуємо мапу ID
      const customWeekendDatesMap = await getCustomWeekends();
      // Створюємо Set для функцій skipWeekends/calculateWorkingDays
      const customWeekendDatesSet = new Set(customWeekendDatesMap.keys());

      const dailyTaskData: {
        [key: string]: { totalHours: number; is_working: boolean; tasks: string; all_h: number, color: number };
      } = {};

      const sortedTasks = [...tasks].sort((a, b) => a.date_working - b.date_working);
      sortedTasks.forEach((task) => {
        let startDate = new Date(task.date_working * 1000);
        
        let remainingHours = 0;
        let currentDay = new Date(startDate);
        
        if (selectedDilytsia === "field1") {
          remainingHours = task.field1;
          currentDay = skipWeekends(new Date(startDate), customWeekendDatesSet);
        } else if (selectedDilytsia === "field2") {
          const field1EndDate = calculateWorkingDays(
            new Date(startDate), 
            task.field1, 
            customWeekendDatesSet
          );
          currentDay = new Date(field1EndDate);
          currentDay.setDate(currentDay.getDate() + 1);
          currentDay = skipWeekends(currentDay, customWeekendDatesSet);
          remainingHours = task.field2;
        } else if (selectedDilytsia === "field3") {
          const field1EndDate = calculateWorkingDays(
            new Date(startDate), 
            task.field1, 
            customWeekendDatesSet
          );
          let field2StartDate = new Date(field1EndDate);
          field2StartDate.setDate(field2StartDate.getDate() + 1);
          field2StartDate = skipWeekends(field2StartDate, customWeekendDatesSet);
          
          const field2EndDate = calculateWorkingDays(
            field2StartDate, 
            task.field2, 
            customWeekendDatesSet
          );
          currentDay = new Date(field2EndDate);
          currentDay.setDate(currentDay.getDate() + 1);
          currentDay = skipWeekends(currentDay, customWeekendDatesSet);
          remainingHours = task.field3;
        }

        while (remainingHours > 0) {
          const currentYear = currentDay.getFullYear();
          const currentMonth = currentDay.getMonth();
          const currentDayNumber = currentDay.getDate();
          const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDayNumber).padStart(2, '0')}`;

          const isStandardWeekendDay = isWeekend(currentDay);
          const isCustomWeekendDay = customWeekendDatesSet.has(dateKey);

          const storageKey = `${currentYear}-${currentMonth}-${currentDayNumber}`;

          if (!dailyTaskData[storageKey]) {
            dailyTaskData[storageKey] = {
              totalHours: 0,
              is_working: false,
              tasks: "",
              all_h: 0,
              color: 0,
            };
          }

          if (!isStandardWeekendDay && !isCustomWeekendDay) {
            const hoursForToday = Math.min(
              remainingHours,
              DAILY_HOUR_LIMIT - dailyTaskData[storageKey].totalHours
            );

            if (hoursForToday > 0) {
              dailyTaskData[storageKey].color = task.collor;
              dailyTaskData[storageKey].totalHours += hoursForToday;
              dailyTaskData[storageKey].is_working = true;
              const existingTask = dailyTaskData[storageKey].tasks;
              if (existingTask && existingTask !== task.name) {
                  dailyTaskData[storageKey].tasks += `, ${task.name}`;
              } else if (!existingTask) {
                  dailyTaskData[storageKey].tasks = task.name;
              }
              dailyTaskData[storageKey].all_h = task.all_hour;
              
              remainingHours -= hoursForToday;
            }
          }
          
          currentDay.setDate(currentDay.getDate() + 1);
          skipWeekends(currentDay, customWeekendDatesSet);

          if (currentDay.getFullYear() > year + 2) break; 
        }
      });
      
      const newDays: DayStateItem[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const isW = isWeekend(date);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Отримуємо offerId для дати
        const offerId = customWeekendDatesMap.get(dateKey) || null;
        const isCustomW = offerId !== null;

        const storageKey = `${year}-${month}-${d}`;
        const dt = dailyTaskData[storageKey] || {
          totalHours: 0,
          is_working: false,
          tasks: "",
          all_h: 0,
          color: 0,
        };

        newDays.push({
          day: d,
          date,
          isWeekend: isW || isCustomW, // День вихідний, якщо стандартний АБО кастомний
          totalHours: dt.totalHours,
          tasks: dt.tasks,
          yer: year,
          month: month,
          isWorking: dt.is_working,
          color: dt.color,
          offerId: offerId, // ПЕРЕДАЄМО ID СЮДИ
        });
      }

      setDaysState(newDays);
      setInitialDaysState(newDays); 
    };

    buildDaysState();
  }, [tasks, year, month, selectedDilytsia]);

  const onDayClick = async (dayNumber: number, year: number, month: number) => {
    await invoke("create_offer_command", { day: dayNumber, year, month: month + 1 });
    fetchTasks();
  };

  const ondaydelete = async (id:number) => {
    await invoke("delete_offer_command", { id: id });
    fetchTasks();
  };

  
  const resetCalendar = async () => {
    console.log("Сброс кастомных выходных...");
    await invoke("delete_all_offer_command"); 
    
    setDaysState(initialDaysState.map((d) => ({ 
        ...d, 
        isWeekend: isWeekend(d.date), 
        tasks: d.tasks, 
        totalHours: 0, 
        isWorking: false, 
        offerId: null // Обов'язково скидаємо offerId
    })));
    fetchTasks(); 
  };
  
  const goToPreviousMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
  const handleDilytsiaChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDilytsia(e.target.value as "field1" | "field2" | "field3");

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDay = firstDayOfMonth.getDay();
  const offset = startingDay === 0 ? 6 : startingDay - 1;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Календар роботи</h1>
          <div className="flex items-center">
            <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200">&lt;</button>
            <p className="text-gray-600 mx-2">{monthNames[month]} {year}</p>
            <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200">&gt;</button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            value={selectedDilytsia}
            onChange={handleDilytsiaChange}
          >
            <option value="field1">Дільниця 1</option>
            <option value="field2">Дільниця 2</option>
            <option value="field3">Дільниця 3</option>
          </select>
          <button onClick={resetCalendar} className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 text-sm">Скинути зміни</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-7 text-center font-bold mb-2">{dayNames.map((name) => (<div key={name}>{name}</div>))}</div>
        {loading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">Error: {error}</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} className="min-h-32" />)}
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
                ondaydelete = {ondaydelete}
                color={d.color}
                offerId={d.offerId} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}