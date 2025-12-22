import React, { useState } from 'react';
import { Task } from '../types/task';
import Offer from './Offer';

interface TaskTableProps {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    refreshTasks: () => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, loading, error, refreshTasks }) => {
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
        } else if (typeof aValue === 'bigint' && typeof bValue === 'bigint') {
            return sortDirection === 'asc' ? Number(aValue - bValue) : Number(bValue - aValue);
        }
        return 0;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-xl">Loading tasks...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-64 text-xl text-red-500">Error: {error}</div>;
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg p-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5m0 0a2.25 2.25 0 0 0 0 4.5h16.5m-16.5-4.5a2.25 2.25 0 0 1 0-4.5h16.5m-16.5 4.5v7.5m-16.5-7.5h16.5" />
                </svg>
                <p className="text-gray-500 text-lg">Немає замовлень</p>
                <p className="text-gray-500 text-sm">Додайте перше замовлення через форму вище</p>
            </div>
        );
    }

    const sortIndicator = (column: keyof Task) => {
        if (sortColumn !== column) return null;
        return <span>{sortDirection === 'asc' ? ' ⬆' : ' ⬇'}</span>;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
                Список замовлень
            </h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                    <thead>
                        <tr>
                            {['id', 'name', 'all_hour', 'field1', 'field2', 'field3', 'date_materials', 'date_working', 'date_complited'].map((col) => (
                                <th
                                    key={col}
                                    className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left cursor-pointer"
                                    onClick={() => handleSort(col as keyof Task)}
                                >
                                    {col === 'id' ? 'Номер' : 
                                     col === 'name' ? 'Імя' : 
                                     col === 'all_hour' ? 'Всього годин' : 
                                     col === 'field1' ? 'Ділянок 1' : 
                                     col === 'field2' ? 'Ділянок 2' : 
                                     col === 'field3' ? 'Ділянок 3' : 
                                     col === 'date_materials' ? 'Дата матеріалів' : 
                                     col === 'date_working' ? 'Дата початку' : 
                                     'Дата готовності'}
                                    {sortIndicator(col as keyof Task)}
                                </th>
                            ))}
                            <th className="py-2 px-4 bg-gray-200 text-gray-700 font-bold text-left">Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map((task) => (
                            <Offer key={task.id} task={task} tasks={tasks} refreshTasks={refreshTasks} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskTable;
