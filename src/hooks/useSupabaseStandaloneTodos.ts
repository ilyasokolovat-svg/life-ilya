
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StandaloneTodo {
  id: string;
  text: string;
  completed: boolean;
  hidden?: boolean;
  deadline?: Date;
}

export const useSupabaseStandaloneTodos = () => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<StandaloneTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load todos from Supabase
  const loadTodos = async () => {
    if (!user) {
      setTodos([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log("Loading standalone todos from Supabase for user:", user.id);
      const { data, error } = await supabase
        .from('standalone_todos')
        .select('*')
        .eq('user_id', user.id)
        .eq('hidden', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading standalone todos:", error);
        setTodos([]);
      } else {
        // Convert database format to component format
        const formattedTodos: StandaloneTodo[] = (data || []).map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          hidden: todo.hidden,
          deadline: todo.deadline ? new Date(todo.deadline) : undefined
        }));
        console.log("Loaded standalone todos from Supabase:", formattedTodos);
        setTodos(formattedTodos);
      }
    } catch (error) {
      console.error("Error loading standalone todos:", error);
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load todos when user changes or component mounts
  useEffect(() => {
    loadTodos();
  }, [user]);

  const addTodo = async (text: string, deadline?: Date) => {
    if (!user) return;

    try {
      console.log("Adding new standalone todo:", { text, deadline });
      const { data, error } = await supabase
        .from('standalone_todos')
        .insert({
          user_id: user.id,
          text,
          completed: false,
          hidden: false,
          deadline: deadline?.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding standalone todo:", error);
        return;
      }

      // Add to local state
      const newTodo: StandaloneTodo = {
        id: data.id,
        text: data.text,
        completed: data.completed,
        hidden: data.hidden,
        deadline: data.deadline ? new Date(data.deadline) : undefined
      };
      setTodos(prev => [newTodo, ...prev]);
    } catch (error) {
      console.error("Error adding standalone todo:", error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      console.log("Toggling standalone todo:", id, "completed:", completed);
      const { error } = await supabase
        .from('standalone_todos')
        .update({ 
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error toggling standalone todo:", error);
        return;
      }

      // Update local state
      setTodos(prev => 
        prev.map(todo => 
          todo.id === id ? { ...todo, completed } : todo
        )
      );
    } catch (error) {
      console.error("Error toggling standalone todo:", error);
    }
  };

  const editTodo = async (id: string, newText: string, deadline?: Date) => {
    if (!user) return;

    try {
      console.log("Editing standalone todo:", id, "newText:", newText);
      const { error } = await supabase
        .from('standalone_todos')
        .update({ 
          text: newText,
          deadline: deadline?.toISOString() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error editing standalone todo:", error);
        return;
      }

      // Update local state
      setTodos(prev => 
        prev.map(todo => 
          todo.id === id ? { ...todo, text: newText, deadline } : todo
        )
      );
    } catch (error) {
      console.error("Error editing standalone todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;

    try {
      console.log("Deleting standalone todo:", id);
      const { error } = await supabase
        .from('standalone_todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deleting standalone todo:", error);
        return;
      }

      // Remove from local state
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Error deleting standalone todo:", error);
    }
  };

  const hideTodo = async (id: string) => {
    if (!user) return;

    try {
      console.log("Hiding standalone todo:", id);
      const { error } = await supabase
        .from('standalone_todos')
        .update({ 
          hidden: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error hiding standalone todo:", error);
        return;
      }

      // Remove from local state (since we filter out hidden todos)
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error("Error hiding standalone todo:", error);
    }
  };

  return {
    todos,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    hideTodo,
    isLoading
  };
};
