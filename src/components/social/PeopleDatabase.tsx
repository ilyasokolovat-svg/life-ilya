import React, { useState, useMemo } from 'react';
import { Search, Settings, Star, Instagram, Plus, Trash2, X, Edit2, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SocialContact, DEFAULT_CLOSENESS_TAGS, CLOSENESS_COLORS, FRIENDS_CLOSENESS, NEW_CONNECTIONS_CLOSENESS, ROMANTIC_CLOSENESS, SortOption } from '@/types/social';
import { formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';

interface PeopleDatabaseProps {
  contacts: SocialContact[];
  closenessTags: string[];
  onAddToOutreach: (contactId: string) => void;
  onUpdateContact: (id: string, updates: Partial<SocialContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onUpdateClosenessTags: (tags: string[]) => void;
  outreachContactIds: Set<string>;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'vibe_desc', label: 'Vibe ↓' },
  { value: 'vibe_asc', label: 'Vibe ↑' },
  { value: 'oldest_first', label: 'Oldest First' },
  { value: 'newest_first', label: 'Recent First' },
];

const PeopleDatabase: React.FC<PeopleDatabaseProps> = ({
  contacts,
  closenessTags,
  onAddToOutreach,
  onUpdateContact,
  onDeleteContact,
  onUpdateClosenessTags,
  outreachContactIds,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingCloseness, setEditingCloseness] = useState<string | null>(null);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<SocialContact | null>(null);

  const filterAndSort = (list: SocialContact[]) => {
    let filtered = list.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.instagram && c.instagram.toLowerCase().includes(search.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'vibe_desc':
          return b.vibe_score - a.vibe_score;
        case 'vibe_asc':
          return a.vibe_score - b.vibe_score;
        case 'oldest_first':
          // Those contacted longest ago first (null = never contacted = very old)
          if (!a.last_contacted && !b.last_contacted) return a.name.localeCompare(b.name);
          if (!a.last_contacted) return -1;
          if (!b.last_contacted) return 1;
          return new Date(a.last_contacted).getTime() - new Date(b.last_contacted).getTime();
        case 'newest_first':
          // Those contacted most recently first (null = never contacted = at the end)
          if (!a.last_contacted && !b.last_contacted) return a.name.localeCompare(b.name);
          if (!a.last_contacted) return 1;
          if (!b.last_contacted) return -1;
          return new Date(b.last_contacted).getTime() - new Date(a.last_contacted).getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });
  };

  const groupedContacts = useMemo(() => {
    const friends = contacts.filter(c => FRIENDS_CLOSENESS.includes(c.closeness as any));
    const newConnections = contacts.filter(c => NEW_CONNECTIONS_CLOSENESS.includes(c.closeness as any));
    const romantic = contacts.filter(c => c.closeness === 'Romantic');

    return {
      friends: filterAndSort(friends),
      newConnections: filterAndSort(newConnections),
      romantic: filterAndSort(romantic),
    };
  }, [contacts, search, sortBy]);

  const getLastContactedColor = (lastContacted: string | null) => {
    if (!lastContacted) return 'text-slate-500';
    const days = differenceInDays(new Date(), parseISO(lastContacted));
    if (days <= 7) return 'text-emerald-400';
    if (days <= 14) return 'text-amber-400';
    return 'text-red-400';
  };

  const getLastContactedText = (lastContacted: string | null) => {
    if (!lastContacted) return 'Never';
    return formatDistanceToNow(parseISO(lastContacted), { addSuffix: true });
  };

  const handleVibeChange = async (contactId: string, newVibe: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await onUpdateContact(contactId, { vibe_score: newVibe });
  };

  const handleClosenessChange = async (contactId: string, closeness: string) => {
    await onUpdateContact(contactId, { closeness });
    setEditingCloseness(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !closenessTags.includes(newTag.trim())) {
      onUpdateClosenessTags([...closenessTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!DEFAULT_CLOSENESS_TAGS.includes(tag as any)) {
      onUpdateClosenessTags(closenessTags.filter(t => t !== tag));
    }
  };

  const openEditContact = (contact: SocialContact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact({ ...contact });
    setEditContactOpen(true);
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;
    await onUpdateContact(editingContact.id, {
      name: editingContact.name,
      instagram: editingContact.instagram,
      closeness: editingContact.closeness,
      vibe_score: editingContact.vibe_score,
      last_contacted: editingContact.last_contacted,
      interesting_note: editingContact.interesting_note,
      notes: editingContact.notes,
    });
    setEditContactOpen(false);
    setEditingContact(null);
  };

  const ContactCard: React.FC<{ contact: SocialContact }> = ({ contact }) => {
    const isInOutreach = outreachContactIds.has(contact.id);

    return (
      <div
        className={`group p-2 rounded-lg transition-all cursor-pointer ${
          isInOutreach 
            ? 'bg-amber-900/20 border border-amber-700/30' 
            : 'bg-slate-800/30 hover:bg-slate-800/60 border border-transparent'
        }`}
        onClick={() => !isInOutreach && onAddToOutreach(contact.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white text-xs truncate">{contact.name}</span>
              {contact.instagram && (
                <a
                  href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-slate-500 hover:text-pink-400"
                >
                  <Instagram className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            
            {/* Closeness Tag */}
            <div className="mt-0.5">
              {editingCloseness === contact.id ? (
                <div className="flex flex-wrap gap-0.5">
                  {closenessTags.map(tag => (
                    <button
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosenessChange(contact.id, tag);
                      }}
                      className={`px-1 py-0.5 rounded text-[8px] text-white transition-opacity ${
                        CLOSENESS_COLORS[tag] || 'bg-slate-600'
                      } ${contact.closeness === tag ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCloseness(contact.id);
                  }}
                  className={`px-1 py-0.5 rounded text-[8px] text-white ${
                    CLOSENESS_COLORS[contact.closeness] || 'bg-slate-600'
                  }`}
                >
                  {contact.closeness || 'Just Met'}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {/* Vibe Score */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={(e) => handleVibeChange(contact.id, star, e)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-2.5 h-2.5 transition-colors ${
                      star <= contact.vibe_score
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Last Contacted */}
            <span className={`text-[8px] ${getLastContactedColor(contact.last_contacted)}`}>
              {getLastContactedText(contact.last_contacted)}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => openEditContact(contact, e)} className="text-slate-500 hover:text-amber-400">
                <Edit2 className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteContact(contact.id); }}
                className="text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {isInOutreach && (
          <div className="mt-0.5 text-[8px] text-amber-500 flex items-center gap-0.5">
            <Plus className="w-2 h-2" /> In outreach
          </div>
        )}
      </div>
    );
  };

  const ContactColumn: React.FC<{ title: string; icon: string; contacts: SocialContact[]; color: string }> = ({ title, icon, contacts: columnContacts, color }) => (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span>{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{title}</span>
        <span className="text-[10px] text-slate-500">({columnContacts.length})</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-1">
          {columnContacts.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-[10px]">No contacts</div>
          ) : (
            columnContacts.map(contact => <ContactCard key={contact.id} contact={contact} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">People</h2>
          <div className="flex items-center gap-1">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="h-7 w-[100px] bg-slate-800 border-slate-700 text-white text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white text-xs">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Manage "How Close" Tags</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag name..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} className="bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {closenessTags.map(tag => (
                      <div
                        key={tag}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${CLOSENESS_COLORS[tag] || 'bg-slate-600'}`}
                      >
                        {tag}
                        {!DEFAULT_CLOSENESS_TAGS.includes(tag as any) && (
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-300">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Three Columns */}
      <div className="flex-1 grid grid-cols-3 gap-2 p-2 min-h-0">
        <ContactColumn title="Friends" icon="👥" contacts={groupedContacts.friends} color="text-emerald-400" />
        <ContactColumn title="New" icon="🌟" contacts={groupedContacts.newConnections} color="text-blue-400" />
        <ContactColumn title="Romantic" icon="💕" contacts={groupedContacts.romantic} color="text-pink-400" />
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-slate-800 text-xs text-slate-500">
        {contacts.length} total contacts
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                <Input
                  value={editingContact.name}
                  onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Instagram</label>
                <Input
                  value={editingContact.instagram || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, instagram: e.target.value })}
                  placeholder="@username"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">How Close</label>
                  <Select 
                    value={editingContact.closeness || 'Just Met'} 
                    onValueChange={(v) => setEditingContact({ ...editingContact, closeness: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {closenessTags.map(tag => (
                        <SelectItem key={tag} value={tag} className="text-white">{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Vibe Score</label>
                  <div className="flex items-center gap-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-md">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingContact({ ...editingContact, vibe_score: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            star <= editingContact.vibe_score
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Last Contacted</label>
                <Input
                  type="date"
                  value={editingContact.last_contacted || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, last_contacted: e.target.value || null })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Interesting Note</label>
                <Input
                  value={editingContact.interesting_note || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, interesting_note: e.target.value })}
                  placeholder="Where you met, something memorable..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <Textarea
                  value={editingContact.notes || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={() => setEditContactOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveContact} className="bg-amber-600 hover:bg-amber-700">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeopleDatabase;