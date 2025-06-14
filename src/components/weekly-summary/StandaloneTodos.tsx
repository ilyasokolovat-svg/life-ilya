
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Edit, Check, EyeOff } from "lucide-react";

export interface StandaloneTodo {
  id: string;
  text: string;
  completed: boolean;
  hidden?: boolean;
}

interface StandaloneTodosProps {
  todos: StandaloneTodo[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string, completed: boolean) => void;
  onEditTodo: (id: string, newText: string) => void;
  onDeleteTodo: (id: string) => void;
  onHideTodo: (id: string) => void;
}

const StandaloneTodos: React.FC<StandaloneTodosProps> = ({
  todos,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  onDeleteTodo,
  onHideTodo
}) => {
  const [newTodoText, setNewTodoText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Filter out hidden todos
  const visibleTodos = todos.filter(todo => !todo.hidden);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      onAddTodo(newTodoText.trim());
      setNewTodoText("");
    }
  };

  const startEditing = (todo: StandaloneTodo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onEditTodo(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-800">Personal To-Do's</CardTitle>
        <p className="text-sm text-amber-600">Add your own tasks that persist across weeks</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new todo input */}
        <div className="flex gap-2">
          <Input
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Add a personal to-do..."
            className="flex-1 border-amber-200 focus:border-amber-400"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          />
          <Button
            onClick={handleAddTodo}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Todo list */}
        {visibleTodos.length > 0 && (
          <div className="space-y-2">
            {visibleTodos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-center gap-2 p-2 rounded border group ${
                  todo.completed 
                    ? 'bg-amber-100 border-amber-300' 
                    : 'bg-white border-amber-200'
                }`}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={(checked) => onToggleTodo(todo.id, !!checked)}
                  className="flex-shrink-0"
                />
                
                {editingId === todo.id ? (
                  <>
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 h-8 text-sm border-amber-200"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={saveEdit}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed 
                          ? 'line-through text-amber-600' 
                          : 'text-amber-800'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(todo)}
                      className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    {todo.completed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onHideTodo(todo.id)}
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hide completed task"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteTodo(todo.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {visibleTodos.length === 0 && (
          <p className="text-center text-amber-600 text-sm py-4">
            No personal to-do's yet. Add one above!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StandaloneTodos;
