// Universal date utilities for Dubai timezone (GMT+4)
import { format, parseISO } from "date-fns";

// Get current date in Dubai timezone (GMT+4)
export const getDubaiDate = (): Date => {
  const now = new Date();
  
  // Get the current time in Dubai timezone using Intl.DateTimeFormat
  const dubaiFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const dubaiDateString = dubaiFormatter.format(now);
  console.log('getDubaiDate: UTC now:', now.toISOString());
  console.log('getDubaiDate: Dubai date string:', dubaiDateString);
  
  // Parse the date string and create a proper Date object
  const [year, month, day] = dubaiDateString.split('-').map(Number);
  const dubaiDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  console.log('getDubaiDate: Dubai date calculated:', dubaiDate.toISOString());
  console.log('getDubaiDate: Dubai date local string:', dubaiDate.toString());
  
  return dubaiDate;
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
