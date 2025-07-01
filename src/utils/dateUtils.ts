
// Universal date utilities for Dubai timezone (GMT+4)
import { format, parseISO } from "date-fns";

// Get current date in Dubai timezone (GMT+4)
export const getDubaiDate = (): Date => {
  const now = new Date();
  
  // Create a new date object representing the current time in Dubai
  // We need to get the Dubai time properly without losing days
  const dubaiTimeString = now.toLocaleString("en-US", {
    timeZone: "Asia/Dubai",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  
  // Parse the Dubai date string to get year, month, day
  const [month, day, year] = dubaiTimeString.split(',')[0].split('/');
  
  // Create a new date object for Dubai date at start of day
  const dubaiDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  dubaiDate.setHours(0, 0, 0, 0);
  
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
