// Universal date utilities for Dubai timezone (GMT+4)
import { format, parseISO } from "date-fns";

// Get current date in Dubai timezone (GMT+4)
export const getDubaiDate = (): Date => {
  const now = new Date();
  
  // Get the current UTC time and add 4 hours for Dubai timezone (GMT+4)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const dubaiTime = new Date(utcTime + (4 * 3600000)); // Add 4 hours for GMT+4
  
  // Reset to start of day for consistency
  dubaiTime.setHours(0, 0, 0, 0);
  
  console.log('getDubaiDate: UTC now:', now.toISOString());
  console.log('getDubaiDate: Dubai date calculated:', dubaiTime.toISOString());
  console.log('getDubaiDate: Dubai date local string:', dubaiTime.toString());
  
  return dubaiTime;
};

// Format date as ISO string (YYYY-MM-DD) - universal across app
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get today's date in ISO format using Dubai timezone
export const getTodayISO = (): string => {
  return formatDateISO(getDubaiDate());
};

// Parse ISO date string to Date object
export const parseISODate = (dateISO: string): Date => {
  return parseISO(dateISO + 'T00:00:00.000Z');
};

// Get days in a specific month
export const getDaysInMonth = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
};

// Format month as YYYY-MM
export const formatYearMonth = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};
