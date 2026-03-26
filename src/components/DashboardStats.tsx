import { Task } from '../types';
import { formatMinutesToHM } from '../utils/dateUtils';

interface DashboardStatsProps {
  tasks: Task[];
}

// Component to display overall task statistics on the dashboard
const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks }) => {
  const totalMinutes = tasks.reduce((sum, task) => sum + task.all_hour, 0);
  const totalHoursStr = formatMinutesToHM(totalMinutes);
  const activeTasks = tasks.filter(task => task.is_comlited === 0).length;
  const inProgress = tasks.filter(task => task.is_comlited === 0).length;
  const completed = tasks.filter(task => task.is_comlited === 1).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p className="text-gray-500">Всього годин</p>
          <p className="text-2xl font-bold">{totalHoursStr}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p className="text-gray-500">Активних замовлень</p>
          <p className="text-2xl font-bold">{activeTasks}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p className="text-gray-500">В процесі</p>
          <p className="text-2xl font-bold">{inProgress}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-yellow-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
        </svg>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div>
          <p className="text-gray-500">Завершено</p>
          <p className="text-2xl font-bold">{completed}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    </div>
  );
};

export default DashboardStats;
