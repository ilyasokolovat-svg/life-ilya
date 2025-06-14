
import { useState, useEffect } from "react";
import { StandaloneTodo } from "@/components/weekly-summary/StandaloneTodos";

const STORAGE_KEY = "standalone-todos";

export const useStandaloneTodos = () => {
  const [todos, setTodos] = useState<StandaloneTodo[]>([]);

  // Load todos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedTodos = JSON.parse(stored);
        // Convert deadline strings back to Date objects
        const todosWithDates = parsedTodos.map((todo: any) => ({
          ...todo,
          deadline: todo.deadline ? new Date(todo.deadline) : undefined
        }));
        setTodos(todosWithDates);
      }
    } catch (error) {
      console.error("Error loading standalone todos:", error);
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error("Error saving standalone todos:", error);
    }
  }, [todos]);

  const addTodo = (text: string, deadline?: Date) => {
    const newTodo: StandaloneTodo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      hidden: false,
      deadline
    };
    setTodos(prev => [...prev, newTodo]);
  };

  const toggleTodo = (id: string, completed: boolean) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      )
    );
  };

  const editTodo = (id: string, newText: string, deadline?: Date) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, text: newText, deadline } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const hideTodo = (id: string) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, hidden: true } : todo
      )
    );
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    hideTodo
  };
};
