
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, TrendingUp, DollarSign, GraduationCap } from "lucide-react";
import GoalTimelineView from "@/components/goals/GoalTimelineView";
import SubcategoryManager from "@/components/goals/SubcategoryManager";

const GoalsOverview = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const initialCategories = {
    career: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"],
    business: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"],
    investments: ["Crypto", "ETFs", "Monthly Investment"],
    skills: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
  };

  const [categorySubcategories, setCategorySubcategories] = useState(initialCategories);
  const [hiddenSubcategories, setHiddenSubcategories] = useState<Record<string, string[]>>({});

  const categories = [
    {
      id: "career",
      title: "Career",
      emoji: "💼",
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      subcategories: categorySubcategories.career
    },
    {
      id: "business",
      title: "Business",
      emoji: "📈",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      subcategories: categorySubcategories.business
    },
    {
      id: "investments",
      title: "Investments",
      emoji: "💰",
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
      subcategories: categorySubcategories.investments
    },
    {
      id: "skills",
      title: "Skills & Growth",
      emoji: "🎓",
      icon: GraduationCap,
      color: "from-orange-500 to-orange-600",
      subcategories: categorySubcategories.skills
    }
  ];

  const handleAddSubcategory = (categoryId: string, name: string) => {
    setCategorySubcategories(prev => ({
      ...prev,
      [categoryId]: [...prev[categoryId as keyof typeof prev], name]
    }));
  };

  const handleRemoveSubcategory = (categoryId: string, name: string) => {
    setCategorySubcategories(prev => ({
      ...prev,
      [categoryId]: prev[categoryId as keyof typeof prev].filter(sub => sub !== name)
    }));
    
    // Also remove from hidden list if it was hidden
    setHiddenSubcategories(prev => ({
      ...prev,
      [categoryId]: prev[categoryId]?.filter(sub => sub !== name) || []
    }));
  };

  const handleToggleSubcategoryVisibility = (categoryId: string, name: string) => {
    setHiddenSubcategories(prev => {
      const currentHidden = prev[categoryId] || [];
      const isHidden = currentHidden.includes(name);
      
      return {
        ...prev,
        [categoryId]: isHidden
          ? currentHidden.filter(sub => sub !== name)
          : [...currentHidden, name]
      };
    });
  };

  const getVisibleSubcategories = (categoryId: string) => {
    const allSubcategories = categorySubcategories[categoryId as keyof typeof categorySubcategories] || [];
    const hidden = hiddenSubcategories[categoryId] || [];
    return allSubcategories.filter(sub => !hidden.includes(sub));
  };

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
                Goals Management
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
                <Tabs defaultValue={getVisibleSubcategories(selectedCategory)[0]} className="w-full">
                  <div className="overflow-x-auto mb-6">
                    <TabsList className="inline-flex h-auto items-center justify-start bg-transparent p-0 gap-2 min-w-full w-max">
                      {getVisibleSubcategories(selectedCategory).map((subcategory) => (
                        <TabsTrigger 
                          key={subcategory} 
                          value={subcategory} 
                          className="flex-shrink-0 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 data-[state=active]:bg-blue-50 data-[state=active]:border-blue-300 data-[state=active]:text-blue-700 data-[state=active]:shadow-md transition-all duration-200"
                        >
                          {subcategory}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {getVisibleSubcategories(selectedCategory).map((subcategory) => (
                    <TabsContent key={subcategory} value={subcategory}>
                      <GoalTimelineView 
                        category={selectedCategory} 
                        subcategory={subcategory} 
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default GoalsOverview;
