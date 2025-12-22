import React, { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import CalendarHeader from "../components/CalendarHeader";
import CalendarGrid from "../components/CalendarGrid";
import { Offer, Message } from "../types/task";
import { useTasks } from "../hooks/useTasks";
import { isWeekend } from "../utils/dateUtils";
import { skipWeekendsInDate, calculateWorkingDays } from "../utils/taskCalculations";

export default function Calendar() {
  const { tasks, loading: tasksLoading, error: tasksError, fetchTasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedDilytsia, setSelectedDilytsia] = useState<"field1" | "field2" | "field3">("field1");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const response: Message<Offer[]> = await invoke("get_all_offer_command");
      if (response.info === "Success") {
        setOffers(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const customWeekendDatesMap = useMemo(() => {
    const map = new Map<string, number>();
    offers.forEach((offer) => {
      const dateKey = `${offer.year}-${String(offer.month).padStart(2, '0')}-${String(offer.day).padStart(2, '0')}`;
      map.set(dateKey, offer.id);
    });
    return map;
  }, [offers]);

  const customWeekendDatesSet = useMemo(() => new Set(customWeekendDatesMap.keys()), [customWeekendDatesMap]);

  const daysState = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const DAILY_HOUR_LIMIT = 8;
    const dailyTaskData: { [key: string]: { totalHours: number; is_working: boolean; tasks: string; color: number } } = {};
    const sortedTasks = [...tasks].sort((a, b) => a.date_working - b.date_working);
    
    sortedTasks.forEach((task) => {
      let startDate = task.date_working * 1000;
      let remainingHours = 0;
      let currentDay = new Date(startDate);
      
      if (selectedDilytsia === "field1") {
        remainingHours = task.field1;
        currentDay = skipWeekendsInDate(new Date(startDate), customWeekendDatesSet);
      } else if (selectedDilytsia === "field2") {
        const field1EndDate = calculateWorkingDays(new Date(startDate), task.field1, customWeekendDatesSet);
        currentDay = task.field1 === 0 ? new Date(startDate) : new Date(field1EndDate);
        if (task.field1 !== 0) currentDay.setDate(currentDay.getDate() + 1);
        currentDay = skipWeekendsInDate(currentDay, customWeekendDatesSet);
        remainingHours = task.field2;
      } else if (selectedDilytsia === "field3") {
        const field1EndDate = calculateWorkingDays(new Date(startDate), task.field1, customWeekendDatesSet);
        let field2StartDate = new Date(field1EndDate);
        field2StartDate.setDate(field2StartDate.getDate() + 1);
        field2StartDate = skipWeekendsInDate(field2StartDate, customWeekendDatesSet);
        const field2EndDate = calculateWorkingDays(field2StartDate, task.field2, customWeekendDatesSet);
        
        currentDay = (task.field1 === 0 || task.field2 === 0) ? new Date(startDate) : new Date(field2EndDate);
        if (task.field1 !== 0 && task.field2 !== 0) currentDay.setDate(currentDay.getDate() + 1);
        currentDay = skipWeekendsInDate(currentDay, customWeekendDatesSet);
        remainingHours = task.field3;
      }

      while (remainingHours > 0) {
        const currentYear = currentDay.getFullYear();
        const currentMonth = currentDay.getMonth();
        const currentDayNumber = currentDay.getDate();
        const storageKey = `${currentYear}-${currentMonth}-${currentDayNumber}`;
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDayNumber).padStart(2, '0')}`;

        if (!dailyTaskData[storageKey]) dailyTaskData[storageKey] = { totalHours: 0, is_working: false, tasks: "", color: 0 };

        if (!isWeekend(currentDay) && !customWeekendDatesSet.has(dateKey)) {
          const hoursForToday = Math.min(remainingHours, DAILY_HOUR_LIMIT - dailyTaskData[storageKey].totalHours);
          if (hoursForToday > 0) {
            dailyTaskData[storageKey].color = task.collor || 0;
            dailyTaskData[storageKey].totalHours += hoursForToday;
            dailyTaskData[storageKey].is_working = true;
            if (dailyTaskData[storageKey].tasks && !dailyTaskData[storageKey].tasks.includes(task.name)) {
                dailyTaskData[storageKey].tasks += `, ${task.name}`;
            } else if (!dailyTaskData[storageKey].tasks) {
                dailyTaskData[storageKey].tasks = task.name;
            }
            remainingHours -= hoursForToday;
          }
        }
        currentDay.setDate(currentDay.getDate() + 1);
        skipWeekendsInDate(currentDay, customWeekendDatesSet);
        if (currentDay.getFullYear() > year + 1) break; 
      }
    });
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const date = new Date(year, month, d);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const offerId = customWeekendDatesMap.get(dateKey) || null;
      const storageKey = `${year}-${month}-${d}`;
      const dt = dailyTaskData[storageKey] || { totalHours: 0, is_working: false, tasks: "", color: 0 };

      return {
        day: d,
        date,
        isWeekend: isWeekend(date) || offerId !== null,
        totalHours: dt.totalHours,
        tasks: dt.tasks,
        yer: year,
        month: month,
        isWorking: dt.is_working,
        color: dt.color,
        offerId
      };
    });
  }, [tasks, year, month, selectedDilytsia, customWeekendDatesSet, customWeekendDatesMap]);

  const onDayClick = async (dayNumber: number, year: number, month: number) => {
    await invoke("create_offer_command", { day: dayNumber, year, month: month + 1 });
    fetchOffers();
    fetchTasks();
  };

  const onDayDelete = async (id: number) => {
    await invoke("delete_offer_command", { id });
    fetchOffers();
    fetchTasks();
  };
  
  const resetCalendar = async () => {
    if (!window.confirm("Ви впевнені, що хочете скинути всі зміни?")) return;
    await invoke("delete_all_offer_command"); 
    fetchOffers();
    fetchTasks(); 
  };
  
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
  const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <div className="p-4">
      <CalendarHeader
        monthName={monthNames[month]}
        year={year}
        selectedDilytsia={selectedDilytsia}
        onPreviousMonth={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        onNextMonth={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        onDilytsiaChange={setSelectedDilytsia}
        onReset={resetCalendar}
      />
      <CalendarGrid
        dayNames={dayNames}
        daysState={daysState}
        offset={offset}
        loading={tasksLoading || loadingOffers}
        error={tasksError}
        onDayClick={onDayClick}
        onDayDelete={onDayDelete}
      />
    </div>
  );
}