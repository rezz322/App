import React, { useState } from 'react';
import { Task, FormData } from '../types';
import { getTodayDateString, formatUkDateTime } from '../utils/dateUtils';

interface TaskFormProps {
  tasks: Task[];
  onSubmit: (data: FormData) => Promise<{ success: boolean; error?: string }>;
}

const TaskForm: React.FC<TaskFormProps> = ({ tasks, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    date: 0,
    name: '',
    field1: 0,
    field2: 0,
    field3: 0,
  });

  const getNextAvailableTime = (fieldKey: 'field1_end' | 'field2_end' | 'field3_end') => {
    let latestEndTime = 0;
    tasks
      .filter(task => task.is_comlited === 0)
      .forEach(task => {
        const currentEndTime = (task[fieldKey] || 0) * 1000;
        if (currentEndTime > latestEndTime) {
          latestEndTime = currentEndTime;
        }
      });

    if (latestEndTime === 0) return "Вільна";
    const nextAvailableDate = new Date(latestEndTime + 24 * 60 * 60 * 1000);
    return formatUkDateTime(nextAvailableDate);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
    const result = await onSubmit(formData);
    if (result.success) {
      setFormData({
        date: 0,
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
          <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Дата початку *</label>
          <div className="relative">
            <input type="date" id="startDate" name="date" value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''} onChange={handleChange} min={getTodayDateString()} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10" required />
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
            <input type="number" id="area1" name="field1" value={formData.field1 === 0 ? '' : formData.field1} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
            <p className="text-xs text-gray-500 mt-1">Наступна доступна: **{getNextAvailableTime('field1_end')}**</p>
          </div>
          <div>
            <label htmlFor="area2" className="block text-gray-700 text-sm font-bold mb-2">Дільниця 2 (год)</label>
            <input type="number" id="area2" name="field2" value={formData.field2 === 0 ? '' : formData.field2} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div>
            <label htmlFor="area3" className="block text-gray-700 text-sm font-bold mb-2">Дільниця 3 (год)</label>
            <input type="number" id="area3" name="field3" value={formData.field3 === 0 ? '' : formData.field3} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
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
