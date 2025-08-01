import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, PiggyBank, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FonteCardProps {
  nome: string;
  tipo: "carta" | "contanti" | "digitale";
  saldo: number;
  ubicazione?: string;
  codice?: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export const FonteCard = ({ 
  nome, 
  tipo, 
  saldo, 
  ubicazione, 
  codice,
  onEdit,
  onDelete,
  className 
}: FonteCardProps) => {
  const getIcon = () => {
    switch (tipo) {
      case "carta":
        return <CreditCard className="w-5 h-5" />;
      case "digitale":
        return <Wallet className="w-5 h-5" />;
      case "contanti":
        return <PiggyBank className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getTipoColor = () => {
    switch (tipo) {
      case "carta":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "digitale":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "contanti":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className={cn(
      "bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{nome}</CardTitle>
              <Badge variant="outline" className={getTipoColor()}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              € {saldo.toFixed(2)}
            </p>
          </div>
          
          {(ubicazione || codice) && (
            <div className="pt-2 border-t border-border space-y-1">
              {ubicazione && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Ubicazione:</span> {ubicazione}
                </p>
              )}
              {codice && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Codice:</span> {codice}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};