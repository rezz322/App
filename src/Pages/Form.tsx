import "../App.css"
import React, { useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import Offer from "../Compnents/Offer";

interface FormData {
    date: number;
    name: string;
    field1: number;
    field2: number;
    field3: number;
}

interface Message<T> {
    data: T;
    info: string;
}

interface Task {
    id: number;
    name: string;
    date_materials: number;
    date_working: number;
    date_complited: number;
    field1: number;
    field2: number;
    field3: number;
    field1_end: number,
    field2_end: number,
    field3_end: number,
    all_hour: number;
    is_comlited: number;
}

const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export default function Main() {
    const [formData, setFormData] = useState<FormData>({
        date: 0,
        name: '',
        field1: 0,
        field2: 0,
        field3: 0,
    });

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortColumn, setSortColumn] = useState<keyof Task | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const getNextAvailableTime = (fieldKey: 'field1_end' | 'field2_end' | 'field3_end') => {
        let latestEndTime = 0;
        
        tasks
            .filter(task => task.is_comlited === 0)
            .forEach(task => {
                let currentEndTime = task[fieldKey]*1000;
                if(currentEndTime !== 0 ){
                    currentEndTime + 24*60*60*1000
                }
                if (currentEndTime > latestEndTime) {
                    latestEndTime = currentEndTime;
                }
            });

        if (latestEndTime === 0) {
            return "Вільна"; 
        }
        
        const nextAvailableDate = new Date((latestEndTime ) ); 
        const dateOptions: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return nextAvailableDate.toLocaleString('uk-UA', dateOptions);
    };



    function is_free_for_field(): boolean {

        const proposedStartTimeMs: number = formData.date;
        let isTimeSlotBooked = false;

        if (formData.field1 > 0) {
            for (const task of tasks) {
                if (task.is_comlited === 1) continue;
                if (task.field1 === 0) continue; 

                const existingStartTimeMs = Number(task.date_working) * 1000;
        
                if (existingStartTimeMs < proposedStartTimeMs &&
                    proposedStartTimeMs < task.field1_end * 1000) {
                    isTimeSlotBooked = true;
                    console.log(`Поле field_1 ЗАЙНЯТО: Перетин із завданням ID: ${task.id}, Назва: ${task.name}`);
                    break;
                } 
            }
        }

        return isTimeSlotBooked;
    }


    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response: Message<Task[]> = await invoke("get_all_task_command");
            if (response.info === "Success") {
                setTasks(response.data);

            } else {
                setError(`Error fetching tasks: ${response.info}`);
            }
        } catch (err) {
            setError(`Failed to fetch tasks: ${err}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTasks();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        console.log(name, value);
        
        setFormData((prevData) => ({
            ...prevData,
            [name]:
                name === 'name'
                    ? value
                    : name === 'date'
                    ? new Date(value).getTime()
                    : value === ''
                    ? 0
                    : parseInt(value, 10),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((formData.field1 < 0 || formData.field2 < 0 || formData.field3 < 0) || is_free_for_field()) {
            alert('Дільниці не можуть бути менше 0 або в цей період вже є замовлення');
            return;
        }

        try {
            const response: Message<any> = await invoke("create_task_command", {
                name: formData.name,
                date: formData.date,
                field1: formData.field1,
                field2: formData.field2,
                field3: formData.field3,
            });
            console.log(response);
            if (response.info === "Success") {
                setFormData({
                    date: 0,
                    name: '',
                    field1: 0,
                    field2: 0,
                    field3: 0,
                });
                fetchTasks();
                try { window.dispatchEvent(new CustomEvent('tasksUpdated')); } catch(e){}

            }
        } catch (error) {
            alert(`Failed to create task: ${error}`);
            console.error("Failed to create task:", error);
        }
    };
    
    const handleSort = (column: keyof Task) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!sortColumn) return 0;

        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
            return sortDirection === 'asc' ? Number(aValue - bValue) : Number(bValue - aValue);
        }
        return 0;
    });

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
            <p className="text-gray-600 mb-6">Управління замовленнями та робочим часом</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                        <p className="text-gray-500">Всього годин</p>
                        <p className="text-2xl font-bold">{tasks.reduce((sum, task) => sum + task.all_hour, 0).toFixed(1)}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                        <p className="text-gray-500">Активних замовлень</p>
                        <p className="text-2xl font-bold">{tasks.filter(task => task.is_comlited === 0).length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                        <p className="text-gray-500">В процесі</p>
                        <p className="text-2xl font-bold">{tasks.filter(task => task.is_comlited === 0).length}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-yellow-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                    </svg>
                </div>
                <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                    <div>
                        <p className="text-gray-500">Завершено</p>
                        <p className="text-2xl font-bold">{tasks.filter(task => task.is_comlited === 1).length}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>Додати замовлення</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="orderNumber" className="block text-gray-700 text-sm font-bold mb-2">Імя замовника</label>
                            <input type="text" id="orderNumber" name="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                        </div>
                    </div>

                    <div className="mb-4 max-w-xs">
                        <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Дата початку *</label>
                        <div className="relative">
                            <input type="date" id="startDate" name="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} onChange={handleChange} min={getTodayDate()} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10" required />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5m16.5 7.5v-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <h3 className="block text-gray-700 text-sm font-bold mb-2">Години роботи по дільницях *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label htmlFor="area1" className="block text-gray-700 text-sm font-bold mb-2">Дільниця 1 (год)</label>
                            <input type="number" id="area1" name="field1" value={formData.field1 === 0 ? '' : formData.field1} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  />
                            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field1_end')}**</p>
                        </div>
                        <div>
                            <label htmlFor="area2" className="block text-gray-700 text-sm font-bold mb-2">Дільниця 2 (год)</label>
                            <input type="number" id="area2" name="field2" value={formData.field2 === 0 ? '' : formData.field2} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  />
                            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field2_end')}**</p>
                        </div>
                        <div>
                            <label htmlFor="area3" className="block text-gray-700 text-sm font-bold mb-2">Дільниця 3 (год)</label>
                            <input type="number" id="area3" name="field3" value={formData.field3 === 0 ? '' : formData.field3} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"  />
                              <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field3_end')}**</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 inline-block">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Додати замовлення
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
</svg>Список замовлень</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-xl">Loading tasks...</div>
                ) : error ? (
                    <div className="flex justify-center items-center h-64 text-xl text-red-500">Error: {error}</div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5" />
                        </svg>
                        <p className="text-gray-500 text-lg">Немає замовлень</p>
                        <p className="text-gray-500 text-sm">Додайте перше замовлення через форму вище</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow-md">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('id')}>
                                        Номер
                                        {sortColumn === 'id' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('name')}>
                                        Імя
                                        {sortColumn === 'name' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('all_hour')}>
                                        Всього годин
                                        {sortColumn === 'all_hour' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('field1')}>
                                        Ділянок 1
                                        {sortColumn === 'field1' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('field2')}>
                                        Ділянок 2
                                        {sortColumn === 'field2' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('field3')}>
                                        Ділянок 3
                                        {sortColumn === 'field3' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('date_materials')}>
                                        Дата матеріалів
                                        {sortColumn === 'date_materials' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('date_working')}>
                                        Дата початку
                                        {sortColumn === 'date_materials' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer" onClick={() => handleSort('date_complited')}>
                                        Дата готовності
                                        {sortColumn === 'date_complited' && (
                                            <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>
                                        )}
                                    </th>
                                    <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left">Дії</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTasks.map((task) => (
                                    <Offer key={task.id} task={task} tasks={tasks} refreshTasks={fetchTasks}/>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}