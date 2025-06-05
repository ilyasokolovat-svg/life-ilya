
import React, { useEffect } from 'react';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useAuth } from '@/contexts/AuthContext';

const TestDataLoader: React.FC = () => {
  const { user } = useAuth();
  const { saveGoal } = useGoalsData('investments');

  useEffect(() => {
    if (!user) return;

    // Add sample data for testing - ETF subcategory, Q2, week 2-8 June
    const addSampleData = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = 6; // June (0-indexed, so 5 = June)
      
      // Calculate the week key for June 2-8
      const weekKey = `${currentYear}-${currentMonth}-2`;
      
      saveGoal({
        category: 'investments',
        subcategory: 'ETFs',
        period_key: weekKey,
        period_type: 'week',
        planned_goal: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        actual_result: undefined
      });
    };

    // Add sample data after a short delay to ensure everything is loaded
    const timer = setTimeout(addSampleData, 1000);
    return () => clearTimeout(timer);
  }, [user, saveGoal]);

  return null;
};

export default TestDataLoader;
