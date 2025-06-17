import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, Edit, Check, EyeOff, Calendar as CalendarIcon } from "lucide-react";
import { format, isToday, isPast, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export interface StandaloneTodo {
  id: string;
  text: string;
  completed: boolean;
  hidden?: boolean;
  deadline?: Date;
}

interface StandaloneTodosProps {
  todos: StandaloneTodo[];
  onAddTodo: (text: string, deadline?: Date) => void;
  onToggleTodo: (id: string, completed: boolean) => void;
  onEditTodo: (id: string, newText: string, deadline?: Date) => void;
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
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(undefined);

  // Filter out hidden todos
  const visibleTodos = todos.filter(todo => !todo.hidden);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      onAddTodo(newTodoText.trim(), newTodoDeadline);
      setNewTodoText("");
      setNewTodoDeadline(undefined);
    }
  };

  const startEditing = (todo: StandaloneTodo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDeadline(todo.deadline);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      onEditTodo(editingId, editText.trim(), editDeadline);
    }
    setEditingId(null);
    setEditText("");
    setEditDeadline(undefined);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditDeadline(undefined);
  };

  const isDeadlineOverdue = (deadline?: Date) => {
    if (!deadline || !isValid(deadline)) return false;
    return isToday(deadline) || isPast(deadline);
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-amber-800">Personal To-Do's</CardTitle>
        <p className="text-sm text-amber-600">Add your own tasks that persist across all devices</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new todo input */}
        <div className="space-y-2">
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
          
          {/* Deadline picker for new todo */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700">Deadline (optional):</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal border-amber-200",
                    !newTodoDeadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {newTodoDeadline ? format(newTodoDeadline, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newTodoDeadline}
                  onSelect={setNewTodoDeadline}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {newTodoDeadline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewTodoDeadline(undefined)}
                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Todo list */}
        {todos.length > 0 && (
          <div className="space-y-2">
            {todos.map((todo) => (
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
                  <div className="flex-1 space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="h-8 text-sm border-amber-200"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700">Deadline:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-7 text-xs border-amber-200",
                              !editDeadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {editDeadline ? format(editDeadline, "MMM d") : "None"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editDeadline}
                            onSelect={setEditDeadline}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {editDeadline && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditDeadline(undefined)}
                          className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm break-words ${
                          todo.completed 
                            ? 'line-through text-amber-600' 
                            : 'text-amber-800'
                        }`}
                      >
                        {todo.text}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {todo.deadline && isValid(todo.deadline) && (
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap",
                              isDeadlineOverdue(todo.deadline)
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {format(todo.deadline, "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {editingId === todo.id ? (
                  <div className="flex gap-1">
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
                  </div>
                ) : (
                  <div className="flex gap-1">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {todos.length === 0 && (
          <p className="text-center text-amber-600 text-sm py-4">
            No personal to-do's yet. Add one above!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StandaloneTodos;
