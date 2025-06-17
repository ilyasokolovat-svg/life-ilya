
import { useState, useEffect } from "react";
import { StandaloneTodo } from "@/components/weekly-summary/StandaloneTodos";

const STORAGE_KEY = "standalone-todos";

export const useStandaloneTodos = () => {
  const [todos, setTodos] = useState<StandaloneTodo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load todos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log("Loading standalone todos from storage:", stored);
      if (stored) {
        const parsedTodos = JSON.parse(stored);
        // Convert deadline strings back to Date objects and filter out hidden ones
        const todosWithDates = parsedTodos
          .filter((todo: any) => !todo.hidden) // Filter out hidden todos
          .map((todo: any) => ({
            ...todo,
            deadline: todo.deadline ? new Date(todo.deadline) : undefined
          }));
        console.log("Loaded standalone todos:", todosWithDates);
        setTodos(todosWithDates);
      }
    } catch (error) {
      console.error("Error loading standalone todos:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save todos to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save until we've loaded first
    
    try {
      console.log("Saving standalone todos to storage:", todos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error("Error saving standalone todos:", error);
    }
  }, [todos, isLoaded]);

  const addTodo = (text: string, deadline?: Date) => {
    const newTodo: StandaloneTodo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      hidden: false,
      deadline
    };
    console.log("Adding new standalone todo:", newTodo);
    setTodos(prev => [...prev, newTodo]);
  };

  const toggleTodo = (id: string, completed: boolean) => {
    console.log("Toggling standalone todo:", id, "completed:", completed);
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      )
    );
  };

  const editTodo = (id: string, newText: string, deadline?: Date) => {
    console.log("Editing standalone todo:", id, "newText:", newText);
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, text: newText, deadline } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    console.log("Deleting standalone todo:", id);
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const hideTodo = (id: string) => {
    console.log("Hiding standalone todo:", id);
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, hidden: true } : todo
      )
    );
  };

  return {
    todos: todos.filter(todo => !todo.hidden), // Always filter out hidden todos in the return
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    hideTodo,
    isLoaded
  };
};
