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
import { CalendarIcon, ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { fontiApi, transazioniApi, type ApiFonte } from "@/lib/api";

interface Fonte {
  id: string;
  nome: string;
}

const NuovaEntrata = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Date>(new Date());
  const [fonti, setFonti] = useState<Fonte[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    importo: "",
    descrizione: "",
    fonte: "",
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

    try {
      await transazioniApi.create({
        tipo: "ENTRATA",
        importo: parseFloat(formData.importo),
        descrizione: formData.descrizione,
        fonteId: formData.fonte,
        data: data.toISOString(),
      });

      const fonteSelezionata = fonti.find((f) => f.id === formData.fonte);
      toast({
        title: "Entrata registrata",
        description: `€ ${parseFloat(formData.importo).toFixed(2)} aggiunti a ${
          fonteSelezionata?.nome
        }`,
      });

      // Reset form o redirect
      navigate("/");
    } catch (error) {
      console.error("Errore nel salvataggio dell'entrata:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare l'entrata. Riprova più tardi.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      importo: "",
      descrizione: "",
      fonte: "",
      note: "",
    });
    setData(new Date());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

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
              Nuova Entrata
            </h1>
            <p className="text-muted-foreground">
              Registra un nuovo incasso o guadagno
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <span>Dettagli Entrata</span>
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
                    className="pl-8 text-lg font-semibold"
                  />
                </div>
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
                  placeholder="es. Stipendio, Mancia, Vendita oggetto..."
                />
              </div>

              {/* Fonte di destinazione */}
              <div className="space-y-2">
                <Label htmlFor="fonte">Aggiungi a *</Label>
                <Select
                  value={formData.fonte}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, fonte: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona dove aggiungere i soldi" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonti.map((fonte) => (
                      <SelectItem key={fonte.id} value={fonte.id}>
                        {fonte.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Informazioni aggiuntive sul guadagno..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-6">
                <Button type="submit" className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Registra Entrata
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Suggerimenti
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Registra le entrate non appena possibile per tenere traccia
                precisa
              </li>
              <li>
                • Usa descrizioni chiare per identificare facilmente la fonte
              </li>
              <li>
                • Il portafoglio può ricevere denaro da altre fonti senza
                contare come nuova entrata
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NuovaEntrata;
