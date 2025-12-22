export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isWeekend = (date: Date | number) => {
    const d = typeof date === 'number' ? new Date(date) : date;
    const day = d.getDay();
    return day === 0 || day === 6;
};

export const getFormattedDate = (timestamp: number) => {
    if (timestamp === 0 || !Number.isFinite(timestamp)) return '';
    const dateMs = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
    return new Date(dateMs).toISOString().split('T')[0];
};

export const formatDateUkrainian = (timestamp: number) => {
    if (timestamp === 0 || !Number.isFinite(timestamp)) return '';
    const dateMs = Math.abs(timestamp) < 1e12 ? timestamp * 1000 : timestamp;
    return new Date(dateMs).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};

export const calculateNextWorkingDate = (date: number) => {
    let date_out = 0;
    let data = new Date(date + 24 * 60 * 60 * 1000);
    const day = data.getDay();
    
    if (day === 0) {
        date_out = 2 * 24 * 60 * 60 * 1000;
    } else if (day === 6) {
        date_out = 3 * 24 * 60 * 60 * 1000;
    }
    
    return date + date_out;
};
