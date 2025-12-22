import { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Task, Message, FormData } from '../types/task';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response: Message<Task[]> = await invoke("get_all_task_command");
            if (response.info === "Success") {
                setTasks(response.data || []);
            } else {
                setError(`Error fetching tasks: ${response.info}`);
            }
        } catch (err) {
            setError(`Failed to fetch tasks: ${err}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const createTask = async (formData: FormData) => {
        try {
            const response: Message<any> = await invoke("create_task_command", {
                name: formData.name,
                date: formData.date,
                field1: formData.field1,
                field2: formData.field2,
                field3: formData.field3,
            });
            if (response.info === "Success") {
                await fetchTasks();
                window.dispatchEvent(new CustomEvent('tasksUpdated'));
                return { success: true };
            }
            return { success: false, error: response.info };
        } catch (err) {
            console.error("Failed to create task:", err);
            return { success: false, error: String(err) };
        }
    };

    const updateTask = async (id: number, data: Partial<Task> & { date?: number }) => {
        try {
            // Note: The original code used specific arguments for update_task_command
            const response: Message<any> = await invoke("update_task_command", {
                id,
                name: data.name,
                date: data.date, 
                field1: data.field1,
                field2: data.field2,
                field3: data.field3,
                isComlited: data.is_comlited,
            });
            if (response.info === "Success") {
                await fetchTasks();
                return { success: true };
            }
            return { success: false, error: response.info };
        } catch (err) {
            console.error("Failed to update task:", err);
            return { success: false, error: String(err) };
        }
    };

    const updateTaskStatus = async (id: number, isCompleted: boolean) => {
        try {
            await invoke("update_task_check_command", {
                id,
                isComlited: isCompleted,
            });
            await fetchTasks();
            return { success: true };
        } catch (err) {
            console.error("Failed to update task status:", err);
            return { success: false, error: String(err) };
        }
    };

    const deleteTask = async (id: number) => {
        try {
            const response: Message<string> = await invoke("delete_task_command", { id });
            if (response.info === "Success") {
                await fetchTasks();
                window.dispatchEvent(new CustomEvent('tasksUpdated'));
                return { success: true };
            }
            return { success: false, error: response.info };
        } catch (err) {
            console.error("Failed to delete task:", err);
            return { success: false, error: String(err) };
        }
    };

    return {
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask
    };
};
