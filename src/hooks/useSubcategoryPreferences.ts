
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubcategoryPreferences {
  [category: string]: string[];
}

export const useSubcategoryPreferences = (initialCategories: SubcategoryPreferences) => {
  const { user } = useAuth();
  const [categorySubcategories, setCategorySubcategories] = useState<SubcategoryPreferences>(initialCategories);
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Load preferences from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_subcategory_preferences')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading subcategory preferences:', error);
          setLoading(false);
          return;
        }

        // Process the loaded data
        const loadedSubcategories: SubcategoryPreferences = { ...initialCategories };
        const loadedHidden: Record<string, string[]> = {};

        data?.forEach((pref) => {
          // Ensure we handle the JSON arrays correctly
          const subcategories = Array.isArray(pref.subcategories) ? pref.subcategories : [];
          const hiddenSubs = Array.isArray(pref.hidden_subcategories) ? pref.hidden_subcategories : [];
          
          loadedSubcategories[pref.category] = subcategories;
          loadedHidden[pref.category] = hiddenSubs;
        });

        setCategorySubcategories(loadedSubcategories);
        setHiddenSubcategories(loadedHidden);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user, initialCategories]);

  // Save preferences to Supabase
  const savePreferences = async (category: string, subcategories: string[], hidden: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_subcategory_preferences')
        .upsert({
          user_id: user.id,
          category,
          subcategories,
          hidden_subcategories: hidden,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,category'
        });

      if (error) {
        console.error('Error saving subcategory preferences:', error);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleAddSubcategory = async (categoryId: string, name: string) => {
    const newSubcategories = [...categorySubcategories[categoryId], name];
    const currentHidden = hiddenSubcategories[categoryId] || [];
    
    setCategorySubcategories(prev => ({
      ...prev,
      [categoryId]: newSubcategories
    }));

    await savePreferences(categoryId, newSubcategories, currentHidden);
  };

  const handleRemoveSubcategory = async (categoryId: string, name: string) => {
    const newSubcategories = categorySubcategories[categoryId].filter(sub => sub !== name);
    const newHidden = (hiddenSubcategories[categoryId] || []).filter(sub => sub !== name);
    
    setCategorySubcategories(prev => ({
      ...prev,
      [categoryId]: newSubcategories
    }));
    
    setHiddenSubcategories(prev => ({
      ...prev,
      [categoryId]: newHidden
    }));

    await savePreferences(categoryId, newSubcategories, newHidden);
  };

  const handleToggleSubcategoryVisibility = async (categoryId: string, name: string) => {
    const currentHidden = hiddenSubcategories[categoryId] || [];
    const isHidden = currentHidden.includes(name);
    const newHidden = isHidden
      ? currentHidden.filter(sub => sub !== name)
      : [...currentHidden, name];
    
    setHiddenSubcategories(prev => ({
      ...prev,
      [categoryId]: newHidden
    }));

    const currentSubcategories = categorySubcategories[categoryId] || [];
    await savePreferences(categoryId, currentSubcategories, newHidden);
  };

  return {
    categorySubcategories,
    hiddenSubcategories,
    handleAddSubcategory,
    handleRemoveSubcategory,
    handleToggleSubcategoryVisibility,
    loading
  };
};
