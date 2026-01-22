import React, { useState } from 'react';
import { Plus, Search, Star, Instagram, Trash2, Edit2, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SocialContact } from '@/types/social';
import { format, differenceInDays } from 'date-fns';

interface PeopleCRMProps {
  contacts: SocialContact[];
  circles: string[];
  statuses: string[];
  onAdd: (contact: Omit<SocialContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<SocialContact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateCircles: (circles: string[]) => void;
  onUpdateStatuses: (statuses: string[]) => void;
}

const PeopleCRM: React.FC<PeopleCRMProps> = ({ 
  contacts, 
  circles,
  statuses,
  onAdd, 
  onUpdate, 
  onDelete,
  onUpdateCircles,
  onUpdateStatuses,
}) => {
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SocialContact | null>(null);
  const [newCircle, setNewCircle] = useState('');
  const [newStatus, setNewStatus] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    instagram: '',
    circle: 'Other',
    vibe_score: 3,
    status: 'Lead',
    last_contacted: '',
    next_action: '',
    notes: '',
  });

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.instagram?.toLowerCase().includes(search.toLowerCase()) ||
    c.circle.toLowerCase().includes(search.toLowerCase())
  );

  const getLastContactedColor = (date: string | null) => {
    if (!date) return 'text-slate-500';
    const days = differenceInDays(new Date(), new Date(date));
    if (days <= 7) return 'text-emerald-500';
    if (days <= 14) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Lead': 'bg-slate-600',
      'Invited': 'bg-blue-600',
      'Attended': 'bg-purple-600',
      'Inner Circle': 'bg-amber-600',
    };
    return colors[status] || 'bg-slate-600';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      instagram: '',
      circle: 'Other',
      vibe_score: 3,
      status: 'Lead',
      last_contacted: '',
      next_action: '',
      notes: '',
    });
  };

  const handleAdd = async () => {
    await onAdd({
      ...formData,
      circle: formData.circle as SocialContact['circle'],
      status: formData.status as SocialContact['status'],
      last_contacted: formData.last_contacted || null,
      next_action: formData.next_action || null,
      notes: formData.notes || null,
      instagram: formData.instagram || null,
    });
    resetForm();
    setIsAddOpen(false);
  };

  const handleEdit = (contact: SocialContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      instagram: contact.instagram || '',
      circle: contact.circle,
      vibe_score: contact.vibe_score,
      status: contact.status,
      last_contacted: contact.last_contacted || '',
      next_action: contact.next_action || '',
      notes: contact.notes || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingContact) return;
    await onUpdate(editingContact.id, {
      ...formData,
      circle: formData.circle as SocialContact['circle'],
      status: formData.status as SocialContact['status'],
      last_contacted: formData.last_contacted || null,
      next_action: formData.next_action || null,
      notes: formData.notes || null,
      instagram: formData.instagram || null,
    });
    setEditingContact(null);
    resetForm();
  };

  const handleAddCircle = () => {
    if (newCircle.trim() && !circles.includes(newCircle.trim())) {
      onUpdateCircles([...circles, newCircle.trim()]);
      setNewCircle('');
    }
  };

  const handleRemoveCircle = (circle: string) => {
    onUpdateCircles(circles.filter(c => c !== circle));
  };

  const handleAddStatus = () => {
    if (newStatus.trim() && !statuses.includes(newStatus.trim())) {
      onUpdateStatuses([...statuses, newStatus.trim()]);
      setNewStatus('');
    }
  };

  const handleRemoveStatus = (status: string) => {
    onUpdateStatuses(statuses.filter(s => s !== status));
  };

  const ContactForm = ({ isEdit = false, onSubmit }: { isEdit?: boolean; onSubmit: () => void }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="bg-slate-900 border-slate-600 text-white"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Instagram</label>
          <Input
            value={formData.instagram}
            onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
            className="bg-slate-900 border-slate-600 text-white"
            placeholder="@username"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Circle</label>
          <Select value={formData.circle} onValueChange={(v) => setFormData(prev => ({ ...prev, circle: v }))}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 z-50">
              {circles.map(c => (
                <SelectItem key={c} value={c} className="text-white hover:bg-slate-700 focus:bg-slate-700">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Status</label>
          <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-600 z-50">
              {statuses.map(s => (
                <SelectItem key={s} value={s} className="text-white hover:bg-slate-700 focus:bg-slate-700">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-2 block">Vibe Score</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, vibe_score: score }))}
              className="focus:outline-none"
            >
              <Star 
                className={`w-6 h-6 ${score <= formData.vibe_score ? 'fill-amber-500 text-amber-500' : 'text-slate-600'}`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Last Contacted</label>
        <Input
          type="date"
          value={formData.last_contacted}
          onChange={(e) => setFormData(prev => ({ ...prev, last_contacted: e.target.value }))}
          className="bg-slate-900 border-slate-600 text-white"
        />
      </div>

      <div>
        <label className="text-sm text-slate-400 mb-1 block">Next Action</label>
        <Input
          value={formData.next_action}
          onChange={(e) => setFormData(prev => ({ ...prev, next_action: e.target.value }))}
          className="bg-slate-900 border-slate-600 text-white"
          placeholder="Invite to Wednesday Walk"
        />
      </div>

      <Button 
        onClick={onSubmit} 
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        disabled={!formData.name}
      >
        {isEdit ? 'Update Contact' : 'Add Contact'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="pl-10 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-slate-600 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-amber-400">Manage Circles & Statuses</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block font-semibold">Circles</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {circles.map(circle => (
                      <span key={circle} className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-sm text-white">
                        {circle}
                        <button onClick={() => handleRemoveCircle(circle)} className="text-red-400 hover:text-red-300 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newCircle}
                      onChange={(e) => setNewCircle(e.target.value)}
                      placeholder="New circle name..."
                      className="bg-slate-900 border-slate-600 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCircle()}
                    />
                    <Button onClick={handleAddCircle} className="bg-amber-600 hover:bg-amber-700">Add</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block font-semibold">Statuses (Funnel Stages)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {statuses.map(status => (
                      <span key={status} className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded text-sm text-white">
                        {status}
                        <button onClick={() => handleRemoveStatus(status)} className="text-red-400 hover:text-red-300 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      placeholder="New status name..."
                      className="bg-slate-900 border-slate-600 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
                    />
                    <Button onClick={handleAddStatus} className="bg-amber-600 hover:bg-amber-700">Add</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0a0a0a] border-slate-600 text-white">
              <DialogHeader>
                <DialogTitle className="text-amber-400">Add New Contact</DialogTitle>
              </DialogHeader>
              <ContactForm onSubmit={handleAdd} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Instagram</TableHead>
              <TableHead className="text-slate-400">Circle</TableHead>
              <TableHead className="text-slate-400">Vibe</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Last Contact</TableHead>
              <TableHead className="text-slate-400">Next Action</TableHead>
              <TableHead className="text-slate-400 w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                  {search ? 'No contacts found' : 'No contacts yet. Add your first contact!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map(contact => (
                <TableRow key={contact.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">{contact.name}</TableCell>
                  <TableCell>
                    {contact.instagram && (
                      <a
                        href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pink-500 hover:text-pink-400"
                      >
                        <Instagram className="w-3 h-3" />
                        {contact.instagram}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">{contact.circle}</TableCell>
                  <TableCell>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          className={`w-3 h-3 ${s <= contact.vibe_score ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getStatusBadge(contact.status)}`}>
                      {contact.status}
                    </span>
                  </TableCell>
                  <TableCell className={getLastContactedColor(contact.last_contacted)}>
                    {contact.last_contacted ? format(new Date(contact.last_contacted), 'MMM d') : '-'}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm max-w-[150px] truncate">
                    {contact.next_action || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog open={editingContact?.id === contact.id} onOpenChange={(open) => {
                        if (!open) {
                          setEditingContact(null);
                          resetForm();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-amber-500"
                            onClick={() => handleEdit(contact)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-slate-600 text-white">
                          <DialogHeader>
                            <DialogTitle className="text-amber-400">Edit Contact</DialogTitle>
                          </DialogHeader>
                          <ContactForm isEdit onSubmit={handleUpdate} />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => onDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PeopleCRM;