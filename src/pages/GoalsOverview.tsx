
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ArrowLeft, Briefcase, TrendingUp, DollarSign, GraduationCap } from "lucide-react";
import CategoryView from "@/components/goals/CategoryView";
import SubcategoryManager from "@/components/goals/SubcategoryManager";
import { useSubcategoryPreferences } from "@/hooks/useSubcategoryPreferences";

const GoalsOverview = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const initialCategories = {
    physical: ["Sport", "Food", "Sleep"],
    mental: ["Networking", "Activities", "Phone usage"],
    financial: ["Spending commitment", "Trading", "Projects"],
    skills: ["Books", "People Management", "Arabic"]
  };

  // Use Supabase to persist subcategories and hidden state
  const {
    categorySubcategories,
    hiddenSubcategories,
    handleAddSubcategory,
    handleRemoveSubcategory,
    handleToggleSubcategoryVisibility,
    loading
  } = useSubcategoryPreferences(initialCategories);

  const categories = [
    {
      id: "physical",
      title: "Physical",
      emoji: "💪",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      subcategories: categorySubcategories.physical
    },
    {
      id: "mental",
      title: "Mental",
      emoji: "🧠",
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      subcategories: categorySubcategories.mental
    },
    {
      id: "financial",
      title: "Financial",
      emoji: "💰",
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
      subcategories: categorySubcategories.financial
    },
    {
      id: "skills",
      title: "Skills",
      emoji: "🎓",
      icon: GraduationCap,
      color: "from-orange-500 to-orange-600",
      subcategories: categorySubcategories.skills
    }
  ];

  const getVisibleSubcategories = (categoryId: string) => {
    const allSubcategories = categorySubcategories[categoryId as keyof typeof categorySubcategories] || [];
    const hidden = hiddenSubcategories[categoryId] || [];
    return allSubcategories.filter(sub => !hidden.includes(sub));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" size="sm" className="mr-4 hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Becoming the Best version of myself
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Bubbles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className="group cursor-pointer"
            >
              <div className={`w-32 h-32 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-3xl mx-auto ${selectedCategory === category.id ? 'ring-4 ring-blue-400 scale-105' : ''}`}>
                <div className="text-center">
                  <div className="text-4xl mb-1">{category.emoji}</div>
                  <h2 className="text-sm font-bold text-white">{category.title}</h2>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Category Content */}
        {selectedCategory && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Subcategory Manager */}
            <SubcategoryManager
              subcategories={categorySubcategories[selectedCategory as keyof typeof categorySubcategories] || []}
              hiddenSubcategories={hiddenSubcategories[selectedCategory] || []}
              onAdd={(name) => handleAddSubcategory(selectedCategory, name)}
              onRemove={(name) => handleRemoveSubcategory(selectedCategory, name)}
              onToggleVisibility={(name) => handleToggleSubcategoryVisibility(selectedCategory, name)}
            />

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800 text-center">
                  {categories.find(c => c.id === selectedCategory)?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CategoryView
                  category={selectedCategory}
                  categoryTitle={categories.find(c => c.id === selectedCategory)?.title || ''}
                  visibleSubcategories={getVisibleSubcategories(selectedCategory)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default GoalsOverview;
