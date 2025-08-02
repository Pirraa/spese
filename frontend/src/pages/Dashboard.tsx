import { useState, useEffect } from "react";
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
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  fontiApi,
  transazioniApi,
  convertiTipoFonte,
  convertiTipoTransazione,
  type ApiFonte,
  type ApiTransazione,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Tipi per il componente Dashboard
interface Fonte {
  nome: string;
  tipo: "carta" | "digitale" | "contanti";
  saldo: number;
  codice?: string;
  ubicazione?: string;
}

interface Transazione {
  id: string;
  tipo: "entrata" | "spesa" | "trasferimento";
  importo: number;
  descrizione: string;
  fonte: string;
  fonteDestinazione?: string;
  data: string;
  luogo?: string;
}

const Dashboard = () => {
  const [fonti, setFonti] = useState<Fonte[]>([]);
  const [transazioni, setTransazioni] = useState<Transazione[]>([]);
  const [statistiche, setStatistiche] = useState({
    entrate: 0,
    spese: 0,
    bilancio: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const caricaDati = async () => {
      try {
        setLoading(true);

        // Carica fonti
        const fontiBE = await fontiApi.getAll();
        const fontiConvertite: Fonte[] = fontiBE.map((fonte: ApiFonte) => ({
          nome: fonte.nome,
          tipo: convertiTipoFonte(fonte.tipo),
          saldo: fonte.saldo,
          codice: fonte.codice,
          ubicazione: fonte.ubicazione,
        }));
        setFonti(fontiConvertite);

        // Carica transazioni recenti
        const { transazioni: transazioniBE } = await transazioniApi.getAll({
          limit: 10,
        });
        const transazioniConvertite: Transazione[] = transazioniBE.map(
          (t: ApiTransazione) => ({
            id: t.id,
            tipo: convertiTipoTransazione(t.tipo),
            importo: t.importo,
            descrizione: t.descrizione,
            fonte: t.fonte.nome,
            fonteDestinazione: t.fonteDestinazione?.nome,
            data: new Date(t.data).toISOString().split("T")[0],
            luogo: t.luogo,
          })
        );
        setTransazioni(transazioniConvertite);

        // Carica statistiche del mese corrente
        const now = new Date();
        const stats = await transazioniApi.getStatistiche({
          mese: now.getMonth() + 1,
          anno: now.getFullYear(),
        });
        setStatistiche({
          entrate: stats.entrate?.totale || 0,
          spese: stats.spese?.totale || 0,
          bilancio: stats.bilancio || 0,
        });
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        toast({
          title: "Errore",
          description:
            "Impossibile caricare i dati. Controlla la connessione al server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    caricaDati();
  }, [toast]);

  const patrimonioTotale = fonti.reduce((acc, fonte) => acc + fonte.saldo, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

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
            trend={{ value: statistiche.bilancio, label: "questo mese" }}
          />
          <StatCard
            title="Entrate del Mese"
            value={statistiche.entrate}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Spese del Mese"
            value={statistiche.spese}
            icon={<TrendingDown className="w-6 h-6" />}
            variant="expense"
          />
          <StatCard
            title="Bilancio Mensile"
            value={statistiche.bilancio}
            icon={<BarChart3 className="w-6 h-6" />}
            variant={statistiche.bilancio >= 0 ? "success" : "expense"}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fonti di Denaro */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Le Tue Fonti
              </h2>
              <Button variant="outline" asChild>
                <Link to="/fonti">
                  <Wallet className="w-4 h-4 mr-2" />
                  Gestisci Fonti
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fonti.map((fonte, index) => (
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
              transactions={transazioni}
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
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start"
                >
                  <Link to="/report">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Visualizza Report
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-start"
                >
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
