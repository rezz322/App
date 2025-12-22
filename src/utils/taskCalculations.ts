import { Task } from "../types/task";
import { calculateNextWorkingDate, isWeekend } from "./dateUtils";

export const getNextAvailableTime = (tasks: Task[], fieldKey: 'field1_end' | 'field2_end' | 'field3_end') => {
    let latestEndTime = 0;
    
    tasks
        .filter(task => task.is_comlited === 0)
        .forEach(task => {
            let currentEndTime = task[fieldKey] * 1000;
            if (currentEndTime !== 0) {
                currentEndTime = calculateNextWorkingDate(currentEndTime);
                currentEndTime = currentEndTime + 24 * 60 * 60 * 1000;
            }
            if (currentEndTime > latestEndTime) {
                latestEndTime = currentEndTime;
            }
        });

    if (latestEndTime === 0) {
        return "Вільна"; 
    }
    
    const nextAvailableDate = new Date(latestEndTime); 
    const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return nextAvailableDate.toLocaleString('uk-UA', dateOptions);
};

export const isFreeForField = (tasks: Task[], proposedStartTimeMs: number, field1: number): boolean => {
    let isTimeSlotBooked = false;

    if (field1 > 0) {
        for (const task of tasks) {
            if (task.is_comlited === 1) continue;
            if (task.field1 === 0) continue; 

            const existingStartTimeMs = Number(task.date_working) * 1000;
    
            if (existingStartTimeMs < proposedStartTimeMs &&
                proposedStartTimeMs < task.field1_end * 1000) {
                isTimeSlotBooked = true;
                break;
            } 
        }
    }

    return isTimeSlotBooked;
};

export const skipWeekendsInDate = (date: Date, customWeekendDatesSet: Set<string>) => {
    while (true) {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!isWeekend(date) && !customWeekendDatesSet.has(dateKey)) {
            break;
        }
        date.setDate(date.getDate() + 1);
    }
    return date;
};

export const calculateWorkingDays = (startDate: Date, hours: number, customWeekendDatesSet: Set<string>): Date => {
    let currentDay = new Date(startDate);
    let remainingHours = hours;
    const DAILY_HOUR_LIMIT = 8;

    while (remainingHours > 0) {
        skipWeekendsInDate(currentDay, customWeekendDatesSet);
        
        const hoursForToday = Math.min(remainingHours, DAILY_HOUR_LIMIT);
        remainingHours -= hoursForToday;
        
        if (remainingHours > 0) {
            currentDay.setDate(currentDay.getDate() + 1);
        }
    }
    
    return currentDay;
};
