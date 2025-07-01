
// Universal date utilities for Dubai timezone (GMT+4)
import { format, parseISO } from "date-fns";

// Get current date in Dubai timezone (GMT+4)
export const getDubaiDate = (): Date => {
  // Create a new date in Dubai timezone using Intl API
  const dubaiFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = dubaiFormatter.formatToParts(new Date());
  const dubaiDateString = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}T${parts.find(p => p.type === 'hour')?.value}:${parts.find(p => p.type === 'minute')?.value}:${parts.find(p => p.type === 'second')?.value}`;
  
  const dubaiDate = new Date(dubaiDateString);
  
  console.log('getDubaiDate: Current UTC time:', new Date().toISOString());
  console.log('getDubaiDate: Dubai date calculated:', dubaiDate.toISOString());
  console.log('getDubaiDate: Dubai date string for comparison:', formatDateISO(dubaiDate));
  
  return dubaiDate;
};

// Format date as ISO string (YYYY-MM-DD) - universal across app
export const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
