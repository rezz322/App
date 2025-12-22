import { useState } from 'react';
import { useTasks } from "../hooks/useTasks";
import { Task } from "../types";
import DashboardStats from "../components/DashboardStats";
import TaskForm from "../components/TaskForm";
import Offer from "../components/Offer";

export default function Dashboard() {
    const { tasks, loading, error, createTask, updateTask, updateTaskStatus, deleteTask, fetchTasks } = useTasks();
    const [sortColumn, setSortColumn] = useState<keyof Task | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

        if (aValue === undefined || bValue === undefined) return 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5" />
            </svg>
            <p className="text-gray-500 text-lg">Немає замовлень</p>
            <p className="text-gray-500 text-sm">Додайте перше замовлення через форму вище</p>
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 transition-colors">Дашборд</h1>
                    <p className="text-gray-600">Управління замовленнями та робочим часом</p>
                </header>

                <DashboardStats tasks={tasks} />

                <TaskForm tasks={tasks} onSubmit={createTask} />

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                        </svg>
                        Список замовлень
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-gray-500 text-lg">Завантаження...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            Error: {error}
                        </div>
                    ) : tasks.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        {(['id', 'name', 'all_hour', 'field1', 'field2', 'field3', 'date_materials', 'date_complited'] as (keyof Task)[]).map((col) => (
                                            <th 
                                                key={col}
                                                className="py-3 px-4 text-gray-700 font-semibold text-left text-sm uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort(col)}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>{col === 'all_hour' ? 'Години' : col === 'id' ? 'ID' : col.replace('field', 'Дільниця ').replace('date_', 'Дата ')}</span>
                                                    {sortColumn === col && (
                                                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="py-3 px-4 text-gray-700 font-semibold text-left text-sm uppercase tracking-wider">Дії</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTasks.map((task) => (
                                        <Offer 
                                            key={task.id} 
                                            task={task} 
                                            tasks={tasks} 
                                            refreshTasks={fetchTasks}
                                            onUpdate={updateTask}
                                            onDelete={deleteTask}
                                            onStatusToggle={updateTaskStatus}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}