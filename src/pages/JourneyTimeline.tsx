import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowLeft, Plus, Star, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date: string;
  category?: string;
  emoji: string;
  color: string;
  created_at: string;
}

const JourneyTimeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    emoji: '⭐',
    color: '#3B82F6'
  });

  const categories = [
    { name: 'Career', emoji: '💼', color: '#3B82F6' },
    { name: 'Personal', emoji: '🎯', color: '#10B981' },
    { name: 'Health', emoji: '💪', color: '#EF4444' },
    { name: 'Relationships', emoji: '❤️', color: '#F59E0B' },
    { name: 'Travel', emoji: '✈️', color: '#8B5CF6' },
    { name: 'Achievement', emoji: '🏆', color: '#F97316' },
    { name: 'Learning', emoji: '📚', color: '#06B6D4' },
    { name: 'Other', emoji: '⭐', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchMilestones();
  }, [user, selectedYear]);

  const fetchMilestones = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .insert({
          ...formData,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Milestone added successfully!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        emoji: '⭐',
        color: '#3B82F6'
      });
      fetchMilestones();
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add milestone');
    }
  };

  const getMonthPosition = (month: number) => {
    return (month - 1) * (100 / 11); // 11 intervals for 12 months
  };

  const getMilestonePosition = (date: string) => {
    const milestoneDate = new Date(date);
    const dayOfYear = Math.floor((milestoneDate.getTime() - new Date(selectedYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = new Date(selectedYear, 11, 31).getDate() === 31 ? 365 : 366;
    return (dayOfYear / totalDays) * 100;
  };

  // Calculate curved positioning for milestones to avoid overlap
  const getMilestonePositioning = () => {
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedMilestones.map((milestone, index) => {
      const xPos = getMilestonePosition(milestone.date);
      
      // Create alternating heights with extra spacing for close milestones
      let yOffset = 0;
      let height = index % 2 === 0 ? -60 : 40;
      
      // Check for nearby milestones and adjust positioning
      if (index > 0) {
        const prevXPos = getMilestonePosition(sortedMilestones[index - 1].date);
        const distance = Math.abs(xPos - prevXPos);
        
        // If milestones are very close (within 5% of timeline), stack them vertically
        if (distance < 5) {
          const sameLevel = sortedMilestones.slice(0, index).filter((_, i) => {
            const prevPos = getMilestonePosition(sortedMilestones[i].date);
            return Math.abs(xPos - prevPos) < 5;
          }).length;
          
          // Alternate between top and bottom, but with more spacing
          height = sameLevel % 2 === 0 ? -60 - (Math.floor(sameLevel / 2) * 50) : 40 + (Math.floor(sameLevel / 2) * 50);
        }
      }
      
      return {
        ...milestone,
        xPos,
        yPos: height
      };
    });
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const positionedMilestones = getMilestonePositioning();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Journey Timeline
                </h1>
                <p className="text-gray-600 mt-1">Track your significant milestones and achievements</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Milestone</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Milestone title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat.name}
                        type="button"
                        variant={formData.category === cat.name ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ 
                          ...formData, 
                          category: cat.name, 
                          emoji: cat.emoji, 
                          color: cat.color 
                        })}
                        className="text-xs h-auto py-2"
                      >
                        <span className="mr-1">{cat.emoji}</span>
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                  <Button type="submit" className="w-full">
                    Add Milestone
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Year Selector */}
        <div className="flex justify-center mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                >
                  ←
                </Button>
                <span className="text-2xl font-bold text-purple-700 min-w-[80px] text-center">
                  {selectedYear}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={selectedYear >= new Date().getFullYear()}
                >
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="bg-white/70 backdrop-blur-sm border-purple-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-purple-700">
              Your {selectedYear} Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="relative" style={{ minHeight: '400px' }}>
                {/* Curved Timeline */}
                <div className="relative h-60 mb-8">
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 1000 240" 
                    className="absolute inset-0"
                    preserveAspectRatio="none"
                  >
                    {/* Curved timeline path */}
                    <defs>
                      <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="25%" stopColor="#6366F1" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="75%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                    
                    {/* Main curved path */}
                    <path
                      d="M 0 120 Q 250 80 500 120 T 1000 120"
                      stroke="url(#timelineGradient)"
                      strokeWidth="4"
                      fill="none"
                      className="drop-shadow-sm"
                    />
                    
                    {/* Month markers along the curve */}
                    {months.map((month, index) => {
                      const x = (index / 11) * 1000;
                      // Calculate y position along the curve
                      const t = index / 11;
                      const y = 120 + Math.sin(t * Math.PI) * -40 * Math.sin(t * 2 * Math.PI);
                      
                      return (
                        <g key={month}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="white"
                            stroke="#A855F7"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={y + 25}
                            textAnchor="middle"
                            className="text-xs font-medium fill-purple-600"
                          >
                            {month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Milestones positioned along the curve */}
                  {positionedMilestones.map((milestone) => {
                    // Calculate position along the curved path
                    const t = milestone.xPos / 100;
                    const x = t * 100; // percentage for CSS positioning
                    const curveY = 120 + Math.sin(t * Math.PI) * -40 * Math.sin(t * 2 * Math.PI);
                    const adjustedY = (curveY / 240) * 100; // convert to percentage
                    
                    return (
                      <HoverCard key={milestone.id}>
                        <HoverCardTrigger asChild>
                          <div
                            className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-10"
                            style={{ 
                              left: `${x}%`,
                              top: `${adjustedY + (milestone.yPos / 4)}%` // Add offset for spacing
                            }}
                          >
                            {/* Connection line to timeline */}
                            <div 
                              className="absolute w-0.5 bg-purple-300"
                              style={{
                                height: `${Math.abs(milestone.yPos / 4)}%`,
                                top: milestone.yPos > 0 ? '-100%' : '100%',
                                left: '50%',
                                transform: 'translateX(-50%)'
                              }}
                            />
                            
                            <div 
                              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl border-4 border-white relative z-20"
                              style={{ backgroundColor: milestone.color }}
                            >
                              <span className="text-xl">{milestone.emoji}</span>
                            </div>
                            
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                              <div className="text-xs font-medium text-purple-700 text-center max-w-[100px] truncate bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                                {milestone.title}
                              </div>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4 bg-white/95 backdrop-blur-sm border-purple-200 shadow-xl">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{milestone.emoji}</span>
                              <h3 className="font-semibold text-purple-800">{milestone.title}</h3>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-purple-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(milestone.date).toLocaleDateString()}
                              </div>
                              {milestone.category && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {milestone.category}
                                </div>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>

                {milestones.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                    <p>No milestones yet for {selectedYear}</p>
                    <p className="text-sm">Add your first milestone to start tracking your journey!</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default JourneyTimeline;