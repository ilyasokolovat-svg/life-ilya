import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowLeft, Plus, Star, Calendar, MapPin, Edit2 } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
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

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
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

  const getMilestonePosition = (date: string) => {
    const milestoneDate = new Date(date);
    const dayOfYear = Math.floor((milestoneDate.getTime() - new Date(selectedYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = new Date(selectedYear, 11, 31).getDate() === 31 ? 365 : 366;
    return (dayOfYear / totalDays) * 100;
  };

  // Calculate positioning for milestones with proper alternating sides
  const getMilestonePositioning = () => {
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedMilestones.map((milestone, index) => {
      let baseYPos = getMilestonePosition(milestone.date);
      
      // Stretch the timeline to provide more space - multiply by 1.5 for 50% more space
      baseYPos = baseYPos * 1.5;
      
      // Simple alternating: left for even indices, right for odd indices
      const side = index % 2 === 0 ? 'left' : 'right';
      
      // Check for very close milestones (within 8% after stretching)
      let yOffset = 0;
      for (let i = 0; i < index; i++) {
        const prevMilestone = sortedMilestones[i];
        const prevYPos = getMilestonePosition(prevMilestone.date) * 1.5;
        
        if (Math.abs(baseYPos - prevYPos) < 8) {
          // If milestones are too close, offset the current one
          yOffset += 12; // 12% offset to create clear separation
        }
      }
      
      return {
        ...milestone,
        yPos: Math.min(baseYPos + yOffset, 140), // Cap at 140% to keep within bounds
        side
      };
    });
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditFormData({
      title: milestone.title,
      description: milestone.description || '',
      date: milestone.date,
      category: milestone.category || '',
      emoji: milestone.emoji,
      color: milestone.color
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingMilestone) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .update(editFormData)
        .eq('id', editingMilestone.id);

      if (error) throw error;

      toast.success('Achievement updated successfully!');
      setIsEditDialogOpen(false);
      setEditingMilestone(null);
      fetchMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update achievement');
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const positionedMilestones = getMilestonePositioning();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Background Achievement Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl text-amber-200/30 animate-pulse">🏆</div>
        <div className="absolute top-40 right-20 text-4xl text-yellow-200/40 animate-bounce">⭐</div>
        <div className="absolute bottom-40 left-20 text-5xl text-orange-200/30 animate-pulse">🎯</div>
        <div className="absolute bottom-20 right-10 text-3xl text-amber-200/40 animate-bounce">✨</div>
        <div className="absolute top-60 left-1/3 text-4xl text-yellow-200/30 animate-pulse">🌟</div>
        <div className="absolute bottom-60 right-1/3 text-5xl text-orange-200/20 animate-bounce">🎖️</div>
      </div>
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-100/90 to-yellow-100/90 backdrop-blur-sm shadow-lg border-b border-amber-200 relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-50"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="relative">
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🏆</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Achievement Timeline
                </h1>
                <p className="text-amber-700 mt-1 font-medium">Celebrate your victories and milestones!</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Achievement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    Add New Achievement
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Achievement title"
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
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    🎉 Add Achievement
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Year Selector */}
        <div className="flex justify-center mb-8">
          <Card className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm border-amber-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  ←
                </Button>
                <span className="text-2xl font-bold text-amber-700 min-w-[80px] text-center">
                  {selectedYear}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={selectedYear >= new Date().getFullYear()}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="bg-gradient-to-br from-white/80 to-amber-50/40 backdrop-blur-sm border-amber-200 shadow-2xl relative overflow-hidden">
          {/* Decorative sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-8 text-xl text-amber-300/50 animate-pulse">✨</div>
            <div className="absolute top-12 left-8 text-lg text-yellow-300/40 animate-bounce">⭐</div>
            <div className="absolute bottom-8 right-12 text-xl text-orange-300/50 animate-pulse">🌟</div>
          </div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-center text-amber-800 flex items-center justify-center gap-2">
              <span className="text-2xl">🏆</span>
              Your {selectedYear} Achievements
              <span className="text-2xl">🏆</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 relative z-10">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className="relative max-w-4xl mx-auto">
                {/* Vertical Timeline */}
                <div className="relative" style={{ minHeight: '600px' }}>
                  {/* Central timeline line with gradient */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-300 via-yellow-400 to-orange-400 transform -translate-x-1/2 rounded-full shadow-lg"></div>
                  
                  {/* Year markers with glow effect */}
                  <div className="absolute left-1/2 top-0 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transform -translate-x-1/2 -translate-y-3 border-4 border-white shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="absolute left-1/2 bottom-0 w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transform -translate-x-1/2 translate-y-3 border-4 border-white shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  
                  {/* Year labels with achievement styling */}
                  <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-12">
                    <span className="text-sm font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 rounded-full shadow-md border border-amber-200">
                      🎊 Jan {selectedYear}
                    </span>
                  </div>
                  <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-12">
                    <span className="text-sm font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 rounded-full shadow-md border border-amber-200">
                      Dec {selectedYear} 🎊
                    </span>
                  </div>
                  
                  {/* Achievement Milestones */}
                  {positionedMilestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="absolute w-full"
                      style={{ top: `${milestone.yPos}%` }}
                    >
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div
                            className={`absolute cursor-pointer transform -translate-y-1/2 group ${
                              milestone.side === 'left' ? 'right-1/2 pr-8' : 'left-1/2 pl-8'
                            }`}
                          >
                            {/* Sparkle effects on hover */}
                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute -top-2 -left-2 text-sm text-yellow-400 animate-bounce">✨</div>
                              <div className="absolute -top-1 -right-3 text-xs text-amber-400 animate-pulse">⭐</div>
                              <div className="absolute -bottom-2 -left-1 text-xs text-orange-400 animate-bounce">🌟</div>
                            </div>
                            
                            {/* Connection line with glow */}
                            <div 
                              className={`absolute top-1/2 w-8 h-1 bg-gradient-to-r from-amber-300 to-yellow-400 transform -translate-y-1/2 shadow-md ${
                                milestone.side === 'left' ? 'right-0' : 'left-0'
                              }`}
                            />
                            
                            {/* Achievement content */}
                            <div 
                              className={`flex items-center gap-4 ${
                                milestone.side === 'left' ? 'flex-row-reverse' : 'flex-row'
                              }`}
                            >
                              {/* Achievement badge */}
                              <div className="relative">
                                <div 
                                  className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transform transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 border-4 border-white relative z-10"
                                  style={{ backgroundColor: milestone.color }}
                                >
                                  <span className="text-2xl">{milestone.emoji}</span>
                                  {/* Achievement ring */}
                                  <div className="absolute inset-0 rounded-full border-2 border-yellow-300/50 animate-pulse"></div>
                                </div>
                                {/* Achievement glow */}
                                <div 
                                  className="absolute inset-0 rounded-full opacity-30 blur-lg group-hover:opacity-50 transition-opacity"
                                  style={{ backgroundColor: milestone.color }}
                                ></div>
                              </div>
                              
                              {/* Achievement info card */}
                              <div 
                                className={`max-w-xs p-5 bg-gradient-to-br from-white to-amber-50/30 rounded-xl shadow-xl border-2 border-amber-200/50 backdrop-blur-sm transform transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 relative ${
                                  milestone.side === 'left' ? 'text-right' : 'text-left'
                                }`}
                              >
                                {/* Edit button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(milestone);
                                  }}
                                  className="absolute top-2 right-2 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                
                                <h3 className="font-bold text-amber-900 mb-2 text-lg pr-6">{milestone.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-amber-700 mb-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">{new Date(milestone.date).toLocaleDateString()}</span>
                                </div>
                                {milestone.category && (
                                  <div className="flex items-center gap-2 text-xs text-amber-600">
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">{milestone.category}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-6 bg-gradient-to-br from-white/95 to-amber-50/80 backdrop-blur-md border-amber-300 shadow-2xl">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{milestone.emoji}</span>
                              <h3 className="font-bold text-amber-900 text-lg">{milestone.title}</h3>
                            </div>
                            {milestone.description && (
                              <p className="text-amber-800 leading-relaxed">{milestone.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-amber-700 pt-2 border-t border-amber-200">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{new Date(milestone.date).toLocaleDateString()}</span>
                              </div>
                              {milestone.category && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">{milestone.category}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  ))}
                </div>

                {milestones.length === 0 && (
                  <div className="text-center py-20 text-amber-600">
                    <div className="text-8xl mb-6 animate-bounce">🏆</div>
                    <h3 className="text-2xl font-bold mb-2">Ready to celebrate your first achievement?</h3>
                    <p className="text-lg">Add your first milestone to start building your success story!</p>
                    <div className="mt-4 text-4xl space-x-2">
                      <span className="animate-pulse">✨</span>
                      <span className="animate-bounce">🌟</span>
                      <span className="animate-pulse">✨</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Achievement
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Achievement title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.name}
                    type="button"
                    variant={editFormData.category === cat.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditFormData({ 
                      ...editFormData, 
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
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  ✨ Update Achievement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default JourneyTimeline;