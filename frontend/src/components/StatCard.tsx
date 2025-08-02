import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: "default" | "success" | "expense" | "wealth";
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  variant = "default", 
  trend, 
  className 
}: StatCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-gradient-success border-green-200 text-white";
      case "expense":
        return "bg-gradient-expense border-red-200 text-white";
      case "wealth":
        return "bg-gradient-wealth border-blue-200 text-white shadow-wealth";
      default:
        return "bg-gradient-card border-border hover:shadow-hover";
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return `€ ${val.toFixed(2)}`;
    }
    return val;
  };

  return (
    <Card className={cn(
      "transition-all duration-300 cursor-default",
      getVariantStyles(),
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "text-white/80"
            )}>
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold",
              variant === "default" ? "text-foreground" : "text-white"
            )}>
              {formatValue(value)}
            </p>
            {trend && (
              <p className={cn(
                "text-xs flex items-center space-x-1",
                variant === "default" ? "text-muted-foreground" : "text-white/70"
              )}>
                <span className={cn(
                  trend.value > 0 ? "text-green-600" : "text-red-600",
                  variant !== "default" && "text-white/90"
                )}>
                  {trend.value > 0 ? "+" : ""}{trend.value.toFixed(2)}€
                </span>
                <span>{trend.label}</span>
              </p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            variant === "default" 
              ? "bg-primary/10 text-primary" 
              : "bg-white/20 text-white"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};