import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ReflectionsView } from "@/reflection/ReflectionsView";
import { WeeklyReflectionModal } from "@/reflection/WeeklyReflectionModal";

const Reflections = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </Link>
              <h1 className="text-lg font-semibold">Reflections</h1>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> This week
            </Button>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
          <ReflectionsView />
        </main>
      </div>
      <WeeklyReflectionModal open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Reflections;
