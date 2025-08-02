import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  CalendarIcon,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  transazioniApi,
  fontiApi,
  convertiTipoTransazione,
  type ApiTransazione,
  type ApiFonte,
} from "@/lib/api";

// Tipi per l'interfaccia
interface TransazioneCompleta {
  id: string;
  tipo: "entrata" | "spesa" | "trasferimento";
  importo: number;
  descrizione: string;
  fonte: string;
  fonteDestinazione?: string;
  data: string;
  luogo?: string;
}

interface Filtri {
  tipo: string;
  fonte: string;
  dataInizio: Date | undefined;
  dataFine: Date | undefined;
  ricerca: string;
}

const Report = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [transazioni, setTransazioni] = useState<TransazioneCompleta[]>([]);
  const [fonti, setFonti] = useState<ApiFonte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtriAperti, setFiltriAperti] = useState(false);

  const [filtri, setFiltri] = useState<Filtri>({
    tipo: "tutti",
    fonte: "tutte",
    dataInizio: undefined,
    dataFine: undefined,
    ricerca: "",
  });

  // Carica dati iniziali
  useEffect(() => {
    const caricaDati = async () => {
      try {
        setLoading(true);

        // Carica fonti per i filtri
        const fontiBE = await fontiApi.getAll();
        setFonti(fontiBE);

        // Carica tutte le transazioni
        const { transazioni: transazioniBE } = await transazioniApi.getAll();
        const transazioniConvertite: TransazioneCompleta[] = transazioniBE.map(
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

  // Filtra le transazioni
  const transazioniFiltrate = transazioni.filter((t) => {
    // Filtro per tipo
    if (filtri.tipo !== "tutti" && t.tipo !== filtri.tipo) return false;

    // Filtro per fonte
    if (filtri.fonte !== "tutte" && t.fonte !== filtri.fonte) return false;

    // Filtro per data inizio
    if (filtri.dataInizio && new Date(t.data) < filtri.dataInizio) return false;

    // Filtro per data fine
    if (filtri.dataFine && new Date(t.data) > filtri.dataFine) return false;

    // Filtro per ricerca testuale
    if (
      filtri.ricerca &&
      !t.descrizione.toLowerCase().includes(filtri.ricerca.toLowerCase()) &&
      !t.luogo?.toLowerCase().includes(filtri.ricerca.toLowerCase())
    )
      return false;

    return true;
  });

  // Calcola statistiche delle transazioni filtrate
  const statistiche = transazioniFiltrate.reduce(
    (acc, t) => {
      if (t.tipo === "entrata") acc.entrate += t.importo;
      else if (t.tipo === "spesa") acc.spese += t.importo;
      return acc;
    },
    { entrate: 0, spese: 0 }
  );

  const bilancio = statistiche.entrate - statistiche.spese;

  const resetFiltri = () => {
    setFiltri({
      tipo: "tutti",
      fonte: "tutte",
      dataInizio: undefined,
      dataFine: undefined,
      ricerca: "",
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "entrata":
        return <TrendingUp className="w-4 h-4" />;
      case "spesa":
        return <TrendingDown className="w-4 h-4" />;
      case "trasferimento":
        return <ArrowLeftRight className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "entrata":
        return "default";
      case "spesa":
        return "destructive";
      case "trasferimento":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              Report Transazioni
            </h1>
            <p className="text-muted-foreground">
              Analisi completa di tutte le tue entrate e spese
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
        </div>

        {/* Statistiche Riepilogative */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Entrate Totali
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    € {statistiche.entrate.toFixed(2)}
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
                  <p className="text-sm text-muted-foreground">Spese Totali</p>
                  <p className="text-2xl font-bold text-red-600">
                    € {statistiche.spese.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bilancio</p>
                  <p
                    className={`text-2xl font-bold ${
                      bilancio >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    € {bilancio.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transazioni</p>
                  <p className="text-2xl font-bold">
                    {transazioniFiltrate.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtri */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtri</span>
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setFiltriAperti(!filtriAperti)}
              >
                {filtriAperti ? "Nascondi" : "Mostra"}
              </Button>
            </div>
          </CardHeader>

          {filtriAperti && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Ricerca */}
                <div className="space-y-2">
                  <Label>Ricerca</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Descrizione o luogo..."
                      value={filtri.ricerca}
                      onChange={(e) =>
                        setFiltri((prev) => ({
                          ...prev,
                          ricerca: e.target.value,
                        }))
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filtri.tipo}
                    onValueChange={(value) =>
                      setFiltri((prev) => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutti">Tutti</SelectItem>
                      <SelectItem value="entrata">Entrate</SelectItem>
                      <SelectItem value="spesa">Spese</SelectItem>
                      <SelectItem value="trasferimento">
                        Trasferimenti
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fonte */}
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Select
                    value={filtri.fonte}
                    onValueChange={(value) =>
                      setFiltri((prev) => ({ ...prev, fonte: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutte">Tutte</SelectItem>
                      {fonti.map((fonte) => (
                        <SelectItem key={fonte.id} value={fonte.nome}>
                          {fonte.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Inizio */}
                <div className="space-y-2">
                  <Label>Data Inizio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtri.dataInizio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtri.dataInizio
                          ? format(filtri.dataInizio, "dd/MM/yyyy", {
                              locale: it,
                            })
                          : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filtri.dataInizio}
                        onSelect={(date) =>
                          setFiltri((prev) => ({ ...prev, dataInizio: date }))
                        }
                        locale={it}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Data Fine */}
                <div className="space-y-2">
                  <Label>Data Fine</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filtri.dataFine && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filtri.dataFine
                          ? format(filtri.dataFine, "dd/MM/yyyy", {
                              locale: it,
                            })
                          : "Seleziona data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filtri.dataFine}
                        onSelect={(date) =>
                          setFiltri((prev) => ({ ...prev, dataFine: date }))
                        }
                        locale={it}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reset */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    variant="outline"
                    onClick={resetFiltri}
                    className="w-full"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabella Transazioni */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Transazioni ({transazioniFiltrate.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Destinazione</TableHead>
                    <TableHead>Luogo</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transazioniFiltrate.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nessuna transazione trovata con i filtri selezionati
                      </TableCell>
                    </TableRow>
                  ) : (
                    transazioniFiltrate
                      .sort(
                        (a, b) =>
                          new Date(b.data).getTime() -
                          new Date(a.data).getTime()
                      )
                      .map((transazione) => (
                        <TableRow key={transazione.id}>
                          <TableCell>
                            {format(new Date(transazione.data), "dd/MM/yyyy", {
                              locale: it,
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getTipoBadgeVariant(transazione.tipo)}
                              className="flex items-center space-x-1 w-fit"
                            >
                              {getTipoIcon(transazione.tipo)}
                              <span className="capitalize">
                                {transazione.tipo}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transazione.descrizione}
                          </TableCell>
                          <TableCell>{transazione.fonte}</TableCell>
                          <TableCell>
                            {transazione.fonteDestinazione || "-"}
                          </TableCell>
                          <TableCell>{transazione.luogo || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            <span
                              className={cn(
                                transazione.tipo === "entrata" &&
                                  "text-green-600",
                                transazione.tipo === "spesa" && "text-red-600",
                                transazione.tipo === "trasferimento" &&
                                  "text-blue-600"
                              )}
                            >
                              {transazione.tipo === "spesa" && "-"}€{" "}
                              {transazione.importo.toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Report;
