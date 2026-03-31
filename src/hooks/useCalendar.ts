import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Task, Offer, Message, DayStateItem, TaskSummary } from "../types";
import {
  isWeekend,
  skipWeekends,
  formatToDateKey,
  formatToStorageKey,
  DAILY_HOUR_LIMIT,
  normalizeMs
} from "../utils/dateUtils";

// Hook to manage calendar state and display logic
export function useCalendar(
  tasks: Task[],
  currentDate: Date,
  selectedDilytsia: "field1" | "field2" | "field3",
  viewMode: 'tasks' | 'materials' = 'tasks'
) {
  const [daysState, setDaysState] = useState<DayStateItem[]>([]);
  const [initialDaysState, setInitialDaysState] = useState<DayStateItem[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetches all custom weekends/holidays from the database
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

  // Main function to build the monthly days state by distributing task hours
  const buildDaysState = useCallback(async () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const customWeekendDatesMap = await getCustomWeekends();
    const customWeekendDatesSet = new Set(customWeekendDatesMap.keys());

    const dailyTaskData: {
      [key: string]: { totalHours: number; is_working: boolean; tasks: TaskSummary[]; materials: { name: string; color: number }[]; color: number };
    } = {};

    const sortedTasks = [...tasks].sort((a, b) => {
      const getStageStart = (t: Task) => {
        if (selectedDilytsia === "field1") return t.date_working;
        if (selectedDilytsia === "field2") return t.field1 > 0 ? t.field1_end : t.date_working;
        if (selectedDilytsia === "field3") {
          if (t.field2 > 0) return t.field2_end;
          if (t.field1 > 0) return t.field1_end;
          return t.date_working;
        }
        return t.date_working;
      };
      return getStageStart(a) - getStageStart(b);
    });

    if (viewMode === 'tasks') {
      sortedTasks.forEach((task) => {
      let remainingHours = 0;
      let currentDay: Date;

      if (selectedDilytsia === "field1") {
        remainingHours = task.field1;
        currentDay = new Date(task.date_working * 1000);
      } else if (selectedDilytsia === "field2") {
        remainingHours = task.field2;
        currentDay = new Date((task.field1 > 0 ? task.field1_end : task.date_working) * 1000);
      } else if (selectedDilytsia === "field3") {
        remainingHours = task.field3;
        let s2 = task.field1 > 0 ? task.field1_end : task.date_working;
        let s3 = task.field2 > 0 ? task.field2_end : s2;
        currentDay = new Date(s3 * 1000);
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
          dailyTaskData[storageKey] = { totalHours: 0, is_working: false, tasks: [], materials: [], color: 0 };
        }

        if (!isStandardWeekendDay && !isCustomWeekendDay) {
          const availableToday = DAILY_HOUR_LIMIT - dailyTaskData[storageKey].totalHours;
          const take = Math.min(remainingHours, availableToday);

          if (take > 0) {
            dailyTaskData[storageKey].color = task.collor || 0;
            dailyTaskData[storageKey].totalHours += take;
            dailyTaskData[storageKey].is_working = true;

            const existingTask = dailyTaskData[storageKey].tasks.find(t => t.name === task.name);
            if (existingTask) {
              existingTask.hours += take;
            } else {
              dailyTaskData[storageKey].tasks.push({
                name: task.name,
                hours: take,
                color: task.collor || task.color || 0
              });
            }
            remainingHours -= take;
          }
        }

        currentDay.setDate(currentDay.getDate() + 1);
        currentDay = skipWeekends(currentDay, customWeekendDatesSet);

      if (currentDay.getFullYear() > year + 2) break;
        }
      });
    }

    // Distribution of materials
    if (viewMode === 'materials') {
      tasks.forEach((task) => {
      let matTimestamp = 0;
      if (selectedDilytsia === "field1") matTimestamp = task.date_materials1;
      else if (selectedDilytsia === "field2") matTimestamp = task.date_materials2;
      else if (selectedDilytsia === "field3") matTimestamp = task.date_materials3;

      if (matTimestamp > 0) {
        const matDate = new Date(normalizeMs(matTimestamp));
        const storageKey = formatToStorageKey(matDate);
        if (!dailyTaskData[storageKey]) {
          dailyTaskData[storageKey] = { totalHours: 0, is_working: false, tasks: [], materials: [], color: 0 };
        }
        dailyTaskData[storageKey].materials.push({
          name: task.name,
          color: task.collor || task.color || 0
        });
      }
    });
    }

    const newDays: DayStateItem[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isW = isWeekend(date);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const offerId = customWeekendDatesMap.get(dateKey) || null;
      const isCustomW = offerId !== null;
      const storageKey = `${year}-${month}-${d}`;
      const dt = dailyTaskData[storageKey] || { totalHours: 0, is_working: false, tasks: [], materials: [], color: 0 };

      newDays.push({
        day: d,
        date,
        isWeekend: isW || isCustomW,
        totalHours: dt.totalHours,
        tasks: dt.tasks,
        materials: dt.materials,
        yer: year,
        month: month,
        isWorking: dt.is_working,
        color: dt.color,
        offerId: offerId,
      });
    }
    setDaysState(newDays);
    setInitialDaysState(newDays);
  }, [tasks, year, month, selectedDilytsia, viewMode]);

  useEffect(() => {
    buildDaysState();
  }, [buildDaysState]);

  // Click handler for a day to create a custom weekend
  const onDayClick = async (dayNumber: number, year: number, month: number) => {
    await invoke("create_offer_command", { day: dayNumber, year, month: month + 1 });
    buildDaysState();
  };

  // Deletes a custom weekend by its ID
  const onDayDelete = async (id: number) => {
    await invoke("delete_offer_command", { id });
    buildDaysState();
  };

  // Resets all custom weekends and refreshes the calendar
  const resetCalendar = async () => {
    await invoke("delete_all_offer_command");
    setDaysState(initialDaysState.map((d) => ({
      ...d,
      isWeekend: isWeekend(d.date),
      tasks: [],
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
