import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Task, FormData, Message, Offer } from '../types';
import { getAvailableDate, calculateMaterialDate, calculateWorkingDays } from '../utils/dateUtils';
import TimeInput from './TimeInput';

interface TaskFormProps {
  tasks: Task[];
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
}

// Main component for the task creation form
const TaskForm: React.FC<TaskFormProps> = ({ tasks, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    date_working: 0,
    name: '',
    field1: 0,
    field2: 0,
    field3: 0,
  });

  const [customWeekends, setCustomWeekends] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response: Message<Offer[]> = await invoke("get_all_offer_command");
        if (response.info === "Success" && response.data) {
          const weekendSet = new Set<string>();
          response.data.forEach(offer => {
            const dateKey = `${offer.year}-${String(offer.month).padStart(2, '0')}-${String(offer.day).padStart(2, '0')}`;
            weekendSet.add(dateKey);
          });
          setCustomWeekends(weekendSet);
        }
      } catch (e) {
        console.error("Failed to fetch offers:", e);
      }
    };
    fetchOffers();
  }, []);

  // Effect to automatically calculate the next available date when field hours change
  useEffect(() => {
    const calculateDate = async () => {
      if (formData.field1 > 0 || formData.field2 > 0 || formData.field3 > 0) {
        try {
          const response: Message<number> = await invoke("get_next_available_date_command", {
            field1: Number(formData.field1),
            field2: Number(formData.field2),
            field3: Number(formData.field3)
          });

          if (response.info === "Success" && response.data > 0) {
            setFormData(prev => ({ ...prev, date_working: response.data * 1000 }));
          }
        } catch (e) {
          console.error("Failed to calculate date:", e);
        }
      }
    };

    const timeoutId = setTimeout(calculateDate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.field1, formData.field2, formData.field3]);

  // Function to get the formatted next available time string for a specific workstation
  const getNextAvailableTime = (fieldKey: 'field1_end' | 'field2_end' | 'field3_end') => {
    const fieldName = fieldKey.replace('_end', '');
    return getAvailableDate(tasks, fieldName, customWeekends);
  };

  const getEndDate = (minutes: number) => {
    if (!formData.date_working) return new Date();
    return calculateWorkingDays(new Date(formData.date_working), minutes, customWeekends);
  };

  // Handler for form input field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === 'name'
          ? value
          : name === 'date_working'
            ? new Date(value).getTime()
            : value === ''
              ? 0
              : Number(value),
    }));
  };

  // Handler for form submission to save a new order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(formData);
    if (result.success) {
      setFormData({
        date_working: 0,
        name: '',
        field1: 0,
        field2: 0,
        field3: 0,
      });
    } else {
      alert(`Failed to create task: ${result.error}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Додати замовлення
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="orderNumber" className="block text-gray-700 text-sm font-bold mb-2">Імя замовника</label>
            <input type="text" id="orderNumber" name="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
        </div>

        <div className="mb-4 max-w-xs">
          <label className="block text-gray-700 text-sm font-bold mb-2">Дата початку (Автоматично)</label>
          <div className="relative">
            <div className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 min-h-[38px]">
              {formData.date_working ? new Date(formData.date_working).toLocaleDateString('uk-UA') : 'Очікування вводу...'}
            </div>
          </div>
        </div>

        <h3 className="block text-gray-700 text-sm font-bold mb-2">Години роботи по дільницях *</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <TimeInput
              label="Дільниця 1"
              value={formData.field1}
              onChange={(val: number) => setFormData(prev => ({ ...prev, field1: val }))}
            />
            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field1_end')}**</p>
            {formData.date_working > 0 && formData.field1 > 0 && (
                <p className="text-xs text-blue-600 mt-1">Матеріали: **{calculateMaterialDate(new Date(formData.date_working), customWeekends).toLocaleDateString('uk-UA')}**</p>
            )}
          </div>
          <div>
            <TimeInput
              label="Дільниця 2"
              value={formData.field2}
              onChange={(val: number) => setFormData(prev => ({ ...prev, field2: val }))}
            />
            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field2_end')}**</p>
            {formData.date_working > 0 && formData.field2 > 0 && (
                <p className="text-xs text-blue-600 mt-1">Матеріали: **{calculateMaterialDate(getEndDate(formData.field1), customWeekends).toLocaleDateString('uk-UA')}**</p>
            )}
          </div>
          <div>
            <TimeInput
              label="Дільниця 3"
              value={formData.field3}
              onChange={(val: number) => setFormData(prev => ({ ...prev, field3: val }))}
            />
            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field3_end')}**</p>
            {formData.date_working > 0 && formData.field3 > 0 && (
                <p className="text-xs text-blue-600 mt-1">Матеріали: **{calculateMaterialDate(getEndDate(formData.field1 + formData.field2), customWeekends).toLocaleDateString('uk-UA')}**</p>
            )}
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
  );
};

export default TaskForm;
