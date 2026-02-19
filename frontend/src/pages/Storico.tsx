import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PiggyBank,
  Calendar,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { transazioniApi } from "@/lib/api";

// Tipi per i dati dello storico
interface StatisticaMensile {
  mese: number;
  anno: number;
  entrate: number;
  spese: number;
  bilancio: number;
  nomeMese: string;
}

interface StatisticaAnnuale {
  anno: number;
  entrateAnno: number;
  speseAnno: number;
  bilancioAnno: number;
  mesi: StatisticaMensile[];
}

// Configurazione dei grafici
const chartConfig: ChartConfig = {
  entrate: {
    label: "Entrate",
    color: "hsl(var(--success))",
  },
  spese: {
    label: "Spese",
    color: "hsl(var(--destructive))",
  },
  bilancio: {
    label: "Bilancio",
    color: "hsl(var(--primary))",
  },
};

const Storico = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [statistiche, setStatistiche] = useState<StatisticaAnnuale[]>([]);
  const [anniDisponibili, setAnniDisponibili] = useState<number[]>([]);
  const [annoSelezionato, setAnnoSelezionato] = useState<number>(
    new Date().getFullYear(),
  );
  const [loading, setLoading] = useState(true);

  // Carica dati storici
  useEffect(() => {
    const caricaAnniDisponibili = async () => {
      try {
        const anni = await transazioniApi.getAnniDisponibili();
        if (anni.length === 0) {
          const currentYear = new Date().getFullYear();
          setAnniDisponibili([currentYear]);
          setAnnoSelezionato(currentYear);
          return;
        }
        setAnniDisponibili(anni);
        if (!anni.includes(annoSelezionato)) {
          setAnnoSelezionato(anni[anni.length - 1]);
        }
      } catch (error) {
        console.error("Errore nel caricamento degli anni:", error);
        const currentYear = new Date().getFullYear();
        setAnniDisponibili([currentYear]);
        setAnnoSelezionato(currentYear);
      }
    };

    caricaAnniDisponibili();
  }, []);

  useEffect(() => {
    const caricaStorico = async () => {
      try {
        setLoading(true);

        const statisticheMesi: StatisticaMensile[] = [];
        let entrateAnno = 0;
        let speseAnno = 0;
        const nomiMesi = [
          "Gen",
          "Feb",
          "Mar",
          "Apr",
          "Mag",
          "Giu",
          "Lug",
          "Ago",
          "Set",
          "Ott",
          "Nov",
          "Dic",
        ];

        for (let mese = 1; mese <= 12; mese++) {
          try {
            const stats = await transazioniApi.getStatistiche({
              mese,
              anno: annoSelezionato,
            });
            const statisticaMese: StatisticaMensile = {
              mese,
              anno: annoSelezionato,
              entrate: stats.entrate?.totale || 0,
              spese: stats.spese?.totale || 0,
              bilancio: stats.bilancio || 0,
              nomeMese: nomiMesi[mese - 1],
            };

            statisticheMesi.push(statisticaMese);
            entrateAnno += statisticaMese.entrate;
            speseAnno += statisticaMese.spese;
          } catch (error) {
            statisticheMesi.push({
              mese,
              anno: annoSelezionato,
              entrate: 0,
              spese: 0,
              bilancio: 0,
              nomeMese: nomiMesi[mese - 1],
            });
          }
        }

        setStatistiche([
          {
            anno: annoSelezionato,
            entrateAnno,
            speseAnno,
            bilancioAnno: entrateAnno - speseAnno,
            mesi: statisticheMesi,
          },
        ]);
      } catch (error) {
        console.error("Errore nel caricamento dello storico:", error);
        toast({
          title: "Errore",
          description:
            "Impossibile caricare i dati storici. Controlla la connessione al server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    caricaStorico();
  }, [annoSelezionato, toast]);

  // Ottieni i dati dell'anno selezionato per i grafici
  const annoCorrente = statistiche.find((s) => s.anno === annoSelezionato);
  const datiGrafici = annoCorrente?.mesi || [];

  // Calcola le statistiche dell'anno selezionato
  const statisticheAnno = annoCorrente || {
    entrateAnno: 0,
    speseAnno: 0,
    bilancioAnno: 0,
  };

  // Calcola la media mensile
  const mediaMensile = annoCorrente
    ? {
        entrate: annoCorrente.entrateAnno / 12,
        spese: annoCorrente.speseAnno / 12,
        bilancio: annoCorrente.bilancioAnno / 12,
      }
    : { entrate: 0, spese: 0, bilancio: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento storico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Storico Finanziario
              </h1>
              <p className="text-muted-foreground">
                Analisi dell'andamento delle tue finanze nel tempo
              </p>
            </div>
          </div>

          {/* Selettore Anno */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select
              value={annoSelezionato.toString()}
              onValueChange={(value) => setAnnoSelezionato(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anniDisponibili.map((anno) => (
                  <SelectItem key={anno} value={anno.toString()}>
                    {anno}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistiche Annuali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Entrate {annoSelezionato}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    € {statisticheAnno.entrateAnno.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Media: € {mediaMensile.entrate.toFixed(2)}/mese
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Spese {annoSelezionato}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    € {statisticheAnno.speseAnno.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Media: € {mediaMensile.spese.toFixed(2)}/mese
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Bilancio {annoSelezionato}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      statisticheAnno.bilancioAnno >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    € {statisticheAnno.bilancioAnno.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Media: € {mediaMensile.bilancio.toFixed(2)}/mese
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PiggyBank className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tasso Risparmio
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statisticheAnno.entrateAnno > 0
                      ? (
                          (statisticheAnno.bilancioAnno /
                            statisticheAnno.entrateAnno) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sul totale entrate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grafico Entrate vs Spese */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Entrate vs Spese - {annoSelezionato}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <BarChart data={datiGrafici}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nomeMese" />
                  <YAxis tickFormatter={(value) => `€${value}`} />
                  <Tooltip
                    formatter={(value, name) => [
                      `€${Number(value).toFixed(2)}`,
                      name,
                    ]}
                    labelFormatter={(label) => `Mese: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="entrate"
                    fill="var(--color-entrate)"
                    name="Entrate"
                  />
                  <Bar dataKey="spese" fill="var(--color-spese)" name="Spese" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Grafico Bilancio Mensile */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Andamento Bilancio - {annoSelezionato}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <LineChart data={datiGrafici}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nomeMese" />
                  <YAxis tickFormatter={(value) => `€${value}`} />
                  <Tooltip
                    formatter={(value, name) => [
                      `€${Number(value).toFixed(2)}`,
                      name,
                    ]}
                    labelFormatter={(label) => `Mese: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bilancio"
                    stroke="var(--color-bilancio)"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    name="Bilancio"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabella Riepilogo Mensile */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Riepilogo Mensile {annoSelezionato}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mese</th>
                    <th className="text-right py-2">Entrate</th>
                    <th className="text-right py-2">Spese</th>
                    <th className="text-right py-2">Bilancio</th>
                    <th className="text-right py-2">Variazione %</th>
                  </tr>
                </thead>
                <tbody>
                  {annoCorrente?.mesi.map((mese, index) => {
                    const mesePrecedente =
                      index > 0 ? annoCorrente.mesi[index - 1] : null;
                    const variazione =
                      mesePrecedente && mesePrecedente.bilancio !== 0
                        ? ((mese.bilancio - mesePrecedente.bilancio) /
                            Math.abs(mesePrecedente.bilancio)) *
                          100
                        : 0;

                    const nomiMesi = [
                      "Gennaio",
                      "Febbraio",
                      "Marzo",
                      "Aprile",
                      "Maggio",
                      "Giugno",
                      "Luglio",
                      "Agosto",
                      "Settembre",
                      "Ottobre",
                      "Novembre",
                      "Dicembre",
                    ];

                    return (
                      <tr
                        key={mese.mese}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 font-medium">
                          {nomiMesi[mese.mese - 1]}
                        </td>
                        <td className="text-right py-3 text-green-600">
                          € {mese.entrate.toFixed(2)}
                        </td>
                        <td className="text-right py-3 text-red-600">
                          € {mese.spese.toFixed(2)}
                        </td>
                        <td
                          className={`text-right py-3 font-medium ${
                            mese.bilancio >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          € {mese.bilancio.toFixed(2)}
                        </td>
                        <td
                          className={`text-right py-3 text-sm ${
                            variazione >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {index === 0
                            ? "-"
                            : `${
                                variazione >= 0 ? "+" : ""
                              }${variazione.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Storico;
