
import { useGoalsData } from "@/hooks/useGoalsData";

export const useWeeklySummaryHooks = () => {
  const careerHook = useGoalsData('career');
  const businessHook = useGoalsData('business');
  const investmentsHook = useGoalsData('investments');
  const skillsHook = useGoalsData('skills');

  const getHookForCategory = (category: string) => {
    switch (category) {
      case 'career': return careerHook;
      case 'business': return businessHook;
      case 'investments': return investmentsHook;
      case 'skills': return skillsHook;
      default: return null;
    }
  };

  return { getHookForCategory };
};
