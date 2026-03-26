import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Task, Message } from "../types";
import { formatMinutesToHM, formatUkDayMonthOnly } from "../utils/dateUtils";
import TimeInput from "./TimeInput";

interface OfferProps {
    task: Task;
    tasks?: Task[];
    refreshTasks: () => void;
    onUpdate: (task: any) => Promise<{ success: boolean; error?: string }>;
    onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
    onStatusToggle: (id: number, status: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function Offer({ task, onUpdate, onDelete, onStatusToggle }: OfferProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState<Task>(task);

    useEffect(() => {
        const calculateDate = async () => {
            if (isEditing && (editedTask.field1 > 0 || editedTask.field2 > 0 || editedTask.field3 > 0)) {
                try {
                    const response: Message<number> = await invoke("get_next_available_date_command", {
                        field1: Number(editedTask.field1),
                        field2: Number(editedTask.field2),
                        field3: Number(editedTask.field3)
                    });

                    if (response.info === "Success" && response.data > 0) {
                        setEditedTask(prev => ({ ...prev, date_working: response.data * 1000 }));
                    }
                } catch (e) {
                    console.error("Failed to calculate date:", e);
                }
            }
        };

        const timeoutId = setTimeout(calculateDate, 500);
        return () => clearTimeout(timeoutId);
    }, [isEditing, editedTask.field1, editedTask.field2, editedTask.field3]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedTask((prevData) => ({
            ...prevData,
            [name]: name === 'name' ? value : Number(value),
        }));
    };

    const handleToggleComplete = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await onStatusToggle(task.id, e.target.checked);
    };

    const handleUpdate = async () => {
        const result = await onUpdate(editedTask);
        if (result.success) {
            setIsEditing(false);
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    const handleDelete = async () => {
        await onDelete(task.id);
    };





    if (isEditing) {
        return (
            <tr className="border-b last:border-b-0">
                <td colSpan={11} className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Назва</label>
                            <input type="text" name="name" value={editedTask.name} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дата початку</label>
                            <div className="border rounded px-2 py-1 bg-gray-100 text-sm h-[30px] flex items-center">
                                {editedTask.date_working ? new Date(editedTask.date_working).toLocaleDateString('uk-UA') : 'Розрахунок...'}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 1</label>
                            <TimeInput 
                                value={editedTask.field1} 
                                onChange={(val: number) => setEditedTask(prev => ({ ...prev, field1: val }))} 
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 2</label>
                            <TimeInput 
                                value={editedTask.field2} 
                                onChange={(val: number) => setEditedTask(prev => ({ ...prev, field2: val }))} 
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 3</label>
                            <TimeInput 
                                value={editedTask.field3} 
                                onChange={(val: number) => setEditedTask(prev => ({ ...prev, field3: val }))} 
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Статус</label>
                            <select name="is_comlited" value={editedTask.is_comlited} onChange={handleChange} className="border rounded px-2 py-1">
                                <option value={0}>В процесі</option>
                                <option value={1}>Завершено</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дата матеріалів</label>
                            <div className="border rounded px-2 py-1 bg-gray-100 text-sm h-[30px] flex items-center">
                                {editedTask.date_materials ? new Date(editedTask.date_materials < 1e12 ? editedTask.date_materials * 1000 : editedTask.date_materials).toLocaleDateString('uk-UA') : 'Розрахунок...'}
                            </div>
                        </div>
                        <div className="flex items-end space-x-2">
                            <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Зберегти</button>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Скасувати</button>
                        </div>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b last:border-b-0 hover:bg-gray-50 transition-colors h-[64px]">
            <td className="py-2 px-4 font-medium text-gray-900 border-r">{task.id}</td>
            <td className="py-2 px-4 border-r">{task.name}</td>
            <td className="py-2 px-4 font-bold border-r text-center">{formatMinutesToHM(task.all_hour)}</td>
            
            {/* D1 */}
            <td className="py-2 px-4 text-center border-r">{task.field1 > 0 ? formatMinutesToHM(task.field1) : '-'}</td>
            <td className="py-2 px-4 border-r text-[11px] leading-tight min-w-[120px]">
                <div className="text-blue-600 font-medium">П: {formatUkDayMonthOnly(task.date_working)}.</div>
                <div className="text-gray-500">М: {task.date_materials1 > 0 ? `${formatUkDayMonthOnly(task.date_materials1)}.` : '-'}</div>
            </td>

            {/* D2 */}
            <td className="py-2 px-4 text-center border-r">{task.field2 > 0 ? formatMinutesToHM(task.field2) : '-'}</td>
            <td className="py-2 px-4 border-r text-[11px] leading-tight min-w-[120px]">
                <div className="text-blue-600 font-medium">П: {formatUkDayMonthOnly(task.field1 > 0 ? task.field1_end : task.date_working)}.</div>
                <div className="text-gray-500">М: {task.date_materials2 > 0 ? `${formatUkDayMonthOnly(task.date_materials2)}.` : '-'}</div>
            </td>

            {/* D3 */}
            <td className="py-2 px-4 text-center border-r">{task.field3 > 0 ? formatMinutesToHM(task.field3) : '-'}</td>
            <td className="py-2 px-4 border-r text-[11px] leading-tight min-w-[120px]">
                <div className="text-blue-600 font-medium">П: {formatUkDayMonthOnly(task.field2 > 0 ? task.field2_end : (task.field1 > 0 ? task.field1_end : task.date_working))}.</div>
                <div className="text-gray-500">М: {task.date_materials3 > 0 ? `${formatUkDayMonthOnly(task.date_materials3)}.` : '-'}</div>
            </td>

            <td className="py-2 px-4 text-gray-700 border-r text-center">{formatUkDayMonthOnly(task.date_complited)}.</td>

            <td className="py-2 px-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={task.is_comlited === 1}
                        onChange={handleToggleComplete}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                    />
                    
                    {task.is_comlited === 1 ? (
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded border border-green-200">Завершено</span>
                    ) : (
                        <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded border border-yellow-100 italic">В процесі</span>
                    )}

                    <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}