import { getAvailableDate } from './dateUtils';

// Mock Tasks
const tasks = [
    {
        is_comlited: 0,
        date_working: new Date('2023-10-27').getTime(),
        field1: 7
    }
];

console.log("Test 1: One task 7 hours");
console.log("Expected: 27.10.2023 (1 год)");
console.log("Actual:", getAvailableDate(tasks, 'field1'));

const tasks2 = [
    { is_comlited: 0, date_working: new Date('2023-10-27').getTime(), field1: 7 },
    { is_comlited: 0, date_working: new Date('2023-10-27').getTime(), field1: 2 } // Starts after task 1? No, logic ignores Start Date for 2nd task?
    // My logic calculates end date for EACH task based on ITS start date.
    // If Task 2 is manually set to same day, it pushes the "latest" end date forward.
    // Task 1 ends 27th (hour 7).
    // Task 2 (starts 27th), duration 2h.
    // Ends 27th (hour 2) -> NO. 
    // It starts at 0? If date_working is midnight.
    // Task 2 occupies [0, 2].
    // Task 1 occupies [0, 7].
    // Max end is Task 1 (Hour 7).
    // So if tasks are PARALLEL on same day, this logic is correct (Availability is determined by the longest task).
    // But if Task 2 SUPPOSED to follow Task 1, its date_working should have been calculated?
    // The user says "form shows next available date".
    // So the stored tasks already HAVE dates.
    // We assume they are correct.
];

// Test case where tasks effectively form a chain
// Task A: 27th, 7 hours.
// Task B: 27th? No, if users followed advice, Task B would be 27th?
// Wait, if Task B starts 27th and takes 2 hours.
// If it starts at 0 (date_working), it ends at 2.
// Task A ends at 7.
// Max is 7. Remaining 1.
// BUT, if Task B was "appended", it effectively consumes capacity.
// My logic assumes ALL tasks start at 0 offset of their `date_working`.
// So it assumes parallel execution if on same day.
// Is this correct? "1 district...".
// If "District 1" has 2 tasks on Same Day.
// Are they parallel?
// If one team, they are sequential.
// If sequential, Task 2 should start after Task 1.
// So Task 2's `date_working` should be different? NO, date is day resolution.
// If they share the day, they MUST share the hours.
// My logic `getAvailableDate` calculates `maxEndDate`.
// If I have 10 tasks of 1 hour on Same Day.
// Each ends at Hour 1. Max is Hour 1. Remaining 7.
// THIS IS WRONG for sequential tasks on same day.
// If they are sequential, I should SUM the hours on that day.
// "if 1 district worked 7 hours ... 1 hour can be sent".
// If I have 7 tasks of 1 hour. Total 7 hours.
// My current logic would say "Max is 1 hour". Remaining 7.
// FAILURE PREDICTION: My logic handles "Tail" but not "Stacking" on same day.

// CORRECTION: Group tasks by Day. Sum durations.
// UsedHours = Sum(Duration) of tasks on that Day.
// Then availability = 8 - Sum.
// THIS IS MUCH SIMPLER AND LIKELY CORRECT for "District" logic.
// "District" = Resource. Resource has 8h/day.
// Tasks consume resource.
// Logic:
// 1. Group active tasks by `date_working`.
// 2. Find the "Latest" Day that has any task?
// 3. Or just iterate days?
// "Next available".
// If Day 1 has 7 hours used. Day 2 has 0.
// Next available is Day 1 (1h).
// If Day 1 full. Day 2 has 3h used.
// Next available is Day 2 (5h).
// But user wants "Next FUTURE available".
// So find the latest day that is NOT full?
// Or append to the very end?
// Usually append to end.
// So finding the Last Day with tasks. Check its sum.
// If Sum < 8, return Late Day (Remaining).
// If Sum >= 8, return Next Day (8h).

console.log("Re-evaluating logic based on 'Stacking'...");
