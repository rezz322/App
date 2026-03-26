import React from 'react';

interface TimeInputProps {
  label?: string;
  value: number; // total minutes
  onChange: (newValue: number) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseFloat(e.target.value || '0');
    onChange(Math.round(h * 60) + minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let m = parseFloat(e.target.value || '0');
    // Clamp minutes between 0 and 59
    if (m < 0) m = 0;
    if (m > 59) m = 59;
    onChange(hours * 60 + Math.round(m));
  };

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs font-bold mb-1 text-gray-700">{label}</label>}
      <div className="flex items-center space-x-1">
        <div className="flex items-center">
          <input
            type="number"
            min="0"
            step="any"
            value={hours || ''}
            onChange={handleHoursChange}
            className="w-16 border rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0"
          />
          <span className="text-xs ml-1 text-gray-500 font-medium">год</span>
        </div>
        <div className="flex items-center">
          <input
            type="number"
            min="0"
            max="59"
            step="any"
            value={minutes || ''}
            onChange={handleMinutesChange}
            className="w-16 border rounded px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="0"
          />
          <span className="text-xs ml-1 text-gray-500 font-medium">хв</span>
        </div>
      </div>
    </div>
  );
};

export default TimeInput;
