
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SubcategoryTree from "@/components/goals/SubcategoryTree";

const Goals = () => {
  const { category } = useParams<{ category: string }>();
  
  const categoryConfig = {
    career: {
      title: "Career Goals",
      subcategories: ["Commission/Bonus/Dividends", "Quota Achievement", "Salary/Income", "Promotion", "Sales Skills"]
    },
    business: {
      title: "Business Goals", 
      subcategories: ["TT Website", "TT Instagram Organic", "TT Ads", "Selo Olive Oil", "Real Estate Projects"]
    },
    investments: {
      title: "Investment Goals",
      subcategories: ["Crypto", "ETFs", "Monthly Investment"]
    },
    skills: {
      title: "Skills Development Goals",
      subcategories: ["Spanish Language", "Arabic Language", "Golf", "Yachting", "Networking", "Sales Skills", "Books"]
    }
  };

  const currentConfig = categoryConfig[category as keyof typeof categoryConfig];

  if (!currentConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
          <Link to="/goals">
            <Button>Back to Goals</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Link to="/goals">
              <Button variant="ghost" size="sm" className="mr-4 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Goals
              </Button>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {currentConfig.title}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SubcategoryTree 
          subcategories={currentConfig.subcategories}
          category={category || ''}
        />
      </main>
    </div>
  );
};

export default Goals;
