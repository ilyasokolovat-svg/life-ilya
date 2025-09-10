import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Star, Calendar, MapPin, Edit2, Trash2 } from "lucide-react";
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
  type?: 'achievement' | 'challenge';
}

interface TravelPeriod {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  emoji: string;
  color: string;
  created_at: string;
}

const JourneyTimeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [travelPeriods, setTravelPeriods] = useState<TravelPeriod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTravelDialogOpen, setIsTravelDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTravelEditDialogOpen, setIsTravelEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingTravel, setEditingTravel] = useState<TravelPeriod | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    emoji: '⭐',
    color: '#3B82F6',
    type: 'achievement' as 'achievement' | 'challenge'
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
    category: '',
    emoji: '⭐',
    color: '#3B82F6',
    type: 'achievement' as 'achievement' | 'challenge'
  });

  // Travel form state
  const [travelFormData, setTravelFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    emoji: '✈️',
    color: '#8B5CF6'
  });

  // Travel edit form state
  const [editTravelFormData, setEditTravelFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    emoji: '✈️',
    color: '#8B5CF6'
  });

  const travelEmojis = [
    { emoji: '✈️', label: 'Airplane' },
    { emoji: '🏖️', label: 'Beach' },
    { emoji: '🏔️', label: 'Mountains' },
    { emoji: '🏛️', label: 'Historical' },
    { emoji: '🌆', label: 'City' },
    { emoji: '🚗', label: 'Road Trip' },
    { emoji: '🚢', label: 'Cruise' },
    { emoji: '🎿', label: 'Skiing' }
  ];

  const achievementCategories = [
    { name: 'Career', emoji: '💼', color: '#3B82F6' },
    { name: 'Personal', emoji: '🎯', color: '#10B981' },
    { name: 'Health', emoji: '💪', color: '#EF4444' },
    { name: 'Relationships', emoji: '❤️', color: '#F59E0B' },
    { name: 'Achievement', emoji: '🏆', color: '#F97316' },
    { name: 'Learning', emoji: '📚', color: '#06B6D4' },
    { name: 'Other', emoji: '⭐', color: '#6B7280' }
  ];

  const challengeCategories = [
    { name: 'Career', emoji: '💼', color: '#64748B' },
    { name: 'Personal', emoji: '🌱', color: '#64748B' },
    { name: 'Health', emoji: '🩹', color: '#64748B' },
    { name: 'Relationships', emoji: '💔', color: '#64748B' },
    { name: 'Loss', emoji: '🕊️', color: '#64748B' },
    { name: 'Financial', emoji: '💸', color: '#64748B' },
    { name: 'Life Change', emoji: '🔄', color: '#64748B' },
    { name: 'Other', emoji: '🌧️', color: '#64748B' }
  ];

  useEffect(() => {
    fetchMilestones();
    fetchTravelPeriods();
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

  const fetchTravelPeriods = async () => {
    if (!user) return;

    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from('travel_periods')
        .select('*')
        .eq('user_id', user.id)
        .or(`start_date.gte.${startDate},end_date.lte.${endDate}`)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Map database fields to interface
      const mappedData = (data || []).map(period => ({
        id: period.id,
        title: period.title,
        description: period.description,
        startDate: period.start_date,
        endDate: period.end_date,
        location: period.location,
        emoji: period.emoji,
        color: period.color,
        created_at: period.created_at
      }));
      
      setTravelPeriods(mappedData);
    } catch (error) {
      console.error('Error fetching travel periods:', error);
      toast.error('Failed to load travel periods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .insert({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          category: formData.category,
          emoji: formData.emoji,
          color: formData.color,
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
        color: '#3B82F6',
        type: 'achievement'
      });
      fetchMilestones();
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add milestone');
    }
  };

  const handleTravelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('travel_periods')
        .insert({
          title: travelFormData.title,
          description: travelFormData.description,
          location: travelFormData.location,
          start_date: travelFormData.startDate,
          end_date: travelFormData.endDate,
          emoji: travelFormData.emoji,
          color: travelFormData.color,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Travel added successfully!');
      setIsTravelDialogOpen(false);
      setTravelFormData({
        title: '',
        description: '',
        location: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        emoji: '✈️',
        color: '#8B5CF6'
      });
      fetchTravelPeriods();
    } catch (error) {
      console.error('Error adding travel:', error);
      toast.error('Failed to add travel');
    }
  };

  const getMilestonePosition = (date: string) => {
    const milestoneDate = new Date(date);
    const dayOfYear = Math.floor((milestoneDate.getTime() - new Date(selectedYear, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = new Date(selectedYear, 11, 31).getDate() === 31 ? 365 : 366;
    return (dayOfYear / totalDays) * 100;
  };

  const getTravelPosition = (startDate: string, endDate: string) => {
    const startPos = getMilestonePosition(startDate);
    const endPos = getMilestonePosition(endDate);
    return { startPos, endPos, height: Math.max(endPos - startPos, 2) }; // Minimum 2% height
  };

  // Calculate positioning for milestones with proper chronological order
  const getMilestonePositioning = () => {
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedMilestones.map((milestone, index) => {
      // Calculate the base position based on the date within the year
      let baseYPos = getMilestonePosition(milestone.date);
      
      // Simple alternating: left for even indices, right for odd indices
      const side = index % 2 === 0 ? 'left' : 'right';
      
      // For milestones that are very close (within 3% of timeline), add minimal offset
      let yOffset = 0;
      if (index > 0) {
        const prevMilestone = sortedMilestones[index - 1];
        const prevYPos = getMilestonePosition(prevMilestone.date);
        
        // If milestones are within 3% of each other, add small offset
        if (Math.abs(baseYPos - prevYPos) < 3) {
          yOffset = 4; // Small 4% offset to prevent overlap
        }
      }
      
      return {
        ...milestone,
        yPos: baseYPos + yOffset, // Don't cap, let it use full timeline
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
      color: milestone.color,
      type: milestone.type || 'achievement'
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingMilestone) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          date: editFormData.date,
          category: editFormData.category,
          emoji: editFormData.emoji,
          color: editFormData.color
        })
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

  const handleDelete = (milestone: Milestone) => {
    setDeletingMilestone(milestone);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deletingMilestone) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', deletingMilestone.id);

      if (error) throw error;

      toast.success('Achievement deleted successfully!');
      setIsDeleteDialogOpen(false);
      setDeletingMilestone(null);
      fetchMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete achievement');
    }
  };

  const handleTravelEdit = (travel: TravelPeriod) => {
    setEditingTravel(travel);
    setEditTravelFormData({
      title: travel.title,
      description: travel.description || '',
      location: travel.location,
      startDate: travel.startDate,
      endDate: travel.endDate,
      emoji: travel.emoji,
      color: travel.color
    });
    setIsTravelEditDialogOpen(true);
  };

  const handleTravelEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTravel) return;

    try {
      const { error } = await supabase
        .from('travel_periods')
        .update({
          title: editTravelFormData.title,
          description: editTravelFormData.description,
          location: editTravelFormData.location,
          start_date: editTravelFormData.startDate,
          end_date: editTravelFormData.endDate,
          emoji: editTravelFormData.emoji,
          color: editTravelFormData.color
        })
        .eq('id', editingTravel.id);

      if (error) throw error;

      toast.success('Travel updated successfully!');
      setIsTravelEditDialogOpen(false);
      setEditingTravel(null);
      fetchTravelPeriods();
    } catch (error) {
      console.error('Error updating travel:', error);
      toast.error('Failed to update travel');
    }
  };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const positionedMilestones = getMilestonePositioning();

  // Calculate total days traveled in the year
  const calculateTravelPercentage = () => {
    let totalDays = 0;
    travelPeriods.forEach(travel => {
      const startDate = new Date(travel.startDate);
      const endDate = new Date(travel.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
      totalDays += diffDays;
    });
    return Math.round((totalDays / 365) * 100);
  };

  const travelPercentage = calculateTravelPercentage();

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

            <div className="flex gap-3">
              <Dialog open={isTravelDialogOpen} onOpenChange={setIsTravelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    <MapPin className="h-5 w-5 mr-2" />
                    Add Travel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="text-xl">✈️</span>
                      Add Travel Period
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTravelSubmit} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Trip title (e.g., 'Paris Vacation')"
                        value={travelFormData.title}
                        onChange={(e) => setTravelFormData({ ...travelFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Location"
                        value={travelFormData.location}
                        onChange={(e) => setTravelFormData({ ...travelFormData, location: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Description (optional)"
                        value={travelFormData.description}
                        onChange={(e) => setTravelFormData({ ...travelFormData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                        <Input
                          type="date"
                          value={travelFormData.startDate}
                          onChange={(e) => setTravelFormData({ ...travelFormData, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                        <Input
                          type="date"
                          value={travelFormData.endDate}
                          onChange={(e) => setTravelFormData({ ...travelFormData, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {travelEmojis.map((travelEmoji) => (
                        <Button
                          key={travelEmoji.emoji}
                          type="button"
                          variant={travelFormData.emoji === travelEmoji.emoji ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTravelFormData({ 
                            ...travelFormData, 
                            emoji: travelEmoji.emoji
                          })}
                          className="text-xs h-auto py-2"
                        >
                          <span className="mr-1">{travelEmoji.emoji}</span>
                          {travelEmoji.label}
                        </Button>
                      ))}
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                      ✈️ Add Travel
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-xl">{formData.type === 'achievement' ? '🏆' : '🌱'}</span>
                    Add New {formData.type === 'achievement' ? 'Achievement' : 'Life Event'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.type === 'achievement' ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, type: 'achievement', category: '', emoji: '⭐', color: '#3B82F6' })}
                      className="flex-1"
                    >
                      🏆 Achievement
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === 'challenge' ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, type: 'challenge', category: '', emoji: '🌱', color: '#64748B' })}
                      className="flex-1"
                    >
                      🌱 Life Event
                    </Button>
                  </div>
                  <div>
                    <Input
                      placeholder={formData.type === 'achievement' ? "Achievement title" : "What happened?"}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder={formData.type === 'achievement' ? "Description (optional)" : "How did you grow from this? (optional)"}
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
                    {(formData.type === 'achievement' ? achievementCategories : challengeCategories).map((cat) => (
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
                  <Button type="submit" className={`w-full ${
                    formData.type === 'achievement' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700'
                  }`}>
                    {formData.type === 'achievement' ? '🎉 Add Achievement' : '🌱 Add Life Event'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
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
                <div className="relative" style={{ minHeight: '2000px' }}>
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
                            
                            {/* Connection line with glow - different styles for achievements vs challenges */}
                            <div 
                              className={`absolute top-1/2 w-8 h-1 transform -translate-y-1/2 shadow-md ${
                                milestone.side === 'left' ? 'right-0' : 'left-0'
                              } ${
                                milestone.type === 'challenge' 
                                  ? 'bg-gradient-to-r from-slate-400 to-slate-500' 
                                  : 'bg-gradient-to-r from-amber-300 to-yellow-400'
                              }`}
                            />
                            
                            {/* Achievement content */}
                            <div 
                              className={`flex items-center gap-4 ${
                                milestone.side === 'left' ? 'flex-row-reverse' : 'flex-row'
                              }`}
                            >
                              {/* Badge - different styles for achievements vs challenges */}
                              <div className="relative">
                                <div 
                                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 border-4 border-white relative z-10 ${
                                    milestone.type === 'challenge' 
                                      ? 'text-slate-600 group-hover:scale-110 bg-gradient-to-br from-slate-100 to-slate-200' 
                                      : 'text-white group-hover:scale-125 group-hover:rotate-12'
                                  }`}
                                  style={{ 
                                    backgroundColor: milestone.type === 'challenge' ? undefined : milestone.color 
                                  }}
                                >
                                  <span className="text-2xl">{milestone.emoji}</span>
                                  {/* Ring effect - different for each type */}
                                  <div className={`absolute inset-0 rounded-full border-2 animate-pulse ${
                                    milestone.type === 'challenge' 
                                      ? 'border-slate-300/50' 
                                      : 'border-yellow-300/50'
                                  }`}></div>
                                </div>
                                {/* Glow effect - subtle for challenges */}
                                <div 
                                  className={`absolute inset-0 rounded-full blur-lg transition-opacity ${
                                    milestone.type === 'challenge' 
                                      ? 'opacity-10 group-hover:opacity-20 bg-slate-400' 
                                      : 'opacity-30 group-hover:opacity-50'
                                  }`}
                                  style={{ 
                                    backgroundColor: milestone.type === 'challenge' ? undefined : milestone.color 
                                  }}
                                ></div>
                              </div>
                              
                              {/* Info card - different styling for achievements vs challenges */}
                              <div 
                                className={`max-w-xs p-5 rounded-xl shadow-xl border-2 backdrop-blur-sm transform transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 relative ${
                                  milestone.side === 'left' ? 'text-right' : 'text-left'
                                } ${
                                  milestone.type === 'challenge' 
                                    ? 'bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200/70' 
                                    : 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200/50'
                                }`}
                              >
                                {/* Edit and Delete buttons */}
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(milestone);
                                    }}
                                    className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(milestone);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                
                                <h3 className={`font-bold mb-2 text-lg pr-6 ${
                                  milestone.type === 'challenge' ? 'text-slate-700' : 'text-amber-900'
                                }`}>
                                  {milestone.title}
                                </h3>
                                <div className={`flex items-center gap-2 text-sm mb-2 ${
                                  milestone.type === 'challenge' ? 'text-slate-600' : 'text-amber-700'
                                }`}>
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">{new Date(milestone.date).toLocaleDateString()}</span>
                                </div>
                                {milestone.category && (
                                  <div className={`flex items-center gap-2 text-xs ${
                                    milestone.type === 'challenge' ? 'text-slate-500' : 'text-amber-600'
                                  }`}>
                                    <MapPin className="h-3 w-3" />
                                    <span className="font-medium">{milestone.category}</span>
                                  </div>
                                )}
                                {milestone.type === 'challenge' && (
                                  <div className="mt-2 text-xs text-slate-500 italic">
                                    🌱 Growth moment
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
                  
                  {/* Travel Timeline - Vertical line on right edge */}
                  <div className="absolute -right-8 top-0 h-full">
                    {/* Travel percentage circle at the top */}
                    <div className="absolute right-16 -top-8 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                      {travelPercentage}%
                    </div>
                    
                    {/* Main vertical timeline line */}
                    <div className="absolute right-20 top-0 w-1 h-full bg-gray-300"></div>
                    
                    {/* Travel periods as highlighted sections */}
                    {travelPeriods.map((travel, index) => {
                      const position = getTravelPosition(travel.startDate, travel.endDate);
                      return (
                        <HoverCard key={travel.id}>
                          <HoverCardTrigger asChild>
                            <div
                              className="absolute cursor-pointer transition-all duration-200 hover:scale-110"
                              style={{
                                top: `${position.startPos}%`,
                                height: `${Math.max(position.height, 3)}%`,
                                right: '78px',
                                width: '6px',
                                backgroundColor: travel.color,
                                borderRadius: '3px',
                                minHeight: '20px'
                              }}
                            >
                              {/* Country name label */}
                              <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                                {travel.emoji} {travel.location}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64" side="left">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <span>{travel.emoji}</span>
                                  {travel.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTravelEdit(travel);
                                  }}
                                  className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full transition-colors"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {travel.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(travel.startDate).toLocaleDateString()} - {new Date(travel.endDate).toLocaleDateString()}
                                </div>
                                {travel.description && (
                                  <div className="text-xs mt-2 italic">
                                    {travel.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      );
                    })}
                  </div>
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
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={editFormData.type === 'achievement' ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, type: 'achievement', category: '', emoji: '⭐', color: '#3B82F6' })}
                  className="flex-1"
                >
                  🏆 Achievement
                </Button>
                <Button
                  type="button"
                  variant={editFormData.type === 'challenge' ? "default" : "outline"}
                  onClick={() => setEditFormData({ ...editFormData, type: 'challenge', category: '', emoji: '🌱', color: '#64748B' })}
                  className="flex-1"
                >
                  🌱 Life Event
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(editFormData.type === 'achievement' ? achievementCategories : challengeCategories).map((cat) => (
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

        {/* Travel Edit Dialog */}
        <Dialog open={isTravelEditDialogOpen} onOpenChange={setIsTravelEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Travel
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTravelEditSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Trip title (e.g., 'Paris Vacation')"
                  value={editTravelFormData.title}
                  onChange={(e) => setEditTravelFormData({ ...editTravelFormData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Input
                  placeholder="Location"
                  value={editTravelFormData.location}
                  onChange={(e) => setEditTravelFormData({ ...editTravelFormData, location: e.target.value })}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={editTravelFormData.description}
                  onChange={(e) => setEditTravelFormData({ ...editTravelFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={editTravelFormData.startDate}
                    onChange={(e) => setEditTravelFormData({ ...editTravelFormData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={editTravelFormData.endDate}
                    onChange={(e) => setEditTravelFormData({ ...editTravelFormData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {travelEmojis.map((travelEmoji) => (
                  <Button
                    key={travelEmoji.emoji}
                    type="button"
                    variant={editTravelFormData.emoji === travelEmoji.emoji ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditTravelFormData({ 
                      ...editTravelFormData, 
                      emoji: travelEmoji.emoji
                    })}
                    className="text-xs h-auto py-2"
                  >
                    <span className="mr-1">{travelEmoji.emoji}</span>
                    {travelEmoji.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTravelEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                  ✈️ Update Travel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Achievement
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingMilestone?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default JourneyTimeline;