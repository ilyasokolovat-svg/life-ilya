import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Target, Plane, Map, BarChart3, Timer, Users, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Healthy Life", path: "/habits", icon: Heart, color: "hsl(350, 80%, 55%)" },
  { title: "Goals", path: "/goals-overview", icon: Target, color: "hsl(263, 85%, 65%)" },
  { title: "Trips", path: "/trip-planning", icon: Plane, color: "hsl(175, 70%, 45%)" },
  { title: "Life Events", path: "/life-events", icon: Map, color: "hsl(40, 90%, 55%)" },
  { title: "Year Analysis", path: "/year-analysis", icon: BarChart3, color: "hsl(25, 80%, 55%)" },
  { title: "Focus Mode", path: "/focus", icon: Timer, color: "hsl(250, 70%, 60%)" },
  { title: "Social CRM", path: "/social", icon: Users, color: "hsl(35, 75%, 50%)" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="w-52 shrink-0 border-r border-border bg-card/50 backdrop-blur-sm min-h-screen flex flex-col">
      {/* Logo / Home */}
      <Link to="/" className="px-4 py-5 border-b border-border">
        <h1 className="text-lg font-bold text-foreground tracking-tight">Life Tracker</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">2025</p>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <item.icon className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
