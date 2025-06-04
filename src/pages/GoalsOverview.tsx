
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, TrendingUp, DollarSign, GraduationCap, Edit2 } from "lucide-react";
import GoalTimelineView from "@/components/goals/GoalTimelineView";

const GoalsOverview = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: "career",
      title: "Career",
      icon: Briefcase,
      color: "from-blue-500 to-blue-600",
      subcategories: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"]
    },
    {
      id: "business",
      title: "Business",
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      subcategories: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"]
    },
    {
      id: "investments",
      title: "Investments",
      icon: DollarSign,
      color: "from-purple-500 to-purple-600",
      subcategories: ["Crypto", "ETFs", "Monthly Investment"]
    },
    {
      id: "skills",
      title: "Skills & Growth",
      icon: GraduationCap,
      color: "from-orange-500 to-orange-600",
      subcategories: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
    }
  ];

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
        {!selectedCategory ? (
          // Category Selection View
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="group cursor-pointer"
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
                    <CardHeader className="text-center pb-4">
                      <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-800">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {category.subcategories.slice(0, 3).map((sub, index) => (
                          <p key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mr-3"></span>
                            {sub}
                          </p>
                        ))}
                        {category.subcategories.length > 3 && (
                          <p className="text-sm text-gray-500 font-medium">
                            +{category.subcategories.length - 3} more areas
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          // Category Detail View
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
              <h2 className="text-2xl font-bold text-gray-800">
                {categories.find(c => c.id === selectedCategory)?.title}
              </h2>
            </div>

            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <Tabs defaultValue={categories.find(c => c.id === selectedCategory)?.subcategories[0]} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
                    {categories.find(c => c.id === selectedCategory)?.subcategories.map((subcategory) => (
                      <TabsTrigger key={subcategory} value={subcategory} className="text-xs px-2">
                        {subcategory}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {categories.find(c => c.id === selectedCategory)?.subcategories.map((subcategory) => (
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
