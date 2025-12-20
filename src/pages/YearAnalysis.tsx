import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Briefcase,
  TrendingUp,
  Heart,
  Users,
  BookOpen,
  Brain,
  Star,
  Target,
  Trophy,
  Lightbulb,
  ChevronRight,
  Sparkles,
  Award,
  Eye,
  PenLine,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WheelOfLife from "@/components/year-analysis/WheelOfLife";
import CategoryComparisonCard from "@/components/year-analysis/CategoryComparisonCard";
import KeyInsights from "@/components/year-analysis/KeyInsights";
import NextYearPlanning from "@/components/year-analysis/NextYearPlanning";
import ProgressTracker from "@/components/year-analysis/ProgressTracker";

interface CategoryData {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  yearStartGoal: string;
  yearResult: string;
  achievements: string;
  challenges: string;
  lessons: string;
  rating: number;
  nextYearGoal: string;
}

const categories: Omit<CategoryData, 'yearStartGoal' | 'yearResult' | 'achievements' | 'challenges' | 'lessons' | 'rating' | 'nextYearGoal'>[] = [
  { id: 'career', name: 'Career', icon: Briefcase, color: 'text-blue-500', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'investment', name: 'Investment', icon: TrendingUp, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'health', name: 'Health', icon: Heart, color: 'text-rose-500', gradient: 'from-rose-500 to-pink-600' },
  { id: 'relationship', name: 'Relationships', icon: Users, color: 'text-purple-500', gradient: 'from-purple-500 to-violet-600' },
  { id: 'learning', name: 'Learning', icon: BookOpen, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-600' },
  { id: 'self-awareness', name: 'Self Awareness', icon: Brain, color: 'text-cyan-500', gradient: 'from-cyan-500 to-sky-600' },
];

const YearAnalysis = () => {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const selectedYear = year || String(new Date().getFullYear());
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('career');
  const [localData, setLocalData] = useState<Record<string, Partial<CategoryData>>>({});
  const [viewMode, setViewMode] = useState<'edit' | 'summary'>('edit');

  // Fetch year analysis data
  const { data: analysisData = [], isLoading } = useQuery({
    queryKey: ['year_analysis', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goals_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'year_analysis')
        .eq('period_key', selectedYear);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (categoryData: { categoryId: string; field: string; value: string | number }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const existingRecord = analysisData.find(d => d.subcategory === categoryData.categoryId);
      
      let currentData: Record<string, string | number> = {};
      if (existingRecord?.actual_result) {
        try {
          currentData = JSON.parse(existingRecord.actual_result);
        } catch {
          currentData = {};
        }
      }
      
      currentData[categoryData.field] = categoryData.value;
      
      const { error } = await supabase
        .from('goals_data')
        .upsert({
          user_id: user.id,
          category: 'year_analysis',
          subcategory: categoryData.categoryId,
          period_type: 'year_analysis',
          period_key: selectedYear,
          actual_result: JSON.stringify(currentData),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,category,subcategory,period_key',
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['year_analysis', user?.id, selectedYear] });
    },
    onError: (error) => {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    },
  });

  const getCategoryData = (categoryId: string): Partial<CategoryData> => {
    const dbRecord = analysisData.find(d => d.subcategory === categoryId);
    let parsedData: Record<string, string | number> = {};
    
    if (dbRecord?.actual_result) {
      try {
        parsedData = JSON.parse(dbRecord.actual_result);
      } catch {
        parsedData = {};
      }
    }
    
    return { ...parsedData, ...localData[categoryId] };
  };

  const updateField = (categoryId: string, field: string, value: string | number) => {
    setLocalData(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value }
    }));
    saveMutation.mutate({ categoryId, field, value });
  };

  const getOverallScore = () => {
    let totalScore = 0;
    let ratedCategories = 0;
    
    categories.forEach(cat => {
      const data = getCategoryData(cat.id);
      if (data.rating && typeof data.rating === 'number') {
        totalScore += data.rating;
        ratedCategories++;
      }
    });
    
    return ratedCategories > 0 ? Math.round(totalScore / ratedCategories) : 0;
  };

  // Calculate progress
  const getProgressStats = () => {
    const fields = ['yearStartGoal', 'yearResult', 'achievements', 'challenges', 'lessons', 'rating', 'nextYearGoal'];
    let totalFields = categories.length * fields.length;
    let filledFields = 0;

    categories.forEach(cat => {
      const data = getCategoryData(cat.id);
      fields.forEach(field => {
        const value = data[field as keyof CategoryData];
        if (value && (typeof value === 'number' ? value > 0 : value.toString().trim().length > 0)) {
          filledFields++;
        }
      });
    });

    return { totalFields, filledFields };
  };

  // Prepare data for components
  const wheelOfLifeData = categories.map(cat => {
    const data = getCategoryData(cat.id);
    return {
      category: cat.name,
      rating: typeof data.rating === 'number' ? data.rating : 0,
      fullMark: 10
    };
  });

  const insightData = categories.map(cat => {
    const data = getCategoryData(cat.id);
    return {
      name: cat.name,
      achievements: (data.achievements as string) || '',
      lessons: (data.lessons as string) || '',
      rating: typeof data.rating === 'number' ? data.rating : 0
    };
  });

  const nextYearGoals = categories.map(cat => {
    const data = getCategoryData(cat.id);
    return {
      name: cat.name,
      icon: cat.icon,
      gradient: cat.gradient,
      goal: (data.nextYearGoal as string) || ''
    };
  });

  const activeCategoryInfo = categories.find(c => c.id === activeCategory)!;
  const activeCategoryData = getCategoryData(activeCategory);
  const { totalFields, filledFields } = getProgressStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/year-analysis">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Years
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">Year in Review</h1>
                <span className="px-3 py-1 bg-amber-500/30 text-amber-300 text-lg font-bold rounded-lg">
                  {selectedYear}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className={viewMode === 'edit' 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'}
              >
                <PenLine className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('summary')}
                className={viewMode === 'summary' 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'}
              >
                <Eye className="w-4 h-4 mr-2" />
                Summary
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressTracker totalFields={totalFields} filledFields={filledFields} />
        </div>

        {viewMode === 'summary' ? (
          /* SUMMARY VIEW */
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Score */}
              <Card className="bg-amber-950/60 border-amber-600/40 backdrop-blur-lg">
                <CardContent className="p-8 text-center">
                  <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <div className="text-7xl font-bold text-white mb-2">{getOverallScore()}</div>
                  <p className="text-amber-200 text-xl">Overall Year Score</p>
                  <p className="text-white/60 text-sm mt-2">Average across all categories</p>
                </CardContent>
              </Card>

              {/* Wheel of Life */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Wheel of Life
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WheelOfLife data={wheelOfLifeData} colors={{}} />
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <KeyInsights categories={insightData} />

            {/* Side by Side Comparisons */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-amber-400" />
                Goals vs Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const data = getCategoryData(cat.id);
                  return (
                    <CategoryComparisonCard
                      key={cat.id}
                      name={cat.name}
                      icon={cat.icon}
                      gradient={cat.gradient}
                      yearStartGoal={(data.yearStartGoal as string) || ''}
                      achievements={(data.achievements as string) || ''}
                      rating={typeof data.rating === 'number' ? data.rating : 0}
                    />
                  );
                })}
              </div>
            </div>

            {/* Next Year Planning */}
            <NextYearPlanning goals={nextYearGoals} />

            {/* Inspirational Quote */}
            <div className="text-center py-8">
              <blockquote className="text-xl text-white/60 italic max-w-2xl mx-auto">
                "Are my choices helping me live the life I want to live?"
              </blockquote>
              <p className="text-white/40 mt-2">— James Clear, Annual Review</p>
            </div>
          </div>
        ) : (
          /* EDIT VIEW */
          <>
            {/* Hero Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Overall Score Card */}
              <Card className="bg-amber-950/60 border-amber-600/40 backdrop-blur-lg col-span-1 md:col-span-1">
                <CardContent className="p-8 text-center">
                  <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <div className="text-6xl font-bold text-white mb-2">{getOverallScore()}</div>
                  <p className="text-amber-200 text-lg">Overall Year Score</p>
                  <p className="text-white/60 text-sm mt-2">Based on your category ratings</p>
                </CardContent>
              </Card>

              {/* Quick Category Overview */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Category Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(cat => {
                      const data = getCategoryData(cat.id);
                      const rating = typeof data.rating === 'number' ? data.rating : 0;
                      const Icon = cat.icon;
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id)}
                          className={`p-4 rounded-xl transition-all duration-300 ${
                            activeCategory === cat.id 
                              ? `bg-gradient-to-br ${cat.gradient} shadow-lg scale-105` 
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-6 h-6 ${activeCategory === cat.id ? 'text-white' : cat.color}`} />
                            <div className="text-left">
                              <p className={`font-medium ${activeCategory === cat.id ? 'text-white' : 'text-white/80'}`}>
                                {cat.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress 
                                  value={rating * 10} 
                                  className={`h-1.5 w-16 ${activeCategory === cat.id ? 'bg-white/30' : 'bg-white/10'}`}
                                />
                                <span className={`text-xs ${activeCategory === cat.id ? 'text-white/90' : 'text-white/50'}`}>
                                  {rating}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Category Analysis */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-lg mb-8">
              <CardHeader className={`bg-gradient-to-r ${activeCategoryInfo.gradient} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <activeCategoryInfo.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">{activeCategoryInfo.name}</CardTitle>
                      <p className="text-white/70">Deep dive into your {activeCategoryInfo.name.toLowerCase()} journey</p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 mr-2">Your Rating:</span>
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => updateField(activeCategory, 'rating', i + 1)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 ${
                              i < (typeof activeCategoryData.rating === 'number' ? activeCategoryData.rating : 0)
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-white/30'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <Tabs defaultValue="reflect" className="w-full">
                  <TabsList className="bg-white/10 border border-white/10 mb-8">
                    <TabsTrigger value="reflect" className="data-[state=active]:bg-white/20 text-white/70 data-[state=active]:text-white">
                      <Target className="w-4 h-4 mr-2" />
                      Reflect
                    </TabsTrigger>
                    <TabsTrigger value="celebrate" className="data-[state=active]:bg-white/20 text-white/70 data-[state=active]:text-white">
                      <Trophy className="w-4 h-4 mr-2" />
                      Celebrate
                    </TabsTrigger>
                    <TabsTrigger value="learn" className="data-[state=active]:bg-white/20 text-white/70 data-[state=active]:text-white">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Learn
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="data-[state=active]:bg-white/20 text-white/70 data-[state=active]:text-white">
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Plan Ahead
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="reflect" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          What was your goal at the start of the year?
                        </label>
                        <Textarea
                          placeholder="Write down what you planned to achieve in this area..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
                          value={activeCategoryData.yearStartGoal as string || ''}
                          onChange={(e) => updateField(activeCategory, 'yearStartGoal', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          What was the result?
                        </label>
                        <Textarea
                          placeholder="What actually happened? How did it turn out..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
                          value={activeCategoryData.yearResult as string || ''}
                          onChange={(e) => updateField(activeCategory, 'yearResult', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="celebrate" className="space-y-6">
                    <div>
                      <label className="text-white/80 text-sm font-medium mb-2 block flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        What did you achieve? What are you proud of?
                      </label>
                      <Textarea
                        placeholder="List your wins, big and small..."
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
                        value={activeCategoryData.achievements as string || ''}
                        onChange={(e) => updateField(activeCategory, 'achievements', e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="learn" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block">
                          What challenges did you face?
                        </label>
                        <Textarea
                          placeholder="What obstacles or difficulties came up..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
                          value={activeCategoryData.challenges as string || ''}
                          onChange={(e) => updateField(activeCategory, 'challenges', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-white/80 text-sm font-medium mb-2 block flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          What lessons did you learn?
                        </label>
                        <Textarea
                          placeholder="Key insights and takeaways..."
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
                          value={activeCategoryData.lessons as string || ''}
                          onChange={(e) => updateField(activeCategory, 'lessons', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="plan" className="space-y-6">
                    <div>
                      <label className="text-white/80 text-sm font-medium mb-2 block flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        What's your focus for next year?
                      </label>
                      <Textarea
                        placeholder="Set your intentions and goals for the coming year..."
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
                        value={activeCategoryData.nextYearGoal as string || ''}
                        onChange={(e) => updateField(activeCategory, 'nextYearGoal', e.target.value)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Inspirational Quote */}
            <div className="text-center py-8">
              <blockquote className="text-xl text-white/60 italic max-w-2xl mx-auto">
                "Are my choices helping me live the life I want to live?"
              </blockquote>
              <p className="text-white/40 mt-2">— James Clear, Annual Review</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default YearAnalysis;
