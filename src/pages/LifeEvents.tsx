import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
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

const LifeEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Personal',
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
    { name: 'Achievement', emoji: '🏆', color: '#F97316' },
    { name: 'Learning', emoji: '📚', color: '#06B6D4' },
    { name: 'Challenge', emoji: '🌱', color: '#64748B' },
    { name: 'Other', emoji: '⭐', color: '#6B7280' }
  ];

  useEffect(() => {
    fetchMilestones();
  }, [user]);

  const fetchMilestones = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load life events');
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
          title: formData.title,
          description: formData.description,
          date: formData.date,
          category: formData.category,
          emoji: formData.emoji,
          color: formData.color,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Life event added!');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Personal',
        emoji: '⭐',
        color: '#3B82F6'
      });
      fetchMilestones();
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add life event');
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditFormData({
      title: milestone.title,
      description: milestone.description || '',
      date: milestone.date,
      category: milestone.category || 'Personal',
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

      toast.success('Life event updated!');
      setIsEditDialogOpen(false);
      setEditingMilestone(null);
      fetchMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update life event');
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

      toast.success('Life event deleted');
      setIsDeleteDialogOpen(false);
      setDeletingMilestone(null);
      fetchMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete life event');
    }
  };

  const selectCategory = (category: typeof categories[0], isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData(prev => ({
        ...prev,
        category: category.name,
        emoji: category.emoji,
        color: category.color
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: category.name,
        emoji: category.emoji,
        color: category.color
      }));
    }
  };

  // Group milestones by year
  const milestonesByYear = milestones.reduce((acc, milestone) => {
    const year = new Date(milestone.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(milestone);
    return acc;
  }, {} as Record<number, Milestone[]>);

  const years = Object.keys(milestonesByYear).map(Number).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-amber-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Life Events
                </h1>
                <p className="text-sm text-muted-foreground">Milestones & achievements</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Life Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Event title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
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
                  <div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Category</p>
                    <div className="grid grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => selectCategory(cat)}
                          className={`p-2 rounded-lg text-center transition-all ${
                            formData.category === cat.name
                              ? 'ring-2 ring-offset-1'
                              : 'hover:bg-gray-100'
                          }`}
                          style={{ 
                            backgroundColor: formData.category === cat.name ? `${cat.color}20` : undefined,
                            borderColor: cat.color 
                          }}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <p className="text-xs mt-1 truncate">{cat.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
                    Add Event
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {milestones.length === 0 ? (
          <Card className="border-dashed border-2 border-amber-200">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No life events yet</h3>
              <p className="text-muted-foreground mb-6">Start documenting your milestones, achievements, and important moments.</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {years.map(year => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-amber-600">{year}</span>
                  <div className="h-px bg-gradient-to-r from-amber-300 to-transparent flex-1" />
                  <span className="text-sm text-muted-foreground">
                    {milestonesByYear[year].length} event{milestonesByYear[year].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {milestonesByYear[year].map(milestone => (
                    <Card 
                      key={milestone.id} 
                      className="overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      <div 
                        className="h-2" 
                        style={{ backgroundColor: milestone.color }}
                      />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{milestone.emoji}</span>
                            <div>
                              <h4 className="font-semibold text-gray-800">{milestone.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(milestone.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              {milestone.description && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(milestone)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(milestone)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {milestone.category && (
                          <div className="mt-3">
                            <span 
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${milestone.color}20`,
                                color: milestone.color
                              }}
                            >
                              {milestone.category}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Life Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Event title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
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
            <div>
              <Textarea
                placeholder="Description (optional)"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Category</p>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => selectCategory(cat, true)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      editFormData.category === cat.name
                        ? 'ring-2 ring-offset-1'
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ 
                      backgroundColor: editFormData.category === cat.name ? `${cat.color}20` : undefined,
                      borderColor: cat.color 
                    }}
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <p className="text-xs mt-1 truncate">{cat.name}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Life Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingMilestone?.title}". This action cannot be undone.
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
    </div>
  );
};

export default LifeEvents;
