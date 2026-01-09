import React, { useState } from 'react';
import { Task } from "../types";
import { formatUkDayMonth, normalizeMs } from "../utils/dateUtils";

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedTask((prevData) => ({
            ...prevData,
            [name]: name === 'name' ? value : name.startsWith('date') ? new Date(value).getTime() : parseInt(value, 10),
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
        if (window.confirm("Ви впевнені, що хочете видалити це замовлення?")) {
            await onDelete(task.id);
        }
    };

    const getFormattedDate = (timestamp: number) => {
        if (timestamp === 0 || !Number.isFinite(timestamp)) return '';
        const dateMs = normalizeMs(timestamp);
        return new Date(dateMs).toISOString().split('T')[0];
    };

    if (isEditing) {
        return (
            <tr className="border-b last:border-b-0">
                <td colSpan={9} className="p-4"> 
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Назва</label>
                            <input type="text" name="name" value={editedTask.name} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дата</label>
                            <input type="date" name="date_working" value={getFormattedDate(editedTask.date_working)} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 1</label>
                            <input type="number" name="field1" value={editedTask.field1} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 2</label>
                            <input type="number" name="field2" value={editedTask.field2} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Дільниця 3</label>
                            <input type="number" name="field3" value={editedTask.field3} onChange={handleChange} className="border rounded px-2 py-1" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-bold mb-1">Статус</label>
                            <select name="is_comlited" value={editedTask.is_comlited} onChange={handleChange} className="border rounded px-2 py-1">
                                <option value={0}>В процесі</option>
                                <option value={1}>Завершено</option>
                            </select>
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
        <tr className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
            <td className="py-2 px-4 font-medium text-gray-900">{task.id}</td>
            <td className="py-2 px-4">{task.name}</td>
            <td className="py-2 px-4 font-semibold">{task.all_hour} год</td>
            <td className="py-2 px-4 text-center">{task.field1}</td>
            <td className="py-2 px-4 text-center">{task.field2}</td>
            <td className="py-2 px-4 text-center">{task.field3}</td>
            <td className="py-2 px-4 text-gray-600">{formatUkDayMonth(task.date_materials)}</td>
            <td className="py-2 px-4 text-gray-600">{formatUkDayMonth(task.date_working)}</td>
            <td className="py-2 px-4 text-gray-600">{formatUkDayMonth(task.date_complited)}</td>
            <td className="py-2 px-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={task.is_comlited === 1}
                        onChange={handleToggleComplete}
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${task.is_comlited === 1 ? 'bg-green-50 text-green-800 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'} ring-1 ring-inset`}>
                        {task.is_comlited === 1 ? 'Завершено' : 'В процесі'}
                    </span>
                    <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button onClick={handleDelete} className="text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0l-.91-9m9.288-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.74 6.784m11.318 0l-.919-.259M12 2.25h3c1.02 0 1.96.284 2.8.775M9 2.25H6c-1.02 0-1.96.284-2.8.775M12 5.25v1.5" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}