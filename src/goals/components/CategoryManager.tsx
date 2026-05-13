import React, { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGoalsStore } from "../storage";

export function CategoryManager() {
  const { categories, addCategory, renameCategory, deleteCategory } = useGoalsStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-1 bg-secondary/50 rounded-full px-2 py-1">
            {editingId === c.id ? (
              <>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-6 w-28 text-xs" autoFocus />
                <button onClick={() => { renameCategory(c.id, editName); setEditingId(null); }} className="text-success"><Check className="w-3 h-3" /></button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="w-3 h-3" /></button>
              </>
            ) : (
              <>
                <span className="text-xs">{c.name}</span>
                <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => { if (confirm(`Delete "${c.name}" and its goals?`)) deleteCategory(c.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </>
            )}
          </div>
        ))}
        {adding && (
          <div className="flex items-center gap-1 bg-secondary/50 rounded-full px-2 py-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-6 w-28 text-xs" autoFocus />
            <button onClick={() => { if (name.trim()) { addCategory(name.trim()); setName(""); setAdding(false); } }} className="text-success"><Check className="w-3 h-3" /></button>
            <button onClick={() => { setAdding(false); setName(""); }} className="text-muted-foreground"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
