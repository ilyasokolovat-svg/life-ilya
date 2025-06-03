
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, TrendingUp, DollarSign, GraduationCap } from "lucide-react";

const GoalsOverview = () => {
  const categories = [
    {
      id: "career",
      title: "Career",
      icon: Briefcase,
      color: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
      description: "Professional growth and achievements"
    },
    {
      id: "business",
      title: "Business",
      icon: TrendingUp,
      color: "bg-green-500",
      gradient: "from-green-500 to-green-600",
      description: "Business development and ventures"
    },
    {
      id: "investments",
      title: "Investments",
      icon: DollarSign,
      color: "bg-purple-500",
      gradient: "from-purple-500 to-purple-600",
      description: "Financial planning and investments"
    },
    {
      id: "skills",
      title: "Skills Development",
      icon: GraduationCap,
      color: "bg-orange-500",
      gradient: "from-orange-500 to-orange-600",
      description: "Learning and skill enhancement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" size="sm" className="mr-4 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Goals Overview
            </h1>
          </div>
          <p className="text-gray-600 mt-2 ml-16">Choose a category to plan and track your goals</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link key={category.id} to={`/goals/${category.id}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border-0 shadow-lg group">
                  <CardHeader className="text-center pb-4">
                    <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default GoalsOverview;
