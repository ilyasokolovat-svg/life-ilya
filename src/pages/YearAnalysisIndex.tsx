import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Calendar,
  ChevronRight,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const YearAnalysisIndex = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Fetch all year analysis data to see which years have data
  const { data: yearData = [], isLoading } = useQuery({
    queryKey: ['year_analysis_years', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goals_data')
        .select('period_key, actual_result')
        .eq('user_id', user.id)
        .eq('period_type', 'year_analysis');
        
      if (error) throw error;
      
      // Group by year and calculate stats
      const yearMap = new Map<string, { rating: number; count: number; filled: number }>();
      
      (data || []).forEach(row => {
        const year = row.period_key;
        if (!yearMap.has(year)) {
          yearMap.set(year, { rating: 0, count: 0, filled: 0 });
        }
        
        const stats = yearMap.get(year)!;
        if (row.actual_result) {
          try {
            const parsed = JSON.parse(row.actual_result);
            if (parsed.rating) {
              stats.rating += parsed.rating;
              stats.count++;
            }
            // Count filled fields
            Object.values(parsed).forEach(v => {
              if (v && (typeof v === 'number' ? v > 0 : String(v).trim().length > 0)) {
                stats.filled++;
              }
            });
          } catch {}
        }
      });
      
      return Array.from(yearMap.entries()).map(([year, stats]) => ({
        year,
        averageRating: stats.count > 0 ? Math.round(stats.rating / stats.count) : 0,
        filledFields: stats.filled
      })).sort((a, b) => parseInt(b.year) - parseInt(a.year));
    },
    enabled: !!user?.id,
  });

  // Years to show (existing + current + next if we're in Dec)
  const yearsToShow = new Set<number>();
  yearData.forEach(y => yearsToShow.add(parseInt(y.year)));
  yearsToShow.add(currentYear);
  if (new Date().getMonth() >= 10) { // November or December
    yearsToShow.add(currentYear + 1);
  }
  
  const sortedYears = Array.from(yearsToShow).sort((a, b) => b - a);

  const getYearStats = (year: number) => {
    return yearData.find(y => y.year === String(year));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold text-white">Year Analysis</h1>
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Intro */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-white mb-3">
              Reflect on your journey
            </h2>
            <p className="text-white/60 max-w-lg mx-auto">
              Review your progress across life's key areas. Select a year to analyze or start planning for the upcoming year.
            </p>
          </div>

          {/* Year Cards */}
          <div className="space-y-4">
            {sortedYears.map(year => {
              const stats = getYearStats(year);
              const isCurrent = year === currentYear;
              const isFuture = year > currentYear;
              
              return (
                <Card 
                  key={year}
                  className={`border-white/10 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30' 
                      : isFuture
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => navigate(`/year-analysis/${year}`)}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500' 
                          : isFuture
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-br from-purple-500 to-violet-500'
                      }`}>
                        <span className="text-2xl font-bold text-white">{String(year).slice(-2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-white">{year}</h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 text-xs rounded-full">
                              Current
                            </span>
                          )}
                          {isFuture && (
                            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 text-xs rounded-full">
                              Upcoming
                            </span>
                          )}
                        </div>
                        {stats ? (
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              {[...Array(10)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < stats.averageRating 
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-white/20'
                                  }`}
                                />
                              ))}
                              <span className="text-white/50 text-sm ml-1">{stats.averageRating}/10</span>
                            </div>
                            <span className="text-white/40 text-sm">
                              {stats.filledFields} fields completed
                            </span>
                          </div>
                        ) : (
                          <p className="text-white/40 text-sm mt-1">
                            {isFuture ? 'Start planning your year' : 'Not started yet'}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/40" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add Custom Year */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {
                const year = prompt('Enter a year (e.g., 2023):');
                if (year && /^\d{4}$/.test(year)) {
                  navigate(`/year-analysis/${year}`);
                }
              }}
              className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Year
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default YearAnalysisIndex;
