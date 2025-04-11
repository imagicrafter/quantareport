import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Image,
  ListChecks,
  Settings,
  User,
  Book,
} from "lucide-react"

import { cn } from "@/lib/utils"

const routes = [
  {
    label: "Projects",
    icon: LayoutDashboard,
    path: "/dashboard/projects",
  },
  {
    label: "Templates",
    icon: FileText,
    path: "/dashboard/templates",
  },
  {
    label: "Reports",
    icon: ListChecks,
    path: "/dashboard/reports",
  },
  {
    label: "Images",
    icon: Image,
    path: "/dashboard/images",
  },
  {
    label: "Notes",
    icon: Book,
    path: "/dashboard/notes",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/dashboard/settings",
  },
  {
    label: "Admin",
    icon: User,
    path: "/dashboard/admin",
  },
]

// Add the onNavigate prop to the component
const Sidebar = ({ onNavigate }: { onNavigate?: (path: string) => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Function to handle navigation with exit confirmation
  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-64 h-full bg-card border-r border-border overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-bold text-lg">Dashboard</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="focus:outline-none"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      
      {/* Update the navigation links to use handleNavigation */}
      <nav className="px-3 mt-6 space-y-1">
        {routes.map((route) => (
          <button
            key={route.path}
            onClick={() => handleNavigation(route.path)}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.pathname.includes(route.path)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <route.icon className="h-5 w-5 mr-2" />
            {route.label}
          </button>
        ))}
      </nav>
      
    </div>
  );
};

export default Sidebar;
