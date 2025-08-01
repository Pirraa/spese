import { StatCard } from "@/components/StatCard";
import { TransactionList } from "@/components/TransactionList";
import { FonteCard } from "@/components/FonteCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Plus,
  BarChart3 
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data - sostituire con dati reali
const mockFonti = [
  { nome: "PostePay", tipo: "carta" as const, saldo: 250.50, codice: "****1234" },
  { nome: "Hype", tipo: "digitale" as const, saldo: 120.00 },
  { nome: "Portafoglio", tipo: "contanti" as const, saldo: 45.20, ubicazione: "Tasca destra" },
  { nome: "Salvadanaio", tipo: "contanti" as const, saldo: 85.75, ubicazione: "Camera da letto" }
];

const mockTransazioni = [
  {
    id: "1",
    tipo: "spesa" as const,
    importo: 12.50,
    descrizione: "Pranzo al bar",
    fonte: "Portafoglio",
    data: "2024-01-15",
    luogo: "Bar Centrale"
  },
  {
    id: "2",
    tipo: "entrata" as const,
    importo: 50.00,
    descrizione: "Prelievo per spese",
    fonte: "Portafoglio",
    data: "2024-01-14"
  },
  {
    id: "3",
    tipo: "trasferimento" as const,
    importo: 50.00,
    descrizione: "Prelievo ATM",
    fonte: "PostePay",
    fonteDestinazione: "Portafoglio",
    data: "2024-01-14"
  }
];

const Dashboard = () => {
  const patrimonioTotale = mockFonti.reduce((acc, fonte) => acc + fonte.saldo, 0);
  const entrateDelMese = 750.00; // Mock data
  const speseDelMese = 420.30; // Mock data
  const guadagnoDelMese = entrateDelMese - speseDelMese;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Panoramica delle tue finanze personali
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild>
              <Link to="/entrata">
                <Plus className="w-4 h-4 mr-2" />
                Nuova Entrata
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/spesa">
                <Plus className="w-4 h-4 mr-2" />
                Nuova Spesa
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Patrimonio Totale"
            value={patrimonioTotale}
            icon={<PiggyBank className="w-6 h-6" />}
            variant="wealth"
            trend={{ value: guadagnoDelMese, label: "questo mese" }}
          />
          <StatCard
            title="Entrate del Mese"
            value={entrateDelMese}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Spese del Mese"
            value={speseDelMese}
            icon={<TrendingDown className="w-6 h-6" />}
            variant="expense"
          />
          <StatCard
            title="Bilancio Mensile"
            value={guadagnoDelMese}
            icon={<BarChart3 className="w-6 h-6" />}
            variant={guadagnoDelMese >= 0 ? "success" : "expense"}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fonti di Denaro */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Le Tue Fonti</h2>
              <Button variant="outline" asChild>
                <Link to="/fonti">
                  <Wallet className="w-4 h-4 mr-2" />
                  Gestisci Fonti
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFonti.map((fonte, index) => (
                <FonteCard
                  key={index}
                  nome={fonte.nome}
                  tipo={fonte.tipo}
                  saldo={fonte.saldo}
                  ubicazione={fonte.ubicazione}
                  codice={fonte.codice}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </div>

          {/* Movimenti Recenti */}
          <div className="space-y-6">
            <TransactionList
              transactions={mockTransazioni}
              title="Movimenti Recenti"
              maxItems={5}
            />
            
            {/* Quick Actions */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link to="/trasferimenti">
                    <Plus className="w-4 h-4 mr-2" />
                    Trasferimento tra Fonti
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link to="/report">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Visualizza Report
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link to="/storico">
                    <Wallet className="w-4 h-4 mr-2" />
                    Storico Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;