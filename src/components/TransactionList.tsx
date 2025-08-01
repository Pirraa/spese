import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  tipo: "entrata" | "spesa" | "trasferimento";
  importo: number;
  descrizione: string;
  fonte: string;
  fonteDestinazione?: string; // Per trasferimenti
  data: string;
  luogo?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  maxItems?: number;
  showAll?: boolean;
}

export const TransactionList = ({ 
  transactions, 
  title = "Movimenti Recenti",
  maxItems = 5,
  showAll = false
}: TransactionListProps) => {
  const displayTransactions = showAll ? transactions : transactions.slice(0, maxItems);

  const getTransactionIcon = (tipo: Transaction["tipo"]) => {
    switch (tipo) {
      case "entrata":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "spesa":
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      case "trasferimento":
        return <ArrowLeftRight className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (tipo: Transaction["tipo"]) => {
    switch (tipo) {
      case "entrata":
        return "text-green-600";
      case "spesa":
        return "text-red-600";
      case "trasferimento":
        return "text-blue-600";
    }
  };

  const getBadgeVariant = (tipo: Transaction["tipo"]) => {
    switch (tipo) {
      case "entrata":
        return "bg-green-100 text-green-800 border-green-200";
      case "spesa":
        return "bg-red-100 text-red-800 border-red-200";
      case "trasferimento":
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {!showAll && transactions.length > maxItems && (
            <span className="text-sm text-muted-foreground font-normal">
              {displayTransactions.length} di {transactions.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nessun movimento registrato
          </p>
        ) : (
          <div className="space-y-3">
            {displayTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    {getTransactionIcon(transaction.tipo)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.descrizione}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>{transaction.fonte}</span>
                      {transaction.fonteDestinazione && (
                        <>
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{transaction.fonteDestinazione}</span>
                        </>
                      )}
                      {transaction.luogo && (
                        <span>• {transaction.luogo}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <p className={cn(
                    "font-semibold",
                    getTransactionColor(transaction.tipo)
                  )}>
                    {transaction.tipo === "spesa" ? "-" : "+"}€ {transaction.importo.toFixed(2)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getBadgeVariant(transaction.tipo)}>
                      {transaction.tipo.charAt(0).toUpperCase() + transaction.tipo.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.data)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};