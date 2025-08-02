import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarIcon, ArrowLeft, Minus, MapPin } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fontiApi, transazioniApi, type ApiFonte } from "@/lib/api";

interface Fonte {
  id: string;
  nome: string;
  saldo: number;
}

const NuovaSpesa = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Date>(new Date());
  const [fonti, setFonti] = useState<Fonte[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    importo: "",
    descrizione: "",
    fonte: "",
    luogo: "",
    note: "",
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

  const fonteSelezionata = fonti.find((f) => f.id === formData.fonte);
  const importoNumerico = parseFloat(formData.importo) || 0;
  const saldoInsufficiente =
    fonteSelezionata && importoNumerico > fonteSelezionata.saldo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.importo || !formData.descrizione || !formData.fonte) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }
    if (saldoInsufficiente) {
      toast({
        title: "Saldo insufficiente",
        description: `Il saldo di ${fonteSelezionata?.nome} non è sufficiente per questa spesa`,
        variant: "destructive",
      });
      return;
    }

    try {
      await transazioniApi.create({
        tipo: "SPESA",
        importo: parseFloat(formData.importo),
        descrizione: formData.descrizione,
        fonteId: formData.fonte,
        luogo: formData.luogo || undefined,
        data: data.toISOString(),
      });

      toast({
        title: "Spesa registrata",
        description: `€ ${parseFloat(formData.importo).toFixed(
          2
        )} sottratti da ${fonteSelezionata?.nome}`,
      });

      // Reset form o redirect
      navigate("/");
    } catch (error) {
      console.error("Errore nel salvataggio della spesa:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la spesa. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      importo: "",
      descrizione: "",
      fonte: "",
      luogo: "",
      note: "",
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
            <h1 className="text-3xl font-bold text-foreground">Nuova Spesa</h1>
            <p className="text-muted-foreground">
              Registra una nuova uscita di denaro
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Minus className="w-5 h-5 text-red-600" />
              </div>
              <span>Dettagli Spesa</span>
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
                        "border-red-500 focus:border-red-500"
                    )}
                  />
                </div>
                {saldoInsufficiente && (
                  <p className="text-sm text-red-600">
                    Saldo insufficiente! Disponibile: €{" "}
                    {fonteSelezionata?.saldo.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione *</Label>
                <Input
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descrizione: e.target.value,
                    }))
                  }
                  placeholder="es. Pranzo, Benzina, Spesa alimentare..."
                />
              </div>

              {/* Fonte di pagamento */}
              <div className="space-y-2">
                <Label htmlFor="fonte">Paga con *</Label>
                <Select
                  value={formData.fonte}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, fonte: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona da dove prelevare i soldi" />
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
                {fonteSelezionata && (
                  <p className="text-sm text-muted-foreground">
                    Saldo disponibile: € {fonteSelezionata.saldo.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Luogo */}
              <div className="space-y-2">
                <Label htmlFor="luogo">Luogo</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="luogo"
                    value={formData.luogo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        luogo: e.target.value,
                      }))
                    }
                    placeholder="es. Supermercato, Bar Centrale..."
                    className="pl-10"
                  />
                </div>
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
                        !data && "text-muted-foreground"
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Note aggiuntive */}
              <div className="space-y-2">
                <Label htmlFor="note">Note aggiuntive</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Dettagli aggiuntivi sulla spesa..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={saldoInsufficiente}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Registra Spesa
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-900 mb-2">
              💡 Suggerimenti
            </h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Registra le spese subito per non dimenticarle</li>
              <li>
                • Controlla sempre il saldo disponibile prima di registrare
              </li>
              <li>
                • Aggiungi il luogo per tenere traccia delle tue abitudini di
                spesa
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NuovaSpesa;
