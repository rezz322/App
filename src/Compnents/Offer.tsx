import "../App.css"
import React, { useState } from 'react';
import { invoke } from "@tauri-apps/api/core";


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
}

interface OfferProps {
    task: Task;
    tasks?: Task[]; 
    refreshTasks: () => void;
}


export default function Offer({ task, tasks, refreshTasks }: OfferProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Task>(task);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedTask((prevData) => ({
            ...prevData,
            [name]:
                name === 'name'
                    ? value
                    : name.startsWith('date')
                        ? new Date(value).getTime() // Получаем мс
                        : parseInt(value, 10),
        }));
    };

const handleToggleComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;


        await invoke("update_task_check_command", {
            id: task.id,
            isComlited: isChecked,
        });
        refreshTasks();   
        console.log("Статус успешно изменен на:", isChecked);

};
    const handleUpdate = async () => {
        try {
            console.log(editedTask);
            const normalizeMs = (value: number) => (value < 1e12 ? value * 1000 : value);

            if (tasks) {
                const proposedStartMs = normalizeMs(Number(editedTask.date_working));
                const proposedDaysSet = new Set<string>();
                const days1 = Math.ceil(Number(editedTask.field1) / 8) || 0;
                const days2 = Math.ceil(Number(editedTask.field2) / 8) || 0;
                const getWorkingDaysForDilytsia = (startMs: number, hours: number, offsetDays: number) => {

                    const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
                    const addDays = (d: Date, days: number) => { const res = new Date(d); res.setDate(res.getDate() + days); return res; };
                    const toIsoDay = (d: Date) => d.toISOString().split('T')[0];
                    const days: string[] = [];
                    if (!hours || hours <= 0) return days;
                    const startDate = new Date(startMs);
                    let current = new Date(startDate);
                    let off = offsetDays;
                    while (off > 0) {
                        current = addDays(current, 1);
                        if (!isWeekend(current)) off--;
                    }
                    const needed = Math.max(1, Math.ceil(hours / 8));
                    let count = 0;
                    while (count < needed) {
                        if (!isWeekend(current)) {
                            days.push(toIsoDay(current));
                            count++;
                        }
                        current = addDays(current, 1);
                    }
                    return days;
                };

                getWorkingDaysForDilytsia(proposedStartMs, editedTask.field1, 0).forEach(d => proposedDaysSet.add(d + '-field1'));
                getWorkingDaysForDilytsia(proposedStartMs, editedTask.field2, days1).forEach(d => proposedDaysSet.add(d + '-field2'));
                getWorkingDaysForDilytsia(proposedStartMs, editedTask.field3, days1 + days2).forEach(d => proposedDaysSet.add(d + '-field3'));

                const occupied = new Map<string, number>();
                tasks.forEach((t) => {
                    if (t.id === editedTask.id || t.is_comlited === 1) return;
                    const startMs = normalizeMs(Number(t.date_working));
                    const tDays1 = Math.ceil(Number(t.field1) / 8) || 0;
                    const tDays2 = Math.ceil(Number(t.field2) / 8) || 0;
                    getWorkingDaysForDilytsia(startMs, t.field1, 0).forEach(d => occupied.set(d + '-field1', t.id));
                    getWorkingDaysForDilytsia(startMs, t.field2, tDays1).forEach(d => occupied.set(d + '-field2', t.id));
                    getWorkingDaysForDilytsia(startMs, t.field3, tDays1 + tDays2).forEach(d => occupied.set(d + '-field3', t.id));
                });

                const conflict = [...proposedDaysSet].some(k => occupied.has(k));
                if (conflict) {
                    alert('Цей період вже зайнятий іншим замовленням. Виберіть іншу дату/години.');
                    return;
                }
            }

            const response: { info: string, data: Task } = await invoke("update_task_command", {
                id: editedTask.id,
                name: editedTask.name,
                date: editedTask.date_working, 
                field1: editedTask.field1,
                field2: editedTask.field2,
                field3: editedTask.field3,
                isComlited: editedTask.is_comlited, 
            });

            if (response.info === "Success") {
                alert("Task updated successfully!");
                setIsEditing(false);
                refreshTasks();
                try { window.dispatchEvent(new CustomEvent('tasksUpdated')); } catch(e) { }
            } else {
                alert(`Error updating task: ${response.info}`);
            }
        } catch (error) {
            alert(`Failed to update task: ${error}`);
            console.error("Failed to update task:", error);
        }
    };

    const handleDelete = async () => {
        try {
            const response: { info: string, data: string } = await invoke("delete_task_command", { id: task.id });
            if (response.info === "Success") {
                refreshTasks();
                try { window.dispatchEvent(new CustomEvent('tasksUpdated')); } catch(e) { }
            } else {
                alert(`Error deleting task: ${response.info}`);
            }
        } catch (error) {
            alert(`Failed to delete task: ${error}`);
            console.error("Failed to delete task:", error);
        }
    };

    const getFormattedDate = (timestamp: number) => {
        if (timestamp === 0 || !Number.isFinite(timestamp)) return '';
        const dateMs = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
        return new Date(dateMs).toISOString().split('T')[0];
    };



    return (
        <tr className="border-b last:border-b-0">
            {isEditing ? (
                // ... (Код режима редактирования)
                <td colSpan={10} className="p-4"> 
                    <div className="flex flex-col space-y-2 w-full">
                        <input
                            type="text"
                            name="name"
                            value={editedTask.name}
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        />
                        <input
                            type="date"
                            name="date_working"

                            value={getFormattedDate(editedTask.date_working)} 
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        />
                        <input
                            type="number"
                            name="field1"
                            value={editedTask.field1}
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        />
                        <input
                            type="number"
                            name="field2"
                            value={editedTask.field2}
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        />
                        <input
                            type="number"
                            name="field3"
                            value={editedTask.field3}
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        />
                        <select
                            name="is_comlited"
                            value={editedTask.is_comlited}
                            onChange={handleChange}
                            className="border rounded px-2 py-1"
                        >
                            <option value={0}>В процесі</option>
                            <option value={1}>Завершено</option>
                        </select>
                        <div className="flex space-x-2 mt-2">
                            <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-1 rounded">Зберегти</button>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-3 py-1 rounded">Скасувати</button>
                        </div>
                    </div>
                </td>
                // ...
            ) : (
                <>
                    <td className="py-2 px-4">{task.id}</td>
                    <td className="py-2 px-4">{task.name}</td>
                    <td className="py-2 px-4">{task.all_hour} год</td>
                    <td className="py-2 px-4">{task.field1}</td>
                    <td className="py-2 px-4">{task.field2}</td>
                    <td className="py-2 px-4">{task.field3}</td>
                    <td className="py-2 px-4">{new Date(task.date_materials * 1000).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}.</td>
                    <td className="py-2 px-4">{new Date(task.date_complited * 1000).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}.</td>
                    <td className="py-2 px-4 flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={task.is_comlited === 1}
                            onChange={handleToggleComplete}
                            title={task.is_comlited === 1 ? 'Позначити як "В процесі"' : 'Позначити як "Завершено"'}
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${task.is_comlited === 1 ? 'bg-green-50 text-green-800 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'} ring-1 ring-inset`}>
                            {task.is_comlited === 1 ? 'Завершено' : 'В процесі'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500 cursor-pointer" onClick={() => setIsEditing(true)}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500 cursor-pointer" onClick={handleDelete}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0l-.91-9m9.288-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.74 6.784m11.318 0l-.919-.259M12 2.25h3c1.02 0 1.96.284 2.8.775M9 2.25H6c-1.02 0-1.96.284-2.8.775M12 5.25v1.5M12 9v1.5M12 12v1.5M12 15v1.5" />
                        </svg>
                        
                    </td>
                </>
            )}
        </tr>
    );
}