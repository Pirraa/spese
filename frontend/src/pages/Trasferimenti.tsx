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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeftRight,
  ArrowLeft,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fontiApi, transazioniApi } from "@/lib/api";

// Tipi per l'interfaccia
interface Fonte {
  id: string;
  nome: string;
  saldo: number;
}

interface ApiFonte {
  id: string;
  nome: string;
  saldo: number;
}

const Trasferimenti = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Date>(new Date());
  const [fonti, setFonti] = useState<Fonte[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    importo: "",
    fonteDa: "",
    fonteA: "",
    descrizione: "",
  });

  // Carica le fonti dal backend
  useEffect(() => {
    const caricaFonti = async () => {
      try {
        setLoading(true);
        const fontiBE = await fontiApi.getAll();
        const fontiConvertite: Fonte[] = fontiBE.map((fonte: ApiFonte) => ({
          id: fonte.id,
          nome: fonte.nome,
          saldo: fonte.saldo,
        }));
        setFonti(fontiConvertite);
      } catch (error) {
        console.error("Errore nel caricamento delle fonti:", error);
        toast({
          title: "Errore",
          description:
            "Impossibile caricare le fonti. Controlla la connessione al server.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    caricaFonti();
  }, [toast]);

  const fonteDa = fonti.find((f) => f.id === formData.fonteDa);
  const fonteA = fonti.find((f) => f.id === formData.fonteA);
  const importoNumerico = parseFloat(formData.importo) || 0;
  const saldoInsufficiente = fonteDa && importoNumerico > fonteDa.saldo;
  const stessaFonte = formData.fonteDa === formData.fonteA;

  // Filtra le fonti di destinazione per escludere quella di origine
  const fontiDestinazione = fonti.filter((f) => f.id !== formData.fonteDa);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.importo || !formData.fonteDa || !formData.fonteA) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (stessaFonte) {
      toast({
        title: "Errore",
        description: "Non puoi trasferire denaro alla stessa fonte",
        variant: "destructive",
      });
      return;
    }

    if (saldoInsufficiente) {
      toast({
        title: "Saldo insufficiente",
        description: `Il saldo di ${fonteDa?.nome} non è sufficiente per questo trasferimento`,
        variant: "destructive",
      });
      return;
    }

    try {
      const importo = parseFloat(formData.importo);
      const descrizione =
        formData.descrizione ||
        `Trasferimento da ${fonteDa?.nome} a ${fonteA?.nome}`;

      await transazioniApi.create({
        tipo: "TRASFERIMENTO",
        importo,
        descrizione,
        fonteId: formData.fonteDa,
        fonteDestinazioneId: formData.fonteA,
        data: `${format(data, "yyyy-MM-dd")}T00:00:00Z`,
      });

      toast({
        title: "Trasferimento completato",
        description: `€ ${importo.toFixed(2)} trasferiti da ${
          fonteDa?.nome
        } a ${fonteA?.nome}`,
      });

      // Reset form o redirect
      navigate("/");
    } catch (error) {
      console.error("Errore nel trasferimento:", error);
      toast({
        title: "Errore",
        description:
          "Impossibile completare il trasferimento. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      importo: "",
      fonteDa: "",
      fonteA: "",
      descrizione: "",
    });
    setData(new Date());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Trasferimento
            </h1>
            <p className="text-muted-foreground">
              Sposta denaro tra le tue fonti
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Informazioni sui Trasferimenti
                </h3>
                <p className="text-sm text-blue-800 mt-1">
                  I trasferimenti tra fonti non vengono conteggiati come entrate
                  o spese nel bilancio mensile. Sono semplicemente spostamenti
                  di denaro che possiedi già.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
              <span>Dettagli Trasferimento</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Importo */}
              <div className="space-y-2">
                <Label htmlFor="importo">Importo *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                  <Input
                    id="importo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.importo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        importo: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className={cn(
                      "pl-8 text-lg font-semibold",
                      saldoInsufficiente &&
                        "border-red-500 focus:border-red-500",
                    )}
                  />
                </div>
                {saldoInsufficiente && (
                  <p className="text-sm text-red-600">
                    Saldo insufficiente! Disponibile: €{" "}
                    {fonteDa?.saldo.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Da (Fonte di origine) */}
              <div className="space-y-2">
                <Label htmlFor="fonteDa">Da *</Label>
                <Select
                  value={formData.fonteDa}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      fonteDa: value,
                      fonteA: prev.fonteA === value ? "" : prev.fonteA, // Reset destinazione se uguale
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fonte di origine" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <div className="p-2 text-center">Caricamento...</div>
                    ) : (
                      fonti.map((fonte) => (
                        <SelectItem key={fonte.id} value={fonte.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{fonte.nome}</span>
                            <span className="text-sm text-muted-foreground ml-4">
                              € {fonte.saldo.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {fonteDa && (
                  <p className="text-sm text-muted-foreground">
                    Saldo disponibile: € {fonteDa.saldo.toFixed(2)}
                  </p>
                )}
              </div>

              {/* A (Fonte di destinazione) */}
              <div className="space-y-2">
                <Label htmlFor="fonteA">A *</Label>
                <Select
                  value={formData.fonteA}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, fonteA: value }))
                  }
                  disabled={!formData.fonteDa}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona fonte di destinazione" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <div className="p-2 text-center">Caricamento...</div>
                    ) : !formData.fonteDa ? (
                      <div className="p-2 text-center text-muted-foreground">
                        Seleziona prima la fonte di origine
                      </div>
                    ) : (
                      fontiDestinazione.map((fonte) => (
                        <SelectItem key={fonte.id} value={fonte.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{fonte.nome}</span>
                            <span className="text-sm text-muted-foreground ml-4">
                              € {fonte.saldo.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Input
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descrizione: e.target.value,
                    }))
                  }
                  placeholder="es. Prelievo ATM, Riempimento portafoglio..."
                />
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data
                        ? format(data, "PPP", { locale: it })
                        : "Seleziona data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data}
                      onSelect={(date) => date && setData(date)}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Riepilogo */}
              {formData.fonteDa && formData.fonteA && formData.importo && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">
                      Riepilogo Trasferimento
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Da: {fonteDa?.nome}</span>
                        <span className="text-red-600">
                          - € {importoNumerico.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>A: {fonteA?.nome}</span>
                        <span className="text-green-600">
                          + € {importoNumerico.toFixed(2)}
                        </span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Nuovo saldo {fonteDa?.nome}:</span>
                        <span>
                          €{" "}
                          {(fonteDa
                            ? fonteDa.saldo - importoNumerico
                            : 0
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Nuovo saldo {fonteA?.nome}:</span>
                        <span>
                          €{" "}
                          {(fonteA
                            ? fonteA.saldo + importoNumerico
                            : 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saldoInsufficiente || stessaFonte}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Conferma Trasferimento
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Trasferimenti;
