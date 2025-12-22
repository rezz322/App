import "../App.css"
import React from 'react';
import DashboardStats from '../components/DashboardStats';
import AddTaskForm from '../components/AddTaskForm';
import TaskTable from '../components/TaskTable';
import { useTasks } from '../hooks/useTasks';

export default function Main() {
    const { tasks, loading, error, fetchTasks, createTask } = useTasks();

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
            <p className="text-gray-600 mb-6">Управління замовленнями та робочим часом</p>

            <DashboardStats tasks={tasks} />

            <AddTaskForm tasks={tasks} onSubmit={createTask} />

            <TaskTable 
                tasks={tasks} 
                loading={loading} 
                error={error} 
                refreshTasks={fetchTasks} 
            />
        </div>
    );
}