import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Task, Offer, Message, DayStateItem } from "../types";
import {
  isWeekend,
  skipWeekends,
  formatToDateKey,
  formatToStorageKey,
  DAILY_HOUR_LIMIT
} from "../utils/dateUtils";

export function useCalendar(tasks: Task[], currentDate: Date, selectedDilytsia: "field1" | "field2" | "field3") {
  const [daysState, setDaysState] = useState<DayStateItem[]>([]);
  const [initialDaysState, setInitialDaysState] = useState<DayStateItem[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getCustomWeekends = async (): Promise<Map<string, number>> => {
    try {
      const response: Message<Offer[]> = await invoke("get_all_offer_command");
      if (response.info !== "Success" || !response.data) {
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

  const buildDaysState = useCallback(async () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const customWeekendDatesMap = await getCustomWeekends();
    const customWeekendDatesSet = new Set(customWeekendDatesMap.keys());

    const dailyTaskData: {
      [key: string]: { totalHours: number; is_working: boolean; tasks: string; color: number };
    } = {};

    const sortedTasks = [...tasks].sort((a, b) => a.date_working - b.date_working);

    sortedTasks.forEach((task) => {
      let remainingHours = 0;
      let currentDay: Date;

      if (selectedDilytsia === "field1") {
        remainingHours = task.field1;
        currentDay = new Date(task.date_working * 1000);
      } else if (selectedDilytsia === "field2") {
        remainingHours = task.field2;
        if (task.field1 > 0) {
          currentDay = new Date(task.field1_end * 1000);
          currentDay.setDate(currentDay.getDate() + 1);
        } else {
          currentDay = new Date(task.date_working * 1000);
        }
      } else if (selectedDilytsia === "field3") {
        remainingHours = task.field3;
        if (task.field2 > 0) {
          console.log(task.name, ' field2  ', new Date(task.field2_end * 1000));
          console.log(task.name, ' field3  ', new Date(task.field3_end * 1000));
          currentDay = new Date(task.field2_end * 1000);
          currentDay.setDate(currentDay.getDate() + 1);
        } else if (task.field1 > 0) {
          currentDay = new Date(task.field1_end * 1000);
          currentDay.setDate(currentDay.getDate() + 1);
        } else {
          currentDay = new Date(task.date_working * 1000);
        }
      } else {
        return;
      }

      currentDay = skipWeekends(currentDay, customWeekendDatesSet);

      while (remainingHours > 0) {
        const storageKey = formatToStorageKey(currentDay);
        const dateKey = formatToDateKey(currentDay);

        const isStandardWeekendDay = isWeekend(currentDay);
        const isCustomWeekendDay = customWeekendDatesSet.has(dateKey);

        if (!dailyTaskData[storageKey]) {
          dailyTaskData[storageKey] = { totalHours: 0, is_working: false, tasks: "", color: 0 };
        }

        if (!isStandardWeekendDay && !isCustomWeekendDay) {
          const hoursForToday = Math.min(
            remainingHours,
            DAILY_HOUR_LIMIT - dailyTaskData[storageKey].totalHours
          );

          if (hoursForToday > 0) {
            dailyTaskData[storageKey].color = task.collor || 0;
            dailyTaskData[storageKey].totalHours += hoursForToday;
            dailyTaskData[storageKey].is_working = true;

            const existingTask = dailyTaskData[storageKey].tasks;
            if (existingTask && !existingTask.includes(task.name)) {
              dailyTaskData[storageKey].tasks += `, ${task.name}`;
            } else if (!existingTask) {
              dailyTaskData[storageKey].tasks = task.name;
            }
            remainingHours -= hoursForToday;
          }
        }

        currentDay.setDate(currentDay.getDate() + 1);
        currentDay = skipWeekends(currentDay, customWeekendDatesSet);

        if (currentDay.getFullYear() > year + 2) break;
      }
    });

    const newDays: DayStateItem[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isW = isWeekend(date);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const offerId = customWeekendDatesMap.get(dateKey) || null;
      const isCustomW = offerId !== null;
      const storageKey = `${year}-${month}-${d}`;
      const dt = dailyTaskData[storageKey] || { totalHours: 0, is_working: false, tasks: "", color: 0 };

      newDays.push({
        day: d,
        date,
        isWeekend: isW || isCustomW,
        totalHours: dt.totalHours,
        tasks: dt.tasks,
        yer: year,
        month: month,
        isWorking: dt.is_working,
        color: dt.color,
        offerId: offerId,
      });
    }
    setDaysState(newDays);
    setInitialDaysState(newDays);
  }, [tasks, year, month, selectedDilytsia]);

  useEffect(() => {
    buildDaysState();
  }, [buildDaysState]);

  const onDayClick = async (dayNumber: number, year: number, month: number) => {
    await invoke("create_offer_command", { day: dayNumber, year, month: month + 1 });
    buildDaysState();
  };

  const onDayDelete = async (id: number) => {
    await invoke("delete_offer_command", { id });
    buildDaysState();
  };

  const resetCalendar = async () => {
    await invoke("delete_all_offer_command");
    setDaysState(initialDaysState.map((d) => ({
      ...d,
      isWeekend: isWeekend(d.date),
      tasks: d.tasks,
      totalHours: 0,
      isWorking: false,
      offerId: null
    })));
    buildDaysState();
  };

  return {
    daysState,
    onDayClick,
    onDayDelete,
    resetCalendar
  };
}
