import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Lightbulb, TrendingUp } from "lucide-react";

interface InsightData {
  achievements: string;
  lessons: string;
  rating: number;
  name: string;
}

interface KeyInsightsProps {
  categories: InsightData[];
}

const KeyInsights = ({ categories }: KeyInsightsProps) => {
  // Get top wins (categories with ratings >= 7)
  const topWins = categories
    .filter(c => c.rating >= 7 && c.achievements)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Get areas for growth (categories with ratings < 5)
  const areasForGrowth = categories
    .filter(c => c.rating > 0 && c.rating < 5)
    .sort((a, b) => a.rating - b.rating);

  // Get all lessons
  const allLessons = categories
    .filter(c => c.lessons)
    .map(c => ({ name: c.name, lesson: c.lessons }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Top Wins */}
      <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Top Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topWins.length > 0 ? (
            <ul className="space-y-3">
              {topWins.map((win, i) => (
                <li key={i} className="text-white/80 text-sm">
                  <span className="text-emerald-400 font-medium">{win.name}:</span>{' '}
                  <span className="line-clamp-2">{win.achievements}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/50 text-sm italic">
              Rate categories 7+ to see your top wins here
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Lessons */}
      <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Key Lessons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allLessons.length > 0 ? (
            <ul className="space-y-3">
              {allLessons.slice(0, 3).map((item, i) => (
                <li key={i} className="text-white/80 text-sm">
                  <span className="text-amber-400 font-medium">{item.name}:</span>{' '}
                  <span className="line-clamp-2">{item.lesson}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/50 text-sm italic">
              Add lessons learned in each category
            </p>
          )}
        </CardContent>
      </Card>

      {/* Areas for Growth */}
      <Card className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-rose-400" />
            Areas for Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          {areasForGrowth.length > 0 ? (
            <ul className="space-y-3">
              {areasForGrowth.map((area, i) => (
                <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                  <span className="text-rose-400 font-medium">{area.name}</span>
                  <span className="text-white/40">({area.rating}/10)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/50 text-sm italic">
              No critical areas identified (all ratings 5+)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyInsights;
