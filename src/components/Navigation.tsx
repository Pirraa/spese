import { NavLink } from "react-router-dom";
import { Home, Wallet, Plus, Minus, ArrowLeftRight, BarChart3, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/fonti", icon: Wallet, label: "Fonti" },
  { to: "/entrata", icon: Plus, label: "Entrata" },
  { to: "/spesa", icon: Minus, label: "Spesa" },
  { to: "/trasferimenti", icon: ArrowLeftRight, label: "Trasferimenti" },
  { to: "/report", icon: BarChart3, label: "Report" },
  { to: "/storico", icon: History, label: "Storico" },
];

export const Navigation = () => {
  return (
    <nav className="bg-card shadow-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">FinanceTracker</h1>
          </div>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          
          <div className="md:hidden flex space-x-1">
            {navItems.slice(0, 4).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "p-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};