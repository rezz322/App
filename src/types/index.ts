export interface Task {
  id: number;
  name: string;
  date_materials: number;
  date_working: number;
  date_complited: number;
  field1: number;
  field2: number;
  field3: number;
  field1_end?: number;
  field2_end?: number;
  field3_end?: number;
  all_hour: number;
  is_comlited: number;
  collor?: number; // Noted as collor and color in different files
  color?: number;
}

export interface Offer {
  id: number;
  day: number;
  month: number;
  year: number;
}

export interface Message<T> {
  data: T;
  info: string;
}

export interface FormData {
  date: number;
  name: string;
  field1: number;
  field2: number;
  field3: number;
}

export type DayStateItem = {
  day: number;
  date: Date;
  isWeekend: boolean;
  totalHours: number;
  yer: number;
  month: number;
  tasks: string;
  isWorking: boolean;
  color: number;
  offerId: number | null;
};
