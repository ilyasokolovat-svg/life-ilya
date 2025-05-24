
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Calendar from "@/components/Calendar";
import HabitStats from "@/components/HabitStats";
import useLocalStorage from "@/hooks/useLocalStorage";
import { HabitData, HabitType, DayData } from "@/types/habit";
import { format } from 'date-fns';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitData, setHabitData] = useLocalStorage<Record<string, DayData>>("habitData", {});

  const updateHabitData = (date: Date, habitType: HabitType, data: HabitData) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    setHabitData(prev => {
      const currentDayData = prev[formattedDate] || {
        date: formattedDate,
        gym: { planned: false, completed: false },
        alcohol: { planned: false, completed: false },
        sleep: { planned: false, completed: false },
        meditation: { planned: false, completed: false }
      };

      const updatedHabitData = {
        ...prev,
        [formattedDate]: {
          ...currentDayData,
          [habitType]: data,
        },
      };
      return updatedHabitData;
    });
  };

  useEffect(() => {
    console.log("Habit data updated:", habitData);
  }, [habitData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4 hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Healthy Life Tracker
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Calendar 
            days={habitData}
            onUpdateHabit={updateHabitData}
          />
          {/* Note: HabitStats component needs to be updated to work with the new data structure */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <p className="text-gray-600">Statistics will be available soon.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
