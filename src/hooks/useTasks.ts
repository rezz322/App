import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Task, Message } from "@/types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: Message<Task[]> = await invoke("get_all_task_command");
      if (response.info === "Success") {
        setTasks(response.data || []);
      } else {
        setError(`Error fetching tasks: ${response.info}`);
      }
    } catch (err) {
      setError(`Failed to fetch tasks: ${String(err)}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = async (formData: { name: string; date: number; field1: number; field2: number; field3: number }) => {
    try {
      const response: Message<any> = await invoke("create_task_command", formData);
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

  const updateTask = async (taskData: any) => {
    try {
      const response: Message<Task> = await invoke("update_task_command", taskData);
      if (response.info === "Success") {
        await fetchTasks();
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
        return { success: true };
      }
      return { success: false, error: response.info };
    } catch (err) {
      console.error("Failed to update task:", err);
      return { success: false, error: String(err) };
    }
  };

  const updateTaskStatus = async (id: number, isComlited: boolean) => {
    try {
      await invoke("update_task_check_command", { id, isComlited });
      await fetchTasks();
      return { success: true };
    } catch (err) {
      console.error("Failed to update status:", err);
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

  useEffect(() => {
    fetchTasks();
    
    // Synchronize between routes if one page updates tasks
    const handleUpdate = () => fetchTasks();
    window.addEventListener('tasksUpdated', handleUpdate);
    return () => window.removeEventListener('tasksUpdated', handleUpdate);
  }, [fetchTasks]);

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
}
